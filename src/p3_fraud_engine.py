"""
Layer 6 — P3 UTXO Double-Selling & Fraud Prevention Engine
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026

Enforces deterministic GovTech land transaction rules:
1. CHAIN_BREAK_CHECK: Seller must match the trusted current-owner record
2. FORGED_KHATIAN_CHECK: Claimed total land must match authoritative master record
3. UTXO_DOUBLE_SELLING_LOCK: Requested sale must not exceed Available Quota
Formula: Available Quota = Total Master Area - Mutated Sold Area - Pending Registry Locks
Uses thread/database level atomic locking for concurrency safety.
Provides 5 benchmark simulator transactions (TX_01 to TX_05) and custom transaction support.
"""

import threading
import hashlib
import json
import sqlite3
from datetime import datetime
from typing import Dict, List, Any, Optional

# Authoritative Master Demo Plot Specification
DEFAULT_MASTER_PLOT = {
    "plot_key": "GZ-SDR-JL14-KH402-DAG105",
    "district": "গাজীপুর",
    "thana": "গাজীপুর সদর",
    "mouza": "বারেন্ডা",
    "jl_no": "14",
    "khatian_no": "402",
    "dag_no": "105",
    "total_master_area": 30.0, # Decimal
    "trusted_owner": "মোহাম্মদ রফিকুল ইসলাম",
    "trusted_owner_nid": "19823315024000123"
}

# 5 Deterministic Benchmark Simulator Transactions
BENCHMARK_TRANSACTIONS = [
    {
        "tx_code": "TX_01",
        "title": "TX_01: First Valid Partial Sale (18.0 Dec)",
        "plot_key": "GZ-SDR-JL14-KH402-DAG105",
        "seller_name": "মোহাম্মদ রফিকুল ইসলাম",
        "buyer_name": "আব্দুল কাদির",
        "requested_area": 18.0,
        "claimed_master_area": 30.0,
        "khatian_no": "402",
        "dag_no": "105",
        "deed_type": "সাফ-কবলা দলিল",
        "expected_result": "ALLOWED",
        "expected_code": "PASS",
        "description": "Legitimate initial partial sale of 18.0 Decimal from 30.0 Decimal master plot. Leaves 12.0 Decimal quota."
    },
    {
        "tx_code": "TX_02",
        "title": "TX_02: Double-Selling Oversell Attempt (20.0 Dec)",
        "plot_key": "GZ-SDR-JL14-KH402-DAG105",
        "seller_name": "মোহাম্মদ রফিকুল ইসলাম",
        "buyer_name": "তাহমিনা বেগম",
        "requested_area": 20.0,
        "claimed_master_area": 30.0,
        "khatian_no": "402",
        "dag_no": "105",
        "deed_type": "সাফ-কবলা দলিল",
        "expected_result": "BLOCKED",
        "expected_code": "UTXO_DOUBLE_SELLING_LOCK",
        "description": "Double-selling fraud attempt. Seller requests 20.0 Dec when only 12.0 Dec quota is remaining."
    },
    {
        "tx_code": "TX_03",
        "title": "TX_03: Broken Ownership Chain Fraud (5.0 Dec)",
        "plot_key": "GZ-SDR-JL14-KH402-DAG105",
        "seller_name": "আব্দুল মান্নান",
        "buyer_name": "হাসান মাহমুদ",
        "requested_area": 5.0,
        "claimed_master_area": 30.0,
        "khatian_no": "402",
        "dag_no": "105",
        "deed_type": "সাফ-কবলা দলিল",
        "expected_result": "BLOCKED",
        "expected_code": "CHAIN_BREAK_CHECK",
        "description": "Ownership chain break fraud. Unauthorized seller attempts to execute deed on plot owned by trusted owner."
    },
    {
        "tx_code": "TX_04",
        "title": "TX_04: Forged Khatian Record Fraud (10.0 Dec)",
        "plot_key": "GZ-SDR-JL14-KH402-DAG105",
        "seller_name": "মোহাম্মদ রফিকুল ইসলাম",
        "buyer_name": "কামরুল হাসান",
        "requested_area": 10.0,
        "claimed_master_area": 45.0, # Claimed 45 vs Master 30
        "khatian_no": "402",
        "dag_no": "105",
        "deed_type": "সাফ-কবলা দলিল",
        "expected_result": "BLOCKED",
        "expected_code": "FORGED_KHATIAN_CHECK",
        "description": "Forged Khatian/Porcha sheet fraud. Stated plot total of 45.0 Decimal contradicts authoritative 30.0 Decimal master record."
    },
    {
        "tx_code": "TX_05",
        "title": "TX_05: Valid Sale of Remaining Quota (12.0 Dec)",
        "plot_key": "GZ-SDR-JL14-KH402-DAG105",
        "seller_name": "মোহাম্মদ রফিকুল ইসলাম",
        "buyer_name": "জাহাঙ্গীর আলম",
        "requested_area": 12.0,
        "claimed_master_area": 30.0,
        "khatian_no": "402",
        "dag_no": "105",
        "deed_type": "সাফ-কবলা দলিল",
        "expected_result": "ALLOWED",
        "expected_code": "PASS",
        "description": "Legitimate subsequent sale of remaining 12.0 Decimal. Completely exhausts plot quota to 0.0 Decimal."
    }
]


class FraudEngine:
    def __init__(self, db_path: str = "outputs/bhumilens_gov_records.db"):
        self.db_path = db_path
        self._lock = threading.Lock()
        self._init_sqlite_tables()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite_tables(self):
        with self._lock:
            conn = self._get_connection()
            cur = conn.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS fraud_plots (
                    plot_key TEXT PRIMARY KEY,
                    district TEXT,
                    thana TEXT,
                    mouza TEXT,
                    jl_no TEXT,
                    khatian_no TEXT,
                    dag_no TEXT,
                    total_master_area REAL,
                    mutated_sold_area REAL DEFAULT 0.0,
                    pending_locked_area REAL DEFAULT 0.0,
                    trusted_owner TEXT,
                    trusted_owner_nid TEXT,
                    created_at TEXT,
                    updated_at TEXT
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS fraud_transactions (
                    tx_id TEXT PRIMARY KEY,
                    tx_code TEXT,
                    plot_key TEXT,
                    seller_name TEXT,
                    buyer_name TEXT,
                    requested_area REAL,
                    claimed_master_area REAL,
                    decision TEXT,
                    reason_code TEXT,
                    reason_message_bn TEXT,
                    available_quota_before REAL,
                    available_quota_after REAL,
                    audit_hash TEXT,
                    timestamp TEXT,
                    FOREIGN KEY (plot_key) REFERENCES fraud_plots(plot_key)
                )
            """)
            conn.commit()

            # Ensure default master plot exists
            cur.execute("SELECT plot_key FROM fraud_plots WHERE plot_key = ?", (DEFAULT_MASTER_PLOT["plot_key"],))
            if not cur.fetchone():
                now = datetime.utcnow().isoformat()
                cur.execute("""
                    INSERT INTO fraud_plots (
                        plot_key, district, thana, mouza, jl_no, khatian_no, dag_no,
                        total_master_area, mutated_sold_area, pending_locked_area,
                        trusted_owner, trusted_owner_nid, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.0, 0.0, ?, ?, ?, ?)
                """, (
                    DEFAULT_MASTER_PLOT["plot_key"],
                    DEFAULT_MASTER_PLOT["district"],
                    DEFAULT_MASTER_PLOT["thana"],
                    DEFAULT_MASTER_PLOT["mouza"],
                    DEFAULT_MASTER_PLOT["jl_no"],
                    DEFAULT_MASTER_PLOT["khatian_no"],
                    DEFAULT_MASTER_PLOT["dag_no"],
                    DEFAULT_MASTER_PLOT["total_master_area"],
                    DEFAULT_MASTER_PLOT["trusted_owner"],
                    DEFAULT_MASTER_PLOT["trusted_owner_nid"],
                    now, now
                ))
                conn.commit()
            conn.close()

    def reset_demo_plot(self, plot_key: str = DEFAULT_MASTER_PLOT["plot_key"]):
        """Resets plot quota and clears previous simulator transactions for a clean demo."""
        with self._lock:
            conn = self._get_connection()
            cur = conn.cursor()
            now = datetime.utcnow().isoformat()
            cur.execute("""
                UPDATE fraud_plots
                SET mutated_sold_area = 0.0, pending_locked_area = 0.0, updated_at = ?
                WHERE plot_key = ?
            """, (now, plot_key))
            cur.execute("DELETE FROM fraud_transactions WHERE plot_key = ?", (plot_key,))
            conn.commit()
            conn.close()

    def get_plot_quota(self, plot_key: str = DEFAULT_MASTER_PLOT["plot_key"]) -> Dict[str, Any]:
        """
        Retrieves authoritative master plot quota:
        Available Quota = Total Master Area - Mutated Sold Area - Pending Registry Locks
        """
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM fraud_plots WHERE plot_key = ?", (plot_key,))
        row = cur.fetchone()
        conn.close()

        if not row:
            return {"error": f"Plot '{plot_key}' not found in registry"}

        master_area = float(row["total_master_area"])
        sold_area = float(row["mutated_sold_area"])
        locked_area = float(row["pending_locked_area"])
        available_quota = round(max(0.0, master_area - sold_area - locked_area), 4)

        return {
            "plot_key": row["plot_key"],
            "district": row["district"],
            "thana": row["thana"],
            "mouza": row["mouza"],
            "jl_no": row["jl_no"],
            "khatian_no": row["khatian_no"],
            "dag_no": row["dag_no"],
            "total_master_area": master_area,
            "mutated_sold_area": sold_area,
            "pending_locked_area": locked_area,
            "available_quota": available_quota,
            "utilization_percentage": round((sold_area / master_area) * 100, 2) if master_area > 0 else 0,
            "trusted_owner": row["trusted_owner"],
            "trusted_owner_nid": row["trusted_owner_nid"],
            "formula_definition": "Available Quota = Total Master Area - Mutated Sold Area - Pending Registry Locks",
            "updated_at": row["updated_at"]
        }

    def process_transaction(
        self,
        plot_key: str,
        seller_name: str,
        buyer_name: str,
        requested_area: float,
        claimed_master_area: float,
        tx_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Authoritative transaction evaluation with atomic locking:
        1. CHAIN_BREAK_CHECK: Seller == Trusted Owner
        2. FORGED_KHATIAN_CHECK: Claimed Total Area == Authoritative Total Area
        3. UTXO_DOUBLE_SELLING_LOCK: Requested Area <= Available Quota
        """
        with self._lock:
            conn = self._get_connection()
            cur = conn.cursor()
            
            cur.execute("SELECT * FROM fraud_plots WHERE plot_key = ?", (plot_key,))
            plot = cur.fetchone()
            if not plot:
                conn.close()
                return {
                    "decision": "BLOCKED",
                    "reason_code": "ERR_INVALID_PLOT",
                    "message_bn": f"খতিয়ান রেকর্ড খুঁজে পাওয়া যায়নি: {plot_key}",
                    "checks": {
                        "chain_break": "FAIL",
                        "forged_khatian": "FAIL",
                        "utxo_lock": "FAIL"
                    }
                }

            master_area = float(plot["total_master_area"])
            sold_area = float(plot["mutated_sold_area"])
            locked_area = float(plot["pending_locked_area"])
            available_quota_before = round(master_area - sold_area - locked_area, 4)
            trusted_owner = plot["trusted_owner"].strip()

            checks = {
                "chain_break": "PASS",
                "forged_khatian": "PASS",
                "utxo_lock": "PASS"
            }
            decision = "ALLOWED"
            reason_code = "PASS"
            reason_message_bn = "লেনদেন সম্পূর্ণ বৈধ এবং রেজিস্ট্রেশনের অনুমোদনযোগ্য।"

            # Check 1: Chain Break Check
            if seller_name.strip() != trusted_owner:
                checks["chain_break"] = "FAIL"
                decision = "BLOCKED"
                reason_code = "CHAIN_BREAK_CHECK"
                reason_message_bn = f"মালিকানা চেইন বিচ্ছিন্নতা: বিক্রেতা '{seller_name}' সরকারি বালাম বহি অনুযায়ী বর্তমান রেকর্ডীয় মালিক '{trusted_owner}' নন।"

            # Check 2: Forged Khatian Check
            elif abs(float(claimed_master_area) - master_area) > 0.001:
                checks["forged_khatian"] = "FAIL"
                decision = "BLOCKED"
                reason_code = "FORGED_KHATIAN_CHECK"
                reason_message_bn = f"জাল খতিয়ান শনাক্ত: দাবি করা মোট জমির পরিমাণ ({claimed_master_area} শতাংশ) মূল রেকর্ডের ({master_area} শতাংশ) সাথে মিলছে না।"

            # Check 3: UTXO Double-Selling Lock Check
            elif float(requested_area) > available_quota_before:
                checks["utxo_lock"] = "FAIL"
                decision = "BLOCKED"
                reason_code = "UTXO_DOUBLE_SELLING_LOCK"
                reason_message_bn = f"দ্বৈত বিক্রয় বা অতিরিক্ত বিক্রয়ের অপচেষ্টা: প্রস্তাবিত জমি ({requested_area} শতাংশ) অবশিষ্ট কোটার ({available_quota_before} শতাংশ) চেয়ে বেশি।"

            # If Allowed, mutate and lock quota atomically
            available_quota_after = available_quota_before
            now = datetime.utcnow().isoformat()
            if decision == "ALLOWED":
                new_sold_area = round(sold_area + float(requested_area), 4)
                available_quota_after = round(master_area - new_sold_area - locked_area, 4)
                cur.execute("""
                    UPDATE fraud_plots
                    SET mutated_sold_area = ?, updated_at = ?
                    WHERE plot_key = ?
                """, (new_sold_area, now, plot_key))

            # Generate SHA-256 transaction audit hash
            tx_id = f"TX_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"
            audit_payload = {
                "tx_id": tx_id,
                "tx_code": tx_code or "CUSTOM",
                "plot_key": plot_key,
                "seller_name": seller_name,
                "buyer_name": buyer_name,
                "requested_area": requested_area,
                "decision": decision,
                "reason_code": reason_code,
                "available_quota_before": available_quota_before,
                "available_quota_after": available_quota_after,
                "timestamp": now
            }
            canonical_payload = json.dumps(audit_payload, sort_keys=True)
            tx_hash = hashlib.sha256(canonical_payload.encode("utf-8")).hexdigest()

            # Persist transaction record
            cur.execute("""
                INSERT INTO fraud_transactions (
                    tx_id, tx_code, plot_key, seller_name, buyer_name,
                    requested_area, claimed_master_area, decision, reason_code,
                    reason_message_bn, available_quota_before, available_quota_after,
                    audit_hash, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                tx_id, tx_code or "CUSTOM", plot_key, seller_name, buyer_name,
                float(requested_area), float(claimed_master_area), decision,
                reason_code, reason_message_bn, available_quota_before,
                available_quota_after, tx_hash, now
            ))

            conn.commit()
            conn.close()

            return {
                "tx_id": tx_id,
                "tx_code": tx_code or "CUSTOM",
                "plot_key": plot_key,
                "seller_name": seller_name,
                "buyer_name": buyer_name,
                "requested_area": requested_area,
                "claimed_master_area": claimed_master_area,
                "decision": decision,
                "reason_code": reason_code,
                "reason_message_bn": reason_message_bn,
                "checks": checks,
                "available_quota_before": available_quota_before,
                "available_quota_after": available_quota_after,
                "audit_hash": tx_hash,
                "timestamp": now
            }

    def execute_benchmark_transaction(self, tx_code: str) -> Dict[str, Any]:
        """Runs one of the 5 benchmark simulator transactions."""
        matched = next((t for t in BENCHMARK_TRANSACTIONS if t["tx_code"] == tx_code), None)
        if not matched:
            raise ValueError(f"Unknown benchmark transaction code: {tx_code}")

        res = self.process_transaction(
            plot_key=matched["plot_key"],
            seller_name=matched["seller_name"],
            buyer_name=matched["buyer_name"],
            requested_area=matched["requested_area"],
            claimed_master_area=matched["claimed_master_area"],
            tx_code=matched["tx_code"]
        )
        res["spec_meta"] = {
            "title": matched["title"],
            "expected_result": matched["expected_result"],
            "expected_code": matched["expected_code"],
            "description": matched["description"],
            "benchmark_match": (res["decision"] == matched["expected_result"] and res["reason_code"] == matched["expected_code"])
        }
        return res

    def get_transaction_history(self, plot_key: str = DEFAULT_MASTER_PLOT["plot_key"]) -> List[Dict[str, Any]]:
        """Returns ordered transaction history for a plot."""
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM fraud_transactions
            WHERE plot_key = ?
            ORDER BY timestamp DESC
        """, (plot_key,))
        rows = cur.fetchall()
        conn.close()
        return [dict(r) for r in rows]
