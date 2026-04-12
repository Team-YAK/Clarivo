from fastapi import APIRouter, HTTPException
from database import db
from pydantic import BaseModel
from typing import Optional
import datetime

router = APIRouter()

class PromptUpdate(BaseModel):
    user_id: str
    prompt_id: str
    content: str
    description: Optional[str] = None

@router.get("/api/prompts")
async def get_prompts(user_id: str):
    try:
        cursor = db.prompts.find({"user_id": user_id})
        prompts = await cursor.to_list(length=100)
        return {"prompts": prompts}
    except Exception as e:
        return {"prompts": []}

@router.get("/api/prompts/{prompt_id}")
async def get_prompt(prompt_id: str, user_id: str):
    prompt = await db.prompts.find_one({"prompt_id": prompt_id, "user_id": user_id})
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return {"prompt": prompt}

@router.post("/api/prompts")
async def upsert_prompt(req: PromptUpdate):
    try:
        await db.prompts.update_one(
            {"prompt_id": req.prompt_id, "user_id": req.user_id},
            {
                "$set": {
                    "content": req.content,
                    "description": req.description,
                    "updated_at": datetime.datetime.utcnow().isoformat()
                }
            },
            upsert=True
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
