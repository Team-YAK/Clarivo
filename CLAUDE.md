# Engineer 3 (Backend — AI + Data + Infrastructure) Context

## Role Overview
- **Identifier**: E3 (sole backend engineer)
- **Domain**: `backend-ai/` + `backend-data/` + `shared/` (Full Ownership)
- **Mindset**: You own the entire backend stack. Every API endpoint, every database query, every AI call.
- **Primary Goal**: Reliable, fast, personalized backend powering the Clarivo AAC system.

## Boundaries & Rules
- **DO NOT TOUCH**: `frontend/` — the frontend engineer owns all files in `frontend/`.
- **COMMUNICATION**: 
  - `backend-ai` (port 8001) calls `backend-data` (port 8002) via HTTP.
  - Never import backend-data code directly into backend-ai.
  - Automatically fall back to `mock_data.py` if backend-data is unavailable.
- **API CONTRACT**: Must adhere strictly to `/shared/api-contract.ts`.

## Tech Stack
- **Languages**: Python 3.11+ (Note: current env is 3.9.6, using compatible syntax)
- **Framework**: FastAPI (both services)
- **AI Services**: OpenAI (gpt-4o-mini for intent/clarify/simplify, gpt-4o for digest)
- **Voice Services**: ElevenLabs (eleven_multilingual_v2 for patient, eleven_turbo_v2 for caregiver)
- **Database**: MongoDB Atlas via Motor (async driver) in backend-data
- **Deployment**: uvicorn — backend-ai on port 8001, backend-data on port 8002

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
  - **Patient (Kishan)**: Cloned `voice_id` (KISHAN_VOICE_ID in .env).
  - **Caregiver**: Neutral preset ("Rachel").
- **Path Key Standard**: `→` delimiter. Examples: `food→dessert→tiramisu`, `composer→running→sun`

## Key Workflows
1. **POST /api/intent**: SSE tokens flow one by one. Stores session in memory (`pending_sessions`).
2. **POST /api/confirm**: ElevenLabs synthesis -> Persistence to E3 -> Background post-session question generation.
3. **POST /api/feedback**: Closing the learning loop. Incorporates corrections into future intents.
4. **POST /api/voice/clone**: Multipart audio upload -> Returns `voice_id`.

## MongoDB Collections
- `users` — patient profiles, preferences, path_frequencies, knowledge_score
- `sessions` — communication sessions with feedback and corrections
- `sentences` — cached sentence results per path_key per user
- `tree_nodes` — decision tree navigation structure
- `icons` — composer mode icon library
- `context_log` — audit trail of caregiver answers

## Testing Commands
- Run AI backend endpoint tests: `cd backend-ai && python3 test_endpoints.py`
- Run data backend: `cd backend-data && python main.py`
- Seed demo data: `curl -X POST http://localhost:8002/api/demo/seed`
- Full suite: `python tests/runner.py --all`
