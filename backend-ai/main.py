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

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Preload icon dictionary
    try:
        from services.icon_dictionary import ICON_DICTIONARY, ICON_DICTIONARY_PATH
        logging.info(
            "Loaded icon dictionary at startup: %s entries from %s",
            len(ICON_DICTIONARY),
            ICON_DICTIONARY_PATH,
        )
    except Exception as e:
        logging.error(f"Failed to preload icon dictionary: {e}")
    yield
    # Shutdown: (No-op)

app = FastAPI(title="VoiceMap AI Backend (E2)", version="1.0.0", lifespan=lifespan)

# CORS — allow frontend on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount audio files directory
audio_dir_path = os.getenv("AUDIO_OUTPUT_DIR", "audio_output")
audio_dir = Path(audio_dir_path)
audio_dir.mkdir(parents=True, exist_ok=True)
import time
now = time.time()
if audio_dir.exists():
    for f in audio_dir.iterdir():
        if f.is_file() and f.stat().st_mtime < now - 86400:
            try:
                f.unlink()
                logging.info(f"Cleaned up old audio file: {f.name}")
            except Exception as e:
                logging.error(f"Failed to delete {f.name}: {e}")

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
from routes.live import router as live_router
from routes.tree_ai import router as tree_ai_router
from routes.reverse import router as reverse_router
from routes.vision import router as vision_router

app.include_router(intent_router)
app.include_router(confirm_router)
app.include_router(feedback_router)
app.include_router(clarify_router)
app.include_router(caregiver_router)
app.include_router(digest_router)
app.include_router(voice_router)
app.include_router(demo_router)
app.include_router(live_router)
app.include_router(tree_ai_router)
app.include_router(reverse_router)
app.include_router(vision_router)

@app.get("/")
async def root():
    return {"status": "ok", "service": "VoiceMap AI Backend (E2)", "port": 8001}

@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    reload_enabled = os.getenv("CLARIVO_RELOAD", "false").lower() == "true"
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=reload_enabled)
