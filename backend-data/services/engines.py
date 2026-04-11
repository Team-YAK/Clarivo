from datetime import datetime, timedelta
from typing import Dict, List, Any
from database import db
from collections import defaultdict

ICON_MAP = {
    "tiramisu": "bowl-food",
    "medicine": "pill",
    "tired": "moon",
    "bathroom": "drop",
    "family": "users",
    "happy": "sun",
    "food": "fork-knife",
}

def get_icon(path: list, label: str) -> str:
    fallback = "star"
    if path and path[-1].lower() in ICON_MAP:
        return ICON_MAP[path[-1].lower()]
    return ICON_MAP.get(label.lower(), fallback)

async def calculate_knowledge_score(user_id: str) -> dict:
    user = await db.users.find_one({"_id": user_id})
    if not user:
        return {"overall": 0, "breakdown": {"overall": 0, "profile": 0, "medical": 0, "preferences": 0, "conversation": 0}}
        
    profile_score = 0
    prof = user.get("profile", {})
    if prof.get("name"): profile_score += 5
    if prof.get("diagnosis_date"): profile_score += 3
    if prof.get("caregiver_name"): profile_score += 3
    if prof.get("photo"): profile_score += 2
    
    prefs = user.get("preferences", {})
    if prefs.get("communication_notes"): profile_score += 6
    if prefs.get("known_preferences"): profile_score += 6
    
    med_score = 0
    med = user.get("medical", {})
    if med.get("medications") and len(med["medications"]) > 0: med_score += 8
    if med.get("allergies") and len(med["allergies"]) > 0: med_score += 7
    if med.get("conditions") and len(med["conditions"]) > 0: med_score += 5
    if med.get("doctor"): med_score += 5
    
    prefs_score = min(25, 2 * len(user.get("context_answers", [])))
    
    sessions_count = await db.sessions.count_documents({"user_id": user_id, "feedback": {"$ne": None}}) # Approx confirmed
    corrections_count = len(user.get("correction_history", []))
    
    conv_score = min(15, sessions_count * 1) + min(10, corrections_count * 2)
    
    overall = min(100, profile_score + med_score + prefs_score + conv_score)
    breakdown = {
        "overall": overall,
        "profile": int((profile_score / 25) * 100) if 25 else 0,
        "medical": int((med_score / 25) * 100),
        "preferences": int((prefs_score / 25) * 100),
        "conversation": int((conv_score / 25) * 100),
    }
    
    await db.users.update_one(
        {"_id": user_id}, 
        {"$set": {"knowledge_score": overall, "knowledge_breakdown": breakdown}}
    )
    
    return {"overall": overall, "breakdown": breakdown}

async def get_shortcuts(user_id: str) -> list:
    user = await db.users.find_one({"_id": user_id})
    if not user: return []
    
    threshold = user.get("interface_settings", {}).get("shortcut_threshold", 5)
    freqs = user.get("path_frequencies", {})
    
    shortcuts = []
    for path_key, count in freqs.items():
        if count >= threshold:
            path = path_key.split("_")
            label = path[-1].title()
            shortcuts.append({
                "path": path,
                "label": label,
                "icon": get_icon(path, label),
                "tap_count": count
            })
            
    shortcuts.sort(key=lambda x: x["tap_count"], reverse=True)
    return shortcuts[:5]

async def detect_urgency(user_id: str) -> bool:
    two_hours_ago = datetime.utcnow() - timedelta(hours=2)
    two_hours_iso = two_hours_ago.isoformat()
    
    query = {
        "user_id": user_id,
        "timestamp": {"$gt": two_hours_iso},
        "path": {"$in": ["pain", "help", "emergency", "health"]}
    }
    distress_count = await db.sessions.count_documents(query)
    return distress_count >= 3

async def get_predictions(user_id: str, hour: int) -> list:
    sessions = await db.sessions.find({"user_id": user_id}).to_list(length=1000)
    
    counts = {}
    for s in sessions:
        ts = s.get("timestamp")
        if not ts: continue
        try:
            if "Z" in ts: ts = ts.replace("Z", "+00:00")
            dt = datetime.fromisoformat(ts)
            s_hour = dt.hour
        except:
            continue
            
        if (hour - 1) <= s_hour <= (hour + 1) or (hour == 0 and s_hour == 23) or (hour == 23 and s_hour == 0):
            path_key = "_".join(s["path"])
            counts[path_key] = counts.get(path_key, 0) + 1
            
    sorted_paths = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    
    results = []
    for path_key, _ in sorted_paths[:4]:
        path = path_key.split("_")
        label = path[-1].title()
        if label == "Tiramisu": label = "I want tiramisu"
        elif path == ["needs", "medicine"]: label = "I need my medication"
        elif path == ["feelings", "happy"]: label = "Good morning"
        elif path == ["food"]: label = "I'm hungry"
        
        results.append({
            "label": label,
            "path": path,
            "icon": get_icon(path, label)
        })
    return results

async def is_first_occurrence(user_id: str, path: list, current_session_id: str = None) -> bool:
    query = {"user_id": user_id, "path": path}
    if current_session_id:
        query["_id"] = {"$ne": current_session_id}
    existing = await db.sessions.find_one(query)
    return existing is None

async def get_insights(user_id: str) -> dict:
    now = datetime.utcnow()
    fourteen_days_ago = now - timedelta(days=14)
    
    # sessions_by_day
    sessions_cursor = db.sessions.find({
        "user_id": user_id,
        "timestamp": {"$gte": fourteen_days_ago.isoformat()}
    })
    
    sessions = await sessions_cursor.to_list(length=1000)
    
    sessions_by_day = {}
    for i in range(14):
        date_str = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        sessions_by_day[date_str] = 0
        
    sessions_by_period = {"morning": 0, "afternoon": 0, "evening": 0}
    
    for s in sessions:
        ts = s.get("timestamp")
        if not ts: continue
        try:
            if "Z" in ts: ts = ts.replace("Z", "+00:00")
            dt = datetime.fromisoformat(ts)
            
            # Day aggregation
            date_key = dt.strftime("%Y-%m-%d")
            if date_key in sessions_by_day:
                sessions_by_day[date_key] += 1
                
            # Period aggregation
            hour = dt.hour
            if 5 <= hour < 12:
                sessions_by_period["morning"] += 1
            elif 12 <= hour < 17:
                sessions_by_period["afternoon"] += 1
            else:
                sessions_by_period["evening"] += 1
        except:
            continue
            
    # Top Paths
    user = await db.users.find_one({"_id": user_id})
    top_paths = []
    if user:
        freqs = user.get("path_frequencies", {})
        sorted_paths = sorted(freqs.items(), key=lambda x: x[1], reverse=True)
        for path_key, count in sorted_paths[:8]:
            top_paths.append({"path": path_key.replace("_", " → "), "count": count})
            
    return {
        "sessions_by_day": sessions_by_day,
        "sessions_by_period": sessions_by_period,
        "top_paths": top_paths,
        "mood_log": user.get("mood_log", []) if user else []
    }
