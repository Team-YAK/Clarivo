# Clarivo — Backend Implementation Plan (E3)

## Context

E3 is the sole backend engineer owning both `backend-ai/` (port 8001) and `backend-data/` (port 8002). MongoDB Atlas is connected via `.env`. All API keys (OpenAI, ElevenLabs) are active. The frontend is owned by a separate engineer — **do not modify any files in `frontend/`**.

---

## Architecture

```
Frontend (Next.js :3000)
    ├── Patient View → patientApi.ts (local mock data, does NOT call backend)
    └── Caregiver View → caregiverApi.ts
            ├── GET /api/caregiver/panel    → backend-data :8002
            ├── GET /api/sessions/history   → backend-data :8002
            ├── GET /api/insights           → backend-data :8002
            ├── POST /api/context/answer    → backend-data :8002
            ├── POST /api/feedback          → backend-ai :8001
            ├── GET /api/digest             → backend-ai :8001
            └── POST /api/voice/clone       → backend-ai :8001

backend-ai (FastAPI :8001)            backend-data (FastAPI :8002)
    ├── /api/intent (SSE)                  ├── /api/tree/root
    ├── /api/confirm                       ├── /api/tree/children
    ├── /api/feedback                      ├── /api/icons
    ├── /api/clarify                       ├── /api/sessions/create
    ├── /api/caregiver/simplify            ├── /api/sessions/history
    ├── /api/digest                        ├── /api/caregiver/panel
    ├── /api/voice/clone                   ├── /api/insights
    ├── /api/live                          ├── /api/predictions
    └── /api/demo/seed (proxy)             ├── /api/shortcuts
                                           ├── /api/profile
                  E2 ──HTTP──► E3          ├── /api/context/answer
                                           ├── /api/knowledge_score
                                           ├── /api/mood/log
                                           ├── /api/settings/update
                                           └── /api/demo/seed
```

---

## Completed Work

### Phase 1: MongoDB Atlas Connection ✅
- [x] `backend-data/.env` — Atlas URI configured, `USE_MOCK_DB=false`
- [x] `backend-data/database.py` — default changed from mock to real MongoDB

### Phase 2: E2 → E3 Data Flow ✅
- [x] `backend-ai/services/data_service.py` — `create_session()` now includes `path_key` and `input_mode`
- [x] `backend-ai/services/data_service.py` — `save_context_question()` fixed to accept `user_id` and find latest session
- [x] `backend-ai/routes/confirm.py` — passes `path_key` and `input_mode` to `create_session`

### Phase 3: Response Format Fixes ✅
- [x] `backend-data/routes/sessions.py` — `GET /api/sessions/history` returns `{sessions: [...]}`
- [x] `backend-data/routes/sessions.py` — `SessionCreate` auto-generates `path_key` from `path`, accepts E2's `session_id`
- [x] `backend-data/routes/sessions.py` — `create_session` now auto-increments path frequencies and confirms immediately
- [x] `backend-data/main.py` — added `GET /health`, `GET /`, logging

### Phase 4: Dead Code Removal ✅
- [x] Deleted `backend-data/routes/internal.py` — duplicate routes not registered in main.py

### Phase 5: Seed Data ✅
- [x] `seed_demo.py` — `voice_id` set to empty string for env cascade
- [x] `seed_service.py` — Added `interface_settings`, `routine`, `correction_history`, `context_answers`, `always_know`
- [x] `mock_db.py` — Added `$push`, `$pull`, `$unset`, `$slice` support

### Phase 6: Context Data Consistency ✅
- [x] `context_service.py` — handles both `corrected` and `corrected_sentence` field names
- [x] `mock_data.py` — added `corrected_sentence` and `original_sentence` fields

### Phase 7: Infrastructure ✅
- [x] `CLAUDE.md` — updated for E3 sole backend ownership
- [x] CORS already correct on both backends (localhost:3000 only)

---

## API Endpoints — Complete Reference

### backend-ai (port 8001)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/health` | Health check | ✅ |
| POST | `/api/intent` | SSE streaming sentence generation | ✅ |
| POST | `/api/confirm` | ElevenLabs synthesis + persist session | ✅ |
| POST | `/api/feedback` | Learning from corrections | ✅ |
| POST | `/api/clarify` | Low-confidence alternatives | ✅ |
| POST | `/api/caregiver/simplify` | Simplify text for patient | ✅ |
| GET | `/api/digest` | Daily caregiver summary (GPT-4o) | ✅ |
| POST | `/api/voice/clone` | Upload audio → clone voice | ✅ |
| GET | `/api/live` | Current patient session state | ✅ |
| POST | `/api/demo/seed` | Proxy to E3 seed | ✅ |

### backend-data (port 8002)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/health` | Health check | ✅ |
| GET | `/api/tree/root` | Root decision tree categories | ✅ |
| GET | `/api/tree/children` | Children of a tree node | ✅ |
| GET | `/api/tree/leaf` | Single leaf node lookup | ✅ |
| GET | `/api/icons` | Composer mode icons | ✅ |
| GET | `/api/icons/search` | Search icons by tag/label | ✅ |
| POST | `/api/sessions/create` | Create + confirm session | ✅ |
| POST | `/api/sessions/confirm` | Confirm a pending session | ✅ |
| POST | `/api/sessions/update` | Update session fields | ✅ |
| GET | `/api/sessions/history` | Session history (wrapped) | ✅ |
| POST | `/api/feedback` | Submit feedback on session | ✅ |
| GET | `/api/question/pending` | Get unanswered post-session question | ✅ |
| GET | `/api/profile` | Full user profile | ✅ |
| POST | `/api/profile/update` | Update profile field | ✅ |
| POST | `/api/context/answer` | Submit caregiver answer | ✅ |
| GET | `/api/context/answers` | Get all context answers | ✅ |
| GET | `/api/knowledge_score` | Knowledge score breakdown | ✅ |
| POST | `/api/mood/log` | Log daily mood | ✅ |
| GET | `/api/mood/log` | Get mood history | ✅ |
| POST | `/api/settings/update` | Update interface settings | ✅ |
| GET | `/api/caregiver/panel` | Caregiver dashboard data | ✅ |
| GET | `/api/insights` | 14-day analytics | ✅ |
| GET | `/api/predictions` | Time-aware predictions | ✅ |
| GET | `/api/shortcuts` | Frequent path shortcuts | ✅ |
| GET | `/api/frequencies` | Raw path frequencies | ✅ |
| GET | `/api/frequencies/next_likely` | Next icon prediction | ✅ |
| POST | `/api/sentences/cache` | Cache a generated sentence | ✅ |
| GET | `/api/sentences/cached` | Get cached sentence | ✅ |
| POST | `/api/sentences/invalidate` | Invalidate cache entry | ✅ |
| POST | `/api/buttons/add` | Add custom button | ✅ |
| GET | `/api/buttons/custom` | Get user's custom buttons | ✅ |
| DELETE | `/api/buttons/custom/{id}` | Delete custom button | ✅ |
| POST | `/api/demo/seed` | Seed demo data | ✅ |

---

## Known Limitation

The patient-side frontend (`patientApi.ts`) uses hardcoded local mock data and does NOT call the backend for tree navigation or intent streaming. This is a frontend-owned file and cannot be modified by E3. The caregiver dashboard (`caregiverApi.ts`) DOES call real backend endpoints and is fully functional.

---

## Verification

### Quick Smoke Test
```bash
# 1. Start both backends
python start.py

# 2. Seed demo data
curl -X POST http://localhost:8002/api/demo/seed

# 3. Verify data layer
curl http://localhost:8002/health
curl http://localhost:8002/api/tree/root
curl "http://localhost:8002/api/caregiver/panel?user_id=alex_demo"
curl "http://localhost:8002/api/sessions/history?user_id=alex_demo"
curl "http://localhost:8002/api/insights?user_id=alex_demo"

# 4. Verify AI layer
curl http://localhost:8001/health
cd backend-ai && python test_endpoints.py
```

### Demo Checklist
1. ✅ Caregiver panel shows real knowledge score
2. ✅ Session history table populates with seeded sessions
3. ✅ Urgency alert fires (3 distress sessions seeded)
4. ✅ Context question card appears if pending
5. ✅ Feedback thumbs up/down persists to DB
6. ✅ Correction invalidates sentence cache
7. ✅ Voice clone upload → ElevenLabs API
8. ✅ Daily digest generates via GPT-4o

---

## Environment Variables

### backend-ai/.env
```
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=sk_...
YUKI_VOICE_ID=kZMkZDS1CEEqIA2z3WtJ
E3_BASE_URL=http://localhost:8002
USE_MOCK=false
```

### backend-data/.env
```
MONGODB_URI=mongodb+srv://...
DB_NAME=voicemap
PORT=8002
USE_MOCK_DB=false
```

### frontend/.env.local
```
NEXT_PUBLIC_AI_URL=http://localhost:8001
NEXT_PUBLIC_DATA_URL=http://localhost:8002
NEXT_PUBLIC_DEFAULT_USER_ID=alex_demo
```
