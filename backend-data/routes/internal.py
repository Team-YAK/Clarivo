from fastapi import APIRouter, HTTPException
from database import db
from models import *
from services.engines import is_first_occurrence, calculate_knowledge_score
from datetime import datetime
import uuid
import subprocess

router = APIRouter()

@router.post("/api/sessions/create")
async def create_session(req: SessionCreateRequest):
    session_id = f"s_{uuid.uuid4().hex[:8]}"
    doc = {
        "_id": session_id,
        "user_id": req.user_id,
        "path": req.path,
        "sentence": req.sentence,
        "confidence": req.confidence,
        "audio_url": None,
        "feedback": None,
        "correction": None,
        "is_first_occurrence": False,
        "flagged": False,
        "timestamp": datetime.utcnow().isoformat()
    }
    await db.sessions.insert_one(doc)
    return {"session_id": session_id}

@router.post("/api/sessions/confirm")
async def confirm_session(req: SessionConfirmRequest):
    session = await db.sessions.find_one({"_id": req.session_id})
    if not session:
        raise HTTPException(404, "Session not found")
        
    first_occ = await is_first_occurrence(session["user_id"], session["path"], req.session_id)
    
    await db.sessions.update_one(
        {"_id": req.session_id},
        {"$set": {
            "audio_url": req.audio_url,
            "is_first_occurrence": first_occ,
            "timestamp": datetime.utcnow().isoformat()
        }}
    )
    
    path_key = "_".join(session["path"])
    await db.users.update_one(
        {"_id": session["user_id"]},
        {"$inc": {f"path_frequencies.{path_key}": 1}}
    )
    
    await calculate_knowledge_score(session["user_id"])
    
    return {"success": True}

@router.post("/api/feedback")
async def process_feedback(req: FeedbackRequest):
    update_data = {
        "feedback": "positive" if req.thumbs_up else "correction"
    }
    if req.correction:
        update_data["correction"] = req.correction
        
    session = await db.sessions.find_one({"_id": req.session_id})
    if not session:
        raise HTTPException(404, "Session not found")
        
    await db.sessions.update_one(
        {"_id": req.session_id},
        {"$set": update_data}
    )
    
    if req.correction:
        corr_doc = {
            "path": " → ".join(session["path"]),
            "original": session.get("sentence", ""),
            "corrected": req.correction,
            "timestamp": datetime.utcnow().isoformat()
        }
        await db.users.update_one(
            {"_id": req.user_id},
            {"$push": {"correction_history": corr_doc}}
        )
        
        path_key = "_".join(session["path"])
        await db.sentences.delete_one({"_id": f"{req.user_id}_{path_key}"})
        
        await calculate_knowledge_score(req.user_id)
        
    return {"success": True}

@router.post("/api/sentences/cache")
async def cache_sentence(req: SentenceCacheRequest):
    doc = {
        "_id": f"{req.user_id}_{req.path_key}",
        "user_id": req.user_id,
        "path_key": req.path_key,
        "sentence": req.sentence,
        "audio_url": req.audio_url,
        "confidence": req.confidence,
        "personalized": True,
        "last_updated": datetime.utcnow().isoformat()
    }
    await db.sentences.update_one({"_id": doc["_id"]}, {"$set": doc}, upsert=True)
    return {"success": True}

@router.post("/api/sentences/invalidate")
async def invalidate_sentence(req: SentenceInvalidateRequest):
    await db.sentences.delete_one({"_id": f"{req.user_id}_{req.path_key}"})
    return {"success": True}

@router.post("/api/demo/seed")
async def trigger_demo_seed(req: DemoSeedRequest):
    # Execute the seed script asynchronously in shell
    subprocess.Popen(["python", "seed_demo.py"])
    return {"success": True, "message": "Seeding started in background"}
