"""POST /api/feedback — Learn from corrections."""

import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.data_service import save_feedback, save_correction, get_user
from services.context_service import build_context_string
from services.openai_service import refine_sentence_with_correction

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

    # Save initial feedback to E3
    await save_feedback(
        req.session_id,
        {
            "thumbs_up": req.thumbs_up,
            "correction": req.correction,
            "user_id": req.user_id,
        },
    )

    # If correction provided, refine it and save to correction history
    if req.correction and session:
        user_data = await get_user(req.user_id)
        context = build_context_string(user_data)
        
        refined_sentence = await refine_sentence_with_correction(
            original=session.get("sentence", ""),
            correction=req.correction,
            path=session.get("path", []),
            context=context
        )

        await save_correction(
            req.user_id,
            req.session_id,
            refined_sentence,
        )

    return {"success": True}

