"""
End-to-End API Integration Tests for FastAPI Backend
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


@pytest.fixture(scope="module")
def admin_token():
    # Login as seeded Admin
    res = client.post("/api/auth/login", json={
        "login_id": "admin@landtech.gov.bd",
        "password": "Admin@LandTech2026!"
    })
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def maker_token():
    # Login as seeded Maker
    res = client.post("/api/auth/login", json={
        "login_id": "maker@landtech.gov.bd",
        "password": "Maker@LandTech2026!"
    })
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def checker_token():
    # Login as seeded Checker
    res = client.post("/api/auth/login", json={
        "login_id": "checker@landtech.gov.bd",
        "password": "Checker@LandTech2026!"
    })
    assert res.status_code == 200
    return res.json()["access_token"]


def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    assert "BhumiLens AI + BhumiGuard" in res.json()["app"]


def test_health_endpoint():
    res = client.get("/api/health/")
    assert res.status_code == 200
    data = res.json()
    assert data["database_mongodb"]["status"] == "UP"
    assert data["database_sqlite"]["status"] == "UP"
    assert "system_metrics" in data


def test_get_current_user_me(maker_token):
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {maker_token}"})
    assert res.status_code == 200
    user = res.json()
    assert user["role"] == "MAKER"
    assert user["employee_id"] == "EMP_MAKER_01"


def test_load_demo_sample_deed(maker_token):
    res = client.post("/api/processing/demo-sample", headers={"Authorization": f"Bearer {maker_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["doc_id"] == "DOLIL_2001_20078"
    assert "image_stages" in data
    assert "crops" in data
    assert len(data["crops"]) == 8
    assert data["completeness"]["found_count"] == 5
    assert data["completeness"]["missing_count"] == 2
    assert "সতর্কবার্তা" in data["completeness"]["warning_message_bn"]


def test_supplement_page2_fields(maker_token):
    payload = {
        "dag_number": "১০৫",
        "khatian_number": "৪০২",
        "provenance": "HUMAN_SUPPLIED_PAGE_2"
    }
    res = client.post(
        "/api/processing/page2/DOLIL_2001_20078",
        json=payload,
        headers={"Authorization": f"Bearer {maker_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["completeness_status"] == "READY_FOR_VERIFICATION"


def test_submit_maker_verification(maker_token):
    payload = {
        "verified_fields": {
            "deed_number": "২০০৭৮/২০০১",
            "deed_type": "বেল এওয়াজে হেবা দলিল",
            "mouza": "বারেন্ডা",
            "dag_number": "১০৫",
            "khatian_number": "৪০২",
            "land_area": "30.0"
        },
        "notes": "Verified against Sub-Registry balam"
    }
    res = client.post(
        "/api/verification/submit-maker/DOLIL_2001_20078",
        json=payload,
        headers={"Authorization": f"Bearer {maker_token}"}
    )
    assert res.status_code == 200
    assert res.json()["verification_state"] == "MAKER_VERIFIED_PENDING_CHECKER"


def test_checker_self_approval_blocked(maker_token):
    # If the user who created/submitted the record tries to approve it, must be blocked (HTTP 403)
    payload = {
        "action": "APPROVE",
        "notes": "Self approval attempt"
    }
    res = client.post(
        "/api/verification/checker-review/DOLIL_2001_20078",
        json=payload,
        headers={"Authorization": f"Bearer {maker_token}"}
    )
    # Maker role cannot call checker review (HTTP 403)
    assert res.status_code == 403


def test_checker_approve_success(checker_token):
    payload = {
        "action": "APPROVE",
        "notes": "Reviewed and locked"
    }
    res = client.post(
        "/api/verification/checker-review/DOLIL_2001_20078",
        json=payload,
        headers={"Authorization": f"Bearer {checker_token}"}
    )
    assert res.status_code == 200
    assert res.json()["verification_state"] == "CHECKER_APPROVED_LOCKED"


def test_fraud_plot_quota_api(maker_token):
    res = client.get(
        "/api/fraud/plot-quota/GZ-SDR-JL14-KH402-DAG105",
        headers={"Authorization": f"Bearer {maker_token}"}
    )
    assert res.status_code == 200
    assert res.json()["total_master_area"] == 30.0


def test_sandbox_confusion_matrix_api():
    res = client.post("/api/sandbox/confusion-matrix", json={"input_text": "গাজীপুর মদর"})
    assert res.status_code == 200
    assert res.json()["suggested_correction"] == "গাজীপুর সদর"


def test_sandbox_ana_calculator_api():
    res = client.post("/api/sandbox/ana-calculator", json={
        "ana": 4, "gonda": 10, "kora": 2, "kranti": 0
    })
    assert res.status_code == 200
    assert res.json()["formatted_percentage"] == "28.2813%"


def test_search_and_export_api(maker_token):
    # Search
    s_res = client.get("/api/search/records", headers={"Authorization": f"Bearer {maker_token}"})
    assert s_res.status_code == 200
    assert "records" in s_res.json()
    assert "legal_disclaimer" in s_res.json()

    # JSON export
    j_res = client.get("/api/exports/json", headers={"Authorization": f"Bearer {maker_token}"})
    assert j_res.status_code == 200
    assert "NON-GOAL COMPLIANCE" in j_res.text

    # CSV export
    c_res = client.get("/api/exports/csv", headers={"Authorization": f"Bearer {maker_token}"})
    assert c_res.status_code == 200
    assert "NON-GOAL COMPLIANCE" in c_res.text
