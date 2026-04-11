import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import connect_to_mongo, close_mongo_connection
from routes.tree import router as tree_router
from routes.buttons import router as buttons_router
from routes.icons import router as icons_router
from routes.sentences import router as sentences_router
from routes.shortcuts import router as shortcuts_router
from routes.sessions import router as sessions_router
from routes.profile import router as profile_router
from routes.aggregations import router as aggregations_router
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
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

app.include_router(tree_router)
app.include_router(buttons_router)
app.include_router(icons_router)
app.include_router(sentences_router)
app.include_router(shortcuts_router)
app.include_router(sessions_router)
app.include_router(profile_router)
app.include_router(aggregations_router)
from routes.demo import router as demo_router
app.include_router(demo_router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "Clarivo Data Backend (E3)", "port": 8002}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8002))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
