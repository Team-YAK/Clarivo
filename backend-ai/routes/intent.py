"""POST /api/intent — SSE streaming sentence generation."""

import json
import uuid
import asyncio
import logging
from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse
from services.data_client import get_user
from services.context import build_context_string
from services.openai_client import stream_intent, compute_confidence

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory pending sessions (shared with confirm route)
pending_sessions: dict[str, dict] = {}


@router.post("/api/intent")
async def intent(request: Request):
    body = await request.json()
    path = body.get("path", [])
    user_id = body.get("user_id", "alex_demo")

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
