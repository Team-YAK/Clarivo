# Clarivo — Full Implementation Plan



## Context



The frontend is ~35% complete (static UI, zero backend integration), while both backends are ~80-85% complete. The frontend needs the most work, so it gets split into two engineers. One engineer handles both backends + infrastructure.



### Bugs Found During Scan

1. **`backend-ai/routes/feedback.py:101`** — calls `save_correction(user_id, correction_data_dict)` with 2 args, but `data_service.py` defines `save_correction(user_id, session_id, correction)` with 3. Runtime error on correction submit.

2. **`backend-data/routes/frontend.py`** — dead code (not registered in `main.py`). Has missing `get_insights` import. Should be deleted.

3. **`shared/api-contract.ts`** — referenced in CLAUDE.md but doesn't exist.



---



## Engineer Split



| Engineer | Ownership | Key Files |

|----------|-----------|-----------|

| **E1 — Patient Frontend** | `frontend/src/components/patient/`, `frontend/src/utils/patientApi.ts` | `ButtonGrid.tsx`, new `IconComposer.tsx`, `SentenceOutput.tsx`, `AudioPlayer.tsx` |

| **E2 — Caregiver Frontend** | `frontend/src/components/caregiver/`, `frontend/src/utils/caregiverApi.ts` | `CaregiverPanel.tsx`, new `InsightsDashboard.tsx`, `VoiceCloneOnboarding.tsx`, `CorrectionEditor.tsx` |

| **E3 — Backend + Infra** | `backend-ai/`, `backend-data/`, `shared/`, `frontend/src/types/`, `frontend/src/utils/api.ts`, `frontend/.env.local` | Route files, services, types, env config |



Shared page `frontend/src/app/patient/page.tsx` — E3 owns layout; E1/E2 request changes.



---



## Phase 0: Day 1 Blockers (E3 first)



E3 must complete before E1/E2 start real API work:



- [ ] Create `shared/api-contract.ts` with all request/response types for both backends

- [ ] Create `frontend/src/types/index.ts` mirroring contract types

- [ ] Update `frontend/src/utils/api.ts` — add base URLs (`NEXT_PUBLIC_AI_URL`, `NEXT_PUBLIC_DATA_URL`), shared fetch helper, default user ID

- [ ] Create `frontend/.env.local` with `NEXT_PUBLIC_AI_URL=http://localhost:8001`, `NEXT_PUBLIC_DATA_URL=http://localhost:8002`, `NEXT_PUBLIC_DEFAULT_USER_ID=alex_demo`

- [ ] Create `frontend/src/utils/iconMap.ts` — maps string icon names from DB (e.g. `"fork-knife"`) to Phosphor React components (e.g. `ForkKnife`)

- [ ] Fix `backend-ai/routes/feedback.py` save_correction call signature

- [ ] Delete dead `backend-data/routes/frontend.py`



---



## Phase 1: Parallel Development



### E1 — Patient Frontend



**1.1 `patientApi.ts`** — API client for patient flows

- SSE client for `POST /api/intent` (ReadableStream)

- `fetchTreeRoot()`, `fetchTreeChildren(parentKey)`, `fetchPredictions()`, `fetchShortcuts()`, `fetchIcons()`, `searchIcons()`, `confirmSession()`, `fetchNextLikely()`



**1.2 Refactor `ButtonGrid.tsx` — dynamic decision tree**

- Fetch root categories from `GET /api/tree/root` on mount (currently hardcoded 9 buttons)

- On button click → `fetchTreeChildren(node.key)` → re-render grid with children

- Track breadcrumb as `TreeNode[]`, wire back button to pop

- On leaf click → trigger intent generation (1.4)

- Map DB icon names to Phosphor components via `iconMap.ts`



**1.3 New: `IconComposer.tsx`** — free-form icon selection

- Toggle via existing SquaresFour/Keyboard mode switch

- Render icon grid from `fetchIcons()` grouped by category

- "Sentence tray" at bottom showing selected icons

- `fetchNextLikely()` for predictive next-icon suggestions

- Submit sends icon array as `path` to `/api/intent`



**1.4 New: `SentenceOutput.tsx`** — streaming sentence display

- Consume SSE from `/api/intent`, show tokens with typewriter effect

- On `done` event: show full sentence + confidence badge

- "Speak" button → calls `/api/confirm`

- Clarification UI: if confidence < threshold, show options from `/api/clarify`



**1.5 New: `AudioPlayer.tsx`** — voice playback

- After `/api/confirm` returns `audio_url`, render `<audio>` element

- Large play/pause/replay buttons (aphasia accessibility)

- Auto-play on confirm



**1.6 Quick response bar** — wire to real predictions

- Replace hardcoded 4 icons with `fetchPredictions(userId, currentHour)`

- On tap → skip tree, go straight to intent generation



**1.7 Shortcut bar** — wire to real data

- Replace hardcoded Pill/Drop/PhoneCall with `fetchShortcuts(userId)`



**1.8 MongoDB Atlas setup**

- Create MongoDB Atlas cluster and get connection URI

- Update `backend-data/.env` with real `MONGODB_URI`

- Create indexes: `sessions` on `{user_id, timestamp}`, `tree_nodes` on `{parent_key}`, `sentences` on `{user_id, path_key}`

- Run `python3 seed_demo.py` to populate demo data (Yuki profile, tree nodes, icons, sample sessions)

- Verify backend-data connects successfully and seed data is queryable



**1.9 Loading states** — skeletons while fetching, error toasts, SSE retry



---



### E2 — Caregiver Frontend



**2.1 `caregiverApi.ts`** — API client for caregiver flows

- `fetchCaregiverPanel()`, `fetchSessionHistory()`, `fetchInsights()`, `fetchKnowledgeScore()`, `submitContextAnswer()`, `submitFeedback()`, `fetchDigest()`, `simplifyText()`, `cloneVoice()`, `submitMoodLog()`, `fetchMoodLog()`



**2.2 Refactor `CaregiverPanel.tsx` — wire real data**

- Replace all mock fetches with real API calls

- Live activity from `fetchCaregiverPanel()` → `last_session` field

- Knowledge score from `GET /api/knowledge_score` with real breakdown

- Urgency from `caregiver_panel.urgent` boolean

- Session history from `GET /api/sessions/history`



**2.3 Session history with feedback controls**

- Expand session cards: sentence, confidence, path breadcrumb, timestamp

- Thumbs up/down buttons per session

- Correction text input on thumbs-down → `submitFeedback()`

- Show feedback status (already rated, pending)



**2.4 Context question engine**

- Display `pending_question` from caregiver panel

- Answer submission → `submitContextAnswer()`

- "No questions" empty state



**2.5 New: `InsightsDashboard.tsx`** — Recharts visualizations

- `sessions_by_day` → BarChart (14-day frequency)

- `top_paths` → horizontal BarChart

- `sessions_by_period` → PieChart (morning/afternoon/evening)

- `mood_log` → LineChart (14-day trend)



**2.6 New: `VoiceCloneOnboarding.tsx`**

- Instructions → file upload (.mp3/.wav/.m4a) → progress → `POST /api/voice/clone` → confirmation



**2.7 New: `CorrectionEditor.tsx`**

- Click session → show original sentence → edit → save correction via feedback endpoint



**2.8 Daily digest display**

- "Daily Summary" button → `fetchDigest()` → display text



**2.9 Loading states** — skeletons, empty states, error boundaries for charts



---



### E3 — Backend + Infrastructure



**3.1 Phase 0 deliverables** (see above)



**3.2 Add `GET /api/live` to backend-ai**

- New file: `backend-ai/routes/live.py`

- Returns current state from `pending_sessions` dict: `{mode, breadcrumb, streamingSentence}`

- Register in `main.py`



**3.3 Add question polling**

- `GET /api/question/pending?user_id=` — checks most recent session for populated `post_session_question`

- Frontend polls after confirming a session



**3.4 ~~MongoDB Atlas setup~~ — MOVED TO E1**



**3.5 Environment files**

- `backend-ai/.env.example`, `backend-data/.env.example`, `frontend/.env.example`

- Ensure `.gitignore` excludes `.env` with real keys



**3.6 CORS audit**

- backend-ai allows `localhost:3000` only — OK for dev

- backend-data allows `*` — tighten to match



**3.7 Integration testing**

- Verify E2→E3 HTTP communication

- Full flow: tree root → children → leaf → intent SSE → confirm → feedback

- Voice clone with real audio file

- Caregiver panel + insights with seeded data



---



## Phase 2: Integration (Days 3-4)



- **E1 + E3**: Tree navigation → intent SSE → confirm → audio playback end-to-end

- **E2 + E3**: Panel hydration → feedback → knowledge score update end-to-end

- **E1 + E2 coordination**: When patient confirms session (E1), caregiver panel (E2) should update. Options:

  - Shared React context with a `sessionConfirmed` event

  - E2 polls `/api/live` every 2-3 seconds

  - Recommendation: simple polling (simpler, avoids shared state complexity)



---



## Phase 3: Polish (Days 4-5)



- Accessibility: large touch targets, screen reader labels, high contrast

- Tablet responsive layout (primary device)

- Error recovery and offline graceful degradation

- Sound on audio playback completion



---



## Dependency Graph



```

E3 Phase 0 (types, api config, iconMap) ──┬──> E1 Task 1.1 (patientApi)

                                           └──> E2 Task 2.1 (caregiverApi)



E1 1.8 (MongoDB Atlas + seed) ──> All real API testing

E3 3.2 (/api/live) ──> E2 2.2 (live activity)

E3 3.3 (question polling) ──> E2 2.4 (question engine)



E1 1.2 (tree nav) ──> E1 1.4 (SSE streaming)

E1 1.4 (SSE) ──> E1 1.5 (audio playback)

E1 1.3 (composer) ──> E1 1.4 (SSE)



E2 2.2 (panel wiring) ──> E2 2.3 (feedback)

E2 2.5 (insights) — independent

E2 2.6 (voice clone) — independent

```



---



## Verification Checklist



1. Patient taps Food → Dessert → Tiramisu → sentence streams → "Speak" → audio plays in user's voice

2. Caregiver sees session in history → thumbs down with correction → knowledge score updates

3. Caregiver answers context question → score increases

4. Quick response bar shows time-aware predictions that change by hour

5. Icon composer: select 🏃 + ☀️ + Morning → "I want to go for a morning run" streams in

6. Insights dashboard renders 4 charts with real seeded data

7. Voice clone upload succeeds → subsequent confirm uses cloned voice

8. Urgency alert fires after 3+ distress sessions in 2 hours



---



## Infrastructure Setup Checklist



| Item | Owner | Status |

|------|-------|--------|

| MongoDB Atlas URI | E1 | Needed |

| OpenAI API key (in backend-ai/.env) | E3 | Verify active |

| ElevenLabs API key (in backend-ai/.env) | E3 | Verify active |

| `npm install` in frontend/ | All | Run once |

| `pip install -r requirements.txt` in both backends | All | Run once |

| `python3 seed_demo.py` against MongoDB | E1 | After Atlas setup |

| Three terminals: frontend (3000), backend-ai (8001), backend-data (8002) | All | Dev workflow |

