"""
Lean tree pipeline for option generation + icon resolution.

Design goals:
- Keep labels extremely short (1 word, rarely 2 words)
- Prioritize conversation + current path context
- Keep latency low with one generation LLM call + one icon shortlist LLM call
- Validate icon payloads locally before returning
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import time
import unicodedata

from dotenv import load_dotenv
try:
    from openai import AsyncOpenAI
except ImportError:  # pragma: no cover - exercised in envs without optional deps
    AsyncOpenAI = None

load_dotenv()
if os.getenv("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

logger = logging.getLogger(__name__)

_openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY")) if AsyncOpenAI else None


async def _chat_once(system: str, user: str, max_tokens: int, temperature: float) -> str:
    if _openai_client is None:
        raise RuntimeError("openai package is not installed")
    resp = await _openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=max_tokens,
        temperature=temperature,
        stream=False,
    )
    return (resp.choices[0].message.content or "").strip()


SYNONYM_HINTS: dict[str, list[str]] = {
    "run": ["running", "jog", "exercise", "sprint"],
    "exercise": ["workout", "gym", "fitness", "stretch"],
    "morning": ["sunrise", "early", "day"],
    "help": ["assist", "support", "aid"],
    "pain": ["hurt", "ache", "sore"],
}



async def context_agent(context_data: dict) -> dict:
    return {
        "current_path": context_data.get("current_path", []),
        "conversation_utterances": context_data.get("conversation_utterances", [])[-5:],
    }


async def personalization_agent(context_data: dict) -> dict:
    return {
        "recent_paths": context_data.get("recent_paths", [])[:8],
        "top_paths": context_data.get("top_paths", [])[:8],
        "recent_concepts": context_data.get("recent_concepts", [])[:16],
        "historical_concepts": context_data.get("historical_concepts", [])[:16],
        "preferences": context_data.get("preferences", ""),
        "always_know": context_data.get("always_know", ""),
    }


async def generation_agent(context_slice: dict, personalization_slice: dict) -> tuple[dict, float]:
    sys_msg = (
        "You generate the next semantic navigation options for Clarivo, an aphasia communication system. "
        "Output JSON only with schema: "
        "{\"quick_option\":{\"label\":\"...\",\"concept\":\"...\",\"key\":\"...\"},"
        "\"options\":[{\"label\":\"...\",\"concept\":\"...\",\"key\":\"...\"}]}. "
        "Rules: labels must be 1 word, rarely 2 words max. "
        "Keys must be kebab-case semantic identifiers. "
        "No subtitles, no long phrases, no questions, no punctuation-heavy text. "
        "No canned AAC categories, no fixed menu sets, no resets to root, no generic top-level buckets unless the context truly demands them. "
        "Treat the current path as an evolving meaning sequence, not a tree hierarchy. "
        "Return 4-10 options that continue the current meaning."
    )
    hu_msg = (
        "Use only these signals, in this priority order:\n"
        "1) Current conversation utterances\n"
        "2) Current navigation path\n"
        "3) Past choices and preferences with lighter weight\n\n"
        "Behavior requirements:\n"
        "- Every option must feel like a semantic continuation of the current path.\n"
        "- Do not emit generic resets or hidden default menus.\n"
        "- The quick option should be the single most probable next concept.\n"
        "- Any concept can lead to any other concept if semantically relevant.\n\n"
        f"Current path: {json.dumps(context_slice.get('current_path', []))}\n"
        f"Conversation: {json.dumps(context_slice.get('conversation_utterances', []))}\n"
        f"Past paths: {json.dumps(personalization_slice.get('recent_paths', []))}\n"
        f"Top paths: {json.dumps(personalization_slice.get('top_paths', []))}\n"
        f"Recent concepts: {json.dumps(personalization_slice.get('recent_concepts', []))}\n"
        f"Historical concepts: {json.dumps(personalization_slice.get('historical_concepts', []))}\n"
        f"Preferences: {personalization_slice.get('preferences', '')}\n"
        f"Always know: {personalization_slice.get('always_know', '')}\n"
    )

    start = time.perf_counter()
    try:
        res_text = await _chat_once(sys_msg, hu_msg, max_tokens=200, temperature=0.2)
    except Exception as e:
        logger.warning(f"generation agent fallback due to LLM error: {e}")
        res_text = ""
    first_token_ms = (time.perf_counter() - start) * 1000

    try:
        raw = _clean_json(res_text)
        data = json.loads(raw)
        if isinstance(data, dict):
            parsed = data
        else:
            raise ValueError("generation output was not a dict")
    except Exception as e:
        logger.error(f"generation agent invalid output: {e}")
        raise ValueError("generation agent returned invalid JSON") from e

    return parsed, round(first_token_ms, 2)


def _is_emoji(text: str) -> bool:
    """Return True if the string contains at least one emoji/unicode char."""
    return bool(text) and any(ord(c) > 127 for c in text)


def _first_grapheme(text: str) -> str:
    """Extract the first full grapheme cluster (emoji) from a string."""
    if not text:
        return ""
    # Walk codepoints and grab until we hit a non-combining character after the first base
    import unicodedata
    result = []
    for ch in text:
        if not result:
            result.append(ch)
        else:
            cat = unicodedata.category(ch)
            # Variation selectors, combiners, ZWJ, joiners — all part of the same grapheme
            if cat in ("Mn", "Mc", "Me", "Cf") or ord(ch) in (0xFE0E, 0xFE0F) or ch == '\u200D':
                result.append(ch)
            else:
                break  # start of next grapheme
    return "".join(result)



async def icon_agent(generated: dict) -> tuple[dict, float]:
    """LLM-driven emoji resolver that guarantees a unique emoji per option."""
    start = time.perf_counter()

    options = generated.get("options", [])
    quick = generated.get("quick_option", {})

    # Build ordered concept list: quick first, then options
    items: list[dict] = []
    if quick:
        items.append({"id": "quick", "concept": (quick.get("concept") or quick.get("label") or "").strip()})
    for idx, opt in enumerate(options):
        items.append({"id": f"opt_{idx}", "concept": (opt.get("concept") or opt.get("label") or "").strip()})

    # Ask the LLM to assign a contextually specific emoji combination for each concept
    emoji_map: dict[str, str] = {}
    if items:
        concepts_formatted = "\n".join(f"- id: {it['id']}, concept: {it['concept']}" for it in items)
        sys_msg = (
            "You are an expert Emoji Communicator for an aphasia communication app. "
            "Your critical goal is to convey the exact meaning of each concept to patients using ONLY emojis. "
            "Because patients with aphasia rely heavily on visual cues, your emoji combinations must be highly expressive, clear, and unmistakable.\n"
            "CRITICAL RULES — violating any will break the app:\n"
            "1. Each value MUST be exactly 1 to 3 emoji characters combined (no text, no spaces, no punctuation).\n"
            "2. ZERO duplicates allowed — every concept MUST have a completely different emoji combination.\n"
            "3. COMBINE emojis to create clearer meanings. E.g., 'hot tea' -> 🍵🔥, 'tired' -> 🥱🛌, 'hospital' -> 🏥🚑, 'sad' -> 😢💔.\n"
            "4. Keep it to a maximum of 3 emojis per concept to prevent visual clutter.\n"
            "5. Number 1 priority is conveying the message clearly through emojis.\n"
            "6. If you struggle to find a unique combination, use a unique color dot as a last resort: 🔴🟠🟡🟢🔵🟣.\n"
            "Return ONLY a flat JSON object: {\"id\": \"emoji_combo\"}. No markdown, no explanation."
        )
        hu_msg = f"Concepts to assign unique emoji combinations to:\n{concepts_formatted}"
        try:
            raw = await _chat_once(sys_msg, hu_msg, max_tokens=180, temperature=0.0)
            parsed = json.loads(_clean_json(raw))
            if isinstance(parsed, dict):
                emoji_map = parsed
        except Exception as e:
            logger.warning(f"icon_agent emoji LLM call failed: {e}")

    # Deduplicate: if LLM still returned duplicates, replace them from fallback list
    used: set[str] = set()
    fallback_idx = 0
    final_map: dict[str, str] = {}
    for it in items:
        # Strip any accidental ASCII text/spaces
        raw_emoji = emoji_map.get(it["id"], "").strip()
        emoji = "".join(c for c in raw_emoji if ord(c) > 127)
        # Limit to first 3 "components" roughly, using grapheme could be too restrictive or slow here,
        # but since we filtered non-emoji characters, sticking to the raw characters (up to 6 chars 
        # to allow complex 3-emoji combos with ZWJ) is safe enough.
        emoji = emoji[:8]

        if not _is_emoji(emoji) or emoji in used:
            # Assign a guaranteed unique fallback
            while fallback_idx < len(FALLBACK_EMOJIS) and FALLBACK_EMOJIS[fallback_idx] in used:
                fallback_idx += 1
            emoji = FALLBACK_EMOJIS[fallback_idx] if fallback_idx < len(FALLBACK_EMOJIS) else "🔘"
            fallback_idx += 1
        used.add(emoji)
        final_map[it["id"]] = emoji

    # Apply emojis back
    resolved = {"quick_option": quick, "options": options}
    if resolved.get("quick_option"):
        resolved["quick_option"]["icon"] = final_map.get("quick", "💬")
    for idx, opt in enumerate(resolved.get("options", [])):
        opt["icon"] = final_map.get(f"opt_{idx}", "🔘")

    icon_ms = (time.perf_counter() - start) * 1000
    return resolved, round(icon_ms, 2)



def manager_agent(result: dict) -> dict:
    options = result.get("options", [])[:12]
    cleaned = []
    for opt in options:
        label = _label_limit(opt.get("label", ""))
        concept = (opt.get("concept") or label).strip()
        key = _semantic_key(opt.get("key", ""), concept, label)
        icon = opt.get("icon", "")

        if not label or not concept or not key:
            continue

        # Emoji validation: must contain at least one non-ASCII character
        if not _is_emoji(icon):
            icon = "🔘"

        cleaned.append({"label": label, "key": key, "icon": icon})

    if not cleaned:
        raise ValueError("manager agent produced no valid semantic options")

    qo = result.get("quick_option") or cleaned[0]
    quick_label = _label_limit(qo.get("label", ""))
    quick_key = _semantic_key(qo.get("key", ""), qo.get("concept", ""), quick_label)
    quick_icon = qo.get("icon", cleaned[0]["icon"])
    if not _is_emoji(quick_icon):
        quick_icon = cleaned[0]["icon"]
    quick_option = {
        "label": quick_label or cleaned[0]["label"],
        "key": quick_key or cleaned[0]["key"],
        "icon": quick_icon,
    }

    return {"quick_option": quick_option, "options": cleaned}



async def run_crew_pipeline(current_path: list[str], context_data: dict) -> dict:
    async def _timed(coro):
        start = time.perf_counter()
        value = await coro
        return value, (time.perf_counter() - start) * 1000

    (context_slice, _ctx_agent_ms), (personalization_slice, personalization_ms) = await asyncio.gather(
        _timed(context_agent(context_data)),
        _timed(personalization_agent(context_data)),
    )

    generated, generation_ttft_ms = await generation_agent(context_slice, personalization_slice)
    resolved, icon_resolve_ms = await icon_agent(generated)

    manager_start = time.perf_counter()
    final_result = manager_agent(resolved)
    manager_ms = (time.perf_counter() - manager_start) * 1000

    final_result["_timings"] = {
        "personalization_ms": round(personalization_ms, 2),
        "generation_first_token_ms": generation_ttft_ms,
        "icon_resolve_ms": icon_resolve_ms,
        "manager_ms": round(manager_ms, 2),
    }
    return final_result
