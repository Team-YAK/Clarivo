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

BASE_SYSTEM_PROMPT = """You generate button options for an AAC (Augmentative and Alternative Communication) app for aphasia patients.

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


def _build_system_prompt(glossary_rules: list[dict]) -> str:
    """Inject active glossary rules as a strict prefix."""
    if not glossary_rules:
        return BASE_SYSTEM_PROMPT
    mappings = " | ".join(
        f'"{r["trigger_word"]}" = {r["enforced_meaning"]}'
        for r in glossary_rules
    )
    return f"Strict Terms (always use these meanings): {mappings}\n\n{BASE_SYSTEM_PROMPT}"


async def generate_options(
    current_path: list[str],
    context: dict,
) -> dict:
    """
    Single LLM call to generate next-step options.
    Target: <500ms (gpt-4o-mini, <300 token prompt).
    """
    path_str = " > ".join(current_path) if current_path else "root"
    glossary_rules = context.get("glossary_rules", [])
    system_prompt = _build_system_prompt(glossary_rules)

    # Build a compact user prompt
    prompt_parts = [f"Path: {path_str}"]
    prompt_parts.append(f"Time: {context.get('time_context', 'unknown')}")

    # Add preferences if available
    prefs = context.get("preferences", "")
    if prefs:
        prompt_parts.append(f"Preferences: {prefs[:100]}")

    # Add path-specific corrections as strong hints
    path_corrections = context.get("path_corrections", {})
    if path_corrections:
        # Show only the corrected values (not full path keys) to keep prompt tight
        correction_hints = list(path_corrections.values())[:3]
        prompt_parts.append(f"Prior corrections: {'; '.join(correction_hints[:80])}")

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

    # Add conversation context — what's been said so far in this session
    utterances = context.get("conversation_utterances", [])
    if utterances:
        convo_str = " | ".join(utterances)
        prompt_parts.append(f"Conversation so far: {convo_str[:150]}")

    user_prompt = "\n".join(prompt_parts)

    try:
        client = get_client()
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
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
    """Path-aware sensible fallback when LLM is unavailable."""
    # Static category map: covers all 12 root categories
    CATEGORY_DEFAULTS: dict[str, list[dict]] = {
        "physical": [
            {"label": "Pain", "icon": "pain"}, {"label": "Hot", "icon": "temperature_hot"},
            {"label": "Cold", "icon": "temperature_cold"}, {"label": "Dizzy", "icon": "dizzy"},
            {"label": "Nausea", "icon": "nausea"}, {"label": "Tired", "icon": "fatigue"},
            {"label": "Itchy", "icon": "itch"}, {"label": "Weak", "icon": "weakness"},
        ],
        "emotional": [
            {"label": "Happy", "icon": "happy"}, {"label": "Sad", "icon": "sad"},
            {"label": "Anxious", "icon": "anxious"}, {"label": "Angry", "icon": "angry"},
            {"label": "Scared", "icon": "scared"}, {"label": "Excited", "icon": "excited"},
            {"label": "Lonely", "icon": "lonely"}, {"label": "Calm", "icon": "calm"},
        ],
        "food": [
            {"label": "Breakfast", "icon": "breakfast"}, {"label": "Lunch", "icon": "lunch"},
            {"label": "Dinner", "icon": "dinner"}, {"label": "Snack", "icon": "snack"},
            {"label": "Dessert", "icon": "dessert"}, {"label": "Fruit", "icon": "fruit"},
        ],
        "drink": [
            {"label": "Water", "icon": "water"}, {"label": "Tea", "icon": "tea"},
            {"label": "Coffee", "icon": "coffee_drink"}, {"label": "Juice", "icon": "juice"},
            {"label": "Milk", "icon": "milk"}, {"label": "Soda", "icon": "soda"},
        ],
        "sleep": [
            {"label": "Rest", "icon": "rest"}, {"label": "Nap", "icon": "nap"},
            {"label": "Pillow", "icon": "pillow"}, {"label": "Blanket", "icon": "blanket"},
            {"label": "Dark Room", "icon": "dark_room"}, {"label": "Quiet", "icon": "quiet"},
        ],
        "social": [
            {"label": "Family", "icon": "family"}, {"label": "Friend", "icon": "friend"},
            {"label": "Nurse", "icon": "nurse"}, {"label": "Doctor", "icon": "doctor"},
            {"label": "Call", "icon": "call_someone"}, {"label": "Alone", "icon": "alone"},
        ],
        "watch": [
            {"label": "TV", "icon": "tv"}, {"label": "Movie", "icon": "movie"},
            {"label": "Music", "icon": "music"}, {"label": "Sports", "icon": "sports"},
            {"label": "News", "icon": "news"}, {"label": "Read", "icon": "read"},
        ],
        "hygiene": [
            {"label": "Shower", "icon": "shower"}, {"label": "Bath", "icon": "bath"},
            {"label": "Brush Teeth", "icon": "brush_teeth"}, {"label": "Wash Hands", "icon": "wash_hands"},
            {"label": "Shave", "icon": "shave"}, {"label": "Change", "icon": "change_clothes"},
        ],
        "environment": [
            {"label": "Light", "icon": "light"}, {"label": "Temperature", "icon": "temperature"},
            {"label": "Fresh Air", "icon": "air"}, {"label": "Window", "icon": "window"},
            {"label": "Fan", "icon": "fan"}, {"label": "Quiet", "icon": "quiet"},
        ],
        "medical": [
            {"label": "Medicine", "icon": "medicine"}, {"label": "Pill", "icon": "pill"},
            {"label": "Emergency", "icon": "emergency"}, {"label": "Checkup", "icon": "checkup"},
            {"label": "Pain Relief", "icon": "pain_relief"}, {"label": "Bandage", "icon": "bandage"},
        ],
        "communication": [
            {"label": "Yes", "icon": "yes"}, {"label": "No", "icon": "no"},
            {"label": "Please", "icon": "please"}, {"label": "Thank You", "icon": "thank_you"},
            {"label": "Help", "icon": "help"}, {"label": "Stop", "icon": "stop"},
        ],
        "pain": [
            {"label": "Headache", "icon": "headache"}, {"label": "Stomach", "icon": "stomach"},
            {"label": "Back", "icon": "backpain"}, {"label": "Chest", "icon": "chestpain"},
            {"label": "Neck", "icon": "neck"}, {"label": "Joints", "icon": "joints"},
        ],
    }

    if not current_path:
        # Root-level fallback: all 12 top categories
        options = [
            {"label": "Physical", "icon": "physical"},
            {"label": "Emotions", "icon": "emotional"},
            {"label": "Food", "icon": "food"},
            {"label": "Drink", "icon": "drink"},
            {"label": "Sleep", "icon": "sleep"},
            {"label": "Social", "icon": "social"},
            {"label": "Entertainment", "icon": "watch"},
            {"label": "Toilet", "icon": "toilet"},
            {"label": "Hygiene", "icon": "hygiene"},
            {"label": "Environment", "icon": "environment"},
            {"label": "Medical", "icon": "medical"},
            {"label": "Communicate", "icon": "communication"},
        ]
    else:
        last = current_path[-1].lower()
        # Look up the closest matching category in our static map
        options = CATEGORY_DEFAULTS.get(last)
        if not options:
            # Search by partial key match
            for key, vals in CATEGORY_DEFAULTS.items():
                if last in key or key in last:
                    options = vals
                    break
        if not options:
            # Truly unknown path — generic but useful fallback
            options = [
                {"label": last.title(), "icon": last.replace(" ", "_")},
                {"label": "Yes", "icon": "yes"},
                {"label": "No", "icon": "no"},
                {"label": "Help", "icon": "help"},
                {"label": "More", "icon": "more"},
            ]

    return {
        "quick_option": options[0],
        "options": options,
    }
