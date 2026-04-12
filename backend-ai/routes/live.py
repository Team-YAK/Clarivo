"""GET /api/live — Proxy to backend-data live_sessions collection.

The caregiver frontend polls this every 2-3s. We proxy to backend-data
so the caregiver sees MongoDB-persisted state (survives AI backend restarts).
Falls back to the in-memory pending_sessions dict if backend-data is down.
"""

import os
import logging
import httpx
from fastapi import APIRouter, Query

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/live")
async def get_live_state(user_id: str = Query(default="alex_demo")):
    e3_url = os.getenv("E3_BASE_URL", "http://localhost:8002")

    # Primary: read from MongoDB via backend-data
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            resp = await client.get(f"{e3_url}/api/live", params={"user_id": user_id})
            if resp.status_code == 200:
                return resp.json()
    except Exception as e:
        logger.warning(f"[live] backend-data unavailable, falling back to in-memory: {e}")

    # Fallback: local in-memory dict
    from routes.intent import pending_sessions
    if not pending_sessions:
        return {"mode": "Idle", "breadcrumb": [], "streamingSentence": "", "session_id": None}

    last_session_id = list(pending_sessions.keys())[-1]
    session = pending_sessions[last_session_id]
    path = session.get("path", [])
    input_mode = session.get("input_mode", "tree")
    sentence = session.get("sentence", "")

    if input_mode == "composer":
        mode = "Composer"
    elif sentence:
        mode = "Playback"
    else:
        mode = "Tree"

    return {
        "mode": mode,
        "breadcrumb": path,
        "streamingSentence": sentence,
        "session_id": last_session_id,
    }
