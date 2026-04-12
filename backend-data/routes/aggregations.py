import logging
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from fastapi import APIRouter, Query, HTTPException
from database import db
from pydantic import BaseModel
from config import DISTRESS_TERMS as DEFAULT_DISTRESS_TERMS

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/api/caregiver/panel")
async def get_caregiver_panel(user_id: str = Query(...)):
    try:
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # 1. Last session
        last_session = await db.sessions.find_one(
            {"user_id": user_id, "status": "confirmed"},
            sort=[("timestamp", -1)]
        )
        if last_session: last_session["id"] = last_session.pop("_id")
        
        # 2. Pending question
        pending_question = None
        if last_session and last_session.get("post_session_question"):
            # Ensure it hasn't been answered yet
            answers = user.get("context_answers", [])
            q_id = last_session["post_session_question"].get("question_id")
            if not any(a.get("question_id") == q_id for a in answers):
                pending_question = last_session["post_session_question"]
                
        # 3. Urgency Detection (Use alert_settings from profile, default to 3 sessions in 2 hours)
        alert_settings = user.get("alert_settings", {})
        threshold = alert_settings.get("threshold", 3)
        timeframe = alert_settings.get("timeframe", 2)
        
        two_hours_ago = (datetime.utcnow() - timedelta(hours=timeframe)).isoformat()
        # Merge default terms with any user-defined overrides
        user_terms = set(user.get("distress_terms") or [])
        DISTRESS_TERMS = DEFAULT_DISTRESS_TERMS | user_terms

        recent_cursor = db.sessions.find({
            "user_id": user_id,
            "timestamp": {"$gte": two_hours_ago},
            "status": "confirmed",
        })
        recent_sessions = await recent_cursor.to_list(length=200)
        urgent_count = sum(
            1 for s in recent_sessions
            if any(p in DISTRESS_TERMS for p in s.get("path", []))
        )
        urgent = urgent_count >= threshold
        
        return {
            "last_session": last_session,
            "pending_question": pending_question,
            "knowledge_score": user.get("knowledge_score", 0),
            "knowledge_breakdown": user.get("knowledge_breakdown", {}),
            "urgent": urgent
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching panel: {e}")
        raise HTTPException(status_code=500, detail="Database failure")

@router.get("/api/insights")
async def get_insights(user_id: str = Query(...)):
    try:
        now_date = datetime.utcnow()
        fourteen_days_ago = (now_date - timedelta(days=14)).isoformat()
        
        # Pull sessions
        sessions_cursor = db.sessions.find({
            "user_id": user_id,
            "status": "confirmed",
            "timestamp": {"$gte": fourteen_days_ago}
        })
        sessions = await sessions_cursor.to_list(length=1000)
        
        # Sessions by day (dict of YYYY-MM-DD: count)
        sessions_by_day = {}
        for i in range(13, -1, -1):
            day_str = (now_date - timedelta(days=i)).strftime("%Y-%m-%d")
            sessions_by_day[day_str] = 0
            
        sessions_by_period = {"morning": 0, "afternoon": 0, "evening": 0}
        
        for s in sessions:
            try:
                dt = datetime.fromisoformat(s["timestamp"])
                d_str = dt.strftime("%Y-%m-%d")
                if d_str in sessions_by_day:
                    sessions_by_day[d_str] += 1
                
                h = dt.hour
                if 6 <= h < 12: sessions_by_period["morning"] += 1
                elif 12 <= h < 18: sessions_by_period["afternoon"] += 1
                else: sessions_by_period["evening"] += 1
            except Exception:
                continue
                
        # Top paths (aggregate across db since we have path frequencies)
        user = await db.users.find_one({"_id": user_id}, {"path_frequencies": 1, "mood_log": 1})
        freqs = user.get("path_frequencies", {})
        top_keys = sorted(freqs.items(), key=lambda x: x[1], reverse=True)[:8]
        
        top_paths = []
        for k, count in top_keys:
            if k.startswith("composer→"):
                path_arr = k.replace("composer→", "").split("→")
                top_paths.append({
                    "path_key": k,
                    "label": " + ".join([p.title() for p in path_arr]),
                    "count": count,
                    "input_mode": "composer"
                })
            else:
                path_arr = k.split("→")
                top_paths.append({
                    "path_key": k,
                    "label": " → ".join([p.title() for p in path_arr]),
                    "count": count,
                    "input_mode": "tree"
                })
                
        # Mood log
        logs = user.get("mood_log", [])
        mood_log = []
        for i in range(14):
            day_str = (now_date - timedelta(days=i)).strftime("%Y-%m-%d")
            found = next((m for m in logs if m["date"] == day_str), None)
            mood_log.append(found)
            
        mood_log = list(reversed(mood_log))

        return {
            "sessions_by_day": sessions_by_day,
            "top_paths": top_paths,
            "sessions_by_period": sessions_by_period,
            "mood_log": mood_log
        }
    except Exception as e:
        logger.error(f"Error fetching insights: {e}")
        raise HTTPException(status_code=500, detail="Database failure")
