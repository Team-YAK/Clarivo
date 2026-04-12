import uuid
import random
from datetime import datetime, timedelta
from database import db
from utils import path_to_key

async def seed():
    # Clear collections (assuming MockCollection and real Motor collections both support these)
    await db.users.delete_many({})
    await db.sessions.delete_many({})
    await db.sentences.delete_many({})
    await db.context_log.delete_many({})
    await db.icons.delete_many({})
    
    user_id = "alex_demo"
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
    alex = {
        "_id": user_id,
        "profile": {"name": "Kishan", "diagnosis_date": "2024-04-12", "caregiver_name": "Yuki"},
        "medical": {"medications": ["Aspirin 100mg", "Lisinopril 10mg"], "allergies": ["Penicillin"], "conditions": ["Hypertension"]},
        "preferences": {
            "communication_notes": "Alex gets frustrated when misunderstood. Give him time.", 
            "known_preferences": "Loves Italian food, especially tiramisu. Watches football on Sundays.",
            "always_know": "His daughter Maria lives in Boston. He misses her."
        },
        "routine": {"meals": {"breakfast": "08:00", "lunch": "12:30", "dinner": "18:00"}},
        "voice_id": "",  # Empty so E2 cascades to YUKI_VOICE_ID env var
        "interface_settings": {"simplified_view": False, "show_subtitles": True, "shortcut_threshold": 5},
        "knowledge_score": 71,
        "knowledge_breakdown": {"profile": 25, "medical": 20, "preferences": 15, "conversation": 11},
        "path_frequencies": {
            # Food paths — rich history for demo personalization
            "food→dessert→tiramisu": 14,
            "food→drink→water": 9,
            "food→dessert→ice_cream": 6,
            "food→drink→coffee": 5,
            "food→main_course": 4,
            "food→breakfast→toast": 3,
            "food→breakfast→eggs": 2,
            "food→snack": 2,
            # Needs paths
            "needs→medicine": 11,
            "needs→bathroom": 8,
            "needs→help": 4,
            "needs→rest": 3,
            # Feelings paths
            "feelings→tired": 7,
            "feelings→happy": 4,
            "feelings→pain": 2,
            # Activities paths
            "activities→walk": 5,
            "activities→tv": 4,
            "activities→music": 3,
            # Health paths
            "health→headache": 3,
            # People paths
            "people→maria": 6,
            "custom→custom_alex_call_maria": 5,
        },
        "glossary_rules": [
            {"id": "gr_001", "trigger_word": "Bobby", "enforced_meaning": "Kishan's Golden Retriever dog", "active": True, "created_at": (now - timedelta(days=30)).isoformat()},
            {"id": "gr_002", "trigger_word": "Blue Pill", "enforced_meaning": "Aspirin (taken at 8am)", "active": True, "created_at": (now - timedelta(days=28)).isoformat()},
            {"id": "gr_003", "trigger_word": "The Lake", "enforced_meaning": "Lake Tahoe summer cabin", "active": False, "created_at": (now - timedelta(days=25)).isoformat()},
        ],
        "correction_history": [
            {"path": "food→dessert→tiramisu", "original_sentence": "I want a dessert.", "corrected_sentence": "I want tiramisu, it's my favorite.", "timestamp": (now - timedelta(days=20)).isoformat()},
        ],
        "context_answers": [
            {"question_id": "q1", "question": "What is his favorite dessert?", "answer": "Tiramisu", "timestamp": (now - timedelta(days=22)).isoformat()},
            {"question_id": "q2", "question": "Who does he miss?", "answer": "Maria", "timestamp": (now - timedelta(days=18)).isoformat()},
        ],
        "mood_log": [
            {"date": (now - timedelta(days=i)).strftime("%Y-%m-%d"), "score": random.randint(4, 9), "notes": "Varied", "timestamp": (now - timedelta(days=i)).isoformat()} for i in range(14)
        ]
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

    await db.icons.insert_many(icon_list)
    await db.sentences.insert_many(sentences)
    await db.sessions.insert_many(sessions)
    await db.users.insert_one(alex)
    
    print("✓ Async Seeded successfully")
    return True
