"""
Mock E3 responses for independent testing.
Used when E3 (localhost:8002) is unavailable.
"""

MOCK_USER = {
    "profile": {
        "name": "Kishan",
        "diagnosis_date": "2024-04-12",
        "caregiver_name": "Yuki",
    },
    "medical": {
        "medications": ["Aspirin 100mg", "Lisinopril 10mg"],
        "allergies": ["Penicillin"],
        "conditions": ["Hypertension"],
    },
    "preferences": {
        "communication_notes": "Kishan gets frustrated when misunderstood. Give him time.",
        "known_preferences": "Loves Italian food, especially tiramisu. Watches football on Sundays.",
        "always_know": "His daughter Maria lives in Boston. He misses her.",
    },
    "correction_history": [
        {
            "path": "food→dessert→cake",
            "original_sentence": "I would like cake.",
            "corrected_sentence": "I want tiramisu specifically.",
        }
    ],
    "context_answers": [
        {"question": "Favorite dessert?", "answer": "Tiramisu, always tiramisu"},
        {"question": "Favorite sport?", "answer": "Football, 49ers fan"},
    ],
    "glossary_rules": [
        {"trigger_word": "Bobby", "enforced_meaning": "Kishan's Golden Retriever dog", "active": True},
        {"trigger_word": "Blue Pill", "enforced_meaning": "Aspirin (taken at 8am)", "active": True},
    ],
    "path_frequencies": {
        "food→dessert→tiramisu": 14,
        "needs→medicine": 11,
        "food→drink→water": 9,
        "feelings→tired": 7,
        "food→dessert→ice_cream": 6,
        "activities→walk": 5,
        "food→main_course": 4,
        "health→headache": 3,
    },
    "voice_id": "mock_voice_id",
}

MOCK_SESSIONS = [
    {
        "session_id": "s_mock_001",
        "user_id": "alex_demo",
        "path": ["needs", "medicine"],
        "sentence": "I need my Lisinopril please.",
        "confidence": 0.92,
        "audio_url": "/audio/mock_001.mp3",
        "feedback": None,
        "correction": None,
        "is_first_occurrence": False,
        "timestamp": "2026-04-11T08:30:00Z",
    },
    {
        "session_id": "s_mock_002",
        "user_id": "alex_demo",
        "path": ["food", "dessert", "tiramisu"],
        "sentence": "I would like some tiramisu please.",
        "confidence": 0.95,
        "audio_url": "/audio/mock_002.mp3",
        "feedback": "positive",
        "correction": None,
        "is_first_occurrence": False,
        "timestamp": "2026-04-11T09:15:00Z",
    },
    {
        "session_id": "s_mock_003",
        "user_id": "alex_demo",
        "path": ["food", "drink", "water"],
        "sentence": "I want a glass of water.",
        "confidence": 0.88,
        "audio_url": "/audio/mock_003.mp3",
        "feedback": "positive",
        "correction": None,
        "is_first_occurrence": False,
        "timestamp": "2026-04-11T10:00:00Z",
    },
]

MOCK_PENDING_QUESTION = {
    "question_id": "q_mock_001",
    "question": "What does Kishan usually like to do after lunch?",
}
