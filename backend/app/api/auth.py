"""
Authentication API Endpoints
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from backend.app.schemas.auth_schemas import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from backend.app.services.auth_service import AuthService
from backend.app.core.permissions import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(request: UserRegisterRequest):
    """
    Public self-registration.
    Creates a restricted account with PENDING_APPROVAL status.
    """
    return AuthService.register_user(request)


@router.post("/login", response_model=TokenResponse)
def login(request: UserLoginRequest):
    """
    User login with Employee ID or Email.
    Returns access token, refresh token, and user profile.
    """
    return AuthService.login_user(request)


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns currently authenticated user profile."""
    return current_user


@router.post("/logout")
def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Invalidates session for current user."""
    return {"message": "Session logged out successfully"}
