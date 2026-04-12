import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException
from database import db
from pydantic import BaseModel
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

class ProfileUpdate(BaseModel):
    user_id: str
    field: str
    value: Any

class ContextAnswerAdd(BaseModel):
    user_id: str
    question_id: str
    question: str
    answer: str

class MoodLogAdd(BaseModel):
    user_id: str
    score: int
    notes: Optional[str] = None

class SettingsUpdate(BaseModel):
    user_id: str
    field: str
    value: Any

class AlertSettings(BaseModel):
    threshold: int
    timeframe: int
    routes: Dict[str, bool]

class AlertSettingsUpdate(BaseModel):
    user_id: str
    settings: AlertSettings

async def compute_knowledge_score(user_id: str):
    user = await db.users.find_one({"_id": user_id})
    if not user: return
    
    # 1. Profile (Max 25)
    prof = user.get("profile", {})
    prefs = user.get("preferences", {})
    prof_score = 0
    if prof.get("name"): prof_score += 5
    if prof.get("diagnosis_date"): prof_score += 3
    if prof.get("caregiver_name"): prof_score += 3
    if prof.get("photo_url"): prof_score += 2 # Not strictly checked but safe
    if len(prefs.get("communication_notes", "")) > 20: prof_score += 6
    if len(prefs.get("known_preferences", "")) > 20: prof_score += 6
    prof_score = min(25, prof_score)
    prof_pct = int((prof_score / 25) * 100)
    
    # 2. Medical (Max 25)
    med = user.get("medical", {})
    med_score = 0
    if len(med.get("medications", [])) >= 1: med_score += 8
    if len(med.get("allergies", [])) >= 1: med_score += 7
    if len(med.get("conditions", [])) >= 1: med_score += 5
    if med.get("doctor_name"): med_score += 5
    med_score = min(25, med_score)
    med_pct = int((med_score / 25) * 100)
    
    # 3. Preferences (Max 25, 2pts per answer)
    answers = user.get("context_answers", [])
    pref_score = min(25, len(answers) * 2)
    pref_pct = int((pref_score / 25) * 100)
    
    # 4. Conversation (Max 25)
    sessions_count = await db.sessions.count_documents({"user_id": user_id, "status": "confirmed"})
    corrections_count = len(user.get("correction_history", []))
    
    convo_sessions = min(15, sessions_count * 1)
    convo_corrections = min(10, corrections_count * 2)
    convo_score = min(25, convo_sessions + convo_corrections)
    convo_pct = int((convo_score / 25) * 100)
    
    # Total overall
    total = prof_score + med_score + pref_score + convo_score
    overall = int((total / 100) * 100)
    
    # Update DB
    breakdown = {
        "profile": prof_pct,
        "medical": med_pct,
        "preferences": pref_pct,
        "conversation": convo_pct
    }
    
    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"knowledge_score": overall, "knowledge_breakdown": breakdown}}
    )
    
    return overall, breakdown


@router.get("/api/profile")
async def get_profile(user_id: str = Query(...)):
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["id"] = user.pop("_id")
    return user


@router.get("/api/context/tree_skim")
async def get_tree_context_skim(user_id: str = Query(...)):
    """
    Lightweight context endpoint for AI tree expansion.
    Uses projection so the AI backend does not pull full user documents.
    """
    user = await db.users.find_one(
        {"_id": user_id},
        {
            "preferences.known_preferences": 1,
            "preferences.always_know": 1,
            "path_frequencies": 1,
        },
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    active_conv = await db.conversations.find_one(
        {"user_id": user_id, "active": True},
        {"utterances": {"$slice": -5}},
    )
    utterances = (active_conv or {}).get("utterances", [])

    cursor = db.sessions.find(
        {"user_id": user_id, "status": "confirmed"},
        {"path": 1, "timestamp": 1, "_id": 0},
    ).sort("timestamp", -1).limit(20)
    recent_sessions = await cursor.to_list(length=20)

    recent_paths = []
    seen = set()
    for s in recent_sessions:
        p = s.get("path") or []
        key = "→".join(p)
        if key and key not in seen:
            recent_paths.append(p)
            seen.add(key)
        if len(recent_paths) >= 10:
            break

    freqs = user.get("path_frequencies", {}) or {}
    clean_freqs = {k: v for k, v in freqs.items() if isinstance(v, (int, float))}
    top_paths = sorted(clean_freqs.items(), key=lambda x: x[1], reverse=True)[:15]

    prefs = user.get("preferences", {}) or {}
    return {
        "conversation_utterances": utterances,
        "recent_paths": recent_paths,
        "top_paths": [{"key": k, "count": v} for k, v in top_paths],
        "preferences": {
            "known_preferences": prefs.get("known_preferences", ""),
            "always_know": prefs.get("always_know", ""),
        },
    }

@router.post("/api/profile/update")
async def update_profile(req: ProfileUpdate):
    try:
        await db.users.update_one(
            {"_id": req.user_id},
            {"$set": {req.field: req.value}}
        )
        await compute_knowledge_score(req.user_id)
        return {"success": True}
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail="Database failure")

@router.post("/api/context/answer")
async def add_context_answer(req: ContextAnswerAdd):
    try:
        ans_doc = {
            "question_id": req.question_id,
            "question": req.question,
            "answer": req.answer,
            "timestamp": datetime.utcnow().isoformat()
        }
        await db.users.update_one(
            {"_id": req.user_id},
            {"$push": {
                "context_answers": {
                    "$each": [ans_doc],
                    "$slice": -20
                }
            }}
        )
        await db.context_log.insert_one({"user_id": req.user_id, **ans_doc})
        await compute_knowledge_score(req.user_id)
        return {"success": True}
    except Exception as e:
        logger.error(f"Error saving context answer: {e}")
        raise HTTPException(status_code=500, detail="Database failure")

@router.get("/api/context/answers")
async def get_context_answers(user_id: str = Query(...)):
    user = await db.users.find_one({"_id": user_id}, {"context_answers": 1})
    if not user: raise HTTPException(status_code=404, detail="Not found")
    return user.get("context_answers", [])

@router.post("/api/mood/log")
async def add_mood_log(req: MoodLogAdd):
    try:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        new_entry = {"date": today, "score": req.score, "notes": req.notes, "timestamp": datetime.utcnow().isoformat()}
        
        # We need to upsert by checking array for matching 'date'. 
        # Easier: Pull existing for 'today', then push newest.
        await db.users.update_one({"_id": req.user_id}, {"$pull": {"mood_log": {"date": today}}})
        await db.users.update_one({"_id": req.user_id}, {"$push": {"mood_log": new_entry}})
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database failure")

@router.get("/api/mood/log")
async def get_mood_log(user_id: str = Query(...), days: int = 14):
    user = await db.users.find_one({"_id": user_id}, {"mood_log": 1})
    if not user: raise HTTPException(status_code=404, detail="Not found")
    logs = user.get("mood_log", [])
    
    # Return last N days with nulls for missing
    from datetime import timedelta
    now_date = datetime.utcnow()
    result = []
    
    for i in range(days):
        target = (now_date - timedelta(days=i)).strftime("%Y-%m-%d")
        found = next((m for m in logs if m["date"] == target), None)
        result.append(found)
        
    # Return chronologically
    return list(reversed(result))

@router.post("/api/settings/update")
async def update_settings(req: SettingsUpdate):
    try:
        await db.users.update_one(
            {"_id": req.user_id},
            {"$set": {f"interface_settings.{req.field}": req.value}}
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database failure")

@router.get("/api/knowledge_score")
async def get_knowledge_score(user_id: str = Query(...)):
    user = await db.users.find_one({"_id": user_id}, {"knowledge_score": 1, "knowledge_breakdown": 1})
    if not user: raise HTTPException(status_code=404, detail="Not found")
    return {
        "overall_score": user.get("knowledge_score", 0),
        "breakdown": user.get("knowledge_breakdown", {})
    }

@router.get("/api/settings/alerts")
async def get_alert_settings(user_id: str = Query(...)):
    user = await db.users.find_one({"_id": user_id}, {"alert_settings": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.get("alert_settings", {
        "threshold": 3,
        "timeframe": 2,
        "routes": {"ui": True, "sms": False, "email": True, "call": False}
    })

@router.post("/api/settings/alerts")
async def update_alert_settings(req: AlertSettingsUpdate):
    try:
        await db.users.update_one(
            {"_id": req.user_id},
            {"$set": {"alert_settings": req.settings.dict()}}
        )
        return {"success": True}
    except Exception as e:
        logger.error(f"Error updating alert settings: {e}")
        raise HTTPException(status_code=500, detail="Database failure")
