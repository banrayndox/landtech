"""
Verification & Maker-Checker Endpoints
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from backend.app.core.permissions import get_current_user, require_role, enforce_no_self_approval
from backend.app.schemas.document_schemas import MakerVerifySubmission, CheckerReviewSubmission
from backend.app.schemas.fraud_schemas import StampMathValidationRequest, ChronologyValidationRequest
from backend.app.services.document_service import DocumentService
from src.land_math_validator import LandMathValidator

router = APIRouter(prefix="/api/verification", tags=["Verification"])
doc_service = DocumentService()


@router.post("/validate-math")
def validate_stamp_duty_math(payload: StampMathValidationRequest):
    """Parses and validates Bengali stamp duty arithmetic."""
    return LandMathValidator.validate_stamp_duty_math(payload.equation)


@router.post("/validate-chronology")
def validate_chronology(payload: ChronologyValidationRequest):
    """Validates registration date <= copy issue date."""
    return LandMathValidator.validate_date_chronology(
        registration_date_str=payload.registration_date,
        copy_issue_date_str=payload.copy_issue_date,
        execution_date_str=payload.execution_date
    )


@router.post("/submit-maker/{doc_id}")
def submit_as_maker(
    doc_id: str,
    payload: MakerVerifySubmission,
    current_user: Dict[str, Any] = Depends(require_role(["MAKER", "ADMIN"]))
):
    """
    Maker updates verified field values and submits for Checker review.
    Transitions state to MAKER_VERIFIED_PENDING_CHECKER.
    """
    return doc_service.submit_maker_verification(
        doc_id=doc_id,
        verified_fields=payload.verified_fields,
        maker_id=current_user["employee_id"],
        notes=payload.notes or ""
    )


@router.post("/checker-review/{doc_id}")
def review_as_checker(
    doc_id: str,
    payload: CheckerReviewSubmission,
    current_user: Dict[str, Any] = Depends(require_role(["CHECKER", "ADMIN"]))
):
    """
    Checker approves or rejects a Maker submission.
    Enforces security rule: Checker cannot approve their own record!
    """
    return doc_service.review_as_checker(
        doc_id=doc_id,
        checker_id=current_user["employee_id"],
        action=payload.action,
        notes=payload.notes or "",
        corrected_fields=payload.corrected_fields
    )
