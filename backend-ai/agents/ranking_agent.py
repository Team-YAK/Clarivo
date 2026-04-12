"""
Ranking Agent — Re-ranks prediction options using frequency, recency, and time context.

Pure Python (no LLM call). Responsible for:
- Frequency bias: prior selections ranked higher
- Recency boost: paths used in last 24h get weight
- Time-of-day relevance: breakfast higher in morning, sleep higher at evening
- Selecting the best quick_option
- Deduplication and enforcement of max 12
"""

import logging

logger = logging.getLogger(__name__)

# Time-of-day keyword boosting
TIME_BOOSTS = {
    "morning": {
        "breakfast", "coffee", "cereal", "toast", "eggs", "oatmeal",
        "shower", "brush_teeth", "medicine", "pill", "wake_up",
        "morning", "stretch", "yogurt",
    },
    "afternoon": {
        "lunch", "sandwich", "salad", "water", "exercise", "walk",
        "outside", "read", "tv", "nap", "snack",
    },
    "evening": {
        "dinner", "sleep", "rest", "bed", "blanket", "pillow",
        "tv", "movie", "night", "pajamas", "tired", "quiet",
        "dark_room", "lullaby",
    },
}


def rank_options(prediction_result: dict, context: dict) -> dict:
    """
    Re-rank the prediction options using personalization signals.
    Target: <10ms (pure in-memory sort).
    """
    options = prediction_result.get("options", [])
    if not options:
        return prediction_result

    frequencies = context.get("frequencies", {})
    recent_paths = context.get("recent_paths", [])
    time_context = context.get("time_context", "afternoon")
    current_path = context.get("current_path", [])

    # Build a set of recently used leaf keys
    recent_keys = set()
    for p in recent_paths:
        if p:
            recent_keys.add(p[-1].lower())

    # Get time-boost keywords
    time_boost_set = TIME_BOOSTS.get(time_context, set())

    # Build path prefix for frequency matching
    path_prefix = "→".join(current_path) + "→" if current_path else ""

    # Build correction vocabulary — words that appear in corrected sentences
    # for the current path are strong positive signals
    corrections = context.get("corrections", {})
    correction_words: set[str] = set()
    for corrected_sentence in corrections.values():
        for word in corrected_sentence.lower().split():
            if len(word) > 3:  # Skip short stop words
                correction_words.add(word.strip(".,!?"))

    # Score each option
    scored = []
    for opt in options:
        label = opt.get("label", "")
        icon = opt.get("icon", "")
        key = icon.lower().replace("-", "_")
        label_lower = label.lower()
        label_words = set(label_lower.replace("_", " ").split())

        score = 0.0

        # 1. Frequency bias (strongest signal)
        freq_key = f"{path_prefix}{key}" if path_prefix else key
        raw_freq = frequencies.get(freq_key, 0)
        freq_count = raw_freq if isinstance(raw_freq, (int, float)) else 0
        # Also check partial matches (label-based key fallback)
        if freq_count == 0:
            label_key = label_lower.replace(" ", "_")
            for fk, fv in frequencies.items():
                if not isinstance(fv, (int, float)):
                    continue
                if fk.endswith(f"→{key}") or fk == key or fk.endswith(f"→{label_key}"):
                    freq_count = max(freq_count, fv)
        score += min(freq_count * 3.0, 30.0)  # Cap frequency contribution

        # 2. Recency boost
        if key in recent_keys or label_lower in recent_keys:
            score += 10.0

        # 3. Time-of-day relevance
        if key in time_boost_set or label_lower.replace(" ", "_") in time_boost_set:
            score += 5.0

        # 4. Correction alignment — boost options whose labels match prior corrections
        if correction_words and label_words & correction_words:
            score += 8.0

        scored.append((score, opt))

    # Sort by score descending, stable sort preserves LLM ordering for ties
    scored.sort(key=lambda x: x[0], reverse=True)

    ranked_options = [opt for _, opt in scored]

    # Deduplicate by label (case-insensitive)
    seen = set()
    deduped = []
    for opt in ranked_options:
        label_key = opt["label"].lower()
        if label_key not in seen:
            deduped.append(opt)
            seen.add(label_key)

    # Enforce max 12
    deduped = deduped[:12]

    # The top-ranked option is the quick_option
    quick_option = deduped[0] if deduped else prediction_result.get("quick_option", {})

    return {
        "quick_option": quick_option,
        "options": deduped,
    }
