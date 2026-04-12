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
        {"_id": "food_breakfast", "key": "breakfast", "label": "Breakfast", "icon": "egg", "subtitle": "Morning meal", "parent_key": "food", "is_leaf": False, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "food_dessert", "key": "dessert", "label": "Dessert", "icon": "ice-cream", "subtitle": "Sweet treats", "parent_key": "food", "is_leaf": False, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "food_main", "key": "main_course", "label": "Main Course", "icon": "hamburger", "subtitle": "Lunch and dinner", "parent_key": "food", "is_leaf": False, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "food_drink", "key": "drink", "label": "Drink", "icon": "drop", "subtitle": "Water and beverages", "parent_key": "food", "is_leaf": False, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "food_snack", "key": "snack", "label": "Snack", "icon": "cookie", "subtitle": "Light bites", "parent_key": "food", "is_leaf": False, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "food_nothing", "key": "nothing", "label": "Nothing", "icon": "x-circle", "subtitle": "I don't want anything", "parent_key": "food", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},

        # Food -> Breakfast Leaves
        {"_id": "breakfast_toast", "key": "toast", "label": "Toast", "icon": "bread", "subtitle": "Buttered toast", "parent_key": "breakfast", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "breakfast_eggs", "key": "eggs", "label": "Eggs", "icon": "egg", "subtitle": "Scrambled or fried", "parent_key": "breakfast", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "breakfast_cereal", "key": "cereal", "label": "Cereal", "icon": "bowl-food", "subtitle": "With milk", "parent_key": "breakfast", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "breakfast_oatmeal", "key": "oatmeal", "label": "Oatmeal", "icon": "bowl-food", "subtitle": "Warm porridge", "parent_key": "breakfast", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "breakfast_yogurt", "key": "yogurt", "label": "Yogurt", "icon": "bowl-food", "subtitle": "With fruit", "parent_key": "breakfast", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},

        # Food -> Dessert Leaves
        {"_id": "dessert_tiramisu", "key": "tiramisu", "label": "Tiramisu", "icon": "cake", "subtitle": "Italian dessert", "parent_key": "dessert", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "dessert_icecream", "key": "ice_cream", "label": "Ice Cream", "icon": "ice-cream", "subtitle": "Cold treat", "parent_key": "dessert", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "dessert_cake", "key": "cake", "label": "Cake", "icon": "cake", "subtitle": "Slice of cake", "parent_key": "dessert", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "dessert_chocolate", "key": "chocolate", "label": "Chocolate", "icon": "cookie", "subtitle": "Chocolate bar", "parent_key": "dessert", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "dessert_fruit", "key": "fruit", "label": "Fruit", "icon": "apple", "subtitle": "Fresh fruit", "parent_key": "dessert", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},

        # Food -> Drink Leaves
        {"_id": "drink_water", "key": "water", "label": "Water", "icon": "drop", "subtitle": "Glass of water", "parent_key": "drink", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "drink_coffee", "key": "coffee", "label": "Coffee", "icon": "coffee", "subtitle": "Hot coffee", "parent_key": "drink", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "drink_tea", "key": "tea", "label": "Tea", "icon": "coffee", "subtitle": "Hot or iced tea", "parent_key": "drink", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "drink_juice", "key": "juice", "label": "Juice", "icon": "orange", "subtitle": "Orange or apple juice", "parent_key": "drink", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "drink_milk", "key": "milk", "label": "Milk", "icon": "drop", "subtitle": "Glass of milk", "parent_key": "drink", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},

        # Feelings Children
        {"_id": "feelings_happy", "key": "happy", "label": "Happy", "icon": "smiley", "subtitle": "Feeling good", "parent_key": "feelings", "is_leaf": True, "category": "feelings", "is_custom": False, "user_id": None},
        {"_id": "feelings_sad", "key": "sad", "label": "Sad", "icon": "smiley-sad", "subtitle": "Feeling down", "parent_key": "feelings", "is_leaf": True, "category": "feelings", "is_custom": False, "user_id": None},
        {"_id": "feelings_tired", "key": "tired", "label": "Tired", "icon": "moon", "subtitle": "Feeling fatigued", "parent_key": "feelings", "is_leaf": True, "category": "feelings", "is_custom": False, "user_id": None},
        {"_id": "feelings_pain", "key": "pain", "label": "In Pain", "icon": "warning", "subtitle": "Physical discomfort", "parent_key": "feelings", "is_leaf": True, "category": "feelings", "is_custom": False, "user_id": None},
        {"_id": "feelings_anxious", "key": "anxious", "label": "Anxious", "icon": "warning-circle", "subtitle": "Feeling worried", "parent_key": "feelings", "is_leaf": True, "category": "feelings", "is_custom": False, "user_id": None},
        {"_id": "feelings_bored", "key": "bored", "label": "Bored", "icon": "minus-circle", "subtitle": "Nothing to do", "parent_key": "feelings", "is_leaf": True, "category": "feelings", "is_custom": False, "user_id": None},

        # Needs Children
        {"_id": "needs_medicine", "key": "medicine", "label": "Medicine", "icon": "pill", "subtitle": "Need medication", "parent_key": "needs", "is_leaf": True, "category": "needs", "is_custom": False, "user_id": None},
        {"_id": "needs_bathroom", "key": "bathroom", "label": "Bathroom", "icon": "toilet", "subtitle": "Need the bathroom", "parent_key": "needs", "is_leaf": True, "category": "needs", "is_custom": False, "user_id": None},
        {"_id": "needs_help", "key": "help", "label": "Help", "icon": "hand-waving", "subtitle": "Need assistance", "parent_key": "needs", "is_leaf": True, "category": "needs", "is_custom": False, "user_id": None},
        {"_id": "needs_rest", "key": "rest", "label": "Rest", "icon": "moon", "subtitle": "Need to rest", "parent_key": "needs", "is_leaf": True, "category": "needs", "is_custom": False, "user_id": None},
        {"_id": "needs_phone", "key": "phone", "label": "My Phone", "icon": "device-mobile", "subtitle": "Get my phone", "parent_key": "needs", "is_leaf": True, "category": "needs", "is_custom": False, "user_id": None},
        {"_id": "needs_pain", "key": "pain", "label": "Pain Relief", "icon": "first-aid-kit", "subtitle": "Pain management", "parent_key": "needs", "is_leaf": True, "category": "needs", "is_custom": False, "user_id": None},

        # Health Children
        {"_id": "health_headache", "key": "headache", "label": "Headache", "icon": "warning", "subtitle": "Head pain", "parent_key": "health", "is_leaf": True, "category": "health", "is_custom": False, "user_id": None},
        {"_id": "health_checkup", "key": "checkup", "label": "Check Up", "icon": "stethoscope", "subtitle": "Medical check", "parent_key": "health", "is_leaf": True, "category": "health", "is_custom": False, "user_id": None},
        {"_id": "health_nausea", "key": "nausea", "label": "Nausea", "icon": "warning-circle", "subtitle": "Feeling sick", "parent_key": "health", "is_leaf": True, "category": "health", "is_custom": False, "user_id": None},
        {"_id": "health_dizzy", "key": "dizzy", "label": "Dizzy", "icon": "spinner", "subtitle": "Feeling dizzy", "parent_key": "health", "is_leaf": True, "category": "health", "is_custom": False, "user_id": None},

        # Activities Children
        {"_id": "activities_walk", "key": "walk", "label": "Walk", "icon": "person-simple-walk", "subtitle": "Go for a walk", "parent_key": "activities", "is_leaf": True, "category": "activities", "is_custom": False, "user_id": None},
        {"_id": "activities_tv", "key": "tv", "label": "Watch TV", "icon": "television", "subtitle": "Watch television", "parent_key": "activities", "is_leaf": True, "category": "activities", "is_custom": False, "user_id": None},
        {"_id": "activities_music", "key": "music", "label": "Music", "icon": "music-note", "subtitle": "Listen to music", "parent_key": "activities", "is_leaf": True, "category": "activities", "is_custom": False, "user_id": None},
        {"_id": "activities_read", "key": "read", "label": "Read", "icon": "book", "subtitle": "Read a book", "parent_key": "activities", "is_leaf": True, "category": "activities", "is_custom": False, "user_id": None},
        {"_id": "activities_outside", "key": "outside", "label": "Outside", "icon": "sun", "subtitle": "Go outside", "parent_key": "activities", "is_leaf": True, "category": "activities", "is_custom": False, "user_id": None},

        # People Children
        {"_id": "people_maria", "key": "maria", "label": "Maria", "icon": "user", "subtitle": "His daughter in Boston", "parent_key": "people", "is_leaf": True, "category": "people", "is_custom": False, "user_id": None},
        {"_id": "people_yuki", "key": "yuki", "label": "Yuki", "icon": "user", "subtitle": "Caregiver", "parent_key": "people", "is_leaf": True, "category": "people", "is_custom": False, "user_id": None},
        {"_id": "people_doctor", "key": "doctor", "label": "Doctor", "icon": "stethoscope", "subtitle": "Call the doctor", "parent_key": "people", "is_leaf": True, "category": "people", "is_custom": False, "user_id": None},

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
