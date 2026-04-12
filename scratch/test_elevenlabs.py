
import os
import requests
from dotenv import load_dotenv

load_dotenv("backend-ai/.env")

api_key = os.getenv("ELEVENLABS_API_KEY")
voice_id = os.getenv("KISHAN_VOICE_ID")

print(f"Testing ElevenLabs with Voice ID: {voice_id}")
print(f"API Key (last 6): ...{api_key[-6:]}")

url = f"https://api.elevenlabs.io/v1/voices/{voice_id}"
headers = {
    "xi-api-key": api_key
}

try:
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Success: Voice '{data.get('name')}' found!")
    else:
        print(f"✗ Error: Received status code {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"✗ Exception: {e}")
