import sys
import asyncio
from dotenv import load_dotenv
load_dotenv()
sys.path.append('.')
from agents.crew_config import run_crew_pipeline

async def test():
    try:
        res = await run_crew_pipeline(["pain"], {})
        print("SUCCESS:", res)
    except Exception as e:
        print("ERROR:", e)

asyncio.run(test())
