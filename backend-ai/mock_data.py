"""
Mock E3 responses for independent testing.
Used when E3 (localhost:8002) is unavailable.
"""

MOCK_USER = {
    "profile": {
        "name": "Alex",
        "diagnosis_date": "2024-04-12",
        "caregiver_name": "Maya",
    },
    "medical": {
        "medications": ["Aspirin 100mg", "Lisinopril 10mg"],
        "allergies": ["Penicillin"],
        "conditions": ["Hypertension"],
    },
    "preferences": {
        "communication_notes": "Alex gets frustrated when misunderstood. Give him time.",
        "known_preferences": "Loves tiramisu. Watches football on Sundays.",
        "always_know": "His daughter Maria lives in Boston. He misses her.",
    },
    "correction_history": [
        {
            "path": "food > dessert > cake",
            "original": "I would like cake.",
            "corrected": "I want tiramisu specifically.",
        }
    ],
    "context_answers": [
        {"question": "Favorite dessert?", "answer": "Tiramisu, always tiramisu"},
        {"question": "Favorite sport?", "answer": "Football, 49ers fan"},
    ],
    "voice_id": "mock_voice_id",
}

MOCK_SESSIONS = [
    {
        "session_id": "s_mock_001",
        "user_id": "alex_demo",
        "path": ["needs", "physical", "pain", "head"],
        "sentence": "I am experiencing a severe headache right now.",
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
        "feedback": "thumbs_up",
        "correction": None,
        "is_first_occurrence": True,
        "timestamp": "2026-04-11T09:15:00Z",
    },
]

MOCK_PENDING_QUESTION = {
    "question_id": "q_mock_001",
    "question": "What does Alex usually like to do after lunch?",
}
