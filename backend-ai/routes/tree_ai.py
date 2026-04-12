"""
POST /api/tree/expand  — AI-powered next option generation
POST /api/tree/select  — Update in-memory path (lightweight)
POST /api/tree/confirm — Persist path to MongoDB via E3
"""

import logging
import json
import time
from pydantic import BaseModel
from typing import List, Optional
from fastapi import APIRouter, Request

from agents.orchestrator import expand, select, confirm

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request models ───────────────────────────────────────────

class ExpandRequest(BaseModel):
    user_id: str = "alex_demo"
    current_path: List[str] = []


class SelectRequest(BaseModel):
    user_id: str = "alex_demo"
    selected_key: str
    current_path: List[str] = []


class ConfirmRequest(BaseModel):
    user_id: str = "alex_demo"
    path: List[str]
    confidence: float = 0.9


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


@router.post("/api/tree/select")
async def tree_select(req: SelectRequest):
    """
    Add a button to the current path queue (lightweight, no LLM).
    
    Input: { user_id, selected_key: "water", current_path: [...] }
    Output: { path: [..., "water"], ok: true }
    """
    result = select(req.user_id, req.selected_key, req.current_path)
    return result


@router.post("/api/tree/confirm")
async def tree_confirm(req: ConfirmRequest):
    """
    Persist the completed path to MongoDB and increment frequency counters.
    
    Input: { user_id, path: ["food", "drink", "water"], confidence: 0.9 }
    Output: { ok: true, session_id: "...", path_key: "..." }
    """
    try:
        result = await confirm(req.user_id, req.path, req.confidence)
        return result
    except Exception as e:
        logger.error(f"tree_confirm failed: {e}")
        return {"ok": False, "error": str(e)}
