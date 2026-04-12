"""POST /api/confirm — ElevenLabs synthesis + post-session question."""

import os
import asyncio
import logging
import httpx
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from services.data_service import get_user, create_session, save_context_question
from services.context_service import build_context_string
from services.elevenlabs_service import synthesize_patient_voice
from services.openai_service import generate_post_session_question
from config import DEFAULT_USER_ID

logger = logging.getLogger(__name__)
router = APIRouter()


class ConfirmRequest(BaseModel):
    session_id: str
    user_id: str = DEFAULT_USER_ID


@router.post("/api/confirm")
async def confirm(req: ConfirmRequest, background_tasks: BackgroundTasks):
    # Import here to avoid circular imports
    from routes.intent import pending_sessions

    session = pending_sessions.get(req.session_id)
    if not session:
        # Fallback: try MongoDB live_sessions
        try:
            e3_url = os.getenv("E3_BASE_URL", "http://localhost:8002")
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(f"{e3_url}/api/live", params={"user_id": req.user_id})
                if resp.status_code == 200:
                    live = resp.json()
                    if live.get("session_id") == req.session_id:
                        session = {
                            "session_id": live["session_id"],
                            "user_id": req.user_id,
                            "path": live.get("breadcrumb", []),
                            "path_key": "→".join(live.get("breadcrumb", [])),
                            "sentence": live.get("streamingSentence", ""),
                            "confidence": 0.85,
                            "input_mode": live.get("mode", "tree").lower(),
                        }
        except Exception:
            pass
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    user_data = await get_user(req.user_id)
    # Cascade: E3 profile -> .env -> Preset Voice
    voice_id = user_data.get("voice_id")
    voice_source = "preset"
    if not voice_id:
        voice_id = os.getenv("YUKI_VOICE_ID")
        if voice_id:
            voice_source = "env_override"
    else:
        voice_source = "cloned"
    if not voice_id:
        voice_id = "21m00Tcm4TlvDq8ikWAM"  # Hardcoded fallback preset

    if voice_id == "mock_voice_id":
        # In mock mode, return a placeholder audio URL
        audio_url = "/audio/mock_patient.mp3"
        voice_source = "mock"
    else:
        try:
            audio_url = await synthesize_patient_voice(session["sentence"], voice_id)
        except Exception as e:
            logger.error(f"Synthesis failed in confirm: {e}")
            raise HTTPException(status_code=500, detail="Voice synthesis failed") from e

    # Remove from MongoDB live_sessions (fire-and-forget)
    async def _delete_live():
        try:
            e3_url = os.getenv("E3_BASE_URL", "http://localhost:8002")
            async with httpx.AsyncClient(timeout=2.0) as c:
                await c.delete(f"{e3_url}/api/live/{req.session_id}")
        except Exception: pass
    asyncio.create_task(_delete_live())

    # Remove from local dict
    from routes.intent import pending_sessions
    pending_sessions.pop(req.session_id, None)

    # Persist session to E3
    await create_session(
        {
            "session_id": session["session_id"],
            "user_id": req.user_id,
            "path": session["path"],
            "path_key": session.get("path_key", ""),
            "input_mode": session.get("input_mode", "tree"),
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
        "voice_source": voice_source,
        "post_session_question": None,  # Generated async, available later
    }
