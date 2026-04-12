
import os
import requests
from dotenv import load_dotenv

load_dotenv("backend-ai/.env")

def test_tts():
    api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("KISHAN_VOICE_ID")
    
    # Correct Endpoint for custom and preset voices
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    
    data = {
        "text": "Hello, this is Kishan's voice. If this sounds like a generic woman's voice, something is wrong.",
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.85,
            "style": 0.0,
            "use_speaker_boost": True
        }
    }
    
    print(f"Requesting TTS for voice_id: {voice_id}")
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code == 200:
        with open("scratch/kishan_test.mp3", "wb") as f:
            f.write(response.content)
        print("✓ Success! Audio saved to scratch/kishan_test.mp3")
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_tts()
