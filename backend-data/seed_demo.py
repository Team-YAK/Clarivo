import pymongo
import os
import uuid
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "voicemap")

def path_to_key(path_list: list[str], mode: str = "tree") -> str:
    if not path_list: return ""
    path_str = "→".join(path_list)
    if mode == "composer": return f"composer→{path_str}"
    if mode == "custom": return f"custom→{path_str}"
    return path_str

def seed():
    client = pymongo.MongoClient(MONGODB_URI, tlsAllowInvalidCertificates=True)
    db = client[DB_NAME]
    
    db.users.delete_many({})
    db.sessions.delete_many({})
    db.sentences.delete_many({})
    db.context_log.delete_many({})
    db.tree_nodes.delete_many({})
    db.icons.delete_many({})
    
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

        # Food -> Main Course Leaves
        {"_id": "main_pasta", "key": "pasta", "label": "Pasta", "icon": "bowl-food", "subtitle": "Noodles", "parent_key": "main_course", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "main_soup", "key": "soup", "label": "Soup", "icon": "bowl-food", "subtitle": "Hot soup", "parent_key": "main_course", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "main_sandwich", "key": "sandwich", "label": "Sandwich", "icon": "hamburger", "subtitle": "Bread sub", "parent_key": "main_course", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "main_rice", "key": "rice", "label": "Rice", "icon": "bowl-food", "subtitle": "Steamed rice", "parent_key": "main_course", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},

        # Food -> Drink Leaves
        {"_id": "drink_water", "key": "water", "label": "Water", "icon": "drop", "subtitle": "Glass of water", "parent_key": "drink", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "drink_tea", "key": "tea", "label": "Tea", "icon": "coffee", "subtitle": "Hot tea", "parent_key": "drink", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "drink_juice", "key": "juice", "label": "Juice", "icon": "drop", "subtitle": "Fruit juice", "parent_key": "drink", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},
        {"_id": "drink_coffee", "key": "coffee", "label": "Coffee", "icon": "coffee", "subtitle": "Hot coffee", "parent_key": "drink", "is_leaf": True, "category": "food", "is_custom": False, "user_id": None},

        # Feelings Leaves
        {"_id": "feelings_happy", "key": "happy", "label": "Happy", "icon": "smiley", "subtitle": "Feeling good", "parent_key": "feelings", "is_leaf": True, "category": "feelings", "is_custom": False, "user_id": None},
        {"_id": "feelings_sad", "key": "sad", "label": "Sad", "icon": "smiley-sad", "subtitle": "Feeling down", "parent_key": "feelings", "is_leaf": True, "category": "feelings", "is_custom": False, "user_id": None},
        {"_id": "feelings_in_pain", "key": "in_pain", "label": "In Pain", "icon": "warning", "subtitle": "Hurting", "parent_key": "feelings", "is_leaf": True, "category": "feelings", "is_custom": False, "user_id": None},
        {"_id": "feelings_tired", "key": "tired", "label": "Tired", "icon": "moon", "subtitle": "Sleepy", "parent_key": "feelings", "is_leaf": True, "category": "feelings", "is_custom": False, "user_id": None},
        {"_id": "feelings_confused", "key": "confused", "label": "Confused", "icon": "question", "subtitle": "Not sure", "parent_key": "feelings", "is_leaf": True, "category": "feelings", "is_custom": False, "user_id": None},
        {"_id": "feelings_okay", "key": "okay", "label": "Okay", "icon": "thumbs-up", "subtitle": "Doing fine", "parent_key": "feelings", "is_leaf": True, "category": "feelings", "is_custom": False, "user_id": None},

        # Needs Leaves
        {"_id": "needs_bathroom", "key": "bathroom", "label": "Bathroom", "icon": "toilet", "subtitle": "Restroom", "parent_key": "needs", "is_leaf": True, "category": "needs", "is_custom": False, "user_id": None},
        {"_id": "needs_medicine", "key": "medicine", "label": "Medicine", "icon": "pill", "subtitle": "Pills", "parent_key": "needs", "is_leaf": True, "category": "needs", "is_custom": False, "user_id": None},
        {"_id": "needs_phone", "key": "phone", "label": "Phone", "icon": "device-mobile", "subtitle": "Call someone", "parent_key": "needs", "is_leaf": True, "category": "needs", "is_custom": False, "user_id": None},
        {"_id": "needs_doctor", "key": "doctor", "label": "Doctor", "icon": "stethoscope", "subtitle": "See physician", "parent_key": "needs", "is_leaf": True, "category": "needs", "is_custom": False, "user_id": None},
        {"_id": "needs_help", "key": "help", "label": "Help", "icon": "warning-octagon", "subtitle": "Need assistance", "parent_key": "needs", "is_leaf": True, "category": "needs", "is_custom": False, "user_id": None},
        {"_id": "needs_rest", "key": "rest", "label": "Rest", "icon": "bed", "subtitle": "Lie down", "parent_key": "needs", "is_leaf": True, "category": "needs", "is_custom": False, "user_id": None},

        # People Leaves
        {"_id": "people_family", "key": "family", "label": "Family", "icon": "users", "subtitle": "Relatives", "parent_key": "people", "is_leaf": True, "category": "people", "is_custom": False, "user_id": None},
        {"_id": "people_doctor", "key": "doctor", "label": "Doctor", "icon": "stethoscope", "subtitle": "Physician", "parent_key": "people", "is_leaf": True, "category": "people", "is_custom": False, "user_id": None},
        {"_id": "people_friend", "key": "friend", "label": "Friend", "icon": "user", "subtitle": "Companion", "parent_key": "people", "is_leaf": True, "category": "people", "is_custom": False, "user_id": None},
        {"_id": "people_nurse", "key": "nurse", "label": "Nurse", "icon": "first-aid", "subtitle": "Care provider", "parent_key": "people", "is_leaf": True, "category": "people", "is_custom": False, "user_id": None},

        # Health Leaves
        {"_id": "health_headache", "key": "headache", "label": "Headache", "icon": "bandaids", "subtitle": "Head hurts", "parent_key": "health", "is_leaf": True, "category": "health", "is_custom": False, "user_id": None},
        {"_id": "health_stomach_pain", "key": "stomach_pain", "label": "Stomach Pain", "icon": "warning", "subtitle": "Belly hurts", "parent_key": "health", "is_leaf": True, "category": "health", "is_custom": False, "user_id": None},
        {"_id": "health_back_pain", "key": "back_pain", "label": "Back Pain", "icon": "warning", "subtitle": "Back hurts", "parent_key": "health", "is_leaf": True, "category": "health", "is_custom": False, "user_id": None},
        {"_id": "health_dizzy", "key": "dizzy", "label": "Dizzy", "icon": "arrows-clockwise", "subtitle": "Spinning", "parent_key": "health", "is_leaf": True, "category": "health", "is_custom": False, "user_id": None},
        {"_id": "health_cold", "key": "cold", "label": "Cold", "icon": "thermometer-cold", "subtitle": "Chills", "parent_key": "health", "is_leaf": True, "category": "health", "is_custom": False, "user_id": None},

        # Activities Leaves
        {"_id": "activities_watch_tv", "key": "watch_tv", "label": "Watch TV", "icon": "television", "subtitle": "Television", "parent_key": "activities", "is_leaf": True, "category": "activities", "is_custom": False, "user_id": None},
        {"_id": "activities_listen_to_music", "key": "listen_to_music", "label": "Listen to Music", "icon": "headphones", "subtitle": "Songs", "parent_key": "activities", "is_leaf": True, "category": "activities", "is_custom": False, "user_id": None},
        {"_id": "activities_go_outside", "key": "go_outside", "label": "Go Outside", "icon": "tree", "subtitle": "Outdoors", "parent_key": "activities", "is_leaf": True, "category": "activities", "is_custom": False, "user_id": None},
        {"_id": "activities_read", "key": "read", "label": "Read", "icon": "book-open", "subtitle": "Book or tablet", "parent_key": "activities", "is_leaf": True, "category": "activities", "is_custom": False, "user_id": None},
        
        # Custom Nodes
        {"_id": "custom_alex_call_maria", "key": "custom_alex_call_maria", "label": "Call Maria", "icon": "phone", "subtitle": "My daughter", "parent_key": "people", "is_leaf": True, "category": "people", "is_custom": True, "user_id": user_id},
        {"_id": "custom_alex_watch_football", "key": "custom_alex_watch_football", "label": "Watch Football", "icon": "football", "subtitle": "Sunday game", "parent_key": "activities", "is_leaf": True, "category": "activities", "is_custom": True, "user_id": user_id},
        {"_id": "custom_alex_go_to_garden", "key": "custom_alex_go_to_garden", "label": "Go to Garden", "icon": "flower", "subtitle": "Outside", "parent_key": "activities", "is_leaf": True, "category": "activities", "is_custom": True, "user_id": user_id},
    ]

    # 2. Composer Icons
    icons = [
        {"key": "running", "icon_name": "person-simple-run", "label": "Running", "category": "actions", "tags": ["run", "jog", "sprint"]},
        {"key": "walking", "icon_name": "person-simple-walk", "label": "Walking", "category": "actions", "tags": ["walk", "stroll"]},
        {"key": "sleeping", "icon_name": "moon", "label": "Sleeping", "category": "actions", "tags": ["sleep", "rest", "nap"]},
        {"key": "eating", "icon_name": "fork-knife", "label": "Eating", "category": "actions", "tags": ["eat", "meal", "food"]},
        {"key": "drinking", "icon_name": "drop", "label": "Drinking", "category": "actions", "tags": ["drink", "water"]},
        {"key": "reading", "icon_name": "book-open", "label": "Reading", "category": "actions", "tags": ["read", "book"]},
        {"key": "watching", "icon_name": "television", "label": "Watching", "category": "actions", "tags": ["watch", "see", "tv"]},
        {"key": "listening", "icon_name": "headphones", "label": "Listening", "category": "actions", "tags": ["listen", "hear", "music"]},
        {"key": "calling", "icon_name": "phone", "label": "Calling", "category": "actions", "tags": ["call", "phone"]},
        {"key": "writing", "icon_name": "pencil", "label": "Writing", "category": "actions", "tags": ["write", "pen"]},
        {"key": "swimming", "icon_name": "waves", "label": "Swimming", "category": "actions", "tags": ["swim", "pool", "water"]},
        {"key": "cooking", "icon_name": "cooking-pot", "label": "Cooking", "category": "actions", "tags": ["cook", "make", "food"]},
        {"key": "driving", "icon_name": "car", "label": "Driving", "category": "actions", "tags": ["drive", "car"]},
        {"key": "exercising", "icon_name": "barbell", "label": "Exercising", "category": "actions", "tags": ["exercise", "workout", "gym"]},
        {"key": "praying", "icon_name": "hands-praying", "label": "Praying", "category": "actions", "tags": ["pray", "god"]},
        {"key": "laughing", "icon_name": "smiley-wink", "label": "Laughing", "category": "actions", "tags": ["laugh", "funny"]},
        {"key": "crying", "icon_name": "drop", "label": "Crying", "category": "actions", "tags": ["cry", "sad", "tears"]},

        {"key": "medicine", "icon_name": "pill", "label": "Medicine", "category": "objects", "tags": ["pill", "drugs", "meds"]},
        {"key": "phone", "icon_name": "device-mobile", "label": "Phone", "category": "objects", "tags": ["mobile", "cell"]},
        {"key": "book", "icon_name": "book", "label": "Book", "category": "objects", "tags": ["read"]},
        {"key": "food", "icon_name": "hamburger", "label": "Food", "category": "objects", "tags": ["eat"]},
        {"key": "water", "icon_name": "drop", "label": "Water", "category": "objects", "tags": ["drink"]},
        {"key": "bed", "icon_name": "bed", "label": "Bed", "category": "objects", "tags": ["sleep"]},
        {"key": "chair", "icon_name": "chair", "label": "Chair", "category": "objects", "tags": ["sit"]},
        {"key": "door", "icon_name": "door", "label": "Door", "category": "objects", "tags": ["open", "exit"]},
        {"key": "window", "icon_name": "browser", "label": "Window", "category": "objects", "tags": ["look"]},
        {"key": "clock", "icon_name": "clock", "label": "Clock", "category": "objects", "tags": ["time"]},
        {"key": "calendar", "icon_name": "calendar", "label": "Calendar", "category": "objects", "tags": ["date", "day"]},
        {"key": "money", "icon_name": "currency-dollar", "label": "Money", "category": "objects", "tags": ["cash", "pay"]},
        {"key": "key", "icon_name": "key", "label": "Key", "category": "objects", "tags": ["open", "lock"]},
        {"key": "bag", "icon_name": "tote", "label": "Bag", "category": "objects", "tags": ["carry", "purse"]},

        {"key": "home", "icon_name": "house", "label": "Home", "category": "places", "tags": ["house", "live"]},
        {"key": "hospital", "icon_name": "hospital", "label": "Hospital", "category": "places", "tags": ["medical", "doctor"]},
        {"key": "garden", "icon_name": "flower", "label": "Garden", "category": "places", "tags": ["outside", "plants"]},
        {"key": "kitchen", "icon_name": "cooking-pot", "label": "Kitchen", "category": "places", "tags": ["cook", "food"]},
        {"key": "bedroom", "icon_name": "bed", "label": "Bedroom", "category": "places", "tags": ["sleep"]},
        {"key": "bathroom", "icon_name": "toilet", "label": "Bathroom", "category": "places", "tags": ["wash", "shower"]},
        {"key": "park", "icon_name": "tree", "label": "Park", "category": "places", "tags": ["outside", "grass"]},
        {"key": "church", "icon_name": "church", "label": "Church", "category": "places", "tags": ["pray"]},
        {"key": "shop", "icon_name": "storefront", "label": "Shop", "category": "places", "tags": ["store", "buy", "groceries"]},
        {"key": "school", "icon_name": "student", "label": "School", "category": "places", "tags": ["learn", "class"]},

        {"key": "morning", "icon_name": "sun", "label": "Morning", "category": "times", "tags": ["am", "sun", "wake"]},
        {"key": "afternoon", "icon_name": "sun-dim", "label": "Afternoon", "category": "times", "tags": ["pm"]},
        {"key": "evening", "icon_name": "moon", "label": "Evening", "category": "times", "tags": ["pm", "dark"]},
        {"key": "night", "icon_name": "moon-stars", "label": "Night", "category": "times", "tags": ["sleep", "bedtime"]},
        {"key": "today", "icon_name": "calendar-check", "label": "Today", "category": "times", "tags": ["now"]},
        {"key": "tomorrow", "icon_name": "calendar-plus", "label": "Tomorrow", "category": "times", "tags": ["future"]},
        {"key": "yesterday", "icon_name": "calendar-minus", "label": "Yesterday", "category": "times", "tags": ["past"]},
        {"key": "now", "icon_name": "clock", "label": "Now", "category": "times", "tags": ["current"]},
        {"key": "later", "icon_name": "clock-afternoon", "label": "Later", "category": "times", "tags": ["future"]},
        {"key": "early", "icon_name": "sun-horizon", "label": "Early", "category": "times", "tags": ["soon"]},
        {"key": "late", "icon_name": "moon", "label": "Late", "category": "times", "tags": ["delayed"]},

        {"key": "happy", "icon_name": "smiley", "label": "Happy", "category": "feelings", "tags": ["glad", "joy"]},
        {"key": "sad", "icon_name": "smiley-sad", "label": "Sad", "category": "feelings", "tags": ["down", "depressed"]},
        {"key": "angry", "icon_name": "smiley-angry", "label": "Angry", "category": "feelings", "tags": ["mad", "upset"]},
        {"key": "scared", "icon_name": "smiley-nervous", "label": "Scared", "category": "feelings", "tags": ["fear", "afraid"]},
        {"key": "confused", "icon_name": "question", "label": "Confused", "category": "feelings", "tags": ["lost", "unsure"]},
        {"key": "tired", "icon_name": "moon", "label": "Tired", "category": "feelings", "tags": ["sleepy", "exhausted"]},
        {"key": "excited", "icon_name": "star", "label": "Excited", "category": "feelings", "tags": ["eager", "thrilled"]},
        {"key": "bored", "icon_name": "smiley-blank", "label": "Bored", "category": "feelings", "tags": ["dull", "uninterested"]},
        {"key": "calm", "icon_name": "wind", "label": "Calm", "category": "feelings", "tags": ["peaceful", "relaxed"]},
        {"key": "anxious", "icon_name": "warning", "label": "Anxious", "category": "feelings", "tags": ["nervous", "worried"]},
        {"key": "proud", "icon_name": "medal", "label": "Proud", "category": "feelings", "tags": ["accomplished"]},
        {"key": "grateful", "icon_name": "heart", "label": "Grateful", "category": "feelings", "tags": ["thankful", "appreciative"]},

        {"key": "family", "icon_name": "users", "label": "Family", "category": "people", "tags": ["relatives", "home"]},
        {"key": "friend", "icon_name": "user", "label": "Friend", "category": "people", "tags": ["buddy", "pal"]},
        {"key": "doctor", "icon_name": "stethoscope", "label": "Doctor", "category": "people", "tags": ["md", "physician", "medical"]},
        {"key": "nurse", "icon_name": "first-aid", "label": "Nurse", "category": "people", "tags": ["rn", "medical"]},
        {"key": "caregiver", "icon_name": "hand-heart", "label": "Caregiver", "category": "people", "tags": ["help", "support"]},
        {"key": "child", "icon_name": "baby", "label": "Child", "category": "people", "tags": ["kid", "son", "daughter"]},
        {"key": "partner", "icon_name": "heart", "label": "Partner", "category": "people", "tags": ["spouse", "wife", "husband"]},
        {"key": "parent", "icon_name": "users", "label": "Parent", "category": "people", "tags": ["mom", "dad", "mother", "father"]},

        {"key": "pain", "icon_name": "warning-octagon", "label": "Pain", "category": "medical", "tags": ["hurt", "ache", "sore"]},
        {"key": "headache", "icon_name": "bandaids", "label": "Headache", "category": "medical", "tags": ["head", "pain"]},
        {"key": "nausea", "icon_name": "toilet", "label": "Nausea", "category": "medical", "tags": ["sick", "stomach", "throw up"]},
        {"key": "dizzy", "icon_name": "arrows-clockwise", "label": "Dizzy", "category": "medical", "tags": ["spin", "faint"]},
        {"key": "cold", "icon_name": "thermometer-cold", "label": "Cold", "category": "medical", "tags": ["freeze", "chilly"]},
        {"key": "fever", "icon_name": "thermometer-hot", "label": "Fever", "category": "medical", "tags": ["hot", "temperature"]},
        {"key": "medication", "icon_name": "pill", "label": "Medication", "category": "medical", "tags": ["drugs", "medicine"]},
        {"key": "wheelchair", "icon_name": "wheelchair", "label": "Wheelchair", "category": "medical", "tags": ["chair", "mobility"]},
        {"key": "bandage", "icon_name": "bandaids", "label": "Bandage", "category": "medical", "tags": ["cut", "wound"]}
    ]

    # Pre-cache sentences
    paths = [
        {"k": "food→dessert→tiramisu", "s": "I want tiramisu — it's my favorite."},
        {"k": "needs→medicine", "s": "I need my Lisinopril please."},
        {"k": "feelings→tired", "s": "I am feeling very tired."},
        {"k": "needs→bathroom", "s": "I need to use the bathroom."},
        {"k": "people→family", "s": "I want to see my family. I miss Maria."}
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
            "feelings→tired": 8,
            "needs→bathroom": 7,
            "people→family": 6,
            "custom→custom_alex_call_maria": 5
        },
        "correction_history": [
            {"path": "food→dessert→tiramisu", "original_sentence": "I want a dessert.", "corrected_sentence": "I want tiramisu, it's my favorite.", "timestamp": (now - timedelta(days=20)).isoformat()},
            {"path": "people→family", "original_sentence": "I want to see my family.", "corrected_sentence": "I want to see my family. I miss Maria.", "timestamp": (now - timedelta(days=15)).isoformat()}
        ],
        "context_answers": [
            {"question_id": "q1", "question": "What is his favorite dessert?", "answer": "Tiramisu", "timestamp": (now - timedelta(days=22)).isoformat()},
            {"question_id": "q2", "question": "Who does he miss?", "answer": "Maria", "timestamp": (now - timedelta(days=18)).isoformat()},
            {"question_id": "q3", "question": "What is his favorite sport?", "answer": "Football", "timestamp": (now - timedelta(days=16)).isoformat()},
            {"question_id": "q4", "question": "When does he take his medicine?", "answer": "Morning and evening", "timestamp": (now - timedelta(days=10)).isoformat()},
            {"question_id": "q5", "question": "Does he like reading?", "answer": "No, he prefers watching TV.", "timestamp": (now - timedelta(days=5)).isoformat()}
        ],
        "mood_log": [
            {"date": (now - timedelta(days=i)).strftime("%Y-%m-%d"), "score": random.randint(4, 9), "notes": "Varied mood", "timestamp": (now - timedelta(days=i)).isoformat()} for i in range(14)
        ]
    }
    
    # Session Data
    sessions = []
    
    for day_offset in range(30, 0, -1):
        day = now - timedelta(days=day_offset)
        
        if day_offset > 20: # Days 1-10
            num_sessions = random.randint(2, 3)
            conf_min, conf_max = 0.55, 0.70
            corrections = True
            path_pool = [["food"], ["needs"], ["feelings"]]
        elif day_offset > 10: # Days 11-20
            num_sessions = random.randint(3, 4)
            conf_min, conf_max = 0.70, 0.82
            corrections = random.choice([True, False])
            path_pool = [["food", "dessert"], ["needs", "medicine"], ["feelings", "tired"]]
        else: # Days 21-30
            num_sessions = random.randint(4, 6)
            conf_min, conf_max = 0.82, 0.94
            corrections = False
            path_pool = [
                ["food", "dessert", "tiramisu"],
                ["needs", "medicine"],
                ["feelings", "tired"],
                ["needs", "bathroom"],
                ["people", "family"]
            ]
            
        for i in range(num_sessions):
            hour = random.choice([8, 12, 18, 20])
            st_time = day.replace(hour=hour, minute=random.randint(0, 59))
            
            path_cat = random.choice(path_pool)
            p_key = path_to_key(path_cat, "tree")
            
            s = {
                "_id": f"s_{uuid.uuid4().hex[:8]}",
                "user_id": user_id,
                "path": path_cat,
                "path_key": p_key,
                "input_mode": "tree",
                "sentence": "Mock sentence output",
                "confidence": round(random.uniform(conf_min, conf_max), 2),
                "audio_url": "/mock-audio/tiramisu.mp3",
                "feedback": "positive" if not corrections else "correction",
                "correction": "Sample correction" if corrections else None,
                "is_first_occurrence": False,
                "flagged": False,
                "post_session_question": None,
                "status": "confirmed",
                "timestamp": st_time.isoformat()
            }
            sessions.append(s)
            
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
            "audio_url": "/mock-audio/help.mp3",
            "feedback": "positive",
            "correction": None,
            "is_first_occurrence": False,
            "flagged": False,
            "post_session_question": None,
            "status": "confirmed",
            "timestamp": (now - timedelta(minutes=10 * (i+1))).isoformat()
        })
        
    # Add a Composer session
    sessions.append({
            "_id": f"s_{uuid.uuid4().hex[:8]}",
            "user_id": user_id,
            "path": ["running", "sun"],
            "path_key": "composer→running→sun",
            "input_mode": "composer",
            "sentence": "I want to go for a morning run.",
            "confidence": 0.85,
            "audio_url": "/mock-audio/run.mp3",
            "feedback": "positive",
            "correction": None,
            "is_first_occurrence": False,
            "flagged": False,
            "post_session_question": None,
            "status": "confirmed",
            "timestamp": (now - timedelta(days=3)).isoformat()
    })

    # Set 3 sessions as first_occurrence
    for i in range(3):
        sessions[i]["is_first_occurrence"] = True

    db.tree_nodes.insert_many(tree_nodes)
    db.icons.insert_many(icons)
    db.sentences.insert_many(sentences)
    db.sessions.insert_many(sessions)
    db.users.insert_one(alex)
    
    # Indexes
    db.sessions.create_index([("user_id", 1), ("timestamp", -1)])
    db.sessions.create_index([("user_id", 1), ("path_key", 1)])
    db.sessions.create_index([("user_id", 1), ("status", 1)])
    db.tree_nodes.create_index([("parent_key", 1), ("user_id", 1)])
    
    print("✓ Seeded successfully")

if __name__ == "__main__":
    seed()
