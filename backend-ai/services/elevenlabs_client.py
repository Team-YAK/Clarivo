"""
ElevenLabs client — patient voice (cloned, high quality) and
caregiver voice (neutral preset, fast).
"""

import os
import uuid
import logging
from pathlib import Path
from elevenlabs.client import AsyncElevenLabs
from elevenlabs import VoiceSettings

logger = logging.getLogger(__name__)

AUDIO_DIR = Path("/tmp/voicemap_audio")
AUDIO_DIR.mkdir(exist_ok=True)

# Neutral preset voice for caregiver direction (Rachel — clear, warm)
CAREGIVER_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # ElevenLabs "Rachel" preset

_client = None


def get_client() -> AsyncElevenLabs:
    global _client
    if _client is None:
        _client = AsyncElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
    return _client


async def synthesize_patient_voice(text: str, voice_id: str) -> str:
    """
    Patient voice: eleven_multilingual_v2 with cloned voice.
    Returns URL path like /audio/{uuid}.mp3
    """
    filename = f"{uuid.uuid4()}.mp3"
    filepath = AUDIO_DIR / filename

    try:
        audio = await get_client().text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id="eleven_multilingual_v2",
            voice_settings=VoiceSettings(
                stability=0.5,
                similarity_boost=0.75,
                style=0.0,
                use_speaker_boost=True,
            ),
        )

        with open(filepath, "wb") as f:
            async for chunk in audio:
                f.write(chunk)

        return f"/audio/{filename}"
    except Exception as e:
        logger.error(f"Patient voice synthesis failed: {e}")
        raise


async def synthesize_caregiver_voice(text: str) -> str:
    """
    Caregiver voice: eleven_turbo_v2 with neutral preset voice.
    Different voice than patient — key demo moment.
    Returns URL path like /audio/{uuid}.mp3
    """
    filename = f"{uuid.uuid4()}.mp3"
    filepath = AUDIO_DIR / filename

    try:
        audio = await get_client().text_to_speech.convert(
            voice_id=CAREGIVER_VOICE_ID,
            text=text,
            model_id="eleven_turbo_v2",
            voice_settings=VoiceSettings(
                stability=0.7,
                similarity_boost=0.5,
                style=0.0,
                use_speaker_boost=False,
            ),
        )

        with open(filepath, "wb") as f:
            async for chunk in audio:
                f.write(chunk)

        return f"/audio/{filename}"
    except Exception as e:
        logger.error(f"Caregiver voice synthesis failed: {e}")
        raise


async def clone_voice(audio_data: bytes, name: str = "Alex") -> str:
    """
    Clone a voice from audio data using ElevenLabs Instant Voice Cloning.
    Returns the new voice_id.
    """
    try:
        voice = await get_client().clone(
            name=name,
            files=[("audio.mp3", audio_data)],
            description="Cloned voice for AAC patient",
        )
        return voice.voice_id
    except Exception as e:
        logger.error(f"Voice cloning failed: {e}")
        raise
