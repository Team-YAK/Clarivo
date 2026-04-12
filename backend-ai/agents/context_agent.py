"""
Context Agent — Lightweight context skim for tree expansion.

Priority:
1. Active conversation utterances (Mongo)
2. Current decision-tree path
3. Past path habits + preferences (lighter weight)
"""

from __future__ import annotations

import os
import logging
import time
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)

E3_BASE = os.getenv("E3_BASE_URL", "http://localhost:8002")


async def fetch_context(user_id: str, current_path: list[str]) -> dict:
    start = time.perf_counter()
    skim_ms = 0.0
    skim = {}

    try:
        skim_start = time.perf_counter()
        async with httpx.AsyncClient(timeout=1.5) as client:
            resp = await client.get(
                f"{E3_BASE}/api/context/tree_skim",
                params={"user_id": user_id},
            )
            if resp.status_code == 200:
                skim = resp.json() or {}
        skim_ms = (time.perf_counter() - skim_start) * 1000
    except Exception as e:
        logger.warning(f"Context skim fetch failed: {e}")

    utterances = skim.get("conversation_utterances", [])[-5:]
    conversation_utterances = []
    for u in utterances:
        if isinstance(u, dict):
            text = (u.get("text") or "").strip()
            if text:
                speaker = u.get("speaker", "Unknown")
                conversation_utterances.append(f"{speaker}: '{text}'")

    recent_paths = skim.get("recent_paths", [])
    top_paths = skim.get("top_paths", [])

    prefs = skim.get("preferences", {}) or {}
    known = prefs.get("known_preferences", "")
    always = prefs.get("always_know", "")

    hour = datetime.now().hour
    if hour < 11:
        time_context = "morning"
    elif hour < 17:
        time_context = "afternoon"
    else:
        time_context = "evening"

    total_ms = (time.perf_counter() - start) * 1000

    return {
        "user_id": user_id,
        "current_path": current_path,
        "time_context": time_context,
        "conversation_utterances": conversation_utterances,
        "recent_paths": recent_paths,
        "top_paths": top_paths,
        "preferences": known,
        "always_know": always,
        "_metrics": {
            "context_mongo_skim_ms": round(skim_ms, 2),
            "context_total_ms": round(total_ms, 2),
        },
    }
