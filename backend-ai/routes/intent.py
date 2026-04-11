"""POST /api/intent — SSE streaming sentence generation."""

import json
import uuid
import asyncio
import logging
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Request, HTTPException
from sse_starlette.sse import EventSourceResponse
from services.data_service import get_user
from services.context_service import build_context_string
from services.openai_service import stream_intent, compute_confidence

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory pending sessions (shared with confirm route)
pending_sessions: dict[str, dict] = {}


class IntentRequest(BaseModel):
    path: Optional[List[str]] = None
    user_id: str = "yuki_demo"


@router.post("/api/intent")
async def intent(req: IntentRequest):
    if not req.path or len(req.path) == 0:
        raise HTTPException(status_code=400, detail="Path cannot be empty or null")

    path = req.path
    user_id = req.user_id

    user_data = await get_user(user_id)
    context = build_context_string(user_data)
    session_id = f"s_{uuid.uuid4().hex[:8]}"

    async def event_generator():
        full_sentence = ""
        try:
            async for token in stream_intent(path, context):
                full_sentence += token
                yield {"data": json.dumps({"token": token})}

            # Compute confidence after stream completes
            confidence = await compute_confidence(full_sentence, path, context)

            # Store in pending sessions for confirm route
            pending_sessions[session_id] = {
                "session_id": session_id,
                "user_id": user_id,
                "path": path,
                "sentence": full_sentence,
                "confidence": confidence,
            }

            # Schedule cleanup after 5 minutes
            async def cleanup():
                await asyncio.sleep(300)
                pending_sessions.pop(session_id, None)

            asyncio.create_task(cleanup())

            yield {
                "data": json.dumps(
                    {
                        "done": True,
                        "session_id": session_id,
                        "full_sentence": full_sentence,
                        "confidence": confidence,
                    }
                )
            }
        except Exception as e:
            logger.error(f"Intent streaming error: {e}")
            yield {"data": json.dumps({"error": str(e)})}

    return EventSourceResponse(event_generator())
