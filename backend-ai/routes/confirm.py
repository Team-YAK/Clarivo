"""POST /api/confirm — ElevenLabs synthesis + post-session question."""

import os
import logging
import asyncio
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from services.data_service import get_user, create_session, save_context_question
from services.context_service import build_context_string
from services.elevenlabs_service import synthesize_patient_voice
from services.openai_service import generate_post_session_question

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
    # Cascade: E3 profile -> .env -> Preset Voice
    voice_id = user_data.get("voice_id")
    if not voice_id:
        voice_id = os.getenv("YUKI_VOICE_ID")
    if not voice_id:
        voice_id = "21m00Tcm4TlvDq8ikWAM"  # Hardcoded fallback preset

    if voice_id == "mock_voice_id":
        # In mock mode, return a placeholder audio URL
        audio_url = "/audio/mock_patient.mp3"
    else:
        try:
            audio_url = await synthesize_patient_voice(session["sentence"], voice_id)
        except Exception as e:
            logger.error(f"Synthesis failed in confirm: {e}")
            return {"error": "Voice synthesis failed", "details": str(e)}, 500

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
