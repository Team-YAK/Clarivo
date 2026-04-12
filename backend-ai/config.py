"""Shared configuration constants for backend-ai."""

import os

DEFAULT_USER_ID = os.getenv("DEFAULT_USER_ID", "alex_demo")
E3_BASE_URL = os.getenv("E3_BASE_URL", "http://localhost:8002")

DISTRESS_TERMS = {
    "pain", "help", "emergency", "headache", "dizzy",
    "stomach_pain", "back_pain", "in_pain",
}


