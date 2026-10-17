"""
Backend Runner Script
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

import uvicorn
import os

if __name__ == "__main__":
    os.makedirs("outputs/crops", exist_ok=True)
    os.makedirs("outputs/processed", exist_ok=True)
    print("=" * 65)
    print("Starting BhumiLens AI + BhumiGuard Backend on http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("Health Diagnostics: http://localhost:8000/api/health")
    print("=" * 65)
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
