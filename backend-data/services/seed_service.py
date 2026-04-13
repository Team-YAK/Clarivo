import uuid
import random
from datetime import datetime, timedelta
from database import db
from utils import path_to_key
from config import DEFAULT_USER_ID

async def seed():
    # Clear ALL collections
    collections = [
        db.users, db.sessions, db.sentences, db.context_log,
        db.icons, db.conversations, db.prompts, db.live_sessions, db.anchors
    ]
    for coll in collections:
        if coll is not None:
            await coll.delete_many({})

    user_id = DEFAULT_USER_ID
    now = datetime.utcnow()

    # 1. Composer Icons - Generic and expressive
    icon_list = [
        {"key": "help", "icon_name": "hand-helping", "label": "Help", "category": "actions", "tags": ["aid", "assistance"]},
        {"key": "home", "icon_name": "house", "label": "Home", "category": "places", "tags": ["house", "stay"]},
        {"key": "feeling", "icon_name": "heart", "label": "Feeling", "category": "state", "tags": ["mood", "emotion"]},
        {"key": "needs", "icon_name": "star", "label": "Needs", "category": "urgent", "tags": ["want", "request"]},
    ]

    # Minimal generic starter sentences
    paths = [
        {"k": "greeting→hello", "s": "Hello, how are you?"},
        {"k": "needs→break", "s": "I would like to take a break."},
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
        "profile": {"name": "Patient", "diagnosis_date": "2024-01-01", "caregiver_name": "Caregiver"},
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
    
    # 3. Default Prompts
    default_prompts = [
        {
            "prompt_id": "generation_sys",
            "user_id": user_id,
            "content": "You are Clarivo, a patient communication AI. Assist patients with aphasia by predicting the next logical communication concepts. CRITICAL: Avoid making everything about food. Prioritize diverse needs, feelings, places, and activities. Keep labels very short (1-2 words).",
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
            "content": "Map semantic labels to a unique, highly expressive emoji combination (1-3 emojis). Ensure no duplicates across options.",
            "description": "System prompt for icon matching",
            "updated_at": now.isoformat()
        }
    ]

    await db.icons.insert_many(icon_list)
    await db.sentences.insert_many(sentences)
    await db.prompts.insert_many(default_prompts)
    await db.users.insert_one(user_doc)
    
    print("✓ Async Seeded successfully with clean generic data")
    return True
