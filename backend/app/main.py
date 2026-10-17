"""
FastAPI Application Entry Point
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.api.auth import router as auth_router
from backend.app.api.users import router as users_router
from backend.app.api.documents import router as documents_router
from backend.app.api.processing import router as processing_router
from backend.app.api.verification import router as verification_router
from backend.app.api.fraud import router as fraud_router
from backend.app.api.sandbox import router as sandbox_router
from backend.app.api.search import router as search_router
from backend.app.api.exports import router as exports_router
from backend.app.api.health import router as health_router

# Ensure runtime directories exist
os.makedirs("outputs/crops", exist_ok=True)
os.makedirs("outputs/processed", exist_ok=True)

app = FastAPI(
    title=settings.APP_NAME,
    description="Bangla Land Record Digitization & Fraud Prevention GovTech Application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(documents_router)
app.include_router(processing_router)
app.include_router(verification_router)
app.include_router(fraud_router)
app.include_router(sandbox_router)
app.include_router(search_router)
app.include_router(exports_router)
app.include_router(health_router)


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "subtitle": settings.APP_SUBTITLE,
        "status": "ONLINE",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
