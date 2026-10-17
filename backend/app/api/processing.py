"""
Document Processing & Page 2 Gatekeeper Endpoints
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from backend.app.core.permissions import get_current_user
from backend.app.services.document_service import DocumentService
from backend.app.schemas.document_schemas import Page2UploadSubmission

router = APIRouter(prefix="/api/processing", tags=["Processing Pipeline"])
doc_service = DocumentService()


@router.post("/demo-sample")
def load_benchmark_demo_sample(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Loads and processes the benchmark sample deed: DOLIL_2001_20078
    (বেল এওয়াজে হেবা দলিল, গাজীপুর সদর, বারেন্ডা).
    Generates synthetic sample image, executes 7 layers, and produces initial Page 1 audit.
    """
    doc_id = "DOLIL_2001_20078"
    sample_img_path = doc_service.generate_synthetic_demo_deed_image(doc_id=doc_id)
    with open(sample_img_path, "rb") as f:
        img_bytes = f.read()

    result = doc_service.process_new_document(
        image_bytes=img_bytes,
        filename="dolil_2001_20078.png",
        actor_id=current_user["employee_id"],
        doc_id=doc_id
    )
    return result


@router.post("/page2/{doc_id}")
def supplement_page2_fields(
    doc_id: str,
    payload: Page2UploadSubmission,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Supplements missing Dag and Khatian numbers from Tafsil page (Page 2) or manual input.
    Recalculates completeness and updates SQLite audit chain.
    """
    return doc_service.supplement_page2_missing_fields(
        doc_id=doc_id,
        dag_no=payload.dag_number,
        khatian_no=payload.khatian_number,
        actor_id=current_user["employee_id"],
        provenance=payload.provenance or "HUMAN_SUPPLIED_BY_OP_MAKER_01",
        notes=payload.notes or ""
    )
