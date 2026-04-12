import logging
import uuid
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException
from database import db
from pydantic import BaseModel
from utils import path_to_key

logger = logging.getLogger(__name__)
router = APIRouter()

class SessionCreate(BaseModel):
    user_id: str
    path: List[str]
    path_key: Optional[str] = None
    sentence: str
    confidence: float
    input_mode: str = "tree"
    session_id: Optional[str] = None
    audio_url: Optional[str] = None

class FeedbackRequest(BaseModel):
    session_id: str
    user_id: str
    thumbs_up: bool
    correction: Optional[str] = None

@router.post("/api/sessions/create")
async def create_session(req: SessionCreate):
    try:
        doc_id = req.session_id or f"s_{uuid.uuid4().hex[:10]}"
        # Auto-generate path_key if not provided
        p_key = req.path_key or path_to_key(req.path, req.input_mode)
        existing_count = await db.sessions.count_documents({
            "user_id": req.user_id,
            "path_key": p_key,
            "status": "confirmed",
        })
        doc = req.model_dump()
        doc.update({
            "_id": doc_id,
            "path_key": p_key,
            "status": "confirmed",
            "feedback": None,
            "correction": None,
            "is_first_occurrence": existing_count == 0,
            "flagged": False,
            "post_session_question": None,
            "timestamp": datetime.utcnow().isoformat()
        })
        # Remove session_id from doc body (it's in _id)
        doc.pop("session_id", None)
        
        await db.sessions.insert_one(doc)
        
        # Increment path frequency for the user
        await db.users.update_one(
            {"_id": req.user_id},
            {"$inc": {f"path_frequencies.{p_key}": 1}}
        )
        
        return {"session_id": doc_id}
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail="Database insertion failed")

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

class SessionUpdate(BaseModel):
    session_id: str
    updates: dict

@router.post("/api/sessions/update")
async def update_session(req: SessionUpdate):
    try:
        await db.sessions.update_one(
            {"_id": req.session_id},
            {"$set": req.updates}
        )
        return {"success": True}
    except Exception as e:
        logger.error(f"Error updating session: {e}")
        raise HTTPException(status_code=500, detail="Database update failed")

@router.get("/api/sessions/history")
async def get_history(user_id: str = Query(...), limit: int = 20):
    try:
        query = {"user_id": user_id, "status": "confirmed"}
        cursor = db.sessions.find(query).sort("timestamp", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        for d in docs:
            d["id"] = d.pop("_id")
        return {"sessions": docs}
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")


@router.get("/api/question/pending")
async def get_pending_question(user_id: str = Query(...)):
    """
    Returns the post_session_question from the patient's most recent confirmed session,
    if the caregiver hasn't answered it yet. Frontend polls this after each session confirm.
    """
    try:
        last_session = await db.sessions.find_one(
            {"user_id": user_id, "status": "confirmed"},
            sort=[("timestamp", -1)]
        )
        if not last_session or not last_session.get("post_session_question"):
            return {"pending": False, "question": None}

        q = last_session["post_session_question"]

        # Check if already answered — look in user's context_answers
        user = await db.users.find_one({"_id": user_id})
        if not user:
            return {"pending": False, "question": None}

        answered_ids = {a.get("question_id") for a in user.get("context_answers", [])}
        q_id = q.get("question_id")

        if q_id and q_id in answered_ids:
            return {"pending": False, "question": None}

        return {"pending": True, "question": q, "session_id": str(last_session["_id"])}
    except Exception as e:
        logger.error(f"Error fetching pending question: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")
