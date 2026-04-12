"""
Purge all collections and reseed with demo data.

Usage:
    python scripts/purge_and_reseed.py           # Execute purge + reseed
    python scripts/purge_and_reseed.py --dry-run  # Print what would be deleted
"""

import asyncio
import sys
import os

# Allow imports from parent directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import connect_to_mongo, close_mongo_connection, db
from services.seed_service import seed

COLLECTIONS_TO_PURGE = [
    "users", "sessions", "sentences", "context_log",
    "conversations", "prompts", "icons",
]


async def purge_and_reseed(dry_run: bool = False):
    await connect_to_mongo()

    for name in COLLECTIONS_TO_PURGE:
        collection = getattr(db, name, None)
        if collection is None:
            print(f"  [skip] {name} — collection not found")
            continue
        count = await collection.count_documents({})
        if dry_run:
            print(f"  [dry-run] {name} — would delete {count} documents")
        else:
            await collection.delete_many({})
            print(f"  [purged] {name} — deleted {count} documents")

    if dry_run:
        print("\nDry run complete. No data was deleted.")
    else:
        print("\nReseeding demo data...")
        await seed()
        print("Done. alex_demo user and demo sessions created.")

    await close_mongo_connection()


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    asyncio.run(purge_and_reseed(dry_run=dry))
