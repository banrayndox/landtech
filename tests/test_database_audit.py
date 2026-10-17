"""
Tests for Layer 7: Database Audit Ledger, SHA-256 Hash Chain & Exports
BhumiLens AI + BhumiGuard
"""

import uuid
import json
import pytest
from src.database_audit import DatabaseAudit, LEGAL_DISCLAIMER


def test_hash_chain_formula_and_integrity():
    da = DatabaseAudit()
    unique_id = uuid.uuid4().hex[:8]
    doc_id = f"TEST_AUDIT_{unique_id}"

    # Block 1: Initial Ingestion
    res1 = da.record_document_state(
        doc_id=doc_id,
        document_type="STAMP_DEED_DOLIL",
        fields_summary={"deed_number": "9999/2026", "land_area": 25.0},
        raw_ocr_dict={"raw_field": "1234"},
        normalized_dict={"norm_field": "1234"},
        verified_dict={},
        state="DRAFT_RAW_OCR",
        actor_id="EMP_MAKER_01",
        action="INGEST"
    )
    assert res1["prev_hash"] == ("0" * 64)
    assert len(res1["current_hash"]) == 64

    # Block 2: Maker Verification
    res2 = da.record_document_state(
        doc_id=doc_id,
        document_type="STAMP_DEED_DOLIL",
        fields_summary={"deed_number": "9999/2026", "land_area": 25.0},
        raw_ocr_dict={"raw_field": "1234"},
        normalized_dict={"norm_field": "1234"},
        verified_dict={"norm_field": "1234"},
        state="MAKER_VERIFIED_PENDING_CHECKER",
        actor_id="EMP_MAKER_01",
        action="MAKER_SUBMIT"
    )
    assert res2["prev_hash"] == res1["current_hash"]

    # Verify chain
    integrity = da.verify_audit_chain_integrity(doc_id)
    assert integrity["is_intact"] is True
    assert integrity["total_blocks"] >= 2


def test_search_and_export_legal_disclaimer():
    da = DatabaseAudit()
    search_res = da.search_records(limit=10)
    assert "legal_disclaimer" in search_res
    assert search_res["legal_disclaimer"] == LEGAL_DISCLAIMER

    # JSON export test
    json_out = da.export_records_json()
    parsed = json.loads(json_out)
    assert "legal_disclaimer" in parsed["export_metadata"]
    assert parsed["export_metadata"]["legal_disclaimer"] == LEGAL_DISCLAIMER

    # CSV export test
    csv_out = da.export_records_csv()
    assert LEGAL_DISCLAIMER in csv_out
