"""
Document & Verification Pydantic Schemas
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class CropInfoSchema(BaseModel):
    field_name: str
    label: str
    box: List[int]
    file_path: str
    url: str


class FieldExtractionSchema(BaseModel):
    field_name: str
    label: str
    crop_path: Optional[str] = None
    crop_url: Optional[str] = None
    raw_ocr_text: str = ""
    normalized_value: Optional[str] = None
    human_verified_value: Optional[str] = None
    confidence: float = 0.0
    provenance: str = "OCR_RAW"
    is_missing: bool = False
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None


class DocumentDetailResponse(BaseModel):
    doc_id: str
    document_type: str
    classification: str
    processing_status: str
    verification_state: str
    created_by: str
    maker_id: Optional[str] = None
    checker_id: Optional[str] = None
    image_stages: Dict[str, Any]
    crops: Dict[str, Any]
    fields: Dict[str, FieldExtractionSchema]
    seal_status: Dict[str, Any]
    validation_flags: Dict[str, Any]
    completeness: Dict[str, Any]
    audit_hash: Optional[str] = None
    legal_disclaimer: str
    created_at: str
    updated_at: str


class MakerVerifySubmission(BaseModel):
    verified_fields: Dict[str, str] = Field(..., description="Map of field_name to human_verified_value")
    notes: Optional[str] = Field(default="")


class CheckerReviewSubmission(BaseModel):
    action: str = Field(..., description="APPROVE or REJECT")
    notes: Optional[str] = Field(default="")
    corrected_fields: Optional[Dict[str, str]] = None


class Page2UploadSubmission(BaseModel):
    dag_number: str
    khatian_number: str
    provenance: Optional[str] = "HUMAN_SUPPLIED_PAGE_2"
    notes: Optional[str] = ""
