import uuid
import random
from datetime import datetime, timedelta
from database import db
from utils import path_to_key
from config import DEFAULT_USER_ID

async def seed():
    # Clear collections (assuming MockCollection and real Motor collections both support these)
    await db.users.delete_many({})
    await db.sessions.delete_many({})
    await db.sentences.delete_many({})
    await db.context_log.delete_many({})
    await db.icons.delete_many({})

    user_id = DEFAULT_USER_ID
    now = datetime.utcnow()

    # 1. Composer Icons
    icon_list = [
        {"key": "running", "icon_name": "person-simple-run", "label": "Running", "category": "actions", "tags": ["run", "jog", "sprint"]},
        {"key": "medicine", "icon_name": "pill", "label": "Medicine", "category": "objects", "tags": ["pill", "drugs", "meds"]},
        {"key": "home", "icon_name": "house", "label": "Home", "category": "places", "tags": ["house", "live"]},
        {"key": "morning", "icon_name": "sun", "label": "Morning", "category": "times", "tags": ["am", "sun", "wake"]},
    ]

    # Pre-cache sentences
    paths = [
        {"k": "food→drink→water", "s": "I would like some water."},
        {"k": "needs→rest", "s": "I need to rest for a while."},
        {"k": "feelings→happy", "s": "I am feeling happy today."},
    ]
    
    sentences = []
    for p in paths:
        sentences.append({
            "_id": f"{user_id}_{p['k']}",
            "user_id": user_id,
            "path_key": p['k'],
            "sentence": p['s'],
            "audio_url": "",
            "confidence": 1.0,
            "personalized": True,
            "input_mode": "tree",
            "last_updated": now.isoformat()
        })

    # 2. Profile Data
    user_doc = {
        "_id": user_id,
        "profile": {"name": "User", "diagnosis_date": "2024-01-01", "caregiver_name": "Caregiver"},
        "medical": {"medications": [], "allergies": [], "conditions": []},
        "preferences": {
            "communication_notes": "", 
            "known_preferences": "",
            "always_know": ""
        },
        "routine": {"meals": {"breakfast": "08:00", "lunch": "13:00", "dinner": "19:00"}},
        "voice_id": "",
        "interface_settings": {"simplified_view": False, "show_subtitles": True, "shortcut_threshold": 5},
        "knowledge_score": 0,
        "knowledge_breakdown": {"profile": 0, "medical": 0, "preferences": 0, "conversation": 0},
        "path_frequencies": {},
        "glossary_rules": [],
        "correction_history": [],
        "context_answers": [],
        "mood_log": [],
        "alert_settings": {
            "threshold": 3,
            "timeframe": 2,
            "routes": {
                "ui": True,
                "sms": False,
                "email": True,
                "call": False
            }
        }
    }
    
    # 3. Session Data
    sessions = []
    
    # 4. Default Prompts
    default_prompts = [
        {
            "prompt_id": "generation_sys",
            "user_id": user_id,
            "content": "You are Clarivo, a patient communication AI. Use context to build a natural sentence from path segments.",
            "description": "System prompt for predicted sentence generation",
            "updated_at": now.isoformat()
        },
        {
            "prompt_id": "generation_hu",
            "user_id": user_id,
            "content": "Context: {context}\nPath: {path}\nLast Utterances: {utterances}",
            "description": "Human template for generation",
            "updated_at": now.isoformat()
        },
        {
            "prompt_id": "icon_sys",
            "user_id": user_id,
            "content": "Map labels to unicode emojis from the provided set.",
            "description": "System prompt for icon matching",
            "updated_at": now.isoformat()
        }
    ]

    await db.icons.insert_many(icon_list)
    await db.sentences.insert_many(sentences)
    if sessions:
        await db.sessions.insert_many(sessions)
    await db.prompts.insert_many(default_prompts)
    await db.users.insert_one(user_doc)
    
    print("✓ Async Seeded successfully with generic data")
    return True
