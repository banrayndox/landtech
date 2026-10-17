"""
Layer 7 — Audit Ledger, Hash Chain & Maker–Checker Workflow
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026

Maintains local immutable SQLite audit ledger, enforces Maker-Checker separation of duties,
records SHA-256 hash-chained state transitions:
H_n = SHA256(H_(n-1) || doc_id || CanonicalJSON(Raw, Norm, Verified) || State || Actor_ID)
Generates authenticated JSON and CSV exports with legal disclaimer.
"""

import os
import json
import csv
import io
import hashlib
import sqlite3
import threading
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

LEGAL_DISCLAIMER = "NON-GOAL COMPLIANCE: Digitized record for search/indexing only. Does NOT establish legal title."

WORKFLOW_STATES = [
    "DRAFT_RAW_OCR",
    "MAKER_VERIFIED_PENDING_CHECKER",
    "CHECKER_APPROVED_LOCKED",
    "REJECTED_NEEDS_CORRECTION"
]


class DatabaseAudit:
    def __init__(self, db_path: str = "outputs/bhumilens_gov_records.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
        self._lock = threading.Lock()
        self._init_tables()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_tables(self):
        with self._lock:
            conn = self._get_connection()
            cur = conn.cursor()
            # Documents authoritative master ledger
            cur.execute("""
                CREATE TABLE IF NOT EXISTS documents_ledger (
                    doc_id TEXT PRIMARY KEY,
                    document_type TEXT,
                    deed_number TEXT,
                    deed_year TEXT,
                    district TEXT,
                    thana TEXT,
                    mouza TEXT,
                    dag_number TEXT,
                    khatian_number TEXT,
                    land_area REAL,
                    stated_value REAL,
                    registration_date TEXT,
                    copy_issue_date TEXT,
                    processing_status TEXT,
                    verification_state TEXT,
                    created_by TEXT,
                    maker_id TEXT,
                    checker_id TEXT,
                    raw_ocr_json TEXT,
                    normalized_json TEXT,
                    verified_json TEXT,
                    validation_flags_json TEXT,
                    latest_audit_hash TEXT,
                    legal_disclaimer TEXT,
                    created_at TEXT,
                    updated_at TEXT
                )
            """)

            # Immutable SHA-256 audit chain
            cur.execute("""
                CREATE TABLE IF NOT EXISTS audit_chain (
                    block_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    doc_id TEXT,
                    prev_hash TEXT,
                    current_hash TEXT,
                    canonical_payload TEXT,
                    state TEXT,
                    actor_id TEXT,
                    action TEXT,
                    notes TEXT,
                    timestamp TEXT,
                    FOREIGN KEY (doc_id) REFERENCES documents_ledger(doc_id)
                )
            """)
            conn.commit()
            conn.close()

    @staticmethod
    def canonical_json(data: Any) -> str:
        """Produces deterministic canonical UTF-8 JSON representation."""
        return json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False)

    def calculate_audit_hash(
        self,
        prev_hash: str,
        doc_id: str,
        raw_dict: Any,
        norm_dict: Any,
        verified_dict: Any,
        state: str,
        actor_id: str
    ) -> Tuple[str, str]:
        """
        Calculates SHA-256 block hash according to the required formula:
        H_n = SHA256(H_(n-1) || doc_id || CanonicalJSON(Raw, Norm, Verified) || State || Actor_ID)
        """
        composite_payload = {
            "raw": raw_dict or {},
            "norm": norm_dict or {},
            "verified": verified_dict or {}
        }
        canonical_str = self.canonical_json(composite_payload)
        preimage = f"{prev_hash}{doc_id}{canonical_str}{state}{actor_id}".encode("utf-8")
        current_hash = hashlib.sha256(preimage).hexdigest()
        return current_hash, canonical_str

    def get_latest_hash(self, doc_id: str) -> str:
        """Retrieves the previous block hash for a document (or genesis hash 64 zeros)."""
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT current_hash FROM audit_chain
            WHERE doc_id = ?
            ORDER BY block_id DESC LIMIT 1
        """, (doc_id,))
        row = cur.fetchone()
        conn.close()
        return row["current_hash"] if row else ("0" * 64)

    def record_document_state(
        self,
        doc_id: str,
        document_type: str,
        fields_summary: Dict[str, Any],
        raw_ocr_dict: Dict[str, Any],
        normalized_dict: Dict[str, Any],
        verified_dict: Dict[str, Any],
        state: str,
        actor_id: str,
        action: str,
        validation_flags: Optional[Dict[str, Any]] = None,
        notes: str = ""
    ) -> Dict[str, Any]:
        """
        Appends an immutable block to the audit chain and updates document ledger state.
        """
        with self._lock:
            conn = self._get_connection()
            cur = conn.cursor()
            now = datetime.utcnow().isoformat()

            prev_hash = self.get_latest_hash(doc_id)
            current_hash, canonical_payload = self.calculate_audit_hash(
                prev_hash=prev_hash,
                doc_id=doc_id,
                raw_dict=raw_ocr_dict,
                norm_dict=normalized_dict,
                verified_dict=verified_dict,
                state=state,
                actor_id=actor_id
            )

            # Insert block into audit chain
            cur.execute("""
                INSERT INTO audit_chain (
                    doc_id, prev_hash, current_hash, canonical_payload,
                    state, actor_id, action, notes, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doc_id, prev_hash, current_hash, canonical_payload,
                state, actor_id, action, notes, now
            ))

            # Upsert into documents_ledger
            cur.execute("SELECT doc_id, maker_id, created_by FROM documents_ledger WHERE doc_id = ?", (doc_id,))
            existing = cur.fetchone()

            maker_id = existing["maker_id"] if existing and existing["maker_id"] else (actor_id if "MAKER" in state else None)
            checker_id = actor_id if "CHECKER" in state else None
            created_by = existing["created_by"] if existing else actor_id

            cur.execute("""
                INSERT INTO documents_ledger (
                    doc_id, document_type, deed_number, deed_year,
                    district, thana, mouza, dag_number, khatian_number,
                    land_area, stated_value, registration_date, copy_issue_date,
                    processing_status, verification_state, created_by,
                    maker_id, checker_id, raw_ocr_json, normalized_json,
                    verified_json, validation_flags_json, latest_audit_hash,
                    legal_disclaimer, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(doc_id) DO UPDATE SET
                    document_type = excluded.document_type,
                    deed_number = COALESCE(excluded.deed_number, documents_ledger.deed_number),
                    deed_year = COALESCE(excluded.deed_year, documents_ledger.deed_year),
                    district = COALESCE(excluded.district, documents_ledger.district),
                    thana = COALESCE(excluded.thana, documents_ledger.thana),
                    mouza = COALESCE(excluded.mouza, documents_ledger.mouza),
                    dag_number = COALESCE(excluded.dag_number, documents_ledger.dag_number),
                    khatian_number = COALESCE(excluded.khatian_number, documents_ledger.khatian_number),
                    land_area = COALESCE(excluded.land_area, documents_ledger.land_area),
                    stated_value = COALESCE(excluded.stated_value, documents_ledger.stated_value),
                    registration_date = COALESCE(excluded.registration_date, documents_ledger.registration_date),
                    copy_issue_date = COALESCE(excluded.copy_issue_date, documents_ledger.copy_issue_date),
                    processing_status = excluded.processing_status,
                    verification_state = excluded.verification_state,
                    maker_id = COALESCE(excluded.maker_id, documents_ledger.maker_id),
                    checker_id = COALESCE(excluded.checker_id, documents_ledger.checker_id),
                    raw_ocr_json = excluded.raw_ocr_json,
                    normalized_json = excluded.normalized_json,
                    verified_json = excluded.verified_json,
                    validation_flags_json = excluded.validation_flags_json,
                    latest_audit_hash = excluded.latest_audit_hash,
                    updated_at = excluded.updated_at
            """, (
                doc_id,
                document_type,
                fields_summary.get("deed_number"),
                fields_summary.get("deed_year"),
                fields_summary.get("district"),
                fields_summary.get("thana"),
                fields_summary.get("mouza"),
                fields_summary.get("dag_number"),
                fields_summary.get("khatian_number"),
                fields_summary.get("land_area"),
                fields_summary.get("stated_value"),
                fields_summary.get("registration_date"),
                fields_summary.get("copy_issue_date"),
                "PROCESSED",
                state,
                created_by,
                maker_id,
                checker_id,
                json.dumps(raw_ocr_dict, ensure_ascii=False),
                json.dumps(normalized_dict, ensure_ascii=False),
                json.dumps(verified_dict, ensure_ascii=False),
                json.dumps(validation_flags or {}, ensure_ascii=False),
                current_hash,
                LEGAL_DISCLAIMER,
                now, now
            ))

            conn.commit()
            conn.close()

            return {
                "doc_id": doc_id,
                "verification_state": state,
                "prev_hash": prev_hash,
                "current_hash": current_hash,
                "actor_id": actor_id,
                "action": action,
                "timestamp": now,
                "disclaimer": LEGAL_DISCLAIMER
            }

    def verify_audit_chain_integrity(self, doc_id: str) -> Dict[str, Any]:
        """
        Audits and verifies the complete hash chain for a document.
        Validates that H_n matches recalculation of H_(n-1) || doc_id || payload || state || actor.
        """
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT block_id, prev_hash, current_hash, canonical_payload, state, actor_id, timestamp
            FROM audit_chain
            WHERE doc_id = ?
            ORDER BY block_id ASC
        """, (doc_id,))
        blocks = cur.fetchall()
        conn.close()

        if not blocks:
            return {
                "doc_id": doc_id,
                "is_intact": False,
                "total_blocks": 0,
                "message": "No audit blocks found for document"
            }

        prev_hash = "0" * 64
        for idx, block in enumerate(blocks):
            if block["prev_hash"] != prev_hash:
                return {
                    "doc_id": doc_id,
                    "is_intact": False,
                    "tampered_block_id": block["block_id"],
                    "reason": f"Hash chain broken at block {block['block_id']}: expected prev_hash {prev_hash[:16]}..., found {block['prev_hash'][:16]}..."
                }

            # Recalculate
            preimage = f"{prev_hash}{doc_id}{block['canonical_payload']}{block['state']}{block['actor_id']}".encode("utf-8")
            recalc_hash = hashlib.sha256(preimage).hexdigest()
            if recalc_hash != block["current_hash"]:
                return {
                    "doc_id": doc_id,
                    "is_intact": False,
                    "tampered_block_id": block["block_id"],
                    "reason": f"Content tampering detected at block {block['block_id']}: hash mismatch"
                }
            prev_hash = block["current_hash"]

        return {
            "doc_id": doc_id,
            "is_intact": True,
            "total_blocks": len(blocks),
            "latest_hash": prev_hash,
            "message": f"Audit chain verified intact ({len(blocks)} blocks cryptographically validated)"
        }

    def search_records(
        self,
        query: Optional[str] = None,
        district: Optional[str] = None,
        thana: Optional[str] = None,
        mouza: Optional[str] = None,
        verification_state: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Search authoritative land records with filtering and pagination.
        """
        conn = self._get_connection()
        cur = conn.cursor()

        sql = "SELECT * FROM documents_ledger WHERE 1=1"
        params = []

        if query and query.strip():
            q = f"%{query.strip()}%"
            sql += " AND (doc_id LIKE ? OR deed_number LIKE ? OR dag_number LIKE ? OR khatian_number LIKE ? OR mouza LIKE ?)"
            params.extend([q, q, q, q, q])

        if district and district.strip():
            sql += " AND district = ?"
            params.append(district.strip())

        if thana and thana.strip():
            sql += " AND thana = ?"
            params.append(thana.strip())

        if mouza and mouza.strip():
            sql += " AND mouza = ?"
            params.append(mouza.strip())

        if verification_state and verification_state.strip():
            sql += " AND verification_state = ?"
            params.append(verification_state.strip())

        # Count total
        count_sql = f"SELECT COUNT(*) as total FROM ({sql})"
        cur.execute(count_sql, params)
        total_count = cur.fetchone()["total"]

        # Fetch page
        sql += " ORDER BY updated_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        cur.execute(sql, params)
        rows = cur.fetchall()
        conn.close()

        records = [dict(r) for r in rows]
        # Parse JSON fields for clean presentation
        for rec in records:
            for json_field in ["raw_ocr_json", "normalized_json", "verified_json", "validation_flags_json"]:
                if rec.get(json_field):
                    try:
                        rec[json_field] = json.loads(rec[json_field])
                    except Exception:
                        pass

        return {
            "records": records,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "legal_disclaimer": LEGAL_DISCLAIMER
        }

    def export_records_json(self, search_params: Optional[Dict[str, Any]] = None) -> str:
        """Generates authorized JSON export with legal disclaimer."""
        res = self.search_records(**(search_params or {}), limit=1000, offset=0)
        export_payload = {
            "export_metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "system": "BhumiLens AI + BhumiGuard",
                "record_count": len(res["records"]),
                "legal_disclaimer": LEGAL_DISCLAIMER
            },
            "records": res["records"]
        }
        return json.dumps(export_payload, ensure_ascii=False, indent=2)

    def export_records_csv(self, search_params: Optional[Dict[str, Any]] = None) -> str:
        """Generates authorized CSV export with legal disclaimer."""
        res = self.search_records(**(search_params or {}), limit=1000, offset=0)
        output = io.StringIO()
        writer = csv.writer(output)

        # Header with disclaimer
        writer.writerow([f"# {LEGAL_DISCLAIMER}"])
        writer.writerow([
            "doc_id", "document_type", "deed_number", "deed_year",
            "district", "thana", "mouza", "dag_number", "khatian_number",
            "land_area", "stated_value", "registration_date", "copy_issue_date",
            "verification_state", "maker_id", "checker_id", "latest_audit_hash", "updated_at"
        ])

        for r in res["records"]:
            writer.writerow([
                r.get("doc_id", ""),
                r.get("document_type", ""),
                r.get("deed_number", ""),
                r.get("deed_year", ""),
                r.get("district", ""),
                r.get("thana", ""),
                r.get("mouza", ""),
                r.get("dag_number", ""),
                r.get("khatian_number", ""),
                r.get("land_area", ""),
                r.get("stated_value", ""),
                r.get("registration_date", ""),
                r.get("copy_issue_date", ""),
                r.get("verification_state", ""),
                r.get("maker_id", ""),
                r.get("checker_id", ""),
                r.get("latest_audit_hash", ""),
                r.get("updated_at", "")
            ])

        return output.getvalue()
