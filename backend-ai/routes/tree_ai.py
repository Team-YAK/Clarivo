"""
POST /api/tree/expand  — AI-powered next option generation
POST /api/tree/select  — Update in-memory path (lightweight)
POST /api/tree/confirm — Persist path to MongoDB via E3
"""

import logging
from pydantic import BaseModel
from typing import List, Optional
from fastapi import APIRouter

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
async def tree_expand(req: ExpandRequest):
    """
    Generate the next set of AI-powered decision tree options.
    
    Input: { user_id, current_path: ["food", "drink"] }
    Output: { quick_option: {label, icon}, options: [{label, icon}, ...] }
    """
    try:
        result = await expand(req.user_id, req.current_path)
        return result
    except Exception as e:
        logger.error(f"tree_expand failed: {e}")
        return {
            "quick_option": {"label": "Help", "icon": "help"},
            "options": [
                {"label": "Help", "icon": "help"},
                {"label": "Try Again", "icon": "redo"},
            ],
        }


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
