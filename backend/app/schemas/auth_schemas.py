"""
Authentication & User Pydantic Schemas
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    employee_id: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    confirm_password: str = Field(..., min_length=6, max_length=128)
    requested_role: str = Field(default="MAKER")


class UserLoginRequest(BaseModel):
    login_id: str = Field(..., description="Employee ID or Email")
    password: str = Field(...)
    remember_me: bool = Field(default=False)


class UserResponse(BaseModel):
    id: str
    employee_id: str
    full_name: str
    email: str
    role: str
    status: str
    created_at: str
    approved_by: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="ACTIVE, PENDING_APPROVAL, DEACTIVATED")


class UserRoleUpdateRequest(BaseModel):
    role: str = Field(..., description="ADMIN, MAKER, CHECKER")
