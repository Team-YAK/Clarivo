"""
Mock E3 responses for independent testing.
Used when E3 (localhost:8002) is unavailable.
"""

MOCK_USER = {
    "profile": {
        "name": "Patient",
        "diagnosis_date": None,
        "caregiver_name": "Caregiver",
    },
    "medical": {
        "medications": [],
        "allergies": [],
        "conditions": [],
    },
    "preferences": {
        "communication_notes": "",
        "known_preferences": "",
        "always_know": "",
    },
    "correction_history": [],
    "context_answers": [],
    "glossary_rules": [],
    "path_frequencies": {},
    "voice_id": "",
}

MOCK_SESSIONS = []

MOCK_PENDING_QUESTION = None
