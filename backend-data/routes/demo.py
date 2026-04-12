import logging
import os
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from database import db

logger = logging.getLogger(__name__)
router = APIRouter()

from services.seed_service import seed

ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "clarivo-admin-2024")

COLLECTIONS_TO_PURGE = [
    "users", "sessions", "sentences", "context_log",
    "conversations", "prompts", "icons",
]

@router.post("/api/demo/seed")
async def seed_demo_data():
    try:
        await seed()
        return {"success": True}
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        raise HTTPException(status_code=500, detail="Seed failed to execute")


@router.post("/api/admin/purge-and-reseed")
async def purge_and_reseed(x_admin_token: Optional[str] = Header(None)):
    """Purge all collections and reseed with fresh alex_demo data.
    Requires X-Admin-Token header matching ADMIN_TOKEN env var.
    """
    if x_admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    try:
        deleted = {}
        for name in COLLECTIONS_TO_PURGE:
            collection = getattr(db, name, None)
            if collection is None:
                continue
            count = await collection.count_documents({})
            await collection.delete_many({})
            deleted[name] = count

        await seed()
        logger.info(f"Purge+reseed complete. Deleted: {deleted}")
        return {"success": True, "deleted": deleted, "reseeded": True}
    except Exception as e:
        logger.error(f"Purge+reseed failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/api/demo/start-exercise-demo")
async def start_exercise_demo():
    """Sets up the specific conversation state for the Exercise Demo."""
    user_id = "alex_demo"
    from datetime import datetime
    
    try:
        # 1. Close any active conversations
        await db.conversations.update_many(
            {"user_id": user_id, "active": True},
            {"$set": {"active": False}}
        )
        
        # 2. Create the specific starting question from Yuki
        new_conv = {
            "user_id": user_id,
            "active": True,
            "started_at": datetime.utcnow().isoformat(),
            "utterances": [
                {
                    "speaker": "caregiver",
                    "text": "What exercise do you want to do?",
                    "timestamp": datetime.utcnow().isoformat()
                }
            ]
        }
        await db.conversations.insert_one(new_conv)
        return {"success": True, "message": "Demo conversation initialized."}
    except Exception as e:
        logger.error(f"Failed to start exercise demo state: {e}")
        raise HTTPException(status_code=500, detail=str(e))
