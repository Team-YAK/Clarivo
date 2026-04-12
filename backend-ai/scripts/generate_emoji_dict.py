import urllib.request
import json
import re
import os
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parents[2]
SHARED_DIR = ROOT_DIR / "shared"
SHARED_DIR.mkdir(exist_ok=True)
OUT_PATH = SHARED_DIR / "emoji-dictionary.json"

# URLs
WORDS_URL = "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt"
EMOJI_JSON_URL = "https://raw.githubusercontent.com/github/gemoji/master/db/emoji.json"

STOP_WORDS = {
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
    "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", 
    "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", 
    "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", 
    "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", 
    "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", 
    "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", 
    "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", 
    "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", 
    "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", 
    "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", 
    "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"
}

def download_data():
    print("Downloading Google 10k words...")
    words_req = urllib.request.urlopen(WORDS_URL)
    words = words_req.read().decode('utf-8').splitlines()
    
    print("Downloading emoji dataset...")
    emoji_req = urllib.request.urlopen(EMOJI_JSON_URL)
    emojis = json.loads(emoji_req.read().decode('utf-8'))
    
    return words, emojis

def build_emoji_index(emojis):
    index = {}
    
    for item in emojis:
        emoji_char = item.get("emoji")
        if not emoji_char:
            continue
            
        # Priority 1: Aliases
        for alias in item.get("aliases", []):
            alias_clean = alias.lower().replace("_", " ")
            for word in alias_clean.split():
                if word not in index:
                    index[word] = emoji_char
            if alias_clean not in index:
                index[alias_clean] = emoji_char
                
        # Priority 2: Tags
        for tag in item.get("tags", []):
            tag_clean = tag.lower().strip()
            if tag_clean not in index:
                index[tag_clean] = emoji_char
                
        # Priority 3: Description words
        desc = item.get("description", "").lower()
        desc_words = re.findall(r'\b\w+\b', desc)
        for w in desc_words:
            if w not in STOP_WORDS and len(w) > 2 and w not in index:
                index[w] = emoji_char
                
    return index

def main():
    words, emojis = download_data()
    emoji_index = build_emoji_index(emojis)
    
    word_to_emoji = {}
    
    print(f"Loaded {len(words)} words and {len(emojis)} emojis.")
    
    # Process 10k words
    for w in words:
        w_clean = w.strip().lower()
        if not w_clean or w_clean in STOP_WORDS or len(w_clean) < 3:
            continue
            
        if w_clean in emoji_index:
            word_to_emoji[w_clean] = emoji_index[w_clean]
    
    # Fallback to current icon-dictionary mapping concepts
    fallback_map = {
        "acorn": "🌰", "address-book": "📓", "alien": "👽", "ambulance": "🚑", 
        "apple": "🍎", "baby": "👶", "bag": "👜", "ball": "⚽", "bank": "🏦",
        "bath": "🛁", "bed": "🛏️", "beer": "🍺", "bicycle": "🚲", "bird": "🐦",
        "book": "📚", "bowl": "🥣", "brain": "🧠", "bread": "🍞", "bug": "🐛",
        "bus": "🚌", "cake": "🍰", "car": "🚗", "cat": "🐱", "cheese": "🧀",
        "city": "🏙️", "clock": "🕒", "cloud": "☁️", "coffee": "☕", "computer": "💻",
        "cow": "🐄", "dog": "🐶", "door": "🚪", "dress": "👗", "egg": "🥚",
        "eye": "👁️", "fire": "🔥", "fish": "🐟", "flag": "🚩", "flower": "🌸",
        "food": "🍽️", "game": "🎮", "gift": "🎁", "girl": "👧", "guitar": "🎸",
        "heart": "❤️", "home": "🏠", "horse": "🐴", "hospital": "🏥", "house": "🏡",
        "ice": "🧊", "key": "🔑", "lion": "🦁", "lock": "🔒", "map": "🗺️",
        "money": "💵", "moon": "🌙", "music": "🎵", "night": "🌃", "pain": "💥",
        "person": "🧍", "phone": "📱", "pill": "💊", "pizza": "🍕", "rain": "🌧️",
        "school": "🏫", "shoe": "👞", "sleep": "😴", "smile": "😊", "snow": "❄️",
        "star": "⭐", "sun": "☀️", "tea": "🍵", "time": "⏳", "toilet": "🚽",
        "tree": "🌳", "water": "💧", "woman": "👩", "burger": "🍔", "fries": "🍟"
    }

    for k, v in fallback_map.items():
        if k not in word_to_emoji and k not in STOP_WORDS:
            word_to_emoji[k] = v

    print(f"Mapped {len(word_to_emoji)} words to emojis.")
    
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(word_to_emoji, f, indent=2, ensure_ascii=False)
        
    print(f"Saved emoji dictionary to {OUT_PATH}")

if __name__ == "__main__":
    main()
