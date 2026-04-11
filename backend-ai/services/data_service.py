"""
HTTP client for E3 (data layer on localhost:8002).
Falls back to mock_data.py when E3 is unavailable.
"""

import os
import logging
import httpx
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
    if USE_MOCK:
        logger.warning(f"Using MOCK session for create_session({session_data.get('session_id')})")
        return {"success": True, "session_id": session_data.get("session_id")}
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(f"{E3_BASE}/api/sessions/create", json=session_data)
            if resp.status_code == 200:
                return resp.json()
            raise Exception(f"E3 returned {resp.status_code}")
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
                f"{E3_BASE}/api/sessions/feedback",
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
    if USE_MOCK:
        logger.warning(f"Using MOCK for save_context_question({user_id})")
        return {"success": True}
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(
                f"{E3_BASE}/api/context/question",
                json={"user_id": user_id, **question_data},
            )
            if resp.status_code == 200:
                return resp.json()
            raise Exception(f"E3 returned {resp.status_code}")
    except Exception as e:
        logger.warning(f"E3 unavailable — question not saved: {e}")
        return {"success": True}


async def save_correction(user_id: str, correction_data: dict) -> dict:
    if USE_MOCK:
        logger.warning(f"Using MOCK for save_correction({user_id})")
        return {"success": True}
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(
                f"{E3_BASE}/api/profile/correction",
                json={"user_id": user_id, **correction_data},
            )
            if resp.status_code == 200:
                return resp.json()
            raise Exception(f"E3 returned {resp.status_code}")
    except Exception as e:
        logger.warning(f"E3 unavailable — correction not saved: {e}")
        return {"success": True}


async def save_voice_id(user_id: str, voice_id: str) -> dict:
    if USE_MOCK:
        logger.warning(f"Using MOCK for save_voice_id({user_id})")
        return {"success": True}
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(
                f"{E3_BASE}/api/profile/voice",
                json={"user_id": user_id, "voice_id": voice_id},
            )
            if resp.status_code == 200:
                return resp.json()
            raise Exception(f"E3 returned {resp.status_code}")
    except Exception as e:
        logger.warning(f"E3 unavailable — voice_id not saved: {e}")
        return {"success": True}
