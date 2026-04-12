
import asyncio
import os
from database import connect_to_mongo, close_mongo_connection, MONGODB_URI
from services.seed_service import seed

async def run_manual_seed():
    print(f"Connecting to MongoDB with URI starting with: {MONGODB_URI[:25]}...")
    await connect_to_mongo()
    print("Running seed...")
    await seed()
    print("Seeding complete!")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(run_manual_seed())
