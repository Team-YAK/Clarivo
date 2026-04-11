"""POST /api/clarify — Low confidence alternatives."""

import logging
from fastapi import APIRouter
from pydantic import BaseModel
from services.data_client import get_user
from services.context import build_context_string
from services.openai_client import generate_clarification_options

logger = logging.getLogger(__name__)
router = APIRouter()


class ClarifyRequest(BaseModel):
    path: list[str]
    user_id: str = "alex_demo"


@router.post("/api/clarify")
async def clarify(req: ClarifyRequest):
    user_data = await get_user(req.user_id)
    context = build_context_string(user_data)
    options = await generate_clarification_options(req.path, context)
    return {"options": options}
