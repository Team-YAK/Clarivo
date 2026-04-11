import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "voicemap")

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
    db.client = AsyncIOMotorClient(MONGODB_URI)
    db.db = db.client[DB_NAME]
    db.users = db.db.users
    db.sessions = db.db.sessions
    db.sentences = db.db.sentences
    db.context_log = db.db.context_log
    db.anchors = db.db.anchors
    db.tree_nodes = db.db.tree_nodes
    db.icons = db.db.icons

async def close_mongo_connection():
    if db.client:
        db.client.close()
