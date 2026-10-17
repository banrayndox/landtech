"""
Authentication & User Management Service
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026

Manages MongoDB user accounts, secure registration, credential verification,
and Admin approval workflows.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from backend.app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from backend.app.db.mongodb import get_users_collection, get_sessions_collection
from backend.app.schemas.auth_schemas import UserRegisterRequest, UserLoginRequest


class AuthService:
    @staticmethod
    def register_user(request: UserRegisterRequest) -> Dict[str, Any]:
        """
        Registers a new user into MongoDB with restricted status (PENDING_APPROVAL).
        Prevents self-assignment of ADMIN or CHECKER roles.
        """
        users_col = get_users_collection()

        # Check password match
        if request.password != request.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match."
            )

        if len(request.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long."
            )

        # Check duplicate email
        if users_col.find_one({"email": request.email.lower()}):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists."
            )

        # Check duplicate employee ID
        if users_col.find_one({"employee_id": request.employee_id.strip()}):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this Employee ID already exists."
            )

        # Role policy: Public registration produces restricted account
        # Never allow public user to self-register as ADMIN or CHECKER
        requested_role = request.requested_role.upper()
        if requested_role in ["ADMIN", "CHECKER"]:
            assigned_role = "MAKER"
            assigned_status = "PENDING_APPROVAL"
        else:
            assigned_role = "MAKER"
            assigned_status = "PENDING_APPROVAL"

        now = datetime.utcnow().isoformat()
        user_doc = {
            "full_name": request.full_name.strip(),
            "employee_id": request.employee_id.strip(),
            "email": request.email.lower().strip(),
            "password_hash": hash_password(request.password),
            "role": assigned_role,
            "status": assigned_status,
            "created_at": now,
            "updated_at": now,
            "approved_by": None
        }

        res = users_col.insert_one(user_doc)
        user_id = str(res.inserted_id)

        return {
            "id": user_id,
            "employee_id": user_doc["employee_id"],
            "full_name": user_doc["full_name"],
            "email": user_doc["email"],
            "role": user_doc["role"],
            "status": user_doc["status"],
            "created_at": user_doc["created_at"],
            "message": "Registration submitted successfully. Your account is pending administrator approval."
        }

    @staticmethod
    def login_user(request: UserLoginRequest) -> Dict[str, Any]:
        """
        Validates login credentials against MongoDB.
        Returns JWT tokens and user metadata.
        """
        users_col = get_users_collection()
        login_key = request.login_id.strip()

        # Search by email or employee ID
        user = users_col.find_one({
            "$or": [
                {"email": login_key.lower()},
                {"employee_id": login_key}
            ]
        })

        if not user or not verify_password(request.password, user.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Employee ID/Email or password."
            )

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

        user_id = str(user["_id"])
        token_data = {
            "sub": user_id,
            "employee_id": user.get("employee_id"),
            "role": user.get("role", "MAKER"),
            "email": user.get("email")
        }

        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Store session in MongoDB
        sessions_col = get_sessions_collection()
        sessions_col.insert_one({
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            "remember_me": request.remember_me
        })

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "employee_id": user.get("employee_id"),
                "full_name": user.get("full_name"),
                "email": user.get("email"),
                "role": user.get("role"),
                "status": user.get("status"),
                "created_at": user.get("created_at"),
                "approved_by": user.get("approved_by")
            }
        }

    @staticmethod
    def list_users() -> List[Dict[str, Any]]:
        """Lists all users from MongoDB."""
        users_col = get_users_collection()
        users = []
        for doc in users_col.find().sort("created_at", -1):
            users.append({
                "id": str(doc["_id"]),
                "employee_id": doc.get("employee_id"),
                "full_name": doc.get("full_name"),
                "email": doc.get("email"),
                "role": doc.get("role"),
                "status": doc.get("status"),
                "created_at": doc.get("created_at"),
                "approved_by": doc.get("approved_by")
            })
        return users

    @staticmethod
    def update_user_status(user_id: str, new_status: str, admin_id: str) -> Dict[str, Any]:
        """Admin approves, activates, or deactivates an account."""
        if new_status not in ["ACTIVE", "PENDING_APPROVAL", "DEACTIVATED"]:
            raise HTTPException(status_code=400, detail="Invalid status")

        users_col = get_users_collection()
        now = datetime.utcnow().isoformat()
        res = users_col.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"status": new_status, "approved_by": admin_id, "updated_at": now}}
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return {"id": user_id, "status": new_status, "updated_at": now}

    @staticmethod
    def update_user_role(user_id: str, new_role: str, admin_id: str) -> Dict[str, Any]:
        """Admin assigns Maker or Checker or Admin role."""
        if new_role not in ["ADMIN", "MAKER", "CHECKER"]:
            raise HTTPException(status_code=400, detail="Invalid role")

        users_col = get_users_collection()
        now = datetime.utcnow().isoformat()
        res = users_col.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"role": new_role, "updated_at": now}}
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return {"id": user_id, "role": new_role, "updated_at": now}
