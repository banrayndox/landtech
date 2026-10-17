"""
Authorized Data Exports API Endpoints
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from backend.app.core.permissions import get_current_user
from backend.app.db.sqlite_audit import get_audit_db

router = APIRouter(prefix="/api/exports", tags=["Exports"])


@router.get("/json")
def export_json(
    query: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    thana: Optional[str] = Query(None),
    mouza: Optional[str] = Query(None),
    verification_state: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Generates authorized JSON export with legal disclaimer."""
    db = get_audit_db()
    params = {
        "query": query,
        "district": district,
        "thana": thana,
        "mouza": mouza,
        "verification_state": verification_state
    }
    json_data = db.export_records_json(params)
    return Response(
        content=json_data,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=bhumilens_authorized_records.json"}
    )


@router.get("/csv")
def export_csv(
    query: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    thana: Optional[str] = Query(None),
    mouza: Optional[str] = Query(None),
    verification_state: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Generates authorized CSV export with legal disclaimer."""
    db = get_audit_db()
    params = {
        "query": query,
        "district": district,
        "thana": thana,
        "mouza": mouza,
        "verification_state": verification_state
    }
    csv_data = db.export_records_csv(params)
    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=bhumilens_authorized_records.csv"}
    )
