"""
Document Ingestion & File Serving Endpoints
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

import os
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from backend.app.core.permissions import get_current_user
from backend.app.services.document_service import DocumentService

router = APIRouter(prefix="/api/documents", tags=["Documents"])
doc_service = DocumentService()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Upload deed or Porcha image, triggers 7-layer vision and OCR pipeline.
    """
    # Validate extension
    allowed_exts = [".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: JPG, PNG, WEBP, TIFF."
        )

    # Read bytes with file size validation (max 25MB)
    contents = await file.read()
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowed limit (25MB)")
    if len(contents) < 100:
        raise HTTPException(status_code=400, detail="Uploaded file is empty or corrupt")

    result = doc_service.process_new_document(
        image_bytes=contents,
        filename=file.filename,
        actor_id=current_user["employee_id"]
    )
    return result


@router.get("/")
def list_documents(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Lists registered documents."""
    return doc_service.audit_db.search_records(limit=100)


@router.get("/{doc_id}")
def get_document(doc_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieves document details with evidence crops and completeness audit."""
    return doc_service.get_document_details(doc_id)


@router.get("/crops/{filename}")
def serve_crop_image(filename: str):
    """Safely serves evidence crop images."""
    safe_name = os.path.basename(filename)
    path = os.path.join("outputs", "crops", safe_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Crop image not found")
    return FileResponse(path)


@router.get("/processed/{filename}")
def serve_processed_image(filename: str):
    """Safely serves 3-stage processed deed images."""
    safe_name = os.path.basename(filename)
    path = os.path.join("outputs", "processed", safe_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Processed stage image not found")
    return FileResponse(path)
