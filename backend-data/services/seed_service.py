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
    await db.tree_nodes.delete_many({})
    await db.icons.delete_many({})
    
    user_id = "alex_demo"
    now = datetime.utcnow()
    
    # 1. Tree Nodes (Default + Custom)
    tree_nodes = [
        # Root Nodes
        {"_id": "cat_food", "key": "food", "label": "Food & Drink", "icon": "fork-knife", "subtitle": "Meals, snacks, and drinks", "parent_key": None, "is_leaf": False, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "cat_feelings", "key": "feelings", "label": "Feelings", "icon": "smiley", "subtitle": "Emotions and physical feelings", "parent_key": None, "is_leaf": False, "category": "feelings", "is_custom": False, "user_id": None},
        {"_id": "cat_needs", "key": "needs", "label": "Needs", "icon": "hand-waving", "subtitle": "Immediate assistance", "parent_key": None, "is_leaf": False, "category": "needs", "is_custom": False, "user_id": None},
        {"_id": "cat_people", "key": "people", "label": "People", "icon": "users", "subtitle": "Family and friends", "parent_key": None, "is_leaf": False, "category": "people", "is_custom": False, "user_id": None},
        {"_id": "cat_health", "key": "health", "label": "Health", "icon": "heartbeat", "subtitle": "Medical and pain", "parent_key": None, "is_leaf": False, "category": "health", "is_custom": False, "user_id": None},
        {"_id": "cat_activities", "key": "activities", "label": "Activities", "icon": "person-simple-run", "subtitle": "Things to do", "parent_key": None, "is_leaf": False, "category": "activities", "is_custom": False, "user_id": None},

        # Food Children
        {"_id": "food_dessert", "key": "dessert", "label": "Dessert", "icon": "ice-cream", "subtitle": "Sweet treats", "parent_key": "food", "is_leaf": False, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "food_main", "key": "main_course", "label": "Main Course", "icon": "hamburger", "subtitle": "Lunch and dinner", "parent_key": "food", "is_leaf": False, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "food_drink", "key": "drink", "label": "Drink", "icon": "drop", "subtitle": "Water and beverages", "parent_key": "food", "is_leaf": False, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "food_nothing", "key": "nothing", "label": "Nothing", "icon": "x-circle", "subtitle": "I don't want anything", "parent_key": "food", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},

        # Food -> Dessert Leaves
        {"_id": "dessert_tiramisu", "key": "tiramisu", "label": "Tiramisu", "icon": "cake", "subtitle": "Italian dessert", "parent_key": "dessert", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "dessert_icecream", "key": "ice_cream", "label": "Ice Cream", "icon": "ice-cream", "subtitle": "Cold treat", "parent_key": "dessert", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "dessert_cake", "key": "cake", "label": "Cake", "icon": "cake", "subtitle": "Slice of cake", "parent_key": "dessert", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "dessert_chocolate", "key": "chocolate", "label": "Chocolate", "icon": "cookie", "subtitle": "Chocolate bar", "parent_key": "dessert", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},

        # Custom Nodes
        {"_id": "custom_alex_call_maria", "key": "custom_alex_call_maria", "label": "Call Maria", "icon": "phone", "subtitle": "My daughter", "parent_key": "people", "is_leaf": True, "category": "people", "is_custom": True, "user_id": user_id},
    ]

    # 2. Composer Icons
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

    # Profile Data
    alex = {
        "_id": user_id,
        "profile": {"name": "Yuki", "diagnosis_date": "2024-04-12", "caregiver_name": "Maya"},
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
            "food→dessert→tiramisu": 14,
            "needs→medicine": 11,
            "custom→custom_alex_call_maria": 5
        },
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
    
    # Session Data
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

    await db.tree_nodes.insert_many(tree_nodes)
    await db.icons.insert_many(icon_list)
    await db.sentences.insert_many(sentences)
    await db.sessions.insert_many(sessions)
    await db.users.insert_one(alex)
    
    print("✓ Async Seeded successfully")
    return True
