from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import logging
from services.vision_service import analyze_drawing
import urllib.request
import json
import os

logger = logging.getLogger(__name__)

router = APIRouter()

class DrawingRequest(BaseModel):
    image: str
    user_id: str = "alex_demo"

def fetch_patient_context(user_id: str) -> str:
    """Helper to fetch profile data from backend-data to build context."""
    data_url = os.getenv("DATA_URL", "http://localhost:8002")
    try:
        req = urllib.request.Request(f"{data_url}/api/profile?user_id={user_id}")
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                body = response.read()
                data = json.loads(body)
                # Build context
                context_str = "Preferences: " + data.get("preferences", {}).get("known_preferences", "")
                return context_str
    except Exception as e:
        logger.warning(f"Failed to fetch patient context for vision route: {e}")
    return "No specific context available."

@router.post("/api/analyze-drawing")
async def analyze_drawing_endpoint(req: DrawingRequest):
    try:
        context = fetch_patient_context(req.user_id)
        result = await analyze_drawing(req.image, context)
        return result
    except Exception as e:
        logger.error(f"Error analyzing drawing: {e}")
        raise HTTPException(status_code=500, detail="Vision analysis failed")
