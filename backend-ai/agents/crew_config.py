"""
CrewAI-style multi-agent pipeline using native LangChain (Python 3.9 compatible).

Pipeline flow:
  Phase 1 (parallel): Context Agent + Personalization Agent
  Phase 2 (sequential): Generation Agent (produces options)
  Phase 3 (parallel): Icon Agent + Manager Agent
  Final: merge icon assignments into validated options

For root path ([]), returns deterministic core-need cards instantly.
"""

import json
import logging
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()
if os.getenv("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from agents.icon_keys import ICON_KEYS_PROMPT, VALID_ICON_KEYS

logger = logging.getLogger(__name__)

llm = ChatOpenAI(
    model_name="gpt-4o-mini",
    temperature=0.4,
    api_key=os.getenv("OPENAI_API_KEY")
)

# ── Deterministic root options (home screen) ────────────────────
# These are the 6 core daily needs for an aphasia patient,
# ordered by urgency. No AI call needed.
ROOT_OPTIONS = {
    "quick_option": {"label": "Pain", "icon": "pain"},
    "options": [
        {"label": "Pain",      "icon": "pain"},
        {"label": "Bathroom",  "icon": "toilet"},
        {"label": "Food",      "icon": "food"},
        {"label": "Medicine",  "icon": "medicine"},
        {"label": "Feelings",  "icon": "emotional"},
        {"label": "Family",    "icon": "family"},
    ]
}


# ── Agent functions ─────────────────────────────────────────────

async def context_agent(raw_db_logs: str) -> str:
    sys_msg = SystemMessage(content=(
        "You are a Context Analyzer for an aphasia communication tablet. "
        "Skim database histories and output a highly dense 2-3 sentence summary. "
        "Focus on: what the user did most recently, recurring patterns, time-of-day habits."
    ))
    hu_msg = HumanMessage(content=f"Analyze raw db logs:\n{raw_db_logs}")
    res = await llm.ainvoke([sys_msg, hu_msg])
    return res.content


async def personalization_agent(user_profile: str) -> str:
    sys_msg = SystemMessage(content=(
        "You are a Personalization Profiler for an aphasia communication tablet. "
        "Build a compact representation of who this user is: preferences, routines, "
        "emotional patterns, things they frequently ask for."
    ))
    hu_msg = HumanMessage(content=f"Analyze user details:\n{user_profile}")
    res = await llm.ainvoke([sys_msg, hu_msg])
    return res.content


async def generation_agent(context_summary: str, profile_summary: str, current_path: str) -> str:
    sys_msg = SystemMessage(content=(
        "You are an Options Generator for an aphasia communication tablet. "
        "The user CANNOT reliably read. Every option must communicate through its icon alone. "
        "Labels are purely decorative — 1-2 words MAXIMUM, never a phrase or sentence. "
        "Generate specific, relevant options for daily life needs. "
        "Never generate generic or abstract options. Every option must map to a concrete, "
        "visually representable concept that a non-verbal person would immediately recognize."
    ))
    hu_msg = HumanMessage(content=(
        f"Context summary: {context_summary}\n"
        f"Profile summary: {profile_summary}\n"
        f"Current navigation path: {current_path}\n\n"
        "Generate 4-6 specific, relevant navigation options. "
        "Output a JSON object with 'quick_option' (object with 'label' and 'icon') "
        "and 'options' (array of objects with 'label' and 'icon'). "
        "Labels: 1-2 words max. Icons: lowercase snake_case concept name."
    ))
    res = await llm.ainvoke([sys_msg, hu_msg])
    return res.content


async def icon_agent(generated_options_json: str) -> str:
    """Maps each generated option to the best Phosphor icon from the valid icon set."""
    sys_msg = SystemMessage(content=(
        "You are an Icon Specialist for an aphasia communication tablet. "
        "The user CANNOT read — the icon IS the entire communication. "
        "Your job: for each option, pick the single best icon key from the valid set below. "
        "Reason about the CONCEPT being communicated, not the literal word. "
        "A non-verbal user must immediately recognize what each icon means.\n\n"
        "VALID ICON KEYS (you MUST pick from these):\n"
        f"{ICON_KEYS_PROMPT}\n\n"
        "RULES:\n"
        "1. Pick the closest matching key from the valid set above.\n"
        "2. If no single key clearly communicates the concept, suggest a slight rewording "
        "of the label that maps better to an existing icon. Return both the new label and icon key.\n"
        "3. A generic fallback icon (like 'unknown', 'other', 'more_options') is NEVER acceptable "
        "unless the concept truly is 'other/more'. Always find a specific, recognizable match.\n\n"
        "Output ONLY a JSON object mapping each original label to its best icon key. "
        "If you rewrote a label, include a 'rewrites' object mapping original_label -> new_label. "
        "Example: {\"icons\": {\"Water\": \"water\", \"Headache\": \"headache\"}, \"rewrites\": {}}"
    ))
    hu_msg = HumanMessage(content=(
        f"Map these generated options to the best icon keys:\n{generated_options_json}"
    ))
    res = await llm.ainvoke([sys_msg, hu_msg])
    return res.content


async def manager_agent(generated_json: str, icon_mapping_json: str, current_path: str) -> str:
    """Validates JSON, merges icon assignments, ensures clean output."""
    sys_msg = SystemMessage(content=(
        "You are a Pipeline Manager for an aphasia communication tablet. "
        "You receive generated options and icon mappings. Your job:\n"
        "1. Parse the generated options JSON.\n"
        "2. Apply the icon mapping — replace each option's 'icon' with the icon agent's selection.\n"
        "3. Apply any label rewrites from the icon agent.\n"
        "4. Ensure labels are 1-2 words MAX. Truncate if longer.\n"
        "5. Ensure exactly 4-6 options in the array.\n"
        "6. Ensure quick_option is an OBJECT with 'label' and 'icon', NOT a string.\n"
        "7. Strip ALL markdown. Return ONLY the raw JSON object.\n"
        "8. Every icon value MUST be a simple snake_case string (a valid key from the icon map)."
    ))
    hu_msg = HumanMessage(content=(
        f"Generated options:\n{generated_json}\n\n"
        f"Icon mapping:\n{icon_mapping_json}\n\n"
        f"Current path: {current_path}\n\n"
        "Merge and validate. Output ONLY the final JSON object with quick_option and options."
    ))
    res = await llm.ainvoke([sys_msg, hu_msg])
    return res.content


# ── Pipeline orchestration ──────────────────────────────────────

def _clean_json(raw: str) -> str:
    """Strip markdown fences from LLM output."""
    s = raw.strip()
    if s.startswith("```json"):
        s = s[7:]
    if s.startswith("```"):
        s = s[3:]
    if s.endswith("```"):
        s = s[:-3]
    return s.strip()


def _validate_icons(result: dict) -> dict:
    """Ensure all icon values are valid keys. Replace unknowns with closest match."""
    for opt in result.get("options", []):
        if opt.get("icon") not in VALID_ICON_KEYS:
            # Try lowercase/underscore normalization
            normalized = opt["icon"].lower().replace(" ", "_").replace("-", "_")
            if normalized in VALID_ICON_KEYS:
                opt["icon"] = normalized
            else:
                # Last resort: use the label as key
                label_key = opt.get("label", "help").lower().replace(" ", "_")
                opt["icon"] = label_key if label_key in VALID_ICON_KEYS else "help"

    qo = result.get("quick_option", {})
    if isinstance(qo, dict) and qo.get("icon") not in VALID_ICON_KEYS:
        normalized = qo["icon"].lower().replace(" ", "_").replace("-", "_")
        qo["icon"] = normalized if normalized in VALID_ICON_KEYS else "help"

    return result


async def run_crew_pipeline(current_path: list, context_data: dict) -> dict:
    """
    Execute the full multi-agent pipeline.
    For root path, returns deterministic core needs instantly.
    """
    # ── Root path: deterministic home screen ──
    if not current_path:
        logger.info("Orchestrator: returning deterministic root options")
        return ROOT_OPTIONS

    path_str = " > ".join(current_path)

    raw_db_logs = json.dumps({
        "recent_paths": context_data.get("recent_paths", []),
        "frequencies": context_data.get("top_paths", []),
        "utterances": context_data.get("conversation_utterances", [])
    })

    user_profile = json.dumps({
        "preferences": context_data.get("preferences", ""),
        "glossary": context_data.get("glossary_rules", [])
    })

    # ── Phase 1: Context + Personalization (parallel) ──
    context_res, profile_res = await asyncio.gather(
        context_agent(raw_db_logs),
        personalization_agent(user_profile)
    )

    # ── Phase 2: Generation (sequential, needs phase 1 output) ──
    generated_json = await generation_agent(context_res, profile_res, path_str)

    # ── Phase 3: Icon mapping + Manager validation (parallel) ──
    icon_mapping, manager_output = await asyncio.gather(
        icon_agent(generated_json),
        manager_agent(generated_json, "{}", path_str)  # preliminary pass
    )

    # ── Phase 4: Final merge — manager re-validates with icon data ──
    final_output = await manager_agent(manager_output, icon_mapping, path_str)

    raw_str = _clean_json(final_output)

    try:
        result = json.loads(raw_str)
        return _validate_icons(result)
    except Exception as e:
        logger.error(f"Manager returned invalid JSON: {raw_str} error: {e}")
        raise ValueError("Manager failed to produce valid JSON options format.")
