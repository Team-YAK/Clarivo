"""POST /api/intent — SSE streaming sentence generation."""

import os
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


import httpx
from services.utils import path_to_key

class IntentRequest(BaseModel):
    path: Optional[List[str]] = None
    user_id: str = "yuki_demo"
    input_mode: str = "tree"

@router.post("/api/intent")
async def intent(req: IntentRequest):
    if not req.path or len(req.path) == 0:
        raise HTTPException(status_code=400, detail="Path cannot be empty or null")

    path = req.path
    user_id = req.user_id
    input_mode = req.input_mode
    path_key = path_to_key(path, input_mode)

    E3_BASE = os.getenv("E3_BASE_URL", "http://localhost:8002")

    async def _fetch_conversation():
        try:
            async with httpx.AsyncClient(timeout=1.0) as client:
                resp = await client.get(
                    f"{E3_BASE}/api/conversations/active",
                    params={"user_id": user_id},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data if isinstance(data, dict) else None
        except Exception:
            pass
        return None

    import asyncio
    user_data, active_conv = await asyncio.gather(
        get_user(user_id),
        _fetch_conversation(),
    )
    context = build_context_string(user_data, conversation=active_conv)
    session_id = f"s_{uuid.uuid4().hex[:8]}"

    async def event_generator():
        full_sentence = ""
        try:
            # 1. Check E3 Cache First
            try:
                # Mock E3 caching fetch. Note: httpx uses E3_BASE_URL internally. 
                # For direct routing in this environment we assume:
                e3_url = os.getenv("E3_BASE_URL", "http://localhost:8002")
                async with httpx.AsyncClient(timeout=1.0) as client:
                    resp = await client.get(f"{e3_url}/api/sentences/cached", params={"user_id": user_id, "path_key": path_key})
                    if resp.status_code == 200:
                        data = resp.json()
                        if data and data.get("sentence"):
                            # CACHE HIT
                            sentence = data["sentence"]
                            yield {"data": json.dumps({"token": sentence})} # Dump everything natively
                            confidence = data.get("confidence", 0.95)
                            pending_sessions[session_id] = {
                                "session_id": session_id, "user_id": user_id, "path": path, "path_key": path_key,
                                "sentence": sentence, "confidence": confidence, "input_mode": input_mode
                            }
                            yield {"data": json.dumps({
                                "done": True, "session_id": session_id,
                                "full_sentence": sentence, "confidence": confidence
                            })}
                            return # Exit generator cleanly!
            except Exception as e:
                logger.warning(f"Failed cache check: {e}")

            # 2. CACHE MISS. Proceed with OpenAI.
            async for token in stream_intent(path, context, input_mode=input_mode):
                full_sentence += token
                yield {"data": json.dumps({"token": token})}

            # Compute confidence after stream completes
            confidence = await compute_confidence(full_sentence, path, context)

            # Store in pending sessions for confirm route
            pending_sessions[session_id] = {
                "session_id": session_id,
                "user_id": user_id,
                "path": path,
                "path_key": path_key,
                "sentence": full_sentence,
                "confidence": confidence,
                "input_mode": input_mode
            }

            # 3. Write cache asyncly
            async def cache_push():
                try:
                    e3_url = os.getenv("E3_BASE_URL", "http://localhost:8002")
                    async with httpx.AsyncClient(timeout=2.0) as client:
                        await client.post(f"{e3_url}/api/sentences/cache", json={
                            "user_id": user_id, "path_key": path_key, "sentence": full_sentence,
                            "confidence": confidence, "input_mode": input_mode, "personalized": True
                        })
                except Exception: pass
            asyncio.create_task(cache_push())

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
