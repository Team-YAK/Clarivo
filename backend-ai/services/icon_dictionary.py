from __future__ import annotations

import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

ICON_DICTIONARY_PATH = Path(__file__).resolve().parents[2] / "shared" / "emoji-dictionary.json"
PHOSPHOR_MAP_PATH = Path(__file__).resolve().parents[2] / "shared" / "phosphor-map.json"

def _load_json_dict(path: Path, fallback: dict) -> dict[str, str]:
    if not path.exists():
        logger.warning(
            "Dictionary missing at %s; using fallback",
            path,
        )
        return fallback
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            raise ValueError(f"Dictionary at {path} must be a flat JSON object")
        return {str(k): str(v) for k, v in data.items()}
    except Exception as e:
        logger.error(f"Failed to load dictionary from {path}: {e}")
        return fallback


# Loaded once at import/startup; reused across requests.
ICON_DICTIONARY: dict[str, str] = _load_json_dict(
    ICON_DICTIONARY_PATH,
    {
        "warning": "⚠️",
        "help": "🆘",
        "home": "🏠",
        "meds": "💊",
        "smiley": "😊",
        "user": "🧍",
        "more": "➕",
        "settings": "⚙️",
        "back": "🔙",
        "good": "👍",
    }
)

PHOSPHOR_MAP: dict[str, str] = _load_json_dict(
    PHOSPHOR_MAP_PATH,
    {
        "physical": "PersonArmsSpread",
        "emotional": "Smiley",
        "needs": "HandHelping",
        "places": "House",
    }
)

ICON_NAMES: tuple[str, ...] = tuple(ICON_DICTIONARY.keys())
PHOSPHOR_NAMES: tuple[str, ...] = tuple(PHOSPHOR_MAP.keys())
