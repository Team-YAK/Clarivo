"""POST /api/voice/clone — Onboarding voice cloning. /api/voice/speak - Text-to-speech."""

import os

import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.elevenlabs_service import clone_voice, synthesize_patient_voice
from services.data_service import save_voice_id, get_user
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/api/voice/clone")
async def voice_clone(audio: UploadFile = File(...), user_id: str = "yuki_demo"):
    if not audio.filename.lower().endswith((".mp3", ".wav", ".m4a")):
        raise HTTPException(status_code=400, detail="Invalid file format. Must be mp3, wav, or m4a")

    audio_data = await audio.read()
    if len(audio_data) < 20000:
        raise HTTPException(status_code=400, detail="Audio file too short or empty. Please provide at least 5 seconds of audio.")

    try:
        voice_id = await clone_voice(audio_data, name=f"Patient_{user_id}")
        await save_voice_id(user_id, voice_id)
        return {"success": True, "voice_id": voice_id}
    except Exception as e:
        logger.error(f"Voice cloning route failed: {e}")
        return {"success": False, "error": f"Failed to clone voice: {str(e)}", "code": "CLONE_ERROR"}


class SpeakRequest(BaseModel):
    text: str
    user_id: str = "alex_demo"


@router.post("/api/voice/speak")
async def voice_speak(req: SpeakRequest):
    try:
        # Get user's voice_id, fallback to YUKI_VOICE_ID env, then Rachel preset
        voice_id = None
        try:
            user_data = await get_user(req.user_id)
            voice_id = user_data.get("voice_id")
        except Exception:
            pass

        if not voice_id or voice_id == "mock_voice_id":
            voice_id = os.getenv("YUKI_VOICE_ID")
        if not voice_id:
            voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel

        logger.info(f"Synthesizing voice with voice_id={voice_id} for text: {req.text[:50]}...")
        audio_url = await synthesize_patient_voice(req.text, voice_id)
        return {"audio_url": audio_url}
    except Exception as e:
        logger.error(f"Speak route failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
