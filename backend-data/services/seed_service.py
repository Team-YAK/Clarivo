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
        {"k": "food→dessert→tiramisu", "s": "I want tiramisu — it's my favorite."},
        {"k": "needs→medicine", "s": "I need my Lisinopril please."},
        {"k": "feelings→tired", "s": "I am feeling very tired."},
    ]
    
    sentences = []
    for p in paths:
        sentences.append({
            "_id": f"{user_id}_{p['k']}",
            "user_id": user_id,
            "path_key": p['k'],
            "sentence": p['s'],
            "audio_url": "/mock-audio/tiramisu.mp3",
            "confidence": 0.95,
            "personalized": True,
            "input_mode": "tree",
            "last_updated": now.isoformat()
        })

    # 2. Profile Data
    kishan = {
        "_id": user_id,
        "profile": {"name": "Kishan", "diagnosis_date": "2023-10-15", "caregiver_name": "Yuki"},
        "medical": {"medications": ["Atorvastatin 20mg", "Lisinopril 5mg"], "allergies": ["Latex"], "conditions": ["Aphasia", "Hypertension"]},
        "preferences": {
            "communication_notes": "Kishan is a former architect. They respond well to visual sketches and structural metaphors. Yuki is their partner and primary caregiver.", 
            "known_preferences": "Loves Earl Grey tea (no sugar). Enjoys Debussy and Bach. Spends mornings in the Japanese rock garden.",
            "always_know": "Yuki works as a digital artist in the home studio. Hachi is their 5-year-old Shiba Inu."
        },
        "routine": {"meals": {"breakfast": "07:30", "lunch": "13:00", "dinner": "19:00"}},
        "voice_id": "",  # Empty so E2 cascades to KISHAN_VOICE_ID env var
        "interface_settings": {"simplified_view": False, "show_subtitles": True, "shortcut_threshold": 5},
        "knowledge_score": 85,
        "knowledge_breakdown": {"profile": 30, "medical": 25, "preferences": 20, "conversation": 10},
        "path_frequencies": {
            "food→drink→tea": 18,
            "food→drink→water": 12,
            "music→classical→debussy": 9,
            "activities→garden": 15,
            "people→hachi": 14,
            "needs→sketchbook": 8,
            "activities→woodworking": 4,
            "needs→medicine": 11,
            "needs→rest": 6,
            "feelings→happy": 8,
            "feelings→tired": 4,
        },
        "glossary_rules": [
            {"id": "gr_001", "trigger_word": "Hachi", "enforced_meaning": "Kishan and Yuki's Shiba Inu dog", "active": True, "created_at": (now - timedelta(days=30)).isoformat()},
            {"id": "gr_002", "trigger_word": "The Studio", "enforced_meaning": "Yuki's workspace where they create digital art", "active": True, "created_at": (now - timedelta(days=28)).isoformat()},
            {"id": "gr_003", "trigger_word": "The Grid", "enforced_meaning": "Kishan's architectural drafting table", "active": True, "created_at": (now - timedelta(days=25)).isoformat()},
            {"id": "gr_004", "trigger_word": "The Drafting Pen", "enforced_meaning": "Kishan's specialized fountain pen for architectural sketching", "active": True, "created_at": (now - timedelta(days=20)).isoformat()},
            {"id": "gr_005", "trigger_word": "Earl Grey", "enforced_meaning": "Kishan's favorite tea, served hot with no sugar", "active": True, "created_at": (now - timedelta(days=15)).isoformat()},
            {"id": "gr_006", "trigger_word": "The Terrace", "enforced_meaning": "The overlook at the Japanese rock garden where Kishan spends his mornings", "active": True, "created_at": (now - timedelta(days=10)).isoformat()},
        ],
        "correction_history": [
            {"path": "food→drink→tea", "original_sentence": "I want drink.", "corrected_sentence": "I'd love some Earl Grey tea, Yuki.", "timestamp": (now - timedelta(days=5)).isoformat()},
        ],
        "context_answers": [
            {"question_id": "q1", "question": "What is his favorite morning drink?", "answer": "Earl Grey tea (no sugar)", "timestamp": (now - timedelta(days=22)).isoformat()},
            {"question_id": "q2", "question": "What was his former profession?", "answer": "Architect", "timestamp": (now - timedelta(days=18)).isoformat()},
        ],
        "mood_log": [
            {"date": (now - timedelta(days=i)).strftime("%Y-%m-%d"), "score": random.randint(6, 10), "notes": "Stable", "timestamp": (now - timedelta(days=i)).isoformat()} for i in range(14)
        ],
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
    # Add distress sessions for urgency (Last 2 hours)
    urgency_paths = [["needs", "pain"], ["needs", "help"], ["health", "headache"]]
    for i in range(3):
        sessions.append({
            "_id": f"s_{uuid.uuid4().hex[:8]}",
            "user_id": user_id,
            "path": urgency_paths[i],
            "path_key": path_to_key(urgency_paths[i], "tree"),
            "input_mode": "tree",
            "sentence": "I need help",
            "confidence": 0.9,
            "status": "confirmed",
            "timestamp": (now - timedelta(minutes=10 * (i+1))).isoformat()
        })

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
    await db.sessions.insert_many(sessions)
    await db.prompts.insert_many(default_prompts)
    await db.users.insert_one(kishan)
    
    print("✓ Async Seeded successfully")
    return True
