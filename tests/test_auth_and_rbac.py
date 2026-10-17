"""
Tests for Authentication & Role-Based Access Control (RBAC)
BhumiLens AI + BhumiGuard
"""

import uuid
import pytest
from fastapi import HTTPException
from backend.app.services.auth_service import AuthService
from backend.app.schemas.auth_schemas import UserRegisterRequest, UserLoginRequest
from backend.app.core.permissions import enforce_no_self_approval
from backend.app.db.mongodb import get_users_collection


@pytest.fixture(autouse=True)
def cleanup_test_users():
    users_col = get_users_collection()
    users_col.delete_many({"employee_id": {"$regex": "^TEST_EMP_"}})
    yield
    users_col.delete_many({"employee_id": {"$regex": "^TEST_EMP_"}})


def test_registration_creates_pending_approval():
    unique_id = uuid.uuid4().hex[:6]
    req = UserRegisterRequest(
        full_name="Test Operator",
        employee_id=f"TEST_EMP_{unique_id}",
        email=f"test_op_{unique_id}@landtech.gov.bd",
        password="ValidPassword123!",
        confirm_password="ValidPassword123!",
        requested_role="ADMIN"  # Intentionally requesting ADMIN
    )
    # Service must force role to MAKER and status to PENDING_APPROVAL
    res = AuthService.register_user(req)
    assert res["status"] == "PENDING_APPROVAL"
    assert res["role"] == "MAKER"


def test_duplicate_email_rejected():
    req = UserRegisterRequest(
        full_name="Duplicate Test",
        employee_id="TEST_EMP_DUP",
        email="admin@landtech.gov.bd",  # Existing seeded admin email
        password="ValidPassword123!",
        confirm_password="ValidPassword123!",
        requested_role="MAKER"
    )
    with pytest.raises(HTTPException) as exc:
        AuthService.register_user(req)
    assert exc.value.status_code == 409


def test_login_valid_credentials():
    req = UserLoginRequest(
        login_id="admin@landtech.gov.bd",
        password="Admin@LandTech2026!"
    )
    res = AuthService.login_user(req)
    assert "access_token" in res
    assert "refresh_token" in res
    assert res["user"]["role"] == "ADMIN"
    assert res["user"]["status"] == "ACTIVE"


def test_login_pending_user_blocked():
    req = UserLoginRequest(
        login_id="pending@landtech.gov.bd",
        password="Pending@LandTech2026!"
    )
    with pytest.raises(HTTPException) as exc:
        AuthService.login_user(req)
    assert exc.value.status_code == 403


def test_maker_cannot_self_approve():
    maker_id = "EMP_MAKER_01"
    checker_id = "EMP_MAKER_01"  # Same person trying to approve

    with pytest.raises(HTTPException) as exc:
        enforce_no_self_approval(maker_id=maker_id, checker_id=checker_id)
    assert exc.value.status_code == 403
    assert "Maker-Checker Security Violation" in exc.value.detail
