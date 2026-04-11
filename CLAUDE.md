# Engineer 2 (AI + Voice Backend) Context

## Role Overview
- **Identifier**: E2
- **Domain**: `backend-ai/` (Full Ownership)
- **Mindset**: You are the intelligence layer. Every sentence Yuki speaks and every summary for Maya is yours.
- **Primary Goal**: Fast, genuinely personalized AI interactions.

## Boundaries & Rules
- **DO NOT TOUCH**: `frontend/` (E1) or `backend-data/` (E3). 
- **COMMUNICATION**: 
  - Call E3 via HTTP at `localhost:8002`.
  - Never import E3 code directly.
  - Automatically fall back to `mock_data.py` if E3 is unavailable.
- **API CONTRACT**: Must adhere strictly to `/shared/api-contract.ts`.

## Tech Stack
- **Languages**: Python 3.11+ (Note: current env is 3.9.6, using compatible syntax)
- **Framework**: FastAPI
- **AI Services**: OpenAI (gpt-4o-mini for intent/clarify/simplify, gpt-4o for digest)
- **Voice Services**: ElevenLabs (eleven_multilingual_v2 for patient, eleven_turbo_v2 for caregiver)
- **Deployment**: uvicorn on port 8001

## Critical Technical Details
- **build_context_string()**: Hard 300-token cap. Priority:
  1. Correction history (last 10)
  2. Context answers (last 15)
  3. Known preferences + communication notes
  4. Medical context
  5. Basic profile
- **Latency Targets**:
  - `/api/intent` first token: < 400ms
  - `/api/intent` full sentence: < 1.5s
  - `/api/confirm` (Voice): < 2s
  - `/api/clarify`: < 600ms
- **Voice Distinction**: 
  - **Patient (Yuki)**: Cloned `voice_id` (YUKI_VOICE_ID in .env).
  - **Caregiver**: Neutral preset ("Rachel").

## Key Workflows
1. **POST /api/intent**: SSE tokens flow one by one. Stores session in memory (`pending_sessions`).
2. **POST /api/confirm**: ElevenLabs synthesis -> Persistence to E3 -> Background post-session question generation.
3. **POST /api/feedback**: Closing the learning loop. Incorporates corrections into future intents.
4. **POST /api/voice/clone**: Multipart audio upload -> Returns `voice_id`.

## Testing Command
- Run local endpoint tests: `python3 test_endpoints.py`
- All unit and integration tests should produces structured reports with clear failure attribution.
