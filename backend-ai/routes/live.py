"""GET /api/live — Current patient session state for caregiver polling."""

import logging
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/live")
async def get_live_state():
    """
    Returns the current in-progress state from the pending_sessions dict.
    The caregiver panel polls this every 2-3s to show a live breadcrumb
    and streaming sentence while the patient is navigating.
    """
    from routes.intent import pending_sessions

    # Find the most recent non-confirmed session (last one written)
    if not pending_sessions:
        return {
            "mode": "Idle",
            "breadcrumb": [],
            "streamingSentence": "",
            "session_id": None,
        }

    # Sessions are keyed by session_id; pick the most recently added
    # (dicts preserve insertion order in Python 3.7+)
    last_session_id = list(pending_sessions.keys())[-1]
    session = pending_sessions[last_session_id]

    path = session.get("path", [])
    input_mode = session.get("input_mode", "tree")
    sentence = session.get("sentence", "")

    # Derive a display mode
    if input_mode == "composer":
        mode = "Composer"
    elif sentence:
        mode = "Playback"
    else:
        mode = "Tree"

    return {
        "mode": mode,
        "breadcrumb": path,
        "streamingSentence": sentence,
        "session_id": last_session_id,
    }
