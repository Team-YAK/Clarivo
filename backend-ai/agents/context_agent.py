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
import httpx

logger = logging.getLogger(__name__)

E3_BASE = os.getenv("E3_BASE_URL", "http://localhost:8002")


def _flatten_concepts(paths: list[list[str]], limit: int = 24) -> list[str]:
    seen = set()
    concepts: list[str] = []
    for path in paths:
        for item in path:
            token = str(item).strip()
            if token and token not in seen:
                seen.add(token)
                concepts.append(token)
            if len(concepts) >= limit:
                return concepts
    return concepts


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

    recent_concepts = _flatten_concepts(recent_paths)
    historical_concepts = _flatten_concepts(
        [str(item.get("key", "")).split("→") for item in top_paths if item.get("key")]
    )

    total_ms = (time.perf_counter() - start) * 1000

    return {
        "user_id": user_id,
        "current_path": current_path,
        "conversation_utterances": conversation_utterances,
        "recent_paths": recent_paths,
        "top_paths": top_paths,
        "recent_concepts": recent_concepts,
        "historical_concepts": historical_concepts,
        "preferences": known,
        "always_know": always,
        # Pass glossary rules and routine directly from MongoDB skim
        "glossary_rules": skim.get("glossary_rules", []),
        "routine": skim.get("routine", {}),
        "_metrics": {
            "context_mongo_skim_ms": round(skim_ms, 2),
            "context_total_ms": round(total_ms, 2),
        },
    }
