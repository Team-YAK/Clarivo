"""POST /api/voice/clone — Onboarding voice cloning. /api/voice/speak - Text-to-speech. /api/voice/transcribe - Speech-to-text."""

import os
import io

import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.elevenlabs_service import clone_voice, synthesize_patient_voice, get_client, FALLBACK_VOICE_ID
from services.data_service import save_voice_id, get_user
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

# Unified default user ID for the demo
DEFAULT_USER_ID = os.getenv("DEFAULT_USER_ID", "alex_demo")


@router.post("/api/voice/clone")
async def voice_clone(audio: UploadFile = File(...), user_id: str = Form(DEFAULT_USER_ID)):
    """
    Accept a voice sample (webm, mp3, wav, m4a, ogg) from the Voice Studio,
    clone it via ElevenLabs, and persist the new voice_id to the user profile.
    """
    # Accept browser-recorded formats (webm) alongside standard audio formats
    ALLOWED_EXTENSIONS = (".mp3", ".wav", ".m4a", ".webm", ".ogg", ".flac")
    filename = audio.filename or "audio.webm"
    if not filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format '{filename}'. Accepted: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    audio_data = await audio.read()
    if len(audio_data) < 5000:
        raise HTTPException(status_code=400, detail="Audio file too short or empty. Please provide at least 5 seconds of audio.")

    try:
        voice_id = await clone_voice(audio_data, name=f"Patient_{user_id}")
        await save_voice_id(user_id, voice_id)
        logger.info(f"Voice cloned successfully for user {user_id}: voice_id={voice_id}")
        return {"success": True, "voice_id": voice_id, "method": "ivc"}
    except Exception as e:
        error_str = str(e)
        logger.error(f"Voice cloning route failed: {error_str}")

        # If it's a permissions error, gracefully fall back:
        # Save the audio sample locally and use the pre-configured voice
        if "missing_permissions" in error_str or "401" in error_str or "permission" in error_str.lower():
            logger.warning("IVC permissions not available — saving voice sample and using pre-configured voice")
            import uuid
            from pathlib import Path

            # Save the raw voice sample for potential future cloning
            samples_dir = Path("/tmp/voicemap_audio/voice_samples")
            samples_dir.mkdir(parents=True, exist_ok=True)
            sample_path = samples_dir / f"{user_id}_{uuid.uuid4().hex[:8]}.webm"
            with open(sample_path, "wb") as f:
                f.write(audio_data)
            logger.info(f"Voice sample saved: {sample_path} ({len(audio_data)} bytes)")

            # Use the pre-configured YUKI_VOICE_ID as the patient voice
            fallback_voice_id = os.getenv("YUKI_VOICE_ID", FALLBACK_VOICE_ID)
            await save_voice_id(user_id, fallback_voice_id)
            logger.info(f"Using pre-configured voice_id={fallback_voice_id} for user {user_id}")

            return {
                "success": True,
                "voice_id": fallback_voice_id,
                "method": "preconfigured",
                "note": "Voice sample saved. Using pre-configured voice profile for synthesis."
            }

        return {"success": False, "error": f"Failed to clone voice: {error_str}", "code": "CLONE_ERROR"}


class SpeakRequest(BaseModel):
    text: str
    user_id: str = "alex_demo"


@router.post("/api/voice/speak")
async def voice_speak(req: SpeakRequest):
    """
    Synthesize speech using the patient's cloned voice.
    Fallback chain: user.voice_id → YUKI_VOICE_ID env → Rachel preset.
    Returns { audio_url, voice_source } so the frontend knows which voice was used.
    """
    try:
        voice_id = None
        voice_source = "preset"  # Track which voice was ultimately used

        # 1. Try to get the user's custom cloned voice_id from the DB
        try:
            user_data = await get_user(req.user_id)
            stored_id = user_data.get("voice_id")
            if stored_id and stored_id not in ("", "mock_voice_id", "mock_voice_123"):
                voice_id = stored_id
                voice_source = "cloned"
                logger.info(f"Using cloned voice_id={voice_id} for user {req.user_id}")
        except Exception as e:
            logger.warning(f"Could not fetch user profile for voice_id: {e}")

        # 2. Fallback to YUKI_VOICE_ID environment variable
        if not voice_id:
            voice_id = os.getenv("YUKI_VOICE_ID")
            if voice_id:
                voice_source = "env_override"

        # 3. Final fallback to Rachel preset
        if not voice_id:
            voice_id = FALLBACK_VOICE_ID
            voice_source = "preset"

        logger.info(f"Synthesizing: voice_id={voice_id} (source={voice_source}), text='{req.text[:50]}...'")
        audio_url = await synthesize_patient_voice(req.text, voice_id)
        return {"audio_url": audio_url, "voice_source": voice_source}
    except Exception as e:
        logger.error(f"Speak route failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/voice/transcribe")
async def voice_transcribe(file: UploadFile = File(...)):
    """
    Transcribe uploaded audio using ElevenLabs Scribe STT.
    Accepts webm, wav, mp3, m4a, ogg, etc.
    Returns { "text": "transcribed text" }
    """
    try:
        audio_data = await file.read()
        if len(audio_data) < 500:
            # Too small to contain speech
            return {"text": ""}

        logger.info(f"Transcribing audio: {len(audio_data)} bytes, filename={file.filename}")

        client = get_client()
        result = client.speech_to_text.convert(
            model_id="scribe_v1",
            file=audio_data,
            language_code="en",
        )

        transcript = result.text.strip() if result and result.text else ""
        logger.info(f"Transcription result: '{transcript[:80]}...' " if len(transcript) > 80 else f"Transcription result: '{transcript}'")
        return {"text": transcript}
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return {"text": ""}
