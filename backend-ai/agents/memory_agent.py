"""
Memory Agent — Handles writes to E3 (MongoDB) for path persistence and frequency tracking.

Pure Python (no LLM call). Responsible for:
- Writing confirmed paths to E3 as sessions
- Incrementing path frequency counters
- Logging session metadata
"""

import os
import uuid
import logging
from datetime import datetime, timezone
import httpx

from services.data_service import create_session
from services.utils import path_to_key

logger = logging.getLogger(__name__)

E3_BASE = os.getenv("E3_BASE_URL", "http://localhost:8002")


async def persist_path(
    user_id: str,
    path: list[str],
    confidence: float = 0.9,
) -> dict:
    """
    Persist a confirmed path to E3 and increment frequency counters.
    Called on CONFIRM action.
    """
    session_id = f"s_{uuid.uuid4().hex[:8]}"
    path_key = path_to_key(path, "tree")

    # 1. Create session in E3
    session_data = {
        "session_id": session_id,
        "user_id": user_id,
        "path": path,
        "path_key": path_key,
        "input_mode": "tree",
        "sentence": "",  # Sentence generated separately via /api/intent
        "confidence": confidence,
        "audio_url": None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    try:
        result = await create_session(session_data)
        logger.info(f"Memory: persisted session {session_id} for path {path_key}")
    except Exception as e:
        logger.error(f"Memory: session persistence failed: {e}")
        result = {"success": False, "error": str(e)}

    # Note: E3's /api/sessions/create already auto-increments
    # path_frequencies via $inc, so no separate frequency call needed.

    return {
        "ok": True,
        "session_id": session_id,
        "path_key": path_key,
    }
