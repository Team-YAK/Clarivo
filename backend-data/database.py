import os
from dotenv import load_dotenv

try:
    from motor.motor_asyncio import AsyncIOMotorClient
except ImportError:  # pragma: no cover - exercised in envs without optional deps
    AsyncIOMotorClient = None

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "voicemap")

USE_MOCK = os.getenv("USE_MOCK_DB", "false").lower() == "true"

class Database:
    client: AsyncIOMotorClient = None
    db = None
    users = None
    sessions = None
    sentences = None
    context_log = None
    anchors = None
    icons = None
    conversations = None

db = Database()

async def connect_to_mongo():
    if USE_MOCK or AsyncIOMotorClient is None:
        import mock_db
        db.users = mock_db.MockCollection("users")
        db.sessions = mock_db.MockCollection("sessions")
        db.sentences = mock_db.MockCollection("sentences")
        db.context_log = mock_db.MockCollection("context_log")
        db.anchors = mock_db.MockCollection("anchors")
        db.icons = mock_db.MockCollection("icons")
        db.conversations = mock_db.MockCollection("conversations")
        if AsyncIOMotorClient is None:
            print("MongoDB driver unavailable. Using In-Memory MOCK Database.")
        else:
            print("Using In-Memory MOCK Database (Missing MongoDB Daemon)")
        return

    try:
        # tlsAllowInvalidCertificates=True bypasses SSL cert issues on macOS venvs
        db.client = AsyncIOMotorClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            tlsAllowInvalidCertificates=True,
        )
        db.db = db.client[DB_NAME]
        db.users = db.db.users
        db.sessions = db.db.sessions
        db.sentences = db.db.sentences
        db.context_log = db.db.context_log
        db.anchors = db.db.anchors
        db.icons = db.db.icons
        db.conversations = db.db.conversations
        # Pinging to check if reachable
        await db.db.command("ping")
    except Exception as e:
        print(f"MongoDB connection failed: {e}. Falling back to MOCK DB.")
        import mock_db
        db.users = mock_db.MockCollection("users")
        db.sessions = mock_db.MockCollection("sessions")
        db.sentences = mock_db.MockCollection("sentences")
        db.context_log = mock_db.MockCollection("context_log")
        db.anchors = mock_db.MockCollection("anchors")
        db.icons = mock_db.MockCollection("icons")
        db.conversations = mock_db.MockCollection("conversations")

async def close_mongo_connection():
    if db.client:
        db.client.close()
