"""
Application Configuration
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "BhumiLens AI + BhumiGuard"
    APP_SUBTITLE: str = "Bangla Land Record Digitization & Fraud Prevention"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "demo_dev_secret_key_change_in_production_32bytes_min_len_1234"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Databases
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "bhumilens_gov"
    SQLITE_DB_PATH: str = "outputs/bhumilens_gov_records.db"
    
    # Storage
    STORAGE_CROPS_DIR: str = "outputs/crops"
    STORAGE_PROCESSED_DIR: str = "outputs/processed"
    
    # OCR
    TESSERACT_CMD: str = ""
    TESSERACT_LANGS: str = "ben+eng"
    
    # SLM (Ollama)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    SLM_MODEL_NAME: str = "phi3:mini"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origin_list(self) -> List[str]:
        return [orig.strip() for orig in self.CORS_ORIGINS.split(",") if orig.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="allow")


settings = Settings()
