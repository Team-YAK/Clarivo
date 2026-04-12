
import os
import requests
from dotenv import load_dotenv

load_dotenv("backend-ai/.env")

api_key = os.getenv("ELEVENLABS_API_KEY")
voice_id = os.getenv("KISHAN_VOICE_ID")

print(f"--- Diagnostic for Voice ID: {voice_id} ---")

# 1. Fetch Voice Details
url = f"https://api.elevenlabs.io/v1/voices/{voice_id}"
headers = {"xi-api-key": api_key}
resp = requests.get(url, headers=headers)
if resp.status_code != 200:
    print(f"✗ Failed to fetch voice: {resp.status_code} {resp.text}")
    exit(1)

voice_data = resp.json()
print(f"✓ Name: {voice_data.get('name')}")
print(f"✓ Category: {voice_data.get('category')}")
print(f"✓ Fine-tuned: {voice_data.get('fine_tuning', {}).get('is_allowed_to_fine_tune')}")

# 2. Test Synthesis with MULTILINGUAL_V2 (Current logic)
print("\n--- Testing Synthesis (Multilingual V2) ---")
syn_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
payload = {
    "text": "This is a test of the multilingual v2 model.",
    "model_id": "eleven_multilingual_v2",
    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
}
resp = requests.post(syn_url, json=payload, headers=headers)
if resp.status_code == 200:
    print("✓ Multilingual V2 Success!")
else:
    print(f"✗ Multilingual V2 Failed: {resp.status_code}")
    print(resp.text)

# 3. Test Synthesis with MONOLINGUAL_V1 (Fallback check)
print("\n--- Testing Synthesis (Monolingual V1) ---")
payload["text"] = "This is a test of the monolingual v1 model."
payload["model_id"] = "eleven_monolingual_v1"
resp = requests.post(syn_url, json=payload, headers=headers)
if resp.status_code == 200:
    print("✓ Monolingual V1 Success!")
else:
    print(f"✗ Monolingual V1 Failed: {resp.status_code}")
    print(resp.text)
