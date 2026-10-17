"""
Health & System Diagnostic Endpoints
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

import psutil
from fastapi import APIRouter
from backend.app.db.mongodb import check_mongo_health
from backend.app.db.sqlite_audit import check_sqlite_health
from src.ocr_engine import OCREngine
from src.slm_schema_gatekeeper import SLMSchemaGatekeeper
from backend.app.core.config import settings

router = APIRouter(prefix="/api/health", tags=["Health & Diagnostics"])
ocr_engine = OCREngine(tesseract_cmd=settings.TESSERACT_CMD, langs=settings.TESSERACT_LANGS)
slm_gatekeeper = SLMSchemaGatekeeper(ollama_url=settings.OLLAMA_BASE_URL, model_name=settings.SLM_MODEL_NAME)


@router.get("/")
def get_system_health():
    """
    Returns system operational status, database connectivity,
    OCR engines and local SLM diagnostic status.
    """
    mongo_status = check_mongo_health()
    sqlite_status = check_sqlite_health()
    ocr_status = ocr_engine.get_engine_status()
    slm_status = slm_gatekeeper.check_slm_availability()

    # Memory / Process diagnostics
    proc = psutil.Process()
    ram_mb = round(proc.memory_info().rss / (1024 * 1024), 2)

    overall_healthy = (mongo_status["status"] == "UP" and sqlite_status["status"] == "UP")

    return {
        "status": "HEALTHY" if overall_healthy else "DEGRADED",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database_mongodb": mongo_status,
        "database_sqlite": sqlite_status,
        "ocr_engines": ocr_status,
        "slm_local": slm_status,
        "system_metrics": {
            "python_process_ram_mb": ram_mb,
            "cpu_percent": psutil.cpu_percent(interval=None)
        },
        "legal_notice": "GovTech Land Records Digitization & Fraud Prevention System"
    }
