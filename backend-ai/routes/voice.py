"""POST /api/voice/clone — Onboarding voice cloning."""

import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.elevenlabs_service import clone_voice
from services.data_service import save_voice_id

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
