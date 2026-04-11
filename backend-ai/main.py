"""
Clarivo AI Backend — FastAPI app on port 8001.
E2: AI + Voice (brain + mouth)
"""

import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(title="VoiceMap AI Backend", version="1.0.0")

# CORS — allow frontend on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount audio files directory
audio_dir = Path("/tmp/voicemap_audio")
audio_dir.mkdir(exist_ok=True)
app.mount("/audio", StaticFiles(directory=str(audio_dir)), name="audio")

# Import and include routers
from routes.intent import router as intent_router
from routes.confirm import router as confirm_router
from routes.feedback import router as feedback_router
from routes.clarify import router as clarify_router
from routes.caregiver import router as caregiver_router
from routes.digest import router as digest_router
from routes.voice import router as voice_router
from routes.demo import router as demo_router

app.include_router(intent_router)
app.include_router(confirm_router)
app.include_router(feedback_router)
app.include_router(clarify_router)
app.include_router(caregiver_router)
app.include_router(digest_router)
app.include_router(voice_router)
app.include_router(demo_router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "VoiceMap AI Backend (E2)", "port": 8001}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
