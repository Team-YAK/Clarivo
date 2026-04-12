"""
Authoritative list of valid ICON_MAP keys from the frontend icon-map.ts.
The Icon Agent uses this to constrain icon selections to real, renderable icons.
"""

VALID_ICON_KEYS = {
    # ROOT CATEGORIES
    "physical", "emotional", "environment", "food", "drink", "sleep", "social",
    "watch", "toilet", "medical", "activities", "time", "weather", "objects",
    "places", "people", "communication", "transportation", "music", "clothing", "hygiene",

    # PHYSICAL NEEDS
    "pain", "hot", "cold", "itch", "dizzy", "nausea", "numbness", "cramp",
    "swelling", "bleeding", "breathing", "choking", "cough", "sneeze", "shivering",
    "sweating", "weakness", "fatigue", "stiffness",

    # Pain subtypes
    "headache", "stomach", "backpain", "chestpain", "joints", "teeth", "earache",
    "eyepain", "throatpain", "neck", "shoulder", "knee", "foot", "hand", "muscle", "migraine",

    # EMOTIONS / FEELINGS
    "happy", "sad", "angry", "anxious", "tired", "scared", "confused", "excited",
    "bored", "lonely", "frustrated", "grateful", "hopeful", "calm", "nervous",
    "overwhelmed", "proud", "embarrassed", "jealous", "love", "nostalgic", "peaceful",
    "surprised", "worried", "content", "depressed", "hurt", "irritated", "relieved",
    "stressed", "uncomfortable",
    # Happy subtypes
    "joyful", "laughing", "cheerful", "playful", "elated", "blissful",
    # Sad subtypes
    "crying", "grieving", "melancholy", "heartbroken", "disappointed", "gloomy",
    # Angry subtypes
    "furious", "annoyed", "resentful", "outraged",

    # FOOD
    "breakfast", "lunch", "dinner", "snack", "dessert",
    # Breakfast
    "cereal", "toast", "eggs", "pancakes", "oatmeal", "yogurt", "fruit_breakfast",
    "bacon", "sausage", "muffin", "croissant", "bagel", "waffles", "smoothie_bowl",
    # Lunch
    "sandwich", "salad", "soup", "pasta", "rice", "burger", "wrap", "sushi",
    "tacos", "pizza", "noodles", "stew",
    # Dinner
    "steak", "chicken", "fish_dinner", "vegetables", "potato", "casserole",
    "meatloaf", "roast", "lasagna", "curry", "stirfry", "grilled",
    # Snacks
    "chips", "crackers", "nuts", "popcorn", "fruit", "apple", "banana", "orange",
    "grapes", "berries", "cheese", "chocolate", "candy", "granola_bar", "pretzels",
    # Desserts
    "cake", "pie", "ice_cream", "cookies", "pudding", "brownie", "tiramisu",
    "cheesecake", "custard", "donut", "cupcake", "fruit_salad",
    # Food concepts
    "spicy", "sweet", "sour", "salty", "bitter", "hot_food", "cold_food",
    "soft", "crunchy", "bland", "savory", "fresh", "frozen", "cooked", "raw",

    # DRINK
    "water", "juice", "tea", "coffee_drink", "milk", "soda", "smoothie",
    "lemonade", "hot_chocolate", "milkshake", "sparkling_water", "coconut_water",
    "protein_shake", "iced_tea", "espresso", "wine", "beer", "cocktail", "broth",
    "warm", "cold_drink", "straw", "cup", "bottle", "glass",

    # SLEEP & REST
    "rest", "nap", "bed", "pillow", "blanket", "dark_room", "quiet", "nightlight",
    "lullaby", "sleepy", "insomnia", "nightmare", "dream", "snoring", "alarm_clock", "wake_up",

    # ENVIRONMENT
    "temperature", "light", "noise", "air", "window", "door", "fan", "heater",
    "air_conditioner", "curtains", "tv_on", "tv_off", "radio", "smell", "clean",
    "dirty", "bright", "dim", "too_loud", "too_quiet", "comfortable", "uncomfortable_env",

    # SOCIAL / PEOPLE
    "family", "friend", "nurse", "doctor", "alone", "visitor", "spouse", "child",
    "parent", "sibling", "grandchild", "caregiver", "therapist", "companion", "pet",
    "neighbor", "stranger", "group", "baby", "elderly", "man", "woman", "boy", "girl",
    # Social actions
    "talk", "call_someone", "video_call", "text_message", "hug", "wave", "visit",
    "meet", "thank", "apologize", "ask_for_help",

    # MEDICAL / HEALTH
    "medicine", "pill", "injection", "bandage", "thermometer_med", "stethoscope",
    "wheelchair", "crutches", "oxygen", "iv_drip", "blood_pressure", "xray",
    "surgery", "prescription", "appointment", "checkup", "emergency", "ambulance",
    "hospital", "pharmacy", "lab_test", "allergy", "vaccination", "first_aid",
    "inhaler", "eye_drops", "cream", "vitamins", "supplement", "pain_relief",
    "antibiotic", "insulin", "blood_test", "heart_monitor", "pulse_check", "temperature_check",

    # ACTIVITIES
    "walk", "read", "write", "draw", "paint", "play", "sing", "dance", "cook",
    "garden", "craft", "puzzle", "exercise", "stretch", "meditate", "pray", "knit",
    "sew", "photography", "birdwatch", "fishing", "swim", "bike", "yoga", "chess",
    "cards", "board_game", "video_game", "crossword", "coloring", "listening",
    "watching", "shopping", "cleaning", "organizing", "journaling",

    # ENTERTAINMENT
    "tv", "movie", "show", "documentary", "news", "sports", "comedy", "drama",
    "cartoon", "reality", "nature_show", "cooking_show", "music_video", "podcast",
    "audiobook", "youtube", "streaming", "radio_show",

    # OBJECTS
    "phone", "tablet", "computer", "laptop", "remote", "glasses_obj", "hearing_aid",
    "dentures", "watch_obj", "wallet", "keys", "book", "magazine", "pen", "paper",
    "tissues", "towel", "soap", "toothbrush", "comb", "mirror", "lamp_obj", "chair",
    "table", "clock_obj", "calendar", "photo", "bag", "umbrella", "flashlight",
    "charger", "headphones", "speaker",

    # PLACES
    "home", "bedroom", "bathroom", "kitchen", "living_room", "garden_place", "porch",
    "hospital_place", "clinic", "church", "park", "store", "restaurant", "bank",
    "library", "school", "gym", "beach", "mountain", "lake", "city", "countryside",
    "mall", "market", "office", "outside", "inside", "upstairs", "downstairs",

    # TIME
    "now", "later", "soon", "morning", "afternoon", "evening", "night", "today",
    "tomorrow", "yesterday", "weekend", "hour", "minute", "before", "after", "early",
    "late", "always", "never", "sometimes", "daily", "weekly", "monthly",

    # WEATHER
    "sunny", "cloudy", "rainy", "snowy", "windy", "stormy", "foggy", "rainbow",
    "hot_weather", "cold_weather", "humid", "dry", "hail", "thunder", "tornado",
    "overcast", "clear_sky", "frost",

    # COMMUNICATION
    "yes", "no", "maybe", "please", "thank_you", "sorry", "hello", "goodbye",
    "help", "stop", "wait", "more", "less", "again", "done", "not_yet",
    "i_dont_know", "i_want", "i_need", "i_feel", "i_am", "i_like", "i_dont_like",
    "show_me", "tell_me", "take_me", "give_me", "bring_me",

    # HYGIENE
    "shower", "bath", "brush_teeth", "wash_hands", "wash_face", "shave", "haircut",
    "lotion", "deodorant", "makeup", "nail_care", "change_clothes", "laundry",

    # CLOTHING
    "shirt", "pants", "dress", "coat", "sweater", "jacket", "socks", "shoes", "hat",
    "scarf", "gloves", "underwear", "pajamas", "robe", "belt", "tie", "sunglasses", "boots",

    # TRANSPORTATION
    "car", "bus", "taxi", "train", "airplane", "boat", "bicycle_trans", "walk_trans",
    "wheelchair_trans", "scooter", "van", "motorcycle", "helicopter", "subway",

    # MUSIC
    "singing", "guitar", "piano", "drums", "classical", "jazz", "rock", "pop",
    "country", "opera", "choir", "instrument", "melody", "rhythm",
    "volume_up", "volume_down", "mute", "playlist",

    # NATURE & ANIMALS
    "flower", "tree_nature", "plant", "grass", "river", "ocean", "forest",
    "mountain_nature", "sunset", "sunrise", "stars", "moon_nature",
    "dog", "cat", "bird_animal", "fish_animal", "horse", "rabbit", "butterfly", "bee", "squirrel",

    # EDUCATION
    "learn", "study", "practice", "homework", "teacher", "student", "class", "lesson",
    "exam", "grade", "diploma", "lecture", "tutor", "science", "math", "history",
    "language", "art",

    # RELIGION
    "church_place", "prayer", "bible", "worship", "faith", "blessing", "meditation",
    "spirit", "soul", "peace", "hope",

    # TECHNOLOGY
    "internet", "wifi", "bluetooth", "email", "camera", "printer", "usb", "battery",
    "settings", "search", "download", "upload", "notification", "password", "screen",

    # EMOTIONS EXTENDED
    "confident", "determined", "inspired", "motivated", "patient_feeling", "impatient",
    "curious", "creative", "moody", "sensitive", "stubborn", "flexible", "generous",
    "selfish", "sympathetic", "indifferent", "optimistic", "pessimistic", "thoughtful",

    # HOUSEHOLD
    "vacuum", "dishes", "cooking", "garbage", "recycling", "mop", "dust", "iron",
    "fold", "sweep", "fix", "repair", "replace", "install",

    # QUANTITY / DESCRIPTORS
    "a_little", "a_lot", "some", "all", "none", "big", "small", "hot_desc", "cold_desc",
    "good", "bad", "new_desc", "old_desc", "fast", "slow", "hard", "easy", "heavy",
    "light_desc", "right", "wrong", "same", "different", "better", "worse", "best",
    "worst", "favorite", "important", "urgent",

    # ACTIONS / VERBS
    "go", "come", "sit", "stand", "lie_down", "turn", "open", "close", "push", "pull",
    "pick_up", "put_down", "take", "give", "hold", "drop", "throw", "catch", "move",
    "carry", "lift", "lower", "eat", "drink_verb", "chew", "swallow", "taste",
    "smell_verb", "look", "listen", "touch", "feel", "think", "remember", "forget",
    "understand", "try", "start", "finish", "continue", "change", "choose", "decide",
    "agree", "disagree",

    # CORRECTIONS / META
    "undo", "redo", "delete", "clear", "submit", "speak", "deeper", "back", "forward",

    # FALLBACK
    "unknown", "other", "more_options",
}

# Compact string for LLM prompt injection (sorted for readability)
ICON_KEYS_PROMPT = ", ".join(sorted(VALID_ICON_KEYS))
