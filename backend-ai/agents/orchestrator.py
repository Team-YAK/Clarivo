from __future__ import annotations

"""
Orchestrator — Pipeline controller for the Decision Tree Intelligence Engine.

Coordinates agents in sequence:
  EXPAND:  Context Agent → Crew reasoning pipeline → return
  SELECT:  Update in-memory path (no LLM)
  CONFIRM: Memory Agent writes to E3

Every EXPAND request invokes Crew reasoning; there is no cached bypass.
"""

import time
import logging
from agents.context_agent import fetch_context
from agents.crew_config import run_crew_pipeline
from agents.memory_agent import persist_path

logger = logging.getLogger(__name__)

# ── In-memory session paths ─────────────────────────────────
# Key: user_id → list[str]
_session_paths: dict[str, list[str]] = {}


# ── EXPAND ───────────────────────────────────────────────────

async def expand(user_id: str, current_path: list[str]) -> dict:
    """
    Full pipeline: Context → Prediction → Ranking.
    Returns: { quick_option: {...}, options: [...] }
    """
    start_perf = time.perf_counter()

    # 2. Context Agent
    context = await fetch_context(user_id, current_path)
    context_metrics = context.pop("_metrics", {})

    # 3. CrewAI Pipeline (Concurrent Context/Personalization -> Generation -> Manager)
    result = await run_crew_pipeline(current_path, context)
    crew_metrics = result.pop("_timings", {})

    elapsed = (time.perf_counter() - start_perf) * 1000
    result["_timings"] = {
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
    Persist path via Memory Agent.
    """
    result = await persist_path(user_id, path, confidence)

    # Clear session path
    _session_paths.pop(user_id, None)

    logger.info(f"Orchestrator: CONFIRM — path {path} persisted")
    return result


# ── Session state accessor ───────────────────────────────────

def get_session_path(user_id: str) -> list[str]:
    """Get the current in-memory path for a user."""
    return _session_paths.get(user_id, [])
