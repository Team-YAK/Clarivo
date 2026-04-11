import logging
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
from database import db
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

class IconModel(BaseModel):
    id: str
    key: str
    icon_name: str
    label: str
    category: str
    tags: List[str]

@router.get("/api/icons", response_model=List[IconModel])
async def get_icons(category: Optional[str] = Query(None)):
    try:
        query = {"category": category} if category else {}
        cursor = db.icons.find(query)
        icons_docs = await cursor.to_list(length=1000)
        for i in icons_docs:
            i['id'] = str(i.pop('_id'))
        return icons_docs
    except Exception as e:
        logger.error(f"Error fetching icons: {e}")
        raise HTTPException(status_code=500, detail="Database failure")

@router.get("/api/icons/search", response_model=List[IconModel])
async def search_icons(q: str = Query(...)):
    try:
        if not q or len(q.strip()) == 0:
            return []
            
        # MongoDB query matching tags matching regex
        import re
        pattern = re.compile(f".*{re.escape(q)}.*", re.IGNORECASE)
        query = {"$or": [{"label": pattern}, {"tags": pattern}, {"key": pattern}]}
        
        cursor = db.icons.find(query)
        matches = await cursor.to_list(length=100)
        for m in matches:
            m['id'] = str(m.pop('_id'))
            
        return matches
    except Exception as e:
        logger.error(f"Error searching icons: {e}")
        raise HTTPException(status_code=500, detail="Database failure")
