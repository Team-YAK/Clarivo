from __future__ import annotations

import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

ICON_DICTIONARY_PATH = Path(__file__).resolve().parents[2] / "shared" / "emoji-dictionary.json"

def _load_dictionary() -> dict[str, str]:
    if not ICON_DICTIONARY_PATH.exists():
        logger.warning(
            "emoji dictionary missing at %s; using minimal built-in fallback",
            ICON_DICTIONARY_PATH,
        )
        return {
            "warning": "⚠️",
            "toilet": "🚽",
            "food": "🍽️",
            "pill": "💊",
            "smiley": "😊",
            "user": "🧍",
            "more": "➕",
        }
    with ICON_DICTIONARY_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError("icon dictionary must be a flat JSON object")
    return {str(k): str(v) for k, v in data.items()}


# Loaded once at import/startup; reused across requests.
ICON_DICTIONARY: dict[str, str] = _load_dictionary()
ICON_NAMES: tuple[str, ...] = tuple(ICON_DICTIONARY.keys())
