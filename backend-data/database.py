import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "voicemap")

USE_MOCK = os.getenv("USE_MOCK_DB", "true").lower() == "true"

class Database:
    client: AsyncIOMotorClient = None
    db = None
    users = None
    sessions = None
    sentences = None
    context_log = None
    anchors = None
    tree_nodes = None
    icons = None

db = Database()

async def connect_to_mongo():
    if USE_MOCK:
        import mock_db
        db.users = mock_db.MockCollection("users")
        db.sessions = mock_db.MockCollection("sessions")
        db.sentences = mock_db.MockCollection("sentences")
        db.context_log = mock_db.MockCollection("context_log")
        db.anchors = mock_db.MockCollection("anchors")
        db.tree_nodes = mock_db.MockCollection("tree_nodes")
        db.icons = mock_db.MockCollection("icons")
        print("Using In-Memory MOCK Database (Missing MongoDB Daemon)")
        return

    try:
        # Lower timeout to not hang server startup
        db.client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
        db.db = db.client[DB_NAME]
        db.users = db.db.users
        db.sessions = db.db.sessions
        db.sentences = db.db.sentences
        db.context_log = db.db.context_log
        db.anchors = db.db.anchors
        db.tree_nodes = db.db.tree_nodes
        db.icons = db.db.icons
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
        db.tree_nodes = mock_db.MockCollection("tree_nodes")
        db.icons = mock_db.MockCollection("icons")

async def close_mongo_connection():
    if db.client:
        db.client.close()
