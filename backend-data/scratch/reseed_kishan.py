import asyncio
from database import connect_to_mongo
from services.seed_service import seed

async def main():
    print("Connecting to MongoDB...")
    await connect_to_mongo()
    print("Starting seed process...")
    await seed()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
