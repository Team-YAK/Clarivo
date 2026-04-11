import logging
from fastapi import APIRouter, HTTPException
import subprocess
import os

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/api/demo/seed")
async def seed_demo_data():
    try:
        # Run the seed script as internal subprocess
        script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "seed_demo.py")
        subprocess.run(["python3", script_path], check=True)
        return {"success": True}
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        raise HTTPException(status_code=500, detail="Seed script failed to execute")
