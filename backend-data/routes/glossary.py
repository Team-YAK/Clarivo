"""
Glossary rules — stored per-user in the users collection under `glossary_rules`.
These rules are fetched by backend-ai and injected into the LLM system prompt
so that they deterministically affect every sentence generation.
"""

import uuid
import logging
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException
from database import db
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class GlossaryRuleAdd(BaseModel):
    user_id: str
    trigger_word: str
    enforced_meaning: str


class GlossaryRuleToggle(BaseModel):
    user_id: str
    rule_id: str
    active: bool


@router.get("/api/glossary")
async def get_glossary_rules(user_id: str = Query(...)):
    """Return all glossary rules for a user."""
    try:
        user = await db.users.find_one({"_id": user_id}, {"glossary_rules": 1})
        if not user:
            return {"rules": []}
        return {"rules": user.get("glossary_rules", [])}
    except Exception as e:
        logger.error(f"Error fetching glossary rules: {e}")
        raise HTTPException(status_code=500, detail="Database failure")


@router.post("/api/glossary")
async def add_glossary_rule(req: GlossaryRuleAdd):
    """Add a new glossary rule for a user."""
    try:
        rule = {
            "id": f"gr_{uuid.uuid4().hex[:8]}",
            "trigger_word": req.trigger_word.strip(),
            "enforced_meaning": req.enforced_meaning.strip(),
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
        }
        await db.users.update_one(
            {"_id": req.user_id},
            {"$push": {"glossary_rules": {"$each": [rule], "$slice": -50}}}
        )
        return {"success": True, "rule": rule}
    except Exception as e:
        logger.error(f"Error adding glossary rule: {e}")
        raise HTTPException(status_code=500, detail="Database failure")


@router.delete("/api/glossary/{rule_id}")
async def delete_glossary_rule(rule_id: str, user_id: str = Query(...)):
    """Delete a glossary rule by id."""
    try:
        await db.users.update_one(
            {"_id": user_id},
            {"$pull": {"glossary_rules": {"id": rule_id}}}
        )
        return {"success": True}
    except Exception as e:
        logger.error(f"Error deleting glossary rule: {e}")
        raise HTTPException(status_code=500, detail="Database failure")


@router.patch("/api/glossary/{rule_id}/toggle")
async def toggle_glossary_rule(rule_id: str, req: GlossaryRuleToggle):
    """Toggle a glossary rule active/inactive."""
    try:
        await db.users.update_one(
            {"_id": req.user_id, "glossary_rules.id": rule_id},
            {"$set": {"glossary_rules.$.active": req.active}}
        )
        return {"success": True}
    except Exception as e:
        logger.error(f"Error toggling glossary rule: {e}")
        raise HTTPException(status_code=500, detail="Database failure")
