import logging
import uuid
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException
from database import db
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

class SessionCreate(BaseModel):
    user_id: str
    path: List[str]
    path_key: str
    sentence: str
    confidence: float
    input_mode: str = "tree"

class SessionConfirm(BaseModel):
    session_id: str
    audio_url: str

class FeedbackRequest(BaseModel):
    session_id: str
    user_id: str
    thumbs_up: bool
    correction: Optional[str] = None

@router.post("/api/sessions/create")
async def create_session(req: SessionCreate):
    try:
        doc_id = f"s_{uuid.uuid4().hex[:10]}"
        doc = req.model_dump()
        doc.update({
            "_id": doc_id,
            "status": "pending",
            "audio_url": None,
            "feedback": None,
            "correction": None,
            "is_first_occurrence": False,
            "flagged": False,
            "post_session_question": None,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        await db.sessions.insert_one(doc)
        return {"session_id": doc_id}
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail="Database insertion failed")

@router.post("/api/sessions/confirm")
async def confirm_session(req: SessionConfirm):
    try:
        session = await db.sessions.find_one({"_id": req.session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        user_id = session["user_id"]
        path_key = session["path_key"]
        
        # Check first occurrence lock
        existing_count = await db.sessions.count_documents({
            "user_id": user_id, 
            "path_key": path_key, 
            "status": "confirmed"
        })
        is_first = (existing_count == 0)
        
        # Update Session
        await db.sessions.update_one(
            {"_id": req.session_id},
            {"$set": {
                "status": "confirmed",
                "audio_url": req.audio_url,
                "is_first_occurrence": is_first
            }}
        )
        
        # Increment frequency atomically
        await db.users.update_one(
            {"_id": user_id},
            {"$inc": {f"path_frequencies.{path_key}": 1}}
        )
        
        return {"success": True, "is_first_occurrence": is_first}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirming session: {e}")
        raise HTTPException(status_code=500, detail="Database update failed")

@router.post("/api/feedback")
async def submit_feedback(req: FeedbackRequest):
    try:
        session = await db.sessions.find_one({"_id": req.session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        feedback_val = "positive" if req.thumbs_up else "correction"
        
        # Update Session
        await db.sessions.update_one(
            {"_id": req.session_id},
            {"$set": {
                "feedback": feedback_val,
                "correction": req.correction
            }}
        )
        
        if req.correction:
            # Add to user's correction history (capped at 50)
            correction_doc = {
                "path": session["path_key"],
                "original_sentence": session["sentence"],
                "corrected_sentence": req.correction,
                "timestamp": datetime.utcnow().isoformat()
            }
            await db.users.update_one(
                {"_id": req.user_id},
                {"$push": {
                    "correction_history": {
                        "$each": [correction_doc],
                        "$slice": -50
                    }
                }}
            )
            
            # Invalidate sentence cache
            await db.sentences.delete_one({"_id": f"{req.user_id}_{session['path_key']}"})
            
            # TODO: Fire knowledge score Recalculation signal
            
        return {"success": True}
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(status_code=500, detail="Database update failed")

@router.get("/api/sessions/history")
async def get_history(user_id: str = Query(...), limit: int = 20, filter_category: Optional[str] = None):
    try:
        query = {"user_id": user_id, "status": "confirmed"}
        if filter_category:
            # Need to figure out category matching, wait paths array can guide us or we just scan path[0] == category
            query["path.0"] = filter_category
            
        cursor = db.sessions.find(query).sort("timestamp", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        for d in docs:
            d["id"] = d.pop("_id")
        return docs
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")
