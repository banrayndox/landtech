"""
Tests for Layer 1: Vision Pipeline & Layer 4: Gatekeeper
BhumiLens AI + BhumiGuard
"""

import os
import numpy as np
import cv2
import pytest
from src.vision_pipeline import VisionPipeline
from src.slm_schema_gatekeeper import SLMSchemaGatekeeper, LandRecordField, MISSING_FIELDS_WARNING_BN


def test_vision_stages_and_crops_generation():
    vp = VisionPipeline(output_dir="outputs")
    # Create test BGR deed image
    h, w = 400, 300
    test_img = np.full((h, w, 3), 240, dtype=np.uint8)
    # Draw circular seal
    cv2.circle(test_img, (200, 320), 25, (100, 20, 10), 2)

    res = vp.process_document(test_img, doc_id="UNIT_TEST_DOC")
    assert res["doc_id"] == "UNIT_TEST_DOC"
    assert "stage1_anonymized" in res["image_stages"]
    assert "stage2_shadow_removed" in res["image_stages"]
    assert "stage3_clean_binarized" in res["image_stages"]
    assert len(res["crops"]) == 8

    # Check files exist on disk
    assert os.path.exists(res["image_stages"]["stage1_anonymized"]["file_path"])
    assert os.path.exists(res["image_stages"]["stage2_shadow_removed"]["file_path"])
    assert os.path.exists(res["image_stages"]["stage3_clean_binarized"]["file_path"])


def test_missing_field_gatekeeper_sample_warning():
    gatekeeper = SLMSchemaGatekeeper()

    # 5 fields present on Page 1, dag_number & khatian_number missing
    fields = {
        "deed_number": LandRecordField(field_name="deed_number", raw_ocr_text="২০০৭৮/২০০১"),
        "deed_type": LandRecordField(field_name="deed_type", raw_ocr_text="বেল এওয়াজে হেবা"),
        "deed_value": LandRecordField(field_name="deed_value", raw_ocr_text="৪০০০"),
        "land_area": LandRecordField(field_name="land_area", raw_ocr_text="৩০ শতাংশ"),
        "mouza": LandRecordField(field_name="mouza", raw_ocr_text="বারেন্ডা"),
        "dag_number": LandRecordField(field_name="dag_number", raw_ocr_text=""),
        "khatian_number": LandRecordField(field_name="khatian_number", raw_ocr_text="")
    }

    audit = gatekeeper.audit_mandatory_fields(fields)
    assert audit["found_count"] == 5
    assert audit["missing_count"] == 2
    assert audit["is_page1_only_sample"] is True
    assert audit["warning_message_bn"] == MISSING_FIELDS_WARNING_BN

    # Supplement Page 2
    supp_audit = gatekeeper.apply_page2_supplement(fields, dag_no="১০৫", khatian_no="৪০২")
    assert supp_audit["found_count"] == 7
    assert supp_audit["missing_count"] == 0
    assert supp_audit["gatekeeper_status"] == "READY_FOR_VERIFICATION"
