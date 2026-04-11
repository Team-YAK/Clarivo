import logging
import uuid
import re
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
from database import db
from pydantic import BaseModel
from utils import path_to_key

logger = logging.getLogger(__name__)
router = APIRouter()

class CustomButtonAdd(BaseModel):
    user_id: str
    label: str
    icon: str
    category: str
    parent_key: Optional[str] = None

class CustomButtonResponse(BaseModel):
    id: str
    key: str
    label: str
    icon: str
    category: str
    parent_key: Optional[str]

@router.post("/api/buttons/add")
async def add_button(req: CustomButtonAdd):
    if not req.user_id or not req.label:
        raise HTTPException(status_code=422, detail="user_id and label are required")
        
    try:
        # Create unique key slug
        slug = re.sub(r'[^a-z0-9_]', '', req.label.lower().replace(' ', '_'))
        unique_key = f"custom_{req.user_id.split('_')[0]}_{slug}"
        
        doc = {
            "_id": unique_key, # Force same ID as key
            "key": unique_key,
            "label": req.label,
            "icon": req.icon,
            "subtitle": "Custom Button",
            "parent_key": req.parent_key,
            "is_leaf": True,
            "category": req.category,
            "is_custom": True,
            "user_id": req.user_id
        }
        
        await db.tree_nodes.insert_one(doc)
        
        # Optionally we don't automatically add path frequencies until it's actually tapped,
        # but the checklist states: "New button appears immediately in shortcut candidates after being tapped enough times"
        
        return {"success": True, "key": unique_key}
    except Exception as e:
        logger.error(f"Error adding custom button: {e}")
        raise HTTPException(status_code=500, detail="Database insertion failed")

@router.get("/api/buttons/custom", response_model=List[CustomButtonResponse])
async def get_custom_buttons(user_id: str = Query(...)):
    if not user_id:
        raise HTTPException(status_code=422, detail="Missing user_id")
    try:
        cursor = db.tree_nodes.find({"user_id": user_id, "is_custom": True})
        nodes = await cursor.to_list(length=500)
        for n in nodes:
            n['id'] = str(n.pop('_id'))
        return nodes
    except Exception as e:
        logger.error(f"Error fetching custom buttons: {e}")
        raise HTTPException(status_code=500, detail="Database reading failed")

@router.delete("/api/buttons/custom/{button_id}")
async def delete_custom_button(button_id: str, user_id: str = Query(...)):
    if not user_id:
        raise HTTPException(status_code=422, detail="Missing user_id")
        
    try:
        # Verify ownership
        node = await db.tree_nodes.find_one({"_id": button_id})
        if not node or node.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
            
        await db.tree_nodes.delete_one({"_id": button_id})
        
        # Deleting a custom button also removes its path frequency entry
        p_key = path_to_key([button_id], mode="custom") # Assuming key structure
        query_key = f"path_frequencies.{p_key}"
        await db.users.update_one(
            {"_id": user_id},
            {"$unset": {query_key: ""}}
        )
        
        # Deleting a custom button also removes its cached sentence
        cache_id = f"{user_id}_{p_key}"
        await db.sentences.delete_one({"_id": cache_id})
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting button: {e}")
        raise HTTPException(status_code=500, detail="Database failure")
