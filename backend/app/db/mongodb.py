"""
MongoDB Database Connection & Client
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026

Authoritative database for:
- User accounts
- User roles and account status
- Authentication / session metadata
- Application settings & configurations
"""

import logging
from typing import Optional, Dict, Any
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from backend.app.core.config import settings

logger = logging.getLogger("bhumilens.mongodb")

_client: Optional[MongoClient] = None


def get_mongo_client() -> MongoClient:
    """Returns singleton MongoDB client with configured timeouts."""
    global _client
    if _client is None:
        try:
            _client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2500,
                connectTimeoutMS=2500,
                maxPoolSize=50
            )
        except Exception as e:
            logger.error(f"Failed to initialize MongoDB client: {e}")
            raise
    return _client


def get_database() -> Database:
    """Returns application MongoDB database."""
    client = get_mongo_client()
    return client[settings.MONGODB_DB_NAME]


def get_users_collection() -> Collection:
    """Returns 'users' collection."""
    return get_database()["users"]


def get_sessions_collection() -> Collection:
    """Returns 'sessions' collection."""
    return get_database()["sessions"]


def get_settings_collection() -> Collection:
    """Returns 'system_settings' collection."""
    return get_database()["system_settings"]


def check_mongo_health() -> Dict[str, Any]:
    """Inspects MongoDB connectivity and server status."""
    try:
        client = get_mongo_client()
        server_info = client.server_info()
        return {
            "status": "UP",
            "version": server_info.get("version", "unknown"),
            "host": client.HOST,
            "port": client.PORT,
            "database": settings.MONGODB_DB_NAME,
            "error": None
        }
    except Exception as e:
        return {
            "status": "DOWN",
            "version": None,
            "host": settings.MONGODB_URI,
            "database": settings.MONGODB_DB_NAME,
            "error": str(e)
        }
