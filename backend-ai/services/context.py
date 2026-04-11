"""
Context assembly — builds a dense system prompt from user data.
Max 300 tokens, priority-ordered.
"""

import tiktoken

ENCODER = tiktoken.encoding_for_model("gpt-4o-mini")
MAX_TOKENS = 300


def _count_tokens(text: str) -> int:
    return len(ENCODER.encode(text))


def build_context_string(user_data: dict) -> str:
    """
    Assemble a max-300-token system prompt from user data.

    Priority order (highest first):
    1. Correction history (last 10)
    2. Context answers (last 15)
    3. Known preferences + communication notes
    4. Medical context (medications, allergies)
    5. Basic profile (name, relationship)
    """
    sections: list[str] = []
    budget = MAX_TOKENS

    profile = user_data.get("profile", {})
    medical = user_data.get("medical", {})
    prefs = user_data.get("preferences", {})
    corrections = user_data.get("correction_history", [])[-10:]
    context_answers = user_data.get("context_answers", [])[-15:]

    # 1. Corrections — highest priority
    if corrections:
        lines = []
        for c in corrections:
            lines.append(f'{c["path"]} = "{c["corrected"]}"')
        correction_text = "Corrections: " + " | ".join(lines)
        cost = _count_tokens(correction_text)
        if cost <= budget:
            sections.append(correction_text)
            budget -= cost

    # 2. Context answers
    if context_answers:
        lines = []
        for a in context_answers:
            lines.append(f'{a["question"]} = {a["answer"]}')
        learned_text = "Learned: " + " | ".join(lines)
        cost = _count_tokens(learned_text)
        if cost <= budget:
            sections.append(learned_text)
            budget -= cost
        else:
            # Try with fewer answers
            for i in range(len(lines) - 1, 0, -1):
                truncated = "Learned: " + " | ".join(lines[:i])
                if _count_tokens(truncated) <= budget:
                    sections.append(truncated)
                    budget -= _count_tokens(truncated)
                    break

    # 3. Preferences + communication notes
    known = prefs.get("known_preferences", "")
    notes = prefs.get("communication_notes", "")
    always = prefs.get("always_know", "")
    pref_parts = []
    if known:
        pref_parts.append(known)
    if always:
        pref_parts.append(always)
    if pref_parts:
        pref_text = "Preferences: " + " ".join(pref_parts)
        if len(pref_text) > 200:
            pref_text = pref_text[:200]
        cost = _count_tokens(pref_text)
        if cost <= budget:
            sections.append(pref_text)
            budget -= cost
    if notes:
        notes_text = f"Notes: {notes}"
        cost = _count_tokens(notes_text)
        if cost <= budget:
            sections.append(notes_text)
            budget -= cost

    # 4. Medical context
    meds = medical.get("medications", [])
    allergies = medical.get("allergies", [])
    if meds or allergies:
        med_parts = []
        if meds:
            med_parts.append(f"Meds: {', '.join(meds)}")
        if allergies:
            med_parts.append(f"Allergies: {', '.join(allergies)}")
        med_text = ". ".join(med_parts) + "."
        cost = _count_tokens(med_text)
        if cost <= budget:
            sections.append(med_text)
            budget -= cost

    # 5. Basic profile — lowest priority but always try to include
    name = profile.get("name", "Patient")
    profile_text = f"Patient: {name}, aphasia post-stroke."
    cost = _count_tokens(profile_text)
    if cost <= budget:
        sections.insert(0, profile_text)  # Put at the top

    return "\n".join(sections)
