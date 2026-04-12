
import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv("backend-ai/.env")

async def test_confirm():
    # We need a session ID. Let's try to trigger an intent first, or just mock the confirm.
    # But wait, confirm.py fetches from 'pending_sessions' which is in memory.
    # So I can't easily test it from a script while the server is running.
    
    # HOWEVER, I can check if backend-ai can reach backend-data.
    e3_url = os.getenv("E3_BASE_URL", "http://localhost:8002")
    user_id = "alex_demo"
    
    print(f"Testing connectivity to E3: {e3_url}")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{e3_url}/api/profile", params={"user_id": user_id})
            if resp.status_code == 200:
                user = resp.json()
                print(f"✓ Success: Fetched user '{user.get('profile', {}).get('name')}'")
                print(f"  Voice ID in DB: '{user.get('voice_id')}'")
                print(f"  Fallback Voice in Env: '{os.getenv('KISHAN_VOICE_ID')}'")
            else:
                print(f"✗ E3 Error: {resp.status_code}")
                print(resp.text)
    except Exception as e:
        print(f"✗ Connectivity Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_confirm())
