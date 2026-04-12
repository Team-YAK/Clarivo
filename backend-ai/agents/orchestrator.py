from __future__ import annotations

"""
Orchestrator — Pipeline controller for the Decision Tree Intelligence Engine.

Coordinates agents in sequence:
  EXPAND:  Context Agent → Prediction Agent → Ranking Agent → return
  SELECT:  Update in-memory path (no LLM)
  CONFIRM: Memory Agent writes to E3

Implements:
- In-memory response cache (5-min TTL per user_id + path_key)
- In-memory session path state
"""

import time
import logging
import copy
from datetime import datetime
from agents.context_agent import fetch_context
from agents.crew_config import run_crew_pipeline
from agents.memory_agent import persist_path

logger = logging.getLogger(__name__)

# ── In-memory cache ──────────────────────────────────────────
# Key: f"{user_id}:{time_slot}:{path_key}" → { "result": {...}, "timestamp": float }
_cache: dict[str, dict] = {}
CACHE_TTL = 60  # 1 minute — keeps options fresh as conversations progress

# ── In-memory session paths ─────────────────────────────────
# Key: user_id → list[str]
_session_paths: dict[str, list[str]] = {}


def _time_slot() -> str:
    """Returns 'morning' | 'afternoon' | 'evening' — cache varies per slot."""
    hour = datetime.now().hour
    if hour < 11:
        return "morning"
    elif hour < 17:
        return "afternoon"
    return "evening"


def _cache_key(user_id: str, path: list[str]) -> str:
    slot = _time_slot()
    return f"{user_id}:{slot}:{'→'.join(path) if path else 'root'}"


def _get_cached(key: str) -> dict | None:
    entry = _cache.get(key)
    if entry and (time.time() - entry["timestamp"]) < CACHE_TTL:
        logger.info(f"Orchestrator: cache HIT for {key}")
        return entry["result"]
    if entry:
        del _cache[key]  # Expired
    return None


def _set_cache(key: str, result: dict):
    # Keep cache payload clean (no per-request timing metadata).
    payload = copy.deepcopy(result)
    payload.pop("_timings", None)
    _cache[key] = {"result": payload, "timestamp": time.time()}
    # Evict old entries if cache grows too large
    if len(_cache) > 500:
        oldest = min(_cache, key=lambda k: _cache[k]["timestamp"])
        del _cache[oldest]


def _invalidate_cache_for_user(user_id: str):
    """Remove all cache entries for a user (called on CONFIRM)."""
    keys_to_remove = [k for k in _cache if k.startswith(f"{user_id}:")]
    for k in keys_to_remove:
        del _cache[k]


# ── EXPAND ───────────────────────────────────────────────────

async def expand(user_id: str, current_path: list[str]) -> dict:
    """
    Full pipeline: Context → Prediction → Ranking.
    Returns: { quick_option: {...}, options: [...] }
    """
    start_perf = time.perf_counter()

    # 1. Check cache
    ck = _cache_key(user_id, current_path)
    cached = _get_cached(ck)
    if cached:
        elapsed = (time.perf_counter() - start_perf) * 1000
        result = copy.deepcopy(cached)
        result["_timings"] = {
            "cache_hit": True,
            "context_mongo_skim_ms": 0.0,
            "personalization_ms": 0.0,
            "generation_first_token_ms": 0.0,
            "icon_resolve_ms": 0.0,
            "manager_ms": 0.0,
            "orchestrator_total_ms": round(elapsed, 2),
        }
        return result

    # 2. Context Agent
    context = await fetch_context(user_id, current_path)
    context_metrics = context.pop("_metrics", {})

    # 3. CrewAI Pipeline (Concurrent Context/Personalization -> Generation -> Manager)
    result = await run_crew_pipeline(current_path, context)
    crew_metrics = result.pop("_timings", {})

    # 4. Cache the result
    _set_cache(ck, result)

    elapsed = (time.perf_counter() - start_perf) * 1000
    result["_timings"] = {
        "cache_hit": False,
        "context_mongo_skim_ms": context_metrics.get("context_mongo_skim_ms", 0.0),
        "context_total_ms": context_metrics.get("context_total_ms", 0.0),
        "personalization_ms": crew_metrics.get("personalization_ms", 0.0),
        "generation_first_token_ms": crew_metrics.get("generation_first_token_ms", 0.0),
        "icon_resolve_ms": crew_metrics.get("icon_resolve_ms", 0.0),
        "manager_ms": crew_metrics.get("manager_ms", 0.0),
        "orchestrator_total_ms": round(elapsed, 2),
    }

    return result


# ── SELECT ───────────────────────────────────────────────────

def select(user_id: str, selected_key: str, current_path: list[str]) -> dict:
    """
    Update in-memory path state. No LLM call.
    """
    new_path = current_path + [selected_key]
    _session_paths[user_id] = new_path
    logger.info(f"Orchestrator: SELECT — path now {new_path}")
    return {"path": new_path, "ok": True}


# ── CONFIRM ──────────────────────────────────────────────────

async def confirm(user_id: str, path: list[str], confidence: float = 0.9) -> dict:
    """
    Persist path via Memory Agent and invalidate cache.
    """
    # Invalidate cache so next EXPAND reflects new frequency data
    _invalidate_cache_for_user(user_id)

    result = await persist_path(user_id, path, confidence)

    # Clear session path
    _session_paths.pop(user_id, None)

    logger.info(f"Orchestrator: CONFIRM — path {path} persisted")
    return result


# ── Session state accessor ───────────────────────────────────

def get_session_path(user_id: str) -> list[str]:
    """Get the current in-memory path for a user."""
    return _session_paths.get(user_id, [])
