import logging
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
from database import db
from pydantic import BaseModel
from utils import path_to_key

logger = logging.getLogger(__name__)
router = APIRouter()

class TreeNode(BaseModel):
    id: str
    key: str
    label: str
    icon: str
    subtitle: Optional[str] = None
    parent_key: Optional[str] = None
    is_leaf: bool
    category: str
    is_custom: bool
    user_id: Optional[str] = None

@router.get("/api/tree/root", response_model=List[TreeNode])
async def get_root_nodes():
    try:
        cursor = db.tree_nodes.find({"parent_key": None})
        nodes = await cursor.to_list(length=100)
        # Rename _id to id for pydantic
        for n in nodes:
            n['id'] = str(n.pop('_id'))
        # Sort alphabetically
        nodes.sort(key=lambda x: x['label'])
        return nodes
    except Exception as e:
        logger.error(f"Error fetching root nodes: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

@router.get("/api/tree/children", response_model=List[TreeNode])
async def get_children(parent_key: str = Query(...), user_id: Optional[str] = Query(None)):
    try:
        # Default nodes
        default_cursor = db.tree_nodes.find({"parent_key": parent_key, "is_custom": False})
        default_nodes = await default_cursor.to_list(length=500)
        for n in default_nodes:
            n['id'] = str(n.pop('_id'))
        default_nodes.sort(key=lambda x: x['label'])

        # Custom nodes for user
        custom_nodes = []
        if user_id:
            custom_cursor = db.tree_nodes.find({"parent_key": parent_key, "is_custom": True, "user_id": user_id})
            custom_nodes = await custom_cursor.to_list(length=500)
            for n in custom_nodes:
                n['id'] = str(n.pop('_id'))
            custom_nodes.sort(key=lambda x: x['label'])

        # Custom nodes appear after default
        return default_nodes + custom_nodes
    except Exception as e:
        logger.error(f"Error fetching children: {e}")
        # Return empty list gracefully per checklist "Invalid parent_key returns empty array"
        return []

@router.get("/api/tree/leaf", response_model=TreeNode)
async def get_leaf(key: str = Query(...), user_id: Optional[str] = Query(None)):
    try:
        query = {"key": key}
        # If it's custom, we verify user_id
        node = await db.tree_nodes.find_one(query)
        if not node:
            raise HTTPException(status_code=404, detail="Node not found")
            
        if node.get("is_custom") and node.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized node access")
            
        node['id'] = str(node.pop('_id'))
        return node
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching leaf node: {e}")
        raise HTTPException(status_code=500, detail="Database failure")
