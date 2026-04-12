import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()
from database import connect_to_mongo, close_mongo_connection
from routes.icons import router as icons_router
from routes.sentences import router as sentences_router
from routes.sessions import router as sessions_router
from routes.profile import router as profile_router
from routes.aggregations import router as aggregations_router
from routes.conversations import router as conversations_router
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    # If we are using mock collections, seed them immediately so endpoints don't 404
    from database import db, USE_MOCK
    # Check if we are in mock mode (either explicitly or via connection failure fallback)
    # A good indicator is if the users collection is a MockCollection
    if hasattr(db.users, "_data"):
        from services.seed_service import seed
        logging.info("Seeding Mock Database for alex_demo...")
        await seed()
    yield
    await close_mongo_connection()

app = FastAPI(title="Clarivo Data Backend (E3)", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(icons_router)
app.include_router(sentences_router)
app.include_router(sessions_router)
app.include_router(profile_router)
app.include_router(aggregations_router)
app.include_router(conversations_router)
from routes.demo import router as demo_router
app.include_router(demo_router)
from routes.glossary import router as glossary_router
app.include_router(glossary_router)
from routes.prompts import router as prompts_router
app.include_router(prompts_router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "Clarivo Data Backend (E3)", "port": 8002}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8002))
    reload_enabled = os.getenv("CLARIVO_RELOAD", "false").lower() == "true"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=reload_enabled)
