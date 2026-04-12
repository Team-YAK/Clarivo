"""
POST /api/tree/expand  — AI-powered next option generation
"""

import logging
import json
import time
from pydantic import BaseModel
from typing import List
from fastapi import APIRouter, Request

from agents.orchestrator import expand
from config import DEFAULT_USER_ID

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request models ───────────────────────────────────────────

class ExpandRequest(BaseModel):
    user_id: str = DEFAULT_USER_ID
    current_path: List[str] = []


# ── Endpoints ────────────────────────────────────────────────

@router.post("/api/tree/expand")
async def tree_expand(req: ExpandRequest, request: Request):
    """
    Generate the next set of AI-powered decision tree options.
    
    Input: { user_id, current_path: ["food", "drink"] }
    Output: { quick_option: {label, icon}, options: [{label, icon}, ...] }
    """
    started = time.perf_counter()
    server_received_ms = int(time.time() * 1000)
    tap_to_backend_ms = None
    raw_tap = request.headers.get("x-client-tap-ts")
    if raw_tap:
        try:
            tap_to_backend_ms = max(0, server_received_ms - int(raw_tap))
        except Exception:
            tap_to_backend_ms = None

    try:
        result = await expand(req.user_id, req.current_path)
        timings = result.get("_timings", {})
        total_ms = round((time.perf_counter() - started) * 1000, 2)
        log_line = {
            "event": "tree_expand_latency",
            "user_id": req.user_id,
            "path_depth": len(req.current_path),
            "tap_to_backend_ms": tap_to_backend_ms,
            "context_mongo_skim_ms": timings.get("context_mongo_skim_ms", 0.0),
            "personalization_ms": timings.get("personalization_ms", 0.0),
            "generation_first_token_ms": timings.get("generation_first_token_ms", 0.0),
            "icon_resolve_ms": timings.get("icon_resolve_ms", 0.0),
            "manager_ms": timings.get("manager_ms", 0.0),
            "orchestrator_total_ms": timings.get("orchestrator_total_ms", total_ms),
            "request_total_ms": total_ms,
            "cache_hit": timings.get("cache_hit", False),
        }
        logger.info(json.dumps(log_line, separators=(",", ":")))
        if total_ms > 1200:
            logger.warning(
                json.dumps(
                    {"event": "tree_expand_slow_warning", "request_total_ms": total_ms},
                    separators=(",", ":"),
                )
            )
        return result
    except Exception as e:
        logger.error(f"tree_expand failed: {e}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="Options generation failed")
