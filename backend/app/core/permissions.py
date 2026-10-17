"""
RBAC Permissions & Authentication Dependencies
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026

Enforces:
1. Valid JWT access token
2. Active account status in MongoDB (rejects PENDING_APPROVAL / DEACTIVATED)
3. Role verification (ADMIN, MAKER, CHECKER)
4. Enforces Maker-Checker separation of duties (Maker cannot approve their own record)
"""

from typing import List, Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from backend.app.core.security import decode_token
from backend.app.db.mongodb import get_users_collection

security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Dict[str, Any]:
    """
    Extracts and validates current authenticated user from MongoDB.
    Returns user document or raises HTTP 401.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    users_col = get_users_collection()
    try:
        user = users_col.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = users_col.find_one({"employee_id": user_id})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Check account active status
    user_status = user.get("status", "PENDING_APPROVAL")
    if user_status == "PENDING_APPROVAL":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending administrator approval. Please contact a land office administrator."
        )
    elif user_status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Access denied."
        )

    return {
        "id": str(user["_id"]),
        "employee_id": user.get("employee_id"),
        "full_name": user.get("full_name"),
        "email": user.get("email"),
        "role": user.get("role", "MAKER"),
        "status": user.get("status"),
        "created_at": user.get("created_at")
    }


def require_role(allowed_roles: List[str]):
    """Role-based access dependency."""
    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in allowed_roles and user_role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of the following roles: {', '.join(allowed_roles)}. Your role is {user_role}."
            )
        return current_user
    return role_checker


def enforce_no_self_approval(maker_id: Optional[str], checker_id: str):
    """
    Security rule: Maker cannot approve their own record.
    Checker cannot approve a record they originally created.
    """
    if maker_id and maker_id == checker_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Maker-Checker Security Violation: An operator cannot approve or verify a record they created or submitted as Maker."
        )
