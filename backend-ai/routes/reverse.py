from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.data_service import get_user
from services.context_service import build_context_string
from services.openai_service import reverse_intent
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class ReverseRequest(BaseModel):
    sentence: str
    user_id: str = "yuki_demo"

@router.post("/api/reverse")
async def reverse_translate(req: ReverseRequest):
    if not req.sentence or not req.sentence.strip():
        raise HTTPException(status_code=400, detail="Sentence cannot be empty")

    user_data = await get_user(req.user_id)
    context = build_context_string(user_data)
    
    result = await reverse_intent(req.sentence, context)
    if result is None:
        raise HTTPException(status_code=500, detail="Reverse translation failed")
        
    return {"options": result}
