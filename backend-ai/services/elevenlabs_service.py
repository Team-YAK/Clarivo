"""
ElevenLabs client — patient voice (cloned, high quality) and
caregiver voice (neutral preset, fast).
"""

import os
import uuid
import logging
from pathlib import Path

try:
    from elevenlabs.client import ElevenLabs
    from elevenlabs import VoiceSettings
except ImportError:  # pragma: no cover - exercised in envs without optional deps
    ElevenLabs = None
    VoiceSettings = None

logger = logging.getLogger(__name__)

AUDIO_DIR = Path("/tmp/voicemap_audio")
AUDIO_DIR.mkdir(exist_ok=True)

# Neutral preset voice for caregiver direction (Rachel — clear, warm)
CAREGIVER_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # ElevenLabs "Rachel" preset
FALLBACK_VOICE_ID = CAREGIVER_VOICE_ID  # Export for use in routes

_client = None


def get_client() -> ElevenLabs:
    """
    Lazily initialize the ElevenLabs client.
    Logs a clear warning if the API key is missing instead of crashing the server.
    """
    global _client
    if _client is None:
        if ElevenLabs is None:
            raise RuntimeError("elevenlabs package is not installed")
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            logger.error(
                "ELEVENLABS_API_KEY is not set. Voice cloning, synthesis, and "
                "transcription will fail. Set it in backend-ai/.env"
            )
            raise RuntimeError(
                "ELEVENLABS_API_KEY environment variable is not set. "
                "Please add it to backend-ai/.env"
            )
        logger.info(f"Initializing ElevenLabs client with key ending in ...{api_key[-6:]}")
        _client = ElevenLabs(api_key=api_key)
    return _client


async def synthesize_patient_voice(text: str, voice_id: str) -> str:
    """
    Patient voice: eleven_multilingual_v2 with cloned voice.
    Falls back to Rachel preset if the provided voice_id is invalid or expired.
    Returns URL path like /audio/{uuid}.mp3
    """
    filename = f"{uuid.uuid4()}.mp3"
    filepath = AUDIO_DIR / filename

    try:
        logger.info(f"Calling ElevenLabs TTS: voice_id={voice_id}, text='{text[:40]}...'")

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
        logger.error(f"Patient voice synthesis failed with voice_id={voice_id}: {e}")

        # If the voice_id was a custom clone and it failed, retry with Rachel preset
        if voice_id != FALLBACK_VOICE_ID:
            logger.warning(f"Retrying synthesis with fallback voice (Rachel): {FALLBACK_VOICE_ID}")
            try:
                # Clean up the failed file if it was partially written
                if filepath.exists():
                    os.remove(filepath)

                fallback_filename = f"{uuid.uuid4()}.mp3"
                fallback_filepath = AUDIO_DIR / fallback_filename

                audio_generator = get_client().text_to_speech.convert(
                    voice_id=FALLBACK_VOICE_ID,
                    text=text,
                    model_id="eleven_multilingual_v2",
                    voice_settings=VoiceSettings(
                        stability=0.5,
                        similarity_boost=0.75,
                        style=0.0,
                        use_speaker_boost=True,
                    ),
                )

                with open(fallback_filepath, "wb") as f:
                    for chunk in audio_generator:
                        f.write(chunk)

                file_size = os.path.getsize(fallback_filepath)
                if file_size == 0:
                    os.remove(fallback_filepath)
                    raise Exception("Fallback also returned 0-byte audio")

                logger.info(f"Fallback audio written: {fallback_filepath} ({file_size} bytes)")
                return f"/audio/{fallback_filename}"

            except Exception as fallback_error:
                logger.error(f"Fallback synthesis also failed: {fallback_error}")
                raise fallback_error
        else:
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


async def clone_voice(audio_data: bytes, name: str = "Patient") -> str:
    """
    Clone a voice from audio data using ElevenLabs Instant Voice Cloning (IVC).
    Uses voices.ivc.create() — ElevenLabs SDK v2.42.0.
    Returns the new voice_id.
    """
    try:
        logger.info(f"Cloning voice '{name}' from {len(audio_data)} bytes of audio")

        result = get_client().voices.ivc.create(
            name=name,
            files=[audio_data],
            description="Cloned voice for AAC patient via Clarivo Voice Studio",
        )
        voice_id = result.voice_id
        logger.info(f"Voice cloned successfully: voice_id={voice_id}")
        return voice_id
    except Exception as e:
        logger.error(f"Voice cloning failed: {e}")
        raise
