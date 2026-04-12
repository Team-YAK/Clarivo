"""
ElevenLabs client — patient voice (cloned, high quality) and
caregiver voice (neutral preset, fast).
"""

import os
import uuid
import logging
from pathlib import Path
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings

logger = logging.getLogger(__name__)

AUDIO_DIR = Path("/tmp/voicemap_audio")
AUDIO_DIR.mkdir(exist_ok=True)

# Neutral preset voice for caregiver direction (Rachel — clear, warm)
CAREGIVER_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # ElevenLabs "Rachel" preset

_client = None


def get_client() -> ElevenLabs:
    global _client
    if _client is None:
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            raise RuntimeError("ELEVENLABS_API_KEY environment variable is not set")
        logger.info(f"Initializing ElevenLabs client with key ending in ...{api_key[-6:]}")
        _client = ElevenLabs(api_key=api_key)
    return _client


async def synthesize_patient_voice(text: str, voice_id: str) -> str:
    """
    Patient voice: eleven_multilingual_v2 with cloned voice.
    Returns URL path like /audio/{uuid}.mp3
    """
    filename = f"{uuid.uuid4()}.mp3"
    filepath = AUDIO_DIR / filename

    try:
        logger.info(f"Calling ElevenLabs TTS: voice_id={voice_id}, text='{text[:40]}...'")
        
        # Use synchronous client — elevenlabs SDK v2.x convert() returns a generator
        audio_generator = get_client().text_to_speech.convert(
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
            for chunk in audio_generator:
                f.write(chunk)

        file_size = os.path.getsize(filepath)
        if file_size == 0:
            os.remove(filepath)
            raise Exception("ElevenLabs returned a 0-byte audio file")

        logger.info(f"Audio file written: {filepath} ({file_size} bytes)")
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
        audio_generator = get_client().text_to_speech.convert(
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
            for chunk in audio_generator:
                f.write(chunk)

        if os.path.getsize(filepath) == 0:
            os.remove(filepath)
            raise Exception("ElevenLabs returned a 0-byte audio file")

        return f"/audio/{filename}"
    except Exception as e:
        logger.error(f"Caregiver voice synthesis failed: {e}")
        raise


async def clone_voice(audio_data: bytes, name: str = "Yuki") -> str:
    """
    Clone a voice from audio data using ElevenLabs Instant Voice Cloning.
    Returns the new voice_id.
    """
    try:
        voice = get_client().clone(
            name=name,
            files=[("audio.mp3", audio_data)],
            description="Cloned voice for AAC patient",
        )
        return voice.voice_id
    except Exception as e:
        logger.error(f"Voice cloning failed: {e}")
        raise
