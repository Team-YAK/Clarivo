# Clarivo

A communication system for aphasia patients that speaks in their own voice, learns who they are through every interaction, and gets smarter every time their caregiver answers one question.

---

## The Problem

1 in 3 stroke survivors develops aphasia — the inability to reliably form words despite fully intact understanding. The standard hardware solution costs $15,000. Speech therapy runs $200 per session. Most patients have nothing.

Clarivo runs on any laptop or tablet, for free.

---

## How It Works

The patient taps large icon-based buttons to express what they need. The system converts their selection into a natural sentence and speaks it aloud — in their own cloned voice. A caregiver panel sits alongside, giving full visibility and control to the person caring for them.

---

## Features

- **Voice cloning** — patient records 60 seconds of their voice during onboarding. ElevenLabs clones it. Every sentence the system speaks sounds like them.
- **Icon-based communication** — two input modes: a navigable decision tree and a free-form icon composer for more expressive combinations
- **Personalization engine** — caregiver fills in medical context, preferences, and daily routine. OpenAI uses all of it on every generation.
- **Post-session learning** — after every session, the system asks the caregiver one targeted question to fill a knowledge gap. The system gets more accurate over time.
- **Knowledge score** — a visible 0-100% bar showing how well the system knows the patient, broken down by profile, medical, preferences, and conversation history
- **Adaptive shortcuts** — frequently used paths surface automatically as one-tap shortcuts
- **Phrase predictions** — time-of-day aware suggestions before the patient taps anything
- **Urgency alerts** — red alert fires if patient expresses distress 3+ times within 2 hours
- **Two-voice system** — patient speaks in their cloned voice, caregiver-to-patient communication uses a distinct neutral voice
- **Caregiver dashboard** — 30-day analytics, daily AI digest, exportable PDF clinical report
- **Offline resilience** — common paths cached locally, app survives wifi failure

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts, Phosphor Icons |
| AI Backend | Python, FastAPI, OpenAI GPT-4o-mini (streaming), OpenAI GPT-4o |
| Voice | ElevenLabs (voice cloning + synthesis) |
| Data Backend | Python, FastAPI, MongoDB Atlas, Motor |
| Caching | MongoDB sentence cache + localStorage fallback |

---

## Project Structure

```
Clarivo/
├── shared/
│   ├── api-contract.ts      # API types and contracts
│   └── mock-data.ts         # Mock responses for frontend dev
├── frontend/                # Next.js app (Engineer 1)
├── backend-ai/              # OpenAI + ElevenLabs service (Engineer 2)
└── backend-data/            # MongoDB data service (Engineer 3)
```

---

## Local Setup

To get Clarivo running on your machine, follow these steps. If you don't have API keys (OpenAI/ElevenLabs) or MongoDB installed, you can still run the app in **Offline Mode**.

### 1. Environment Variables

Each service needs its own configuration file. Follow these steps to set them up:

**AI Backend (E2):**
```bash
cd backend-ai
cp .env.example .env
# Edit .env and set USE_MOCK=true if you don't have API keys
```

**Data Backend (E3):**
```bash
cd backend-data
cp .env.example .env
# Edit .env and set USE_MOCK_DB=true to run without MongoDB
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
```

### 2. Installation & Running

**AI Backend (Port 8001):**
```bash
cd backend-ai
pip install -r requirements.txt
python main.py
```

**Data Backend (Port 8002):**
```bash
cd backend-data
pip install -r requirements.txt
python main.py
```

**Frontend (Port 3000):**
```bash
cd frontend
npm install
npm run dev
```

---

## Offline Mode (No API Keys Required)

If you or your collaborators want to test the UI without setting up OpenAI, ElevenLabs, or MongoDB:

1. In `backend-ai/.env`, set `USE_MOCK=true`.
2. In `backend-data/.env`, set `USE_MOCK_DB=true`.
3. Start all three services as described above.

The app will use pre-defined mock responses for all AI and database operations, allowing you to navigate the UI and test the buttons immediately.

### Demo Mode

Open the app and click **"Load Demo Profile"** on the onboarding screen. This seeds the database with a complete patient profile (Yuki) and 30 days of session history, then drops you straight into the patient view.

---

## Services

| Service | Port |
|---------|------|
| Frontend | 3000 |
| AI Backend | 8001 |
| Data Backend | 8002 |

---

## Running Tests

```bash
# Full suite
python tests/runner.py --all

# Pre-demo check only
python tests/runner.py --demo
```

---

## Prize Categories

Built for Los Altos Hacks X targeting:
- Best Use of ElevenLabs
- Best Use of Gen AI
- Best Use of MongoDB Atlas
- Best Social Impact
- Best UI/UX
- Best .Tech Domain — [Clarivo.tech](https://Clarivo.tech)

---

## Team

Built at Los Altos Hacks X · April 11–12, 2026