from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
import os
import json
from datetime import datetime
import httpx
from config import DEFAULT_USER_ID, E3_BASE_URL

logger = logging.getLogger(__name__)
router = APIRouter()


class DrawingRequest(BaseModel):
    image: str  # base64
    user_id: str = DEFAULT_USER_ID


async def fetch_vision_context(user_id: str) -> str:
    """
    Fetch patient profile async (non-blocking). Returns a context string
    that includes preferences, active glossary rules, and a meal-window
    bias hint if the current time is near a scheduled meal.
    """
    data_url = os.getenv("E3_BASE_URL", E3_BASE_URL)
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            resp = await client.get(f"{data_url}/api/profile", params={"user_id": user_id})
            if resp.status_code != 200:
                return "No specific context available."
            data = resp.json()
    except Exception as e:
        logger.warning(f"[Vision] Failed to fetch patient context: {e}")
        return "No specific context available."

    parts: list[str] = []

    # Preferences
    prefs = data.get("preferences", {})
    if prefs.get("known_preferences"):
        parts.append(f"Preferences: {prefs['known_preferences']}")
    if prefs.get("always_know"):
        parts.append(f"Always know: {prefs['always_know']}")

    # Active glossary rules — help interpret idiosyncratic symbols
    glossary = [r for r in (data.get("glossary_rules") or []) if r.get("active", True)]
    if glossary:
        rules = "; ".join(f'"{r["trigger_word"]}" = {r["enforced_meaning"]}' for r in glossary[:5])
        parts.append(f"Symbolic overrides: {rules}")

    # Meal-window temporal bias
    meals = (data.get("routine") or {}).get("meals", {})
    if meals:
        now_hour = datetime.now().hour
        for meal_name, meal_time in meals.items():
            try:
                meal_hour = int(str(meal_time).split(":")[0])
                if abs(now_hour - meal_hour) <= 1:
                    parts.append(
                        f"Temporal bias: Patient is currently near {meal_name} time ({meal_time}). "
                        f"Bias ambiguous round/oval/circular shapes toward food concepts "
                        f"(Plate, Bowl, Food, Soup, etc.)."
                    )
                    break
            except (ValueError, AttributeError):
                continue

    return "\n".join(parts) if parts else "No specific context available."


@router.post("/api/analyze-drawing")
async def analyze_drawing_endpoint(req: DrawingRequest):
    try:
        from services.vision_service import analyze_drawing
        context = await fetch_vision_context(req.user_id)
        result = await analyze_drawing(req.image, context)
        return result
    except Exception as e:
        logger.error(f"Error analyzing drawing: {e}")
        raise HTTPException(status_code=500, detail="Vision analysis failed")
