"""POST /api/caregiver/simplify — Caregiver-to-patient text simplification."""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.openai_service import simplify_text
from services.elevenlabs_service import synthesize_caregiver_voice

logger = logging.getLogger(__name__)
router = APIRouter()


class SimplifyRequest(BaseModel):
    text: str
    user_id: str = "yuki_demo"


@router.post("/api/caregiver/simplify")
async def simplify(req: SimplifyRequest):
    if not req.text or len(req.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text to simplify cannot be empty")

    simplified = await simplify_text(req.text)

    # Synthesize with caregiver voice (neutral preset, NOT Yuki's)
    combined_text = " ".join(simplified)
    try:
        audio_url = await synthesize_caregiver_voice(combined_text)
    except Exception:
        audio_url = "/audio/mock_caregiver.mp3"

    # Generate emoji tags from simplified text
    emoji_map = {
        "medicine": "💊",
        "medication": "💊",
        "food": "🍽️",
        "eat": "🍽️",
        "pain": "😣",
        "hurt": "😣",
        "happy": "😊",
        "walk": "🚶",
        "sleep": "😴",
        "water": "💧",
        "drink": "💧",
        "doctor": "👨‍⚕️",
        "family": "👨‍👩‍👧",
        "love": "❤️",
    }
    emoji_tags = []
    lower_text = combined_text.lower()
    for word, emoji in emoji_map.items():
        if word in lower_text and emoji not in emoji_tags:
            emoji_tags.append(emoji)

    return {
        "simplified": simplified,
        "emoji_tags": emoji_tags,
        "audio_url": audio_url,
    }
