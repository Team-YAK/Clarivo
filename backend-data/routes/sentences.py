import logging
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException
from database import db
from pydantic import BaseModel
from utils import path_to_key

logger = logging.getLogger(__name__)
router = APIRouter()

class CacheSentenceRequest(BaseModel):
    user_id: str
    path_key: str
    sentence: str
    confidence: float
    audio_url: Optional[str] = None
    personalized: bool = False
    input_mode: str = "tree"

@router.post("/api/sentences/cache")
async def cache_sentence(req: CacheSentenceRequest):
    try:
        doc_id = f"{req.user_id}_{req.path_key}"
        doc = req.model_dump()
        doc["_id"] = doc_id
        doc["last_updated"] = datetime.utcnow().isoformat()
        
        await db.sentences.replace_one({"_id": doc_id}, doc, upsert=True)
        return {"success": True}
    except Exception as e:
        logger.error(f"Error caching sentence: {e}")
        raise HTTPException(status_code=500, detail="Database insertion failed")

@router.get("/api/sentences/cached")
async def get_cached_sentence(user_id: str = Query(...), path_key: str = Query(...)):
    try:
        doc_id = f"{user_id}_{path_key}"
        doc = await db.sentences.find_one({"_id": doc_id})
        if not doc:
            return None
        doc["id"] = str(doc.pop("_id"))
        return doc
    except Exception as e:
        logger.error(f"Error fetching cached sentence: {e}")
        # Always return None on error to not block application
        return None

@router.post("/api/sentences/invalidate")
async def invalidate_cache(user_id: str = Query(...), path_key: str = Query(...)):
    try:
        doc_id = f"{user_id}_{path_key}"
        await db.sentences.delete_one({"_id": doc_id})
        return {"success": True}
    except Exception as e:
        logger.error(f"Error invalidating cache: {e}")
        raise HTTPException(status_code=500, detail="Database deletion failed")

@router.post("/api/sentences/invalidate_all")
async def invalidate_all(user_id: str = Query(...)):
    try:
        result = await db.sentences.delete_many({"user_id": user_id})
        return {"success": True, "deleted_count": result.deleted_count}
    except Exception as e:
        logger.error(f"Error invalidating all chunks: {e}")
        raise HTTPException(status_code=500, detail="Database failure")

@router.post("/api/sentences/prepopulate")
async def prepopulate_trigger(user_id: str = Query(...)):
    # The E2 backend triggers this to mark all leaf nodes.
    # For now, simply mock a "started" logic.
    return {"success": True, "status": "started"}

@router.get("/api/sentences/prepopulate_status")
async def prepopulate_status(user_id: str = Query(...)):
    # Mock status 
    return {"percent_complete": 100, "status": "done"}
