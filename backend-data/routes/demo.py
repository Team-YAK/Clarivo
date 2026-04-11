import logging
from fastapi import APIRouter, HTTPException
import subprocess
import os

logger = logging.getLogger(__name__)
router = APIRouter()

from services.seed_service import seed

@router.post("/api/demo/seed")
async def seed_demo_data():
    try:
        await seed()
        return {"success": True}
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        raise HTTPException(status_code=500, detail="Seed failed to execute")
