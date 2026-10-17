"""
Demo & Benchmark Data Seeding Script
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026

Creates synthetic hackathon accounts and benchmark sample records:
1. Admin: admin@landtech.gov.bd (EMP_ADMIN_01)
2. Maker: maker@landtech.gov.bd (EMP_MAKER_01)
3. Checker: checker@landtech.gov.bd (EMP_CHECKER_01)
4. Pending: pending@landtech.gov.bd (EMP_PENDING_01)
5. Synthetic benchmark deed: DOLIL_2001_20078
6. Authoritative master plot: GZ-SDR-JL14-KH402-DAG105 (30.0 Dec)
"""

import sys
import os
from datetime import datetime

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath("."))

from backend.app.core.security import hash_password
from backend.app.db.mongodb import get_users_collection, check_mongo_health
from backend.app.services.document_service import DocumentService
from src.p3_fraud_engine import FraudEngine


def seed_database():
    print("=" * 65)
    print("BhumiLens AI + BhumiGuard — Hackathon Demo Seeding")
    print("=" * 65)

    # 1. Verify MongoDB Connectivity
    mongo_status = check_mongo_health()
    if mongo_status["status"] != "UP":
        print(f"[ERROR] MongoDB is not running at {mongo_status['host']}.")
        print(f"Details: {mongo_status['error']}")
        sys.exit(1)
    print("[OK] MongoDB connected successfully.")

    users_col = get_users_collection()

    demo_users = [
        {
            "full_name": "Dr. Aminul Islam (Admin)",
            "employee_id": "EMP_ADMIN_01",
            "email": "admin@landtech.gov.bd",
            "password": "Admin@LandTech2026!",
            "role": "ADMIN",
            "status": "ACTIVE"
        },
        {
            "full_name": "Tania Akter (Maker)",
            "employee_id": "EMP_MAKER_01",
            "email": "maker@landtech.gov.bd",
            "password": "Maker@LandTech2026!",
            "role": "MAKER",
            "status": "ACTIVE"
        },
        {
            "full_name": "Kazi Farhan (Checker)",
            "employee_id": "EMP_CHECKER_01",
            "email": "checker@landtech.gov.bd",
            "password": "Checker@LandTech2026!",
            "role": "CHECKER",
            "status": "ACTIVE"
        },
        {
            "full_name": "Rahim Uddin (Pending)",
            "employee_id": "EMP_PENDING_01",
            "email": "pending@landtech.gov.bd",
            "password": "Pending@LandTech2026!",
            "role": "MAKER",
            "status": "PENDING_APPROVAL"
        }
    ]

    now = datetime.utcnow().isoformat()
    for u in demo_users:
        existing = users_col.find_one({"email": u["email"]})
        if existing:
            users_col.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "full_name": u["full_name"],
                    "employee_id": u["employee_id"],
                    "password_hash": hash_password(u["password"]),
                    "role": u["role"],
                    "status": u["status"],
                    "updated_at": now
                }}
            )
            print(f"[UPDATED] Demo user: {u['email']} ({u['role']} - {u['status']})")
        else:
            users_col.insert_one({
                "full_name": u["full_name"],
                "employee_id": u["employee_id"],
                "email": u["email"],
                "password_hash": hash_password(u["password"]),
                "role": u["role"],
                "status": u["status"],
                "created_at": now,
                "updated_at": now,
                "approved_by": "SYSTEM_BOOTSTRAP"
            })
            print(f"[CREATED] Demo user: {u['email']} ({u['role']} - {u['status']})")

    # 2. Reset and Seed Master Plot Quota
    fe = FraudEngine()
    fe.reset_demo_plot()
    quota = fe.get_plot_quota()
    print(f"[OK] Master Plot {quota['plot_key']} initialized with {quota['available_quota']} Dec quota.")

    # 3. Seed Benchmark Sample Document (DOLIL_2001_20078)
    doc_service = DocumentService()
    sample_path = doc_service.generate_synthetic_demo_deed_image("DOLIL_2001_20078")
    with open(sample_path, "rb") as f:
        img_bytes = f.read()
    
    doc_res = doc_service.process_new_document(
        image_bytes=img_bytes,
        filename="dolil_2001_20078.png",
        actor_id="EMP_MAKER_01",
        doc_id="DOLIL_2001_20078"
    )
    print(f"[OK] Benchmark deed {doc_res['doc_id']} processed and recorded in SQLite ledger.")
    print("=" * 65)
    print("Seeding Complete! Demo accounts ready:")
    print("Admin:   admin@landtech.gov.bd   / Admin@LandTech2026!")
    print("Maker:   maker@landtech.gov.bd   / Maker@LandTech2026!")
    print("Checker: checker@landtech.gov.bd / Checker@LandTech2026!")
    print("=" * 65)


if __name__ == "__main__":
    seed_database()
