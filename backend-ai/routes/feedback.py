"""POST /api/feedback — Learn from corrections."""

import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.data_client import save_feedback, save_correction

logger = logging.getLogger(__name__)
router = APIRouter()


class FeedbackRequest(BaseModel):
    session_id: str
    thumbs_up: bool
    correction: Optional[str] = None
    user_id: str = "yuki_demo"


@router.post("/api/feedback")
async def feedback(req: FeedbackRequest):
    from routes.intent import pending_sessions

    session = pending_sessions.get(req.session_id)

    # Save feedback to E3
    await save_feedback(
        req.session_id,
        {
            "thumbs_up": req.thumbs_up,
            "correction": req.correction,
            "user_id": req.user_id,
        },
    )

    # If correction provided, save to correction history
    if req.correction and session:
        path_str = " > ".join(session.get("path", []))
        await save_correction(
            req.user_id,
            {
                "path": path_str,
                "original": session.get("sentence", ""),
                "corrected": req.correction,
            },
        )

    return {"success": True}
