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

from dotenv import load_dotenv
from openai import AsyncOpenAI

from services.icon_dictionary import ICON_DICTIONARY, ICON_NAMES

load_dotenv()
if os.getenv("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

logger = logging.getLogger(__name__)

_openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def _chat_once(system: str, user: str, max_tokens: int, temperature: float) -> str:
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


def _clean_json(raw: str) -> str:
    text = raw.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def _tokenize(text: str) -> list[str]:
    return [t for t in re.split(r"[^a-z0-9]+", text.lower()) if t]


def _label_limit(label: str) -> str:
    words = [w for w in re.split(r"\s+", label.strip()) if w]
    if not words:
        return ""
    return " ".join(words[:2]).title()


def _concept_to_key(concept: str) -> str:
    return "-".join(_tokenize(concept))


def _semantic_key(*parts: str) -> str:
    for part in parts:
        key = _concept_to_key(part)
        if key:
            return key
    return ""


def _score_candidate(concept: str, candidate: str) -> float:
    concept_tokens = set(_tokenize(concept))
    haystack = f"{candidate} {ICON_DICTIONARY.get(candidate, '')}"
    cand_tokens = set(_tokenize(haystack))
    if not concept_tokens:
        return 0.0

    overlap = concept_tokens.intersection(cand_tokens)
    base = float(len(overlap))

    # Bonus for direct key/token prefix matches
    for token in concept_tokens:
        if candidate.startswith(token):
            base += 0.9
        if token in candidate:
            base += 0.4

    return base


def _prefilter_candidates(concept: str, limit: int = 80) -> list[str]:
    scored: list[tuple[float, str]] = []
    for key in ICON_NAMES:
        score = _score_candidate(concept, key)
        if score > 0:
            scored.append((score, key))
    scored.sort(key=lambda x: x[0], reverse=True)
    if scored:
        return [k for _, k in scored[:limit]]

    # Extremely rare: no lexical overlap found
    key = _concept_to_key(concept)
    starts = [k for k in ICON_NAMES if k.startswith(key[:2])]
    return starts[:limit] if starts else list(ICON_NAMES[:limit])


def _attempt_reword_match(concept: str) -> str | None:
    base_key = _concept_to_key(concept)
    variants = {base_key, base_key.replace("-", "")}
    tokens = _tokenize(concept)
    if tokens:
        singular = tokens[:-1] + [tokens[-1].rstrip("s")]
        variants.add("-".join(singular))

    for token in tokens:
        for hint in SYNONYM_HINTS.get(token, []):
            variants.add(hint)
            variants.add(hint.replace(" ", "-"))

    for variant in variants:
        if variant in ICON_DICTIONARY:
            return variant
    return None


def _layer_icon(first: str, second: str) -> str | None:
    if first in ICON_DICTIONARY and second in ICON_DICTIONARY and first != second:
        return f"layer:{first}+{second}"
    return None


def _custom_svg_for_concept(concept: str) -> str:
    tokens = set(_tokenize(concept))

    if tokens.intersection({"run", "running", "exercise", "jog", "sprint"}):
        return (
            "<svg viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'>"
            "<path d='M24 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z' fill='currentColor'/>"
            "<path d='M22 18l8 4-4 6 6 8h-5l-4-6-5 6h-5l7-8 2-10Z' fill='currentColor'/>"
            "</svg>"
        )

    if tokens.intersection({"morning", "sunrise", "early"}):
        return (
            "<svg viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'>"
            "<path d='M10 32h28v3H10z' fill='currentColor'/>"
            "<path d='M24 14a9 9 0 0 1 9 9H15a9 9 0 0 1 9-9Z' fill='currentColor'/>"
            "<path d='M24 8v4M14 12l3 3M34 12l-3 3' stroke='currentColor' stroke-width='2' fill='none'/>"
            "</svg>"
        )

    return (
        "<svg viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'>"
        "<path d='M24 8 40 24 24 40 8 24Z' fill='currentColor'/>"
        "<path d='M24 16v16M16 24h16' stroke='white' stroke-width='3'/>"
        "</svg>"
    )


def _is_valid_icon_payload(icon_value: str) -> bool:
    if icon_value in ICON_DICTIONARY:
        return True
    if icon_value.startswith("layer:"):
        pair = icon_value.replace("layer:", "", 1).split("+")
        return len(pair) == 2 and pair[0] in ICON_DICTIONARY and pair[1] in ICON_DICTIONARY
    if icon_value.strip().startswith("<svg"):
        return icon_value.count("<path") <= 4 and "</svg>" in icon_value
    return False


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


async def icon_agent(generated: dict) -> tuple[dict, float]:
    start = time.perf_counter()

    options = generated.get("options", [])
    quick = generated.get("quick_option", {})

    concept_rows = []
    for idx, item in enumerate(options):
        concept = (item.get("concept") or item.get("label") or "").strip()
        if concept:
            concept_rows.append({"id": f"opt_{idx}", "concept": concept})

    if quick:
        qconcept = (quick.get("concept") or quick.get("label") or "").strip()
        if qconcept:
            concept_rows.append({"id": "quick", "concept": qconcept})

    pools = {row["id"]: _prefilter_candidates(row["concept"]) for row in concept_rows}

    shortlist_map: dict[str, list[str]] = {}
    if concept_rows:
        sys_msg = (
            "You are selecting icon names. For each concept, choose 10-15 best icon keys "
            "from the provided candidate pool only. Return JSON object: "
            "{\"shortlists\":{\"id\":[\"icon-a\",\"icon-b\"]}}."
        )
        hu_msg = json.dumps({"concepts": concept_rows, "pools": pools})
        try:
            raw = await _chat_once(sys_msg, hu_msg, max_tokens=350, temperature=0.0)
            parsed = json.loads(_clean_json(raw))
            if isinstance(parsed, dict):
                shortlist_map = parsed.get("shortlists", {}) or {}
        except Exception as e:
            logger.warning(f"icon shortlist fallback: {e}")

    resolved = {"quick_option": quick, "options": options}

    def _resolve_icon(concept: str, row_id: str) -> str:
        candidates = shortlist_map.get(row_id) or pools.get(row_id, [])[:12]
        scored = [(c, _score_candidate(concept, c)) for c in candidates if c in ICON_DICTIONARY]
        scored.sort(key=lambda x: x[1], reverse=True)
        if scored and scored[0][1] >= 1.25:
            return scored[0][0]

        reword = _attempt_reword_match(concept)
        if reword:
            return reword

        if len(scored) >= 2:
            layered = _layer_icon(scored[0][0], scored[1][0])
            if layered:
                return layered

        return _custom_svg_for_concept(concept)

    for idx, opt in enumerate(resolved.get("options", [])):
        concept = (opt.get("concept") or opt.get("label") or "").strip()
        opt["icon"] = _resolve_icon(concept, f"opt_{idx}")

    if resolved.get("quick_option"):
        qconcept = (
            resolved["quick_option"].get("concept")
            or resolved["quick_option"].get("label")
            or ""
        ).strip()
        resolved["quick_option"]["icon"] = _resolve_icon(qconcept, "quick")

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

        if not _is_valid_icon_payload(icon):
            fallback_pool = _prefilter_candidates(concept, limit=5)
            icon = fallback_pool[0] if fallback_pool else _custom_svg_for_concept(concept)

        cleaned.append({"label": label, "key": key, "icon": icon})

    if not cleaned:
        raise ValueError("manager agent produced no valid semantic options")

    qo = result.get("quick_option") or cleaned[0]
    quick_label = _label_limit(qo.get("label", ""))
    quick_key = _semantic_key(qo.get("key", ""), qo.get("concept", ""), quick_label)
    quick_option = {
        "label": quick_label or cleaned[0]["label"],
        "key": quick_key or cleaned[0]["key"],
        "icon": qo.get("icon", cleaned[0]["icon"]),
    }
    if not _is_valid_icon_payload(quick_option["icon"]):
        quick_option["icon"] = cleaned[0]["icon"]

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
