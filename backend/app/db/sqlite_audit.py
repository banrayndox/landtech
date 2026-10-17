"""
SQLite Audit & Hash Chain Helper
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026

Authoritative database for:
- Local immutable audit ledger and SHA-256 hash-chain records
- Document processing states and human corrections
- Plot quota transactions and double-selling locks
"""

import os
from typing import Dict, Any
from backend.app.core.config import settings
from src.database_audit import DatabaseAudit
from src.p3_fraud_engine import FraudEngine

_audit_instance = None
_fraud_instance = None


def get_audit_db() -> DatabaseAudit:
    global _audit_instance
    if _audit_instance is None:
        _audit_instance = DatabaseAudit(db_path=settings.SQLITE_DB_PATH)
    return _audit_instance


def get_fraud_engine() -> FraudEngine:
    global _fraud_instance
    if _fraud_instance is None:
        _fraud_instance = FraudEngine(db_path=settings.SQLITE_DB_PATH)
    return _fraud_instance


def check_sqlite_health() -> Dict[str, Any]:
    """Inspects SQLite database existence and access."""
    try:
        db = get_audit_db()
        path = db.db_path
        exists = os.path.exists(path)
        size = os.path.getsize(path) if exists else 0
        return {
            "status": "UP",
            "path": path,
            "exists": exists,
            "size_bytes": size,
            "error": None
        }
    except Exception as e:
        return {
            "status": "DOWN",
            "path": settings.SQLITE_DB_PATH,
            "exists": False,
            "size_bytes": 0,
            "error": str(e)
        }
