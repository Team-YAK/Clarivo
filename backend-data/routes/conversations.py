from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException
from database import db
from pydantic import BaseModel
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class Utterance(BaseModel):
    speaker: str  # "Patient" or "Visitor"
    text: str
    timestamp: str

class ConversationCreate(BaseModel):
    user_id: str

@router.post("/api/conversations/start")
async def start_conversation(user_id: str):
    try:
        conv_id = f"c_{uuid.uuid4().hex[:10]}"
        doc = {
            "_id": conv_id,
            "user_id": user_id,
            "start_time": datetime.utcnow().isoformat(),
            "end_time": None,
            "utterances": [],
            "active": True
        }
        await db.conversations.insert_one(doc)
        return {"conversation_id": conv_id}
    except Exception as e:
        logger.error(f"Error starting conversation: {e}")
        raise HTTPException(status_code=500, detail="Database insertion failed")

@router.post("/api/conversations/add_sentence")
async def add_sentence(conversation_id: str, speaker: str, text: str):
    try:
        utterance = {
            "speaker": speaker,
            "text": text,
            "timestamp": datetime.utcnow().isoformat()
        }
        result = await db.conversations.update_one(
            {"_id": conversation_id},
            {"$push": {"utterances": utterance}}
        )
        if result and hasattr(result, 'matched_count') and result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding sentence: {e}")
        return {"success": True}  # Best-effort — don't block the UI

@router.post("/api/conversations/end")
async def end_conversation(conversation_id: str):
    try:
        result = await db.conversations.update_one(
            {"_id": conversation_id},
            {"$set": {"active": False, "end_time": datetime.utcnow().isoformat()}}
        )
        if result and hasattr(result, 'matched_count') and result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ending conversation: {e}")
        return {"success": True}  # Best-effort

@router.get("/api/conversations/active")
async def get_active_conversation(user_id: str):
    from fastapi.responses import Response
    try:
        conv = await db.conversations.find_one({"user_id": user_id, "active": True})
        if conv:
            # Copy to avoid mutating the in-memory mock DB doc
            result = dict(conv)
            result["id"] = result.pop("_id", result.get("id"))
            return result
        return Response(status_code=204)
    except Exception as e:
        logger.error(f"Error fetching active conversation: {e}")
        # Return 204 instead of 500 for transient DB errors — the frontend
        # treats this as "no active conversation" which is a safe fallback
        return Response(status_code=204)

@router.get("/api/conversations/history")
async def get_conversation_history(user_id: str, limit: int = 10):
    try:
        cursor = db.conversations.find({"user_id": user_id}).sort("start_time", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        results = []
        for d in docs:
            c = dict(d)
            c["id"] = c.pop("_id", c.get("id"))
            results.append(c)
        docs = results
        return {"conversations": docs}
    except Exception as e:
        logger.error(f"Error fetching conversation history: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")
