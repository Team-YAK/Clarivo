"""Shared configuration constants for backend-data."""

import os

DEFAULT_USER_ID = os.getenv("DEFAULT_USER_ID", "alex_demo")

DISTRESS_TERMS = {
    "pain", "help", "emergency", "headache", "dizzy",
    "stomach_pain", "back_pain", "in_pain",
}
