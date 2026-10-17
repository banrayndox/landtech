"""
Registry Search API Endpoints
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from backend.app.core.permissions import get_current_user
from backend.app.db.sqlite_audit import get_audit_db

router = APIRouter(prefix="/api/search", tags=["Registry Search"])


@router.get("/records")
def search_registry_records(
    query: Optional[str] = Query(None, description="Bangla or English text search"),
    district: Optional[str] = Query(None),
    thana: Optional[str] = Query(None),
    mouza: Optional[str] = Query(None),
    verification_state: Optional[str] = Query(None),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Search authoritative land records with filters and pagination.
    Returns legal disclaimer with all records.
    """
    db = get_audit_db()
    return db.search_records(
        query=query,
        district=district,
        thana=thana,
        mouza=mouza,
        verification_state=verification_state,
        limit=limit,
        offset=offset
    )
