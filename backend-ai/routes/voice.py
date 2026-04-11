"""POST /api/voice/clone — Onboarding voice cloning."""

import logging
from fastapi import APIRouter, UploadFile, File
from services.elevenlabs_client import clone_voice
from services.data_client import save_voice_id

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/api/voice/clone")
async def voice_clone(audio: UploadFile = File(...), user_id: str = "alex_demo"):
    audio_data = await audio.read()
    voice_id = await clone_voice(audio_data, name=f"Patient_{user_id}")
    await save_voice_id(user_id, voice_id)
    return {"voice_id": voice_id}
