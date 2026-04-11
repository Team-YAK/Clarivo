"""GET /api/digest — Daily summary for caregiver."""

import logging
from fastapi import APIRouter, Query
from services.data_client import get_user, get_sessions_last_24h
from services.openai_client import generate_digest

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/digest")
async def digest(user_id: str = Query(default="yuki_demo")):
    user_data = await get_user(user_id)
    sessions = await get_sessions_last_24h(user_id)
    digest_text = await generate_digest(sessions, user_data)
    return {"digest": digest_text}
