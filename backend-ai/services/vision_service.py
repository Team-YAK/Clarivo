import os
import json
import logging

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None

logger = logging.getLogger(__name__)

_client = None

def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if AsyncOpenAI is None:
            raise RuntimeError("openai package is not installed")
        _client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client

VISION_SYSTEM_PROMPT = """You are the Clarivo Vision Analyst. Identify the concept in this patient's drawing to help them communicate. 
Return a single concept label and a suggested Unicode Emoji that visually represents the concept. 
Keep the label simple (e.g., 'Coffee', 'Pain', 'Bathroom').

Format your response exactly as a JSON object with two fields:
- "label": "The concept name"
- "iconKey": "The single unicode emoji" (e.g., '☕', '💔', '🛁')
"""

async def analyze_drawing(base64_image: str, context: str = "") -> dict:
    """
    Analyzes a base64 encoded user drawing (data URL) using GPT-4 Vision model
    and extracts a predicted label and icon.
    """
    try:
        # Check for mock
        if os.getenv("USE_MOCK") == "true" or not os.getenv("OPENAI_API_KEY"):
            logger.info("Using mock Vision API")
            return {"label": "Coffee", "iconKey": "Coffee"}

        if base64_image.startswith("data:image"):
            base64_image = base64_image.split(",")[1]

        resp = await get_client().chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": f"{VISION_SYSTEM_PROMPT}\n\nCurrent Patient Context:\n{context}"
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What did the patient draw?"},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}",
                                "detail": "low"
                            }
                        }
                    ]
                }
            ],
            response_format={ "type": "json_object" },
            max_tokens=100,
            temperature=0.4,
        )

        content = resp.choices[0].message.content.strip()
        data = json.loads(content)
        return {"label": data.get("label", "Unknown"), "iconKey": data.get("iconKey", "HelpCircle")}

    except Exception as e:
        logger.warning(f"Vision analysis failed: {e}")
        return {"label": "Error", "iconKey": "AlertCircle"}
