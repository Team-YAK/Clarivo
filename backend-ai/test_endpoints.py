"""
Automated endpoint test script for VoiceMap AI Backend.
Run: python test_endpoints.py

Tests every endpoint in sequence, reports latency vs targets.
"""

import asyncio
import json
import time
import httpx

__test__ = False

BASE = "http://localhost:8001"

# Latency targets (seconds)
TARGETS = {
    "intent_first_token": 0.4,
    "intent_full": 1.5,
    "confirm": 2.0,
    "clarify": 0.6,
    "simplify": 2.0,
}


def result(name: str, passed: bool, detail: str = "", latency: float = 0):
    status = "✅ PASS" if passed else "❌ FAIL"
    lat = f" ({latency:.2f}s)" if latency else ""
    print(f"  {status} {name}{lat} {detail}")


async def test_health():
    print("\n🔍 Health Check")
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE}/health")
        result("GET /health", resp.status_code == 200, f"status={resp.status_code}")


async def test_intent():
    print("\n🔍 Intent Streaming (POST /api/intent)")
    session_id = None
    full_sentence = ""
    confidence = 0
    first_token_time = None

    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            async with client.stream(
                "POST",
                f"{BASE}/api/intent",
                json={"path": ["food", "dessert", "tiramisu"], "user_id": "yuki_demo"},
            ) as resp:
                async for line in resp.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data = json.loads(line[5:].strip())

                    if "token" in data:
                        if first_token_time is None:
                            first_token_time = time.time() - start
                        full_sentence += data["token"]

                    if data.get("done"):
                        session_id = data.get("session_id")
                        full_sentence = data.get("full_sentence", full_sentence)
                        confidence = data.get("confidence", 0)

        total = time.time() - start

        result(
            "First token latency",
            first_token_time is not None and first_token_time < TARGETS["intent_first_token"],
            f"target <{TARGETS['intent_first_token']}s",
            first_token_time or 0,
        )
        result(
            "Full sentence latency",
            total < TARGETS["intent_full"],
            f"target <{TARGETS['intent_full']}s",
            total,
        )
        result("Sentence not empty", bool(full_sentence), f'"{full_sentence[:60]}..."')
        result("Session ID returned", bool(session_id), session_id or "none")
        result(
            "Confidence score valid",
            0 <= confidence <= 1,
            f"confidence={confidence}",
        )

    except Exception as e:
        result("Intent endpoint", False, str(e))

    return session_id


async def test_confirm(session_id: str):
    print("\n🔍 Confirm (POST /api/confirm)")
    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{BASE}/api/confirm",
                json={"session_id": session_id, "user_id": "yuki_demo"},
            )
            latency = time.time() - start
            data = resp.json()

            result(
                "Confirm latency",
                latency < TARGETS["confirm"],
                f"target <{TARGETS['confirm']}s",
                latency,
            )
            result("Audio URL returned", "audio_url" in data, data.get("audio_url", "none"))
            result("Status 200", resp.status_code == 200, f"status={resp.status_code}")
    except Exception as e:
        result("Confirm endpoint", False, str(e))


async def test_feedback(session_id: str):
    print("\n🔍 Feedback (POST /api/feedback)")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Thumbs up
            resp = await client.post(
                f"{BASE}/api/feedback",
                json={"session_id": session_id, "thumbs_up": True, "user_id": "yuki_demo"},
            )
            data = resp.json()
            result("Thumbs up", data.get("success") is True)

            # Correction
            resp = await client.post(
                f"{BASE}/api/feedback",
                json={
                    "session_id": session_id,
                    "thumbs_up": False,
                    "correction": "I want tiramisu specifically",
                    "user_id": "yuki_demo",
                },
            )
            data = resp.json()
            result("Correction feedback", data.get("success") is True)
    except Exception as e:
        result("Feedback endpoint", False, str(e))


async def test_clarify():
    print("\n🔍 Clarify (POST /api/clarify)")
    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{BASE}/api/clarify",
                json={"path": ["feelings"], "user_id": "yuki_demo"},
            )
            latency = time.time() - start
            data = resp.json()
            options = data.get("options", [])

            result(
                "Clarify latency",
                latency < TARGETS["clarify"],
                f"target <{TARGETS['clarify']}s",
                latency,
            )
            result("Returns 2-3 options", 2 <= len(options) <= 3, f"got {len(options)}")
            if options:
                has_shape = all("label" in o and "icon" in o and "path" in o for o in options)
                result("Options have correct shape", has_shape)
    except Exception as e:
        result("Clarify endpoint", False, str(e))


async def test_simplify():
    print("\n🔍 Simplify (POST /api/caregiver/simplify)")
    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{BASE}/api/caregiver/simplify",
                json={
                    "text": "We need to adjust your medication dosage today because your blood pressure has been higher than normal",
                    "user_id": "yuki_demo",
                },
            )
            latency = time.time() - start
            data = resp.json()

            result(
                "Simplify latency",
                latency < TARGETS["simplify"],
                f"target <{TARGETS['simplify']}s",
                latency,
            )
            result("Simplified text returned", bool(data.get("simplified")), str(data.get("simplified", [])))
            result("Audio URL returned", "audio_url" in data, data.get("audio_url", "none"))
            result("Emoji tags returned", "emoji_tags" in data, str(data.get("emoji_tags", [])))
    except Exception as e:
        result("Simplify endpoint", False, str(e))


async def test_digest():
    print("\n🔍 Digest (GET /api/digest)")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{BASE}/api/digest", params={"user_id": "yuki_demo"})
            data = resp.json()

            result("Digest returned", bool(data.get("digest")), data.get("digest", "")[:80])
    except Exception as e:
        result("Digest endpoint", False, str(e))


async def main():
    print("=" * 60)
    print("  VoiceMap AI Backend — Endpoint Tests")
    print("=" * 60)

    await test_health()
    session_id = await test_intent()
    if session_id:
        await test_confirm(session_id)
        await test_feedback(session_id)
    await test_clarify()
    await test_simplify()
    await test_digest()

    print("\n" + "=" * 60)
    print("  Tests complete!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
