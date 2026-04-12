"""GET /api/digest — Daily summary for caregiver."""

import logging
from fastapi import APIRouter, Query
from services.data_service import get_user, get_sessions_last_24h
from services.openai_service import generate_digest
from config import DEFAULT_USER_ID

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/digest")
async def digest(user_id: str = Query(default=DEFAULT_USER_ID)):
    user_data = await get_user(user_id)
    sessions = await get_sessions_last_24h(user_id)
    if len(sessions) < 3:
        return {"digest": "Not enough communication sessions today to generate a meaningful digest."}
    digest_text = await generate_digest(sessions, user_data)
    return {"digest": digest_text}
