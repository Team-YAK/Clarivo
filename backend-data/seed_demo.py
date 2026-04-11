

import pymongo
import os
import uuid
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "voicemap")

def seed():
    client = pymongo.MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    
    db.users.delete_many({})
    db.sessions.delete_many({})
    db.sentences.delete_many({})
    db.context_log.delete_many({})
    
    user_id = "alex_demo"
    now = datetime.utcnow()
    
    alex = {
        "_id": user_id,
        "profile": {"name": "Alex", "diagnosis_date": "2024-04-12", "caregiver_name": "Maya"},
        "medical": {"medications": ["Aspirin 100mg", "Lisinopril 10mg"], "allergies": ["Penicillin"], "conditions": ["Hypertension"]},
        "preferences": {
            "communication_notes": "Alex gets frustrated when misunderstood. Give him time.", 
            "known_preferences": "Loves Italian food, especially tiramisu. Watches football on Sundays.", 
            "always_know": "His daughter Maria lives in Boston. He misses her."
        },
        "routine": {"meals": {"breakfast": "08:00", "lunch": "12:30", "dinner": "18:00"}},
        "voice_id": "mock_voice_id",
        "interface_settings": {"simplified_view": False, "show_subtitles": True, "shortcut_threshold": 5},
        "knowledge_score": 71,
        "knowledge_breakdown": {"overall": 71, "profile": 94, "medical": 78, "preferences": 61, "conversation": 42},
        "path_frequencies": {
            "food_dessert_tiramisu": 14,
            "needs_medicine": 11,
            "feelings_tired": 8,
            "needs_bathroom": 7,
            "people_family": 6
        },
        "correction_history": [],
        "context_answers": [],
        "custom_buttons": [],
        "mood_log": [
            {"date": (now - timedelta(days=2)).strftime("%Y-%m-%d"), "score": 8, "notes": "Very engaged"},
            {"date": (now - timedelta(days=1)).strftime("%Y-%m-%d"), "score": 5, "notes": "Tired"},
            {"date": now.strftime("%Y-%m-%d"), "score": 7, "notes": "Good day, communicated well."}
        ]
    }
    
    # 30 days of sessions
    sessions = []
    
    for day_offset in range(30, 0, -1):
        day = now - timedelta(days=day_offset)
        
        if day_offset > 20: # Days 1-10
            num_sessions = random.randint(2, 3)
            conf_min, conf_max = 0.55, 0.70
            corrections = True
            anchor_used = False
            path_pool = [["food"], ["needs"], ["feelings"]]
        elif day_offset > 10: # Days 11-20
            num_sessions = random.randint(3, 4)
            conf_min, conf_max = 0.70, 0.82
            corrections = random.choice([True, False])
            anchor_used = random.choice([True, False])
            path_pool = [["food", "dessert"], ["needs", "medicine"], ["feelings", "tired"]]
        else: # Days 21-30
            num_sessions = random.randint(4, 6)
            conf_min, conf_max = 0.82, 0.94
            corrections = False
            anchor_used = True
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
            
            s = {
                "_id": f"s_{uuid.uuid4().hex[:8]}",
                "user_id": user_id,
                "path": path_cat,
                "sentence": "Mock sentence output",
                "confidence": round(random.uniform(conf_min, conf_max), 2),
                "audio_url": "/mock-audio/tiramisu.mp3",
                "feedback": "positive" if not corrections else "correction",
                "correction": "Sample correction" if corrections else None,
                "is_first_occurrence": False,
                "anchor_used": anchor_used,
                "flagged": False,
                "timestamp": st_time.isoformat()
            }
            sessions.append(s)
            
    # Add distress sessions for urgency
    urgency_paths = [["needs", "pain"], ["needs", "help"], ["health", "emergency"]]
    for i in range(3):
        sessions.append({
            "_id": f"s_{uuid.uuid4().hex[:8]}",
            "user_id": user_id,
            "path": urgency_paths[i],
            "sentence": "I need help",
            "confidence": 0.9,
            "audio_url": "/mock-audio/help.mp3",
            "feedback": "positive",
            "correction": None,
            "is_first_occurrence": False,
            "flagged": False,
            "timestamp": (now - timedelta(minutes=10 * (i+1))).isoformat()
        })
        
    db.sessions.insert_many(sessions)
    db.users.insert_one(alex)
    
    # Pre-cache sentences
    paths = [
        {"k": "food_dessert_tiramisu", "s": "I want tiramisu — it's my favorite."},
        {"k": "needs_medicine", "s": "I need my medication."},
        {"k": "feelings_tired", "s": "I am feeling tired."},
        {"k": "needs_bathroom", "s": "I need to go to the bathroom."},
        {"k": "people_family", "s": "I want to see my family."}
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
            "last_updated": now.isoformat()
        })
    db.sentences.insert_many(sentences)
    
    print("Demo Data Seeded Correctly!")

if __name__ == "__main__":
    seed()
