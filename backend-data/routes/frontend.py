from fastapi import APIRouter, HTTPException, Query
from database import db
from models import *
from services.engines import calculate_knowledge_score, get_shortcuts, get_predictions, detect_urgency
from datetime import datetime
import uuid

router = APIRouter()

@router.get("/api/profile", response_model=ProfileResponse)
async def get_profile(user_id: str):
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    return ProfileResponse(
        profile=user.get("profile", {}),
        medical=user.get("medical", {}),
        preferences=user.get("preferences", {}),
        routine=user.get("routine", {}),
        voice_id=user.get("voice_id", ""),
        interface_settings=user.get("interface_settings", {})
    )

@router.post("/api/profile/update")
async def update_profile(req: ProfileUpdateRequest):
    update_dict = {req.field: req.value}
    res = await db.users.update_one({"_id": req.user_id}, {"$set": update_dict})
    if res.matched_count == 0:
        raise HTTPException(404, "User not found")
        
    score = await calculate_knowledge_score(req.user_id)
    return {"success": True, "knowledge_score": score["overall"]}

@router.get("/api/shortcuts", response_model=ShortcutsResponse)
async def shortcuts(user_id: str):
    s = await get_shortcuts(user_id)
    return ShortcutsResponse(shortcuts=s)

@router.get("/api/predictions", response_model=PredictionsResponse)
async def predictions(user_id: str, hour: int):
    p = await get_predictions(user_id, hour)
    return PredictionsResponse(predictions=p)

@router.post("/api/context/answer")
async def context_answer(req: ContextAnswerRequest):
    log_entry = {
        "_id": str(uuid.uuid4()),
        "user_id": req.user_id,
        "question_id": req.question_id,
        "question": req.question,
        "answer": req.answer,
        "timestamp": datetime.utcnow().isoformat()
    }
    await db.context_log.insert_one(log_entry)
    
    # Append to context_answers up to 20
    user = await db.users.find_one({"_id": req.user_id})
    if not user:
        raise HTTPException(404, "User not found")
        
    answers = user.get("context_answers", [])
    answers.append({"question": req.question, "answer": req.answer})
    if len(answers) > 20:
        answers = answers[-20:]
        
    await db.users.update_one({"_id": req.user_id}, {"$set": {"context_answers": answers}})
    
    score = await calculate_knowledge_score(req.user_id)
    return {"success": True, "knowledge_score": score["overall"]}

@router.get("/api/caregiver/panel", response_model=CaregiverPanelResponse)
async def caregiver_panel(user_id: str):
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
        
    last_session = await db.sessions.find_one({"user_id": user_id}, sort=[("timestamp", -1)])
    ls_model = None
    if last_session:
        ls_model = SessionModel(
            id=str(last_session["_id"]),
            path=last_session["path"],
            sentence=last_session.get("sentence", ""),
            confidence=last_session.get("confidence", 0.0),
            audio_url=last_session.get("audio_url"),
            feedback=last_session.get("feedback"),
            correction=last_session.get("correction"),
            is_first_occurrence=last_session.get("is_first_occurrence", False),
            timestamp=last_session.get("timestamp", "")
        )
        
    pending = user.get("pending_question")
    urgent = await detect_urgency(user_id)
    score = user.get("knowledge_score", 0)
    
    bk = user.get("knowledge_breakdown", {"overall":0, "profile":0, "medical":0, "preferences":0, "conversation":0})
    breakdown = KnowledgeBreakdown(**bk)
    
    return CaregiverPanelResponse(
        last_session=ls_model,
        pending_question=pending,
        knowledge_score=score,
        knowledge_breakdown=breakdown,
        urgent=urgent
    )

@router.get("/api/sessions/history")
async def sessions_history(user_id: str, limit: int = 50):
    sessions_cursor = db.sessions.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
    sessions = await sessions_cursor.to_list(length=limit)
    res = []
    for s in sessions:
        res.append(SessionModel(
            id=str(s["_id"]),
            path=s["path"],
            sentence=s.get("sentence", ""),
            confidence=s.get("confidence", 0.0),
            audio_url=s.get("audio_url"),
            feedback=s.get("feedback"),
            correction=s.get("correction"),
            is_first_occurrence=s.get("is_first_occurrence", False),
            timestamp=s.get("timestamp", "")
        ))
    return {"sessions": res}

@router.get("/api/insights", response_model=InsightsResponse)
async def insights(user_id: str):
    data = await get_insights(user_id)
    return InsightsResponse(**data)
    
@router.post("/api/sessions/flag")
async def flag_session(req: FlagSessionRequest):
    await db.sessions.update_one({"_id": req.session_id, "user_id": req.user_id}, {"$set": {"flagged": True}})
    return {"success": True}

@router.get("/api/buttons/custom")
async def buttons_custom(user_id: str):
    user = await db.users.find_one({"_id": user_id})
    if not user: raise HTTPException(404)
    return {"buttons": user.get("custom_buttons", [])}

@router.post("/api/buttons/add")
async def buttons_add(req: CustomButtonAddRequest):
    button_id = str(uuid.uuid4())
    btn = {
        "id": button_id,
        "label": req.label,
        "icon": req.icon,
        "category": req.category
    }
    await db.users.update_one({"_id": req.user_id}, {"$push": {"custom_buttons": btn}})
    return {"success": True, "button_id": button_id}
