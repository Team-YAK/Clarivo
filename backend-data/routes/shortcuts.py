import logging
from typing import Optional, List, Dict
from fastapi import APIRouter, Query, HTTPException
from database import db

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/api/frequencies")
async def get_frequencies(user_id: str = Query(...)):
    try:
        user = await db.users.find_one({"_id": user_id}, {"path_frequencies": 1})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user.get("path_frequencies", {})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching frequencies: {e}")
        raise HTTPException(status_code=500, detail="Database failure")

@router.get("/api/shortcuts")
async def get_shortcuts(user_id: str = Query(...)):
    try:
        user = await db.users.find_one({"_id": user_id}, {"path_frequencies": 1, "interface_settings": 1})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        settings = user.get("interface_settings", {})
        threshold = settings.get("shortcut_threshold", 5)
        freqs = user.get("path_frequencies", {})
        
        # Sort freqs by descending count
        sorted_freqs = sorted(freqs.items(), key=lambda x: x[1], reverse=True)
        
        # Filter above threshold and cap at 5
        top_keys = [k for k, count in sorted_freqs if count >= threshold][:5]
        
        if not top_keys:
            return []
            
        shortcuts = []
        for key in top_keys:
            # We must resolve the Node or composer label
            if key.startswith("composer→"):
                # Handle composer parsing gracefully
                path_arr = key.replace("composer→", "").split("→")
                shortcuts.append({
                    "path": path_arr,
                    "path_key": key,
                    "label": " + ".join([p.title() for p in path_arr]),
                    "icon": "magic-wand", # Generic icon for composer combos
                    "tap_count": freqs[key],
                    "input_mode": "composer",
                    "is_custom": False
                })
            elif key.startswith("custom→"):
                # Get custom node
                node = await db.tree_nodes.find_one({"_id": key.replace("custom→", "")})
                if node:
                    shortcuts.append({
                        "path": [node["key"]],
                        "path_key": key,
                        "label": node["label"],
                        "icon": node["icon"],
                        "tap_count": freqs[key],
                        "input_mode": "tree",
                        "is_custom": True
                    })
            else:
                # Normal tree
                path_arr = key.split("→")
                leaf_key = path_arr[-1]
                node = await db.tree_nodes.find_one({"key": leaf_key})
                if node:
                    shortcuts.append({
                        "path": path_arr,
                        "path_key": key,
                        "label": node["label"],
                        "icon": node["icon"],
                        "tap_count": freqs[key],
                        "input_mode": "tree",
                        "is_custom": False
                    })
                    
        return shortcuts
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching shortcuts: {e}")
        raise HTTPException(status_code=500, detail="Database failure")

@router.get("/api/frequencies/next_likely")
async def get_next_likely(user_id: str = Query(...), current_sequence: str = Query(...)):
    try:
        user = await db.users.find_one({"_id": user_id}, {"path_frequencies": 1})
        if not user:
            return []
            
        freqs = user.get("path_frequencies", {})
        # Find paths starting with "composer→current_sequence→"
        prefix = f"composer→{current_sequence}→"
        
        candidates = []
        for k, v in freqs.items():
            if k.startswith(prefix):
                # Extract the next icon
                remainder = k[len(prefix):]
                next_icon = remainder.split("→")[0]
                candidates.append({"icon": next_icon, "frequency": v})
                
        candidates.sort(key=lambda x: x["frequency"], reverse=True)
        return candidates[:5]
    except Exception as e:
        logger.error(f"Error predicting next likely: {e}")
        return []
