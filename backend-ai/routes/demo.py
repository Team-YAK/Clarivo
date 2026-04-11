"""POST /api/demo/seed — Demo mode trigger (passthrough to E3)."""

import os
import logging
import httpx
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter()

E3_BASE = os.getenv("E3_BASE_URL", "http://localhost:8002")


@router.post("/api/demo/seed")
async def demo_seed():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{E3_BASE}/api/demo/seed")
            if resp.status_code == 200:
                return resp.json()
            return {"success": False, "error": f"E3 returned {resp.status_code}"}
    except Exception as e:
        logger.warning(f"E3 unavailable for demo seed: {e}")
        return {"success": False, "error": "E3 unavailable"}
