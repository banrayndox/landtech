"""
User Management API Endpoints (Admin Only)
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.core.permissions import require_role
from backend.app.schemas.auth_schemas import UserResponse, UserStatusUpdateRequest, UserRoleUpdateRequest
from backend.app.services.auth_service import AuthService

router = APIRouter(prefix="/api/users", tags=["User Administration"])


@router.get("/", response_model=List[UserResponse])
def list_all_users(admin_user: Dict[str, Any] = Depends(require_role(["ADMIN"]))):
    """Admin retrieves all registered users and pending accounts."""
    return AuthService.list_users()


@router.put("/{user_id}/status")
def update_user_status(
    user_id: str,
    payload: UserStatusUpdateRequest,
    admin_user: Dict[str, Any] = Depends(require_role(["ADMIN"]))
):
    """Admin approves or deactivates an account."""
    return AuthService.update_user_status(user_id, payload.status, admin_id=admin_user["employee_id"])


@router.put("/{user_id}/role")
def update_user_role(
    user_id: str,
    payload: UserRoleUpdateRequest,
    admin_user: Dict[str, Any] = Depends(require_role(["ADMIN"]))
):
    """Admin assigns MAKER, CHECKER, or ADMIN role."""
    return AuthService.update_user_role(user_id, payload.role, admin_id=admin_user["employee_id"])
