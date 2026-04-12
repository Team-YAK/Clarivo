"""Live session persistence for caregiver real-time view.

backend-ai writes here (upsert) after each SSE intent generation.
backend-ai deletes here (delete) after a session is confirmed.
MongoDB TTL index on expires_at auto-cleans stale docs (10-minute window).
"""

import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from database import db

logger = logging.getLogger(__name__)
router = APIRouter()

LIVE_TTL_MINUTES = 10


class LiveSessionUpsert(BaseModel):
    session_id: str
    user_id: str
    path: List[str] = []
    path_key: str = ""
    sentence: str = ""
    confidence: float = 0.0
    input_mode: str = "tree"


@router.post("/api/live/upsert")
async def upsert_live_session(req: LiveSessionUpsert):
    """Called by backend-ai (fire-and-forget) after intent generation."""
    try:
        doc = {
            "_id": req.session_id,
            "user_id": req.user_id,
            "path": req.path,
            "path_key": req.path_key,
            "sentence": req.sentence,
            "confidence": req.confidence,
            "input_mode": req.input_mode,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=LIVE_TTL_MINUTES),
        }
        await db.live_sessions.replace_one({"_id": req.session_id}, doc, upsert=True)
        return {"success": True}
    except Exception as e:
        logger.error(f"Failed to upsert live session: {e}")
        raise HTTPException(status_code=500, detail="Live session upsert failed")


@router.delete("/api/live/{session_id}")
async def delete_live_session(session_id: str):
    """Called by backend-ai after a session is confirmed."""
    try:
        await db.live_sessions.delete_one({"_id": session_id})
        return {"success": True}
    except Exception as e:
        logger.error(f"Failed to delete live session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Live session delete failed")


@router.get("/api/live")
async def get_live_state(user_id: str = Query(...)):
    """
    Returns the most recent active live session for a user.
    Caregiver frontend polls this every 2-3 seconds.
    """
    try:
        doc = await db.live_sessions.find_one(
            {"user_id": user_id},
            sort=[("created_at", -1)],
        )
        if not doc:
            return {"mode": "Idle", "breadcrumb": [], "streamingSentence": "", "session_id": None}

        path = doc.get("path", [])
        input_mode = doc.get("input_mode", "tree")
        sentence = doc.get("sentence", "")

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
            "session_id": doc["_id"],
        }
    except Exception as e:
        logger.error(f"Failed to fetch live state: {e}")
        return {"mode": "Idle", "breadcrumb": [], "streamingSentence": "", "session_id": None}
