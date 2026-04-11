"""POST /api/confirm — ElevenLabs synthesis + post-session question."""

import os
import logging
import asyncio
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from services.data_client import get_user, create_session, save_context_question
from services.context import build_context_string
from services.elevenlabs_client import synthesize_patient_voice
from services.openai_client import generate_post_session_question

logger = logging.getLogger(__name__)
router = APIRouter()


class ConfirmRequest(BaseModel):
    session_id: str
    user_id: str = "yuki_demo"


@router.post("/api/confirm")
async def confirm(req: ConfirmRequest, background_tasks: BackgroundTasks):
    # Import here to avoid circular imports
    from routes.intent import pending_sessions

    session = pending_sessions.get(req.session_id)
    if not session:
        return {"error": "Session not found or expired"}, 404

    user_data = await get_user(req.user_id)
    voice_id = user_data.get("voice_id") or os.getenv("YUKI_VOICE_ID", "")

    if not voice_id or voice_id == "mock_voice_id":
        # In mock mode, return a placeholder audio URL
        audio_url = "/audio/mock_patient.mp3"
    else:
        audio_url = await synthesize_patient_voice(session["sentence"], voice_id)

    # Persist session to E3
    await create_session(
        {
            "session_id": session["session_id"],
            "user_id": req.user_id,
            "path": session["path"],
            "sentence": session["sentence"],
            "confidence": session["confidence"],
            "audio_url": audio_url,
        }
    )

    # Background: generate post-session question
    async def _generate_question():
        context = build_context_string(user_data)
        question = await generate_post_session_question(session, context)
        if question:
            await save_context_question(req.user_id, question)

    background_tasks.add_task(_generate_question)

    return {
        "audio_url": audio_url,
        "session_id": session["session_id"],
        "sentence": session["sentence"],
        "post_session_question": None,  # Generated async, available later
    }
