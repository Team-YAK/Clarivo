"""POST /api/clarify — Low confidence alternatives."""

import logging
from fastapi import APIRouter
from pydantic import BaseModel
from services.data_service import get_user
from services.context_service import build_context_string
from services.openai_service import generate_clarification_options
from config import DEFAULT_USER_ID

logger = logging.getLogger(__name__)
router = APIRouter()


class ClarifyRequest(BaseModel):
    path: list[str]
    user_id: str = DEFAULT_USER_ID
    input_mode: str = "tree"


@router.post("/api/clarify")
async def clarify(req: ClarifyRequest):
    user_data = await get_user(req.user_id)
    context = build_context_string(user_data)
    options = await generate_clarification_options(req.path, context, input_mode=req.input_mode)

    if options is None:
        return {"options": []}

    for opt in options:
        opt["input_mode"] = req.input_mode

    return {"options": options}
