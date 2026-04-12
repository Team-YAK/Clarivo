"""
Context Agent — Fetches and assembles all user context for the prediction pipeline.

Pure Python (no LLM call). Responsible for:
- Fetching user profile + preferences from E3
- Fetching path frequency data
- Fetching recent sessions (last 24h)
- Computing time-of-day context
- Assembling a structured context dict for downstream agents
"""

import os
import logging
from datetime import datetime
import httpx

from services.data_service import get_user, get_sessions_last_24h

logger = logging.getLogger(__name__)

E3_BASE = os.getenv("E3_BASE_URL", "http://localhost:8002")


async def fetch_context(user_id: str, current_path: list[str]) -> dict:
    """
    Gather all relevant context for option generation.
    Returns a structured dict consumed by prediction + ranking agents.
    Target: <200ms (parallel HTTP calls to localhost).
    """
    import asyncio

    # ── Parallel fetch helpers ──
    async def _fetch_user():
        try:
            return await get_user(user_id)
        except Exception as e:
            logger.warning(f"Context: user fetch failed: {e}")
            return {}

    async def _fetch_frequencies():
        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                resp = await client.get(
                    f"{E3_BASE}/api/frequencies",
                    params={"user_id": user_id},
                )
                if resp.status_code == 200:
                    return resp.json()
            return {}
        except Exception as e:
            logger.warning(f"Context: frequency fetch failed: {e}")
            return {}

    async def _fetch_sessions():
        try:
            return await get_sessions_last_24h(user_id)
        except Exception as e:
            logger.warning(f"Context: sessions fetch failed: {e}")
            return []

    # Run all three in parallel
    user_data, frequencies, recent_sessions = await asyncio.gather(
        _fetch_user(),
        _fetch_frequencies(),
        _fetch_sessions(),
    )

    # Compute time context
    hour = datetime.now().hour
    if hour < 11:
        time_context = "morning"
    elif hour < 17:
        time_context = "afternoon"
    else:
        time_context = "evening"

    # Extract recent paths (last 10 unique)
    recent_paths = []
    seen = set()
    for s in recent_sessions:
        path_key = "→".join(s.get("path", []))
        if path_key and path_key not in seen:
            recent_paths.append(s.get("path", []))
            seen.add(path_key)
        if len(recent_paths) >= 10:
            break

    # Extract top paths (top 10 by frequency)
    # Sanitize: filter out corrupted entries (non-int values)
    clean_freqs = {k: v for k, v in frequencies.items() if isinstance(v, (int, float))}
    sorted_freqs = sorted(clean_freqs.items(), key=lambda x: x[1], reverse=True)
    top_paths = [{"key": k, "count": v} for k, v in sorted_freqs[:10]]

    # Extract user preferences
    prefs = user_data.get("preferences", {})
    known_prefs = prefs.get("known_preferences", "")
    always_know = prefs.get("always_know", "")

    # Extract correction history (maps path -> corrected intent)
    corrections = user_data.get("correction_history", [])
    correction_map = {}
    for c in corrections[-10:]:
        path_str = c.get("path", "")
        corrected = c.get("corrected") or c.get("corrected_sentence", "")
        if path_str and corrected:
            correction_map[path_str] = corrected

    return {
        "user_id": user_id,
        "current_path": current_path,
        "time_context": time_context,
        "recent_paths": recent_paths,
        "top_paths": top_paths,
        "frequencies": frequencies,
        "preferences": known_prefs,
        "always_know": always_know,
        "corrections": correction_map,
        "profile_name": user_data.get("profile", {}).get("name", "Patient"),
    }
