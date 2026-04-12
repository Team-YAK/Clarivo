from __future__ import annotations

"""
Orchestrator — Pipeline controller for the Decision Tree Intelligence Engine.

Every EXPAND request invokes Crew reasoning; there is no cached bypass.
"""

import time
import logging
from agents.context_agent import fetch_context
from agents.crew_config import run_crew_pipeline

logger = logging.getLogger(__name__)


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
