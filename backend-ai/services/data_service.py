"""
HTTP client for E3 (data layer on localhost:8002).
Falls back to mock_data.py when E3 is unavailable.
"""

import os
import logging
import httpx
from services.utils import path_to_key
from mock_data import MOCK_USER, MOCK_SESSIONS, MOCK_PENDING_QUESTION

logger = logging.getLogger(__name__)

E3_BASE = os.getenv("E3_BASE_URL", "http://localhost:8002")
USE_MOCK = os.getenv("USE_MOCK", "false").lower() == "true"


async def get_user(user_id: str) -> dict:
    if USE_MOCK:
        logger.warning(f"Using MOCK_USER for get_user({user_id})")
        return MOCK_USER
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{E3_BASE}/api/profile", params={"user_id": user_id})
            if resp.status_code == 200:
                return resp.json()
            raise Exception(f"E3 returned {resp.status_code}")
    except Exception as e:
        logger.warning(f"E3 unavailable — using mock data: {e}")
        return MOCK_USER


async def create_session(session_data: dict) -> dict:
    """Create a session in E3. Ensures path_key and input_mode are included."""
    # Auto-generate path_key if not present
    if "path_key" not in session_data and "path" in session_data:
        mode = session_data.get("input_mode", "tree")
        session_data["path_key"] = path_to_key(session_data["path"], mode)
    if "input_mode" not in session_data:
        session_data["input_mode"] = "tree"

    if USE_MOCK:
        logger.warning(f"Using MOCK session for create_session({session_data.get('session_id')})")
        return {"success": True, "session_id": session_data.get("session_id")}
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(f"{E3_BASE}/api/sessions/create", json=session_data)
            if resp.status_code == 200:
                return resp.json()
            raise Exception(f"E3 returned {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.warning(f"E3 unavailable — session not persisted: {e}")
        return {"success": True, "session_id": session_data.get("session_id")}


async def save_feedback(session_id: str, feedback_data: dict) -> dict:
    if USE_MOCK:
        logger.warning(f"Using MOCK for save_feedback({session_id})")
        return {"success": True}
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(
                f"{E3_BASE}/api/feedback",
                json={"session_id": session_id, **feedback_data},
            )
            if resp.status_code == 200:
                return resp.json()
            raise Exception(f"E3 returned {resp.status_code}")
    except Exception as e:
        logger.warning(f"E3 unavailable — feedback not persisted: {e}")
        return {"success": True}


async def get_sessions_last_24h(user_id: str) -> list:
    if USE_MOCK:
        logger.warning(f"Using MOCK_SESSIONS for get_sessions_last_24h({user_id})")
        return MOCK_SESSIONS
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(
                f"{E3_BASE}/api/sessions/history",
                params={"user_id": user_id, "limit": 50},
            )
            if resp.status_code == 200:
                return resp.json().get("sessions", [])
            raise Exception(f"E3 returned {resp.status_code}")
    except Exception as e:
        logger.warning(f"E3 unavailable — using mock sessions: {e}")
        return MOCK_SESSIONS


async def save_context_question(user_id: str, question_data: dict) -> dict:
    """Save a post-session question. Called from confirm.py with user_id.
    Finds the most recent session for this user and attaches the question."""
    if USE_MOCK:
        logger.warning(f"Using MOCK for save_context_question({user_id})")
        return {"success": True}
    try:
        # Get the most recent session to attach the question to
        async with httpx.AsyncClient(timeout=2.0) as client:
            # First get the latest session
            hist_resp = await client.get(
                f"{E3_BASE}/api/sessions/history",
                params={"user_id": user_id, "limit": 1},
            )
            if hist_resp.status_code == 200:
                sessions = hist_resp.json()
                # Handle both wrapped and unwrapped response formats
                if isinstance(sessions, dict):
                    sessions = sessions.get("sessions", sessions.get("data", []))
                if sessions and len(sessions) > 0:
                    session_id = sessions[0].get("id") or sessions[0].get("_id")
                    if session_id:
                        resp = await client.post(
                            f"{E3_BASE}/api/sessions/update",
                            json={"session_id": session_id, "updates": {"post_session_question": question_data}},
                        )
                        if resp.status_code == 200:
                            return resp.json()
            logger.warning(f"Could not find session to attach question for user {user_id}")
            return {"success": True}
    except Exception as e:
        logger.warning(f"E3 unavailable — question not saved: {e}")
        return {"success": True}


async def save_correction(user_id: str, session_id: str, correction: str) -> dict:
    # Corrections are now handled via the feedback endpoint in E3
    return await save_feedback(session_id, {"user_id": user_id, "thumbs_up": False, "correction": correction})


async def save_voice_id(user_id: str, voice_id: str) -> dict:
    if USE_MOCK:
        logger.warning(f"Using MOCK for save_voice_id({user_id})")
        return {"success": True}
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(
                f"{E3_BASE}/api/profile/update",
                json={"user_id": user_id, "field": "voice_id", "value": voice_id},
            )
            if resp.status_code == 200:
                return resp.json()
            raise Exception(f"E3 returned {resp.status_code}")
    except Exception as e:
        logger.warning(f"E3 unavailable — voice_id not saved: {e}")
        return {"success": True}


async def get_prompt(prompt_id: str, user_id: str) -> dict | None:
    if USE_MOCK:
        return None
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            resp = await client.get(f"{E3_BASE}/api/prompts/{prompt_id}", params={"user_id": user_id})
            if resp.status_code == 200:
                return resp.json().get("prompt")
            return None
    except Exception as e:
        logger.warning(f"Could not fetch prompt {prompt_id}: {e}")
        return None


async def update_prompt(user_id: str, prompt_id: str, content: str, description: str = None) -> bool:
    if USE_MOCK:
        return True
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(
                f"{E3_BASE}/api/prompts",
                json={"user_id": user_id, "prompt_id": prompt_id, "content": content, "description": description}
            )
            return resp.status_code == 200
    except Exception as e:
        logger.warning(f"Could not update prompt {prompt_id}: {e}")
        return False
