"""
Prediction Agent — Generates next-step options using a single GPT-4o-mini call.

This is the ONLY agent that makes an LLM call. Responsible for:
- Building a tight prompt (<300 tokens) from context + current_path
- Calling OpenAI with JSON response format
- Parsing response into { quick_option, options } format
- Enforcing max 12 options, 1-2 word labels, icon identifiers
- Falling back to sensible defaults if LLM fails
"""

import json
import logging
from services.openai_service import get_client

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You generate button options for an AAC (Augmentative and Alternative Communication) app for aphasia patients.

Given the user's current navigation path and their personal context, generate the next 6-12 options they might want to select.

Return ONLY valid JSON in this exact format:
{"quick_option":{"label":"...","icon":"..."},"options":[{"label":"...","icon":"..."}]}

Rules:
- Max 12 options in the options array
- Labels must be 1-2 words maximum (e.g. "Water", "Hot Coffee")
- Icon must be a simple lowercase identifier using underscores (e.g. "water", "coffee_drink", "ice_cream")
- The quick_option should be the single best prediction
- quick_option must also appear in the options array
- Options should be semantically grouped and relevant to the current path
- No duplicate labels
- No explanations, ONLY the JSON object"""


async def generate_options(
    current_path: list[str],
    context: dict,
) -> dict:
    """
    Single LLM call to generate next-step options.
    Target: <500ms (gpt-4o-mini, <300 token prompt).
    """
    path_str = " > ".join(current_path) if current_path else "root"

    # Build a compact user prompt
    prompt_parts = [f"Path: {path_str}"]
    prompt_parts.append(f"Time: {context.get('time_context', 'unknown')}")

    # Add preferences if available
    prefs = context.get("preferences", "")
    if prefs:
        prompt_parts.append(f"Preferences: {prefs[:100]}")

    # Add frequency hints (top 5 relevant)
    frequencies = context.get("frequencies", {})
    if frequencies:
        # Filter frequencies that start with current path
        path_prefix = "→".join(current_path) + "→" if current_path else ""
        relevant = []
        for k, v in frequencies.items():
            if path_prefix and k.startswith(path_prefix):
                next_part = k[len(path_prefix):].split("→")[0]
                if next_part:
                    relevant.append((next_part, v))
            elif not current_path:
                top_level = k.split("→")[0]
                relevant.append((top_level, v))

        if relevant:
            # Deduplicate and sort
            freq_dict = {}
            for name, count in relevant:
                freq_dict[name] = freq_dict.get(name, 0) + count
            sorted_freq = sorted(freq_dict.items(), key=lambda x: x[1], reverse=True)[:5]
            freq_str = ", ".join(f"{n}({c})" for n, c in sorted_freq)
            prompt_parts.append(f"Frequent: {freq_str}")

    # Add recent context
    recent = context.get("recent_paths", [])
    if recent:
        recent_leaves = [p[-1] for p in recent[:5] if p]
        prompt_parts.append(f"Recent: {', '.join(recent_leaves)}")

    user_prompt = "\n".join(prompt_parts)

    try:
        client = get_client()
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=300,
            temperature=0.7,
            response_format={"type": "json_object"},
        )

        raw = resp.choices[0].message.content.strip()
        data = json.loads(raw)

        # Validate structure
        if not isinstance(data, dict):
            raise ValueError("Response is not a dict")

        quick = data.get("quick_option")
        options = data.get("options", [])

        if not isinstance(options, list) or len(options) == 0:
            raise ValueError("No options in response")

        # Enforce max 12
        options = options[:12]

        # Ensure quick_option exists
        if not quick or not isinstance(quick, dict):
            quick = options[0]

        # Ensure all items have label + icon
        cleaned = []
        seen_labels = set()
        for opt in options:
            label = opt.get("label", "").strip()
            icon = opt.get("icon", "unknown").strip().lower().replace(" ", "_").replace("-", "_")
            if label and label.lower() not in seen_labels:
                cleaned.append({"label": label, "icon": icon})
                seen_labels.add(label.lower())

        if not cleaned:
            raise ValueError("All options were invalid")

        # Ensure quick_option label is in cleaned list
        quick_label = quick.get("label", "").strip()
        quick_icon = quick.get("icon", "unknown").strip().lower().replace(" ", "_").replace("-", "_")
        if quick_label.lower() not in {o["label"].lower() for o in cleaned}:
            cleaned.insert(0, {"label": quick_label, "icon": quick_icon})

        return {
            "quick_option": {"label": quick_label, "icon": quick_icon},
            "options": cleaned[:12],
        }

    except json.JSONDecodeError as e:
        logger.error(f"Prediction: JSON parse failed: {e}")
        return _fallback_options(current_path)
    except Exception as e:
        logger.error(f"Prediction: LLM call failed: {e}")
        return _fallback_options(current_path)


def _fallback_options(current_path: list[str]) -> dict:
    """Sensible fallback when LLM is unavailable."""
    if not current_path:
        # Root-level fallback
        options = [
            {"label": "Food", "icon": "food"},
            {"label": "Drink", "icon": "drink"},
            {"label": "Emotions", "icon": "emotional"},
            {"label": "Physical", "icon": "physical"},
            {"label": "Sleep", "icon": "sleep"},
            {"label": "Social", "icon": "social"},
            {"label": "Medical", "icon": "medical"},
            {"label": "Toilet", "icon": "toilet"},
        ]
    else:
        last = current_path[-1]
        options = [
            {"label": "More Info", "icon": "more"},
            {"label": "Something Else", "icon": "other"},
            {"label": last.title(), "icon": last.lower()},
        ]

    return {
        "quick_option": options[0],
        "options": options,
    }
