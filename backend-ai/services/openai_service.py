"""
OpenAI client — streaming sentence generation, confidence scoring,
clarification options, simplification, and digest generation.
"""

import os
import json
import logging
from typing import AsyncGenerator
import openai
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

_client = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client

INTENT_SYSTEM = """You are the voice of an aphasia patient. Given the navigation path they selected in their AAC app and their personal context, generate a natural first-person sentence expressing their intent.

Rules:
- First person only ("I want...", "I feel...", "I need...")
- One sentence, clear and direct
- Use their personal context to make it specific and accurate
- Max 20 words
- Sound natural, not robotic"""

CONFIDENCE_SYSTEM = """Rate how confident you are that this sentence accurately captures the patient's intent, given their navigation path and personal context. Consider:
- Does the sentence match the path meaning?
- Does it incorporate relevant personal context?
- Would the patient likely confirm this?
Return ONLY a number between 0.0 and 1.0."""

CLARIFY_SYSTEM = """The patient selected an ambiguous navigation path in their AAC app. Generate 2-3 more specific options they might mean.

Return valid JSON array with objects containing:
- "label": short display text (2-4 words)
- "icon": single relevant emoji
- "path": array of strings representing the more specific navigation path

Example: [{"label": "Head hurts", "icon": "🤕", "path": ["needs","physical","pain","head"]}, {"label": "Stomach ache", "icon": "🤢", "path": ["needs","physical","pain","stomach"]}]"""

SIMPLIFY_SYSTEM = """Simplify the following text for an aphasia patient. Rules:
- Max 2 sentences
- Max 6 words per sentence
- Use simple, common words
- Be warm and clear
Return ONLY the simplified sentences, one per line."""

DIGEST_SYSTEM = """You are writing a warm daily summary for a caregiver about their loved one's communication sessions. Write 2-3 specific, warm sentences summarizing the sessions. Flag any first-time occurrences. Be encouraging and specific — use actual details from the sessions."""


async def stream_intent(path: list[str], context: str) -> AsyncGenerator[str, None]:
    path_str = " > ".join(path)
    user_prompt = f"The patient selected: {path_str}"

    try:
        stream = await get_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"{INTENT_SYSTEM}\n\nPatient context:\n{context}"},
                {"role": "user", "content": user_prompt},
            ],
            stream=True,
            max_tokens=40,
            temperature=0.7,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content
    except openai.RateLimitError as e:
        logger.warning(f"OpenAI RateLimitError: {e}")
        yield "I want... Please try again later. "
    except openai.APITimeoutError as e:
        logger.warning(f"OpenAI APITimeoutError: {e}")
        yield "I want... Connection timed out. "
    except openai.APIConnectionError as e:
        logger.warning(f"OpenAI APIConnectionError: {e}")
        yield "I want... Bad connection. "
    except Exception as e:
        logger.warning(f"Intent streaming failed: {e}")
        import asyncio
        mock_sentence = f"I want {path[-1]} please."
        for word in mock_sentence.split():
            yield word + " "
            await asyncio.sleep(0.05)


async def compute_confidence(sentence: str, path: list[str], context: str) -> float:
    path_str = " > ".join(path)
    try:
        resp = await get_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": CONFIDENCE_SYSTEM},
                {
                    "role": "user",
                    "content": f"Path: {path_str}\nContext: {context}\nSentence: {sentence}",
                },
            ],
            max_tokens=5,
            temperature=0,
        )
        score = float(resp.choices[0].message.content.strip())
        return max(0.0, min(1.0, score))
    except Exception as e:
        logger.warning(f"Confidence scoring failed: {e}")
        return 0.75


async def generate_clarification_options(path: list[str], context: str) -> list[dict]:
    path_str = " > ".join(path)
    try:
        resp = await get_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"{CLARIFY_SYSTEM}\n\nPatient context:\n{context}"},
                {"role": "user", "content": f"Ambiguous path: {path_str}"},
            ],
            max_tokens=200,
            temperature=0.8,
        )
        raw = resp.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()
        data = json.loads(raw)
        
        # Enforce bounds
        if not isinstance(data, list):
            data = [data]
        if len(data) < 2:
            data.append({"label": "Tell me more", "icon": "💬", "path": path + ["more"]})
        if len(data) > 3:
            data = data[:3]
            
        return data
    except Exception as e:
        logger.warning(f"Clarification generation failed: {e}")
        return [
            {"label": "Tell me more", "icon": "💬", "path": path + ["more"]},
            {"label": "Something else", "icon": "🔄", "path": path + ["other"]},
        ]


async def generate_post_session_question(session_data: dict, context: str):
    try:
        path_str = " > ".join(session_data.get("path", []))
        sentence = session_data.get("sentence", "")
        resp = await get_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Generate a single question for the caregiver to help personalize future responses. The question should be about the patient's preferences related to this session topic. Return JSON: {\"question\": \"...\"}",
                },
                {
                    "role": "user",
                    "content": f"Session path: {path_str}\nGenerated sentence: {sentence}\nExisting context: {context}",
                },
            ],
            max_tokens=60,
            temperature=0.7,
        )
        raw = resp.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()
        data = json.loads(raw)
        return {
            "question_id": f"q_{session_data.get('session_id', 'unknown')}",
            "question": data["question"],
        }
    except Exception as e:
        logger.warning(f"Post-session question generation failed: {e}")
        return None


async def simplify_text(text: str) -> list[str]:
    try:
        resp = await get_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SIMPLIFY_SYSTEM},
                {"role": "user", "content": text},
            ],
            max_tokens=40,
            temperature=0.5,
        )
        raw = resp.choices[0].message.content.strip()
        return [line.strip() for line in raw.split("\n") if line.strip()]
    except Exception as e:
        logger.warning(f"Text simplification failed: {e}")
        return [text[:30]]


async def generate_digest(sessions: list, user_data: dict) -> str:
    profile = user_data.get("profile", {})
    name = profile.get("name", "the patient")

    session_summaries = []
    for s in sessions:
        path_str = " > ".join(s.get("path", []))
        first = " (FIRST TIME)" if s.get("is_first_occurrence") else ""
        session_summaries.append(
            f"- {path_str}: \"{s.get('sentence', '')}\"{first}"
        )

    try:
        resp = await get_client().chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": DIGEST_SYSTEM},
                {
                    "role": "user",
                    "content": f"Patient: {name}\n\nToday's sessions:\n" + "\n".join(session_summaries),
                },
            ],
            max_tokens=150,
            temperature=0.7,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"Digest generation failed: {e}")
        return f"{name} had {len(sessions)} communication sessions today."


async def refine_sentence_with_correction(original: str, correction: str, path: list[str], context: str) -> str:
    path_str = " > ".join(path)
    try:
        resp = await get_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": f"You are the voice of an aphasia patient. A caregiver corrected a generated sentence. Create an improved version of the sentence that matches the intent of the path and the specific correction. Sound natural and use first person. Context: {context}",
                },
                {
                    "role": "user",
                    "content": f"Path: {path_str}\nOriginal: {original}\nCorrection: {correction}",
                },
            ],
            max_tokens=60,
            temperature=0.3,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"Sentence refinement failed: {e}")
        return correction  # Fallback to the raw correction

