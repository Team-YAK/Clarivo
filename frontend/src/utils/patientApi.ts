export interface TreeNode {
  key: string;
  label: string;
  isLeaf: boolean;
}

// ─────────────────────────────────────────────────────────────
// Deep decision tree — branching structure for patient UI
// ─────────────────────────────────────────────────────────────
const TREE_DATA: Record<string, TreeNode[]> = {
  root: [
    { key: "physical", label: "Physical Needs", isLeaf: false },
    { key: "emotional", label: "Emotions", isLeaf: false },
    { key: "food", label: "Food", isLeaf: false },
    { key: "drink", label: "Drink", isLeaf: false },
    { key: "sleep", label: "Sleep", isLeaf: false },
    { key: "social", label: "Social", isLeaf: false },
    { key: "watch", label: "Entertainment", isLeaf: false },
    { key: "toilet", label: "Toilet", isLeaf: true },
    { key: "hygiene", label: "Hygiene", isLeaf: false },
    { key: "environment", label: "Environment", isLeaf: false },
    { key: "medical", label: "Medical", isLeaf: false },
    { key: "communication", label: "Communicate", isLeaf: false },
  ],

  // ── Physical ──
  physical: [
    { key: "pain", label: "Pain", isLeaf: false },
    { key: "hot", label: "Too Hot", isLeaf: true },
    { key: "cold", label: "Too Cold", isLeaf: true },
    { key: "itch", label: "Itchy", isLeaf: true },
    { key: "dizzy", label: "Dizzy", isLeaf: true },
    { key: "nausea", label: "Nausea", isLeaf: true },
    { key: "breathing", label: "Breathing", isLeaf: true },
    { key: "weakness", label: "Weak", isLeaf: true },
    { key: "fatigue", label: "Tired", isLeaf: true },
    { key: "numbness", label: "Numb", isLeaf: true },
  ],
  pain: [
    { key: "headache", label: "Headache", isLeaf: true },
    { key: "stomach", label: "Stomach", isLeaf: true },
    { key: "backpain", label: "Back", isLeaf: true },
    { key: "chestpain", label: "Chest", isLeaf: true },
    { key: "joints", label: "Joints", isLeaf: true },
    { key: "teeth", label: "Teeth", isLeaf: true },
    { key: "earache", label: "Ear", isLeaf: true },
    { key: "eyepain", label: "Eye", isLeaf: true },
    { key: "neck", label: "Neck", isLeaf: true },
    { key: "shoulder", label: "Shoulder", isLeaf: true },
    { key: "knee", label: "Knee", isLeaf: true },
    { key: "foot", label: "Foot", isLeaf: true },
  ],

  // ── Emotions ──
  emotional: [
    { key: "happy", label: "Happy", isLeaf: false },
    { key: "sad", label: "Sad", isLeaf: false },
    { key: "angry", label: "Angry", isLeaf: false },
    { key: "anxious", label: "Anxious", isLeaf: true },
    { key: "tired", label: "Tired", isLeaf: true },
    { key: "scared", label: "Scared", isLeaf: true },
    { key: "confused", label: "Confused", isLeaf: true },
    { key: "excited", label: "Excited", isLeaf: true },
    { key: "lonely", label: "Lonely", isLeaf: true },
    { key: "frustrated", label: "Frustrated", isLeaf: true },
    { key: "grateful", label: "Grateful", isLeaf: true },
    { key: "calm", label: "Calm", isLeaf: true },
    { key: "nervous", label: "Nervous", isLeaf: true },
    { key: "overwhelmed", label: "Overwhelmed", isLeaf: true },
    { key: "bored", label: "Bored", isLeaf: true },
    { key: "worried", label: "Worried", isLeaf: true },
  ],
  happy: [
    { key: "joyful", label: "Joyful", isLeaf: true },
    { key: "laughing", label: "Laughing", isLeaf: true },
    { key: "cheerful", label: "Cheerful", isLeaf: true },
    { key: "playful", label: "Playful", isLeaf: true },
    { key: "elated", label: "Elated", isLeaf: true },
    { key: "proud", label: "Proud", isLeaf: true },
    { key: "content", label: "Content", isLeaf: true },
    { key: "relieved", label: "Relieved", isLeaf: true },
  ],
  sad: [
    { key: "crying", label: "Crying", isLeaf: true },
    { key: "melancholy", label: "Melancholy", isLeaf: true },
    { key: "heartbroken", label: "Heartbroken", isLeaf: true },
    { key: "disappointed", label: "Disappointed", isLeaf: true },
    { key: "gloomy", label: "Gloomy", isLeaf: true },
    { key: "depressed", label: "Depressed", isLeaf: true },
    { key: "nostalgic", label: "Nostalgic", isLeaf: true },
    { key: "hurt", label: "Hurt", isLeaf: true },
  ],
  angry: [
    { key: "furious", label: "Furious", isLeaf: true },
    { key: "annoyed", label: "Annoyed", isLeaf: true },
    { key: "irritated", label: "Irritated", isLeaf: true },
    { key: "resentful", label: "Resentful", isLeaf: true },
    { key: "outraged", label: "Outraged", isLeaf: true },
    { key: "frustrated", label: "Frustrated", isLeaf: true },
  ],

  // ── Food ──
  food: [
    { key: "breakfast", label: "Breakfast", isLeaf: false },
    { key: "lunch", label: "Lunch", isLeaf: false },
    { key: "dinner", label: "Dinner", isLeaf: false },
    { key: "snack", label: "Snack", isLeaf: false },
    { key: "dessert", label: "Dessert", isLeaf: false },
  ],
  breakfast: [
    { key: "cereal", label: "Cereal", isLeaf: true },
    { key: "toast", label: "Toast", isLeaf: true },
    { key: "eggs", label: "Eggs", isLeaf: true },
    { key: "pancakes", label: "Pancakes", isLeaf: true },
    { key: "oatmeal", label: "Oatmeal", isLeaf: true },
    { key: "yogurt", label: "Yogurt", isLeaf: true },
    { key: "bacon", label: "Bacon", isLeaf: true },
    { key: "croissant", label: "Croissant", isLeaf: true },
    { key: "waffles", label: "Waffles", isLeaf: true },
    { key: "fruit_breakfast", label: "Fruit", isLeaf: true },
  ],
  lunch: [
    { key: "sandwich", label: "Sandwich", isLeaf: true },
    { key: "salad", label: "Salad", isLeaf: true },
    { key: "soup", label: "Soup", isLeaf: true },
    { key: "pasta", label: "Pasta", isLeaf: true },
    { key: "burger", label: "Burger", isLeaf: true },
    { key: "wrap", label: "Wrap", isLeaf: true },
    { key: "sushi", label: "Sushi", isLeaf: true },
    { key: "pizza", label: "Pizza", isLeaf: true },
    { key: "rice", label: "Rice", isLeaf: true },
    { key: "tacos", label: "Tacos", isLeaf: true },
  ],
  dinner: [
    { key: "steak", label: "Steak", isLeaf: true },
    { key: "chicken", label: "Chicken", isLeaf: true },
    { key: "fish_dinner", label: "Fish", isLeaf: true },
    { key: "pasta", label: "Pasta", isLeaf: true },
    { key: "vegetables", label: "Vegetables", isLeaf: true },
    { key: "soup", label: "Soup", isLeaf: true },
    { key: "casserole", label: "Casserole", isLeaf: true },
    { key: "curry", label: "Curry", isLeaf: true },
    { key: "stirfry", label: "Stir Fry", isLeaf: true },
    { key: "grilled", label: "Grilled", isLeaf: true },
  ],
  snack: [
    { key: "fruit", label: "Fruit", isLeaf: true },
    { key: "chips", label: "Chips", isLeaf: true },
    { key: "nuts", label: "Nuts", isLeaf: true },
    { key: "crackers", label: "Crackers", isLeaf: true },
    { key: "popcorn", label: "Popcorn", isLeaf: true },
    { key: "cheese", label: "Cheese", isLeaf: true },
    { key: "chocolate", label: "Chocolate", isLeaf: true },
    { key: "candy", label: "Candy", isLeaf: true },
    { key: "granola_bar", label: "Granola Bar", isLeaf: true },
    { key: "pretzels", label: "Pretzels", isLeaf: true },
  ],
  dessert: [
    { key: "cake", label: "Cake", isLeaf: true },
    { key: "pie", label: "Pie", isLeaf: true },
    { key: "ice_cream", label: "Ice Cream", isLeaf: true },
    { key: "cookies", label: "Cookies", isLeaf: true },
    { key: "pudding", label: "Pudding", isLeaf: true },
    { key: "brownie", label: "Brownie", isLeaf: true },
    { key: "tiramisu", label: "Tiramisu", isLeaf: true },
    { key: "cheesecake", label: "Cheesecake", isLeaf: true },
    { key: "donut", label: "Donut", isLeaf: true },
    { key: "cupcake", label: "Cupcake", isLeaf: true },
  ],

  // ── Drink ──
  drink: [
    { key: "water", label: "Water", isLeaf: true },
    { key: "juice", label: "Juice", isLeaf: true },
    { key: "tea", label: "Tea", isLeaf: true },
    { key: "coffee_drink", label: "Coffee", isLeaf: true },
    { key: "milk", label: "Milk", isLeaf: true },
    { key: "soda", label: "Soda", isLeaf: true },
    { key: "smoothie", label: "Smoothie", isLeaf: true },
    { key: "hot_chocolate", label: "Hot Chocolate", isLeaf: true },
    { key: "lemonade", label: "Lemonade", isLeaf: true },
    { key: "sparkling_water", label: "Sparkling Water", isLeaf: true },
    { key: "broth", label: "Broth", isLeaf: true },
  ],

  // ── Sleep ──
  sleep: [
    { key: "rest", label: "Rest", isLeaf: true },
    { key: "nap", label: "Nap", isLeaf: true },
    { key: "bed", label: "Go to Bed", isLeaf: true },
    { key: "pillow", label: "Pillow", isLeaf: true },
    { key: "blanket", label: "Blanket", isLeaf: true },
    { key: "dark_room", label: "Dark Room", isLeaf: true },
    { key: "quiet", label: "Quiet", isLeaf: true },
    { key: "lullaby", label: "Lullaby", isLeaf: true },
    { key: "insomnia", label: "Can't Sleep", isLeaf: true },
    { key: "nightmare", label: "Nightmare", isLeaf: true },
  ],

  // ── Social ──
  social: [
    { key: "family", label: "Family", isLeaf: true },
    { key: "friend", label: "Friend", isLeaf: true },
    { key: "nurse", label: "Nurse", isLeaf: true },
    { key: "doctor", label: "Doctor", isLeaf: true },
    { key: "alone", label: "Be Alone", isLeaf: true },
    { key: "visitor", label: "Visitor", isLeaf: true },
    { key: "call_someone", label: "Call", isLeaf: true },
    { key: "video_call", label: "Video Call", isLeaf: true },
    { key: "hug", label: "Hug", isLeaf: true },
    { key: "pet", label: "Pet", isLeaf: true },
  ],

  // ── Entertainment ──
  watch: [
    { key: "tv", label: "TV", isLeaf: true },
    { key: "movie", label: "Movie", isLeaf: true },
    { key: "music", label: "Music", isLeaf: true },
    { key: "news", label: "News", isLeaf: true },
    { key: "sports", label: "Sports", isLeaf: true },
    { key: "podcast", label: "Podcast", isLeaf: true },
    { key: "audiobook", label: "Audiobook", isLeaf: true },
    { key: "video_game", label: "Game", isLeaf: true },
    { key: "read", label: "Read", isLeaf: true },
    { key: "puzzle", label: "Puzzle", isLeaf: true },
  ],

  // ── Hygiene ──
  hygiene: [
    { key: "shower", label: "Shower", isLeaf: true },
    { key: "bath", label: "Bath", isLeaf: true },
    { key: "brush_teeth", label: "Brush Teeth", isLeaf: true },
    { key: "wash_hands", label: "Wash Hands", isLeaf: true },
    { key: "wash_face", label: "Wash Face", isLeaf: true },
    { key: "shave", label: "Shave", isLeaf: true },
    { key: "change_clothes", label: "Change Clothes", isLeaf: true },
    { key: "lotion", label: "Lotion", isLeaf: true },
    { key: "comb", label: "Comb Hair", isLeaf: true },
  ],

  // ── Environment ──
  environment: [
    { key: "light", label: "Light", isLeaf: true },
    { key: "temperature", label: "Temperature", isLeaf: true },
    { key: "noise", label: "Noise", isLeaf: true },
    { key: "air", label: "Fresh Air", isLeaf: true },
    { key: "window", label: "Window", isLeaf: true },
    { key: "fan", label: "Fan", isLeaf: true },
    { key: "tv_off", label: "Turn Off TV", isLeaf: true },
    { key: "clean", label: "Clean Room", isLeaf: true },
    { key: "comfortable", label: "Comfortable", isLeaf: true },
  ],

  // ── Medical ──
  medical: [
    { key: "medicine", label: "Medicine", isLeaf: true },
    { key: "pill", label: "Pill", isLeaf: true },
    { key: "injection", label: "Injection", isLeaf: true },
    { key: "bandage", label: "Bandage", isLeaf: true },
    { key: "appointment", label: "Appointment", isLeaf: true },
    { key: "emergency", label: "Emergency", isLeaf: true },
    { key: "checkup", label: "Checkup", isLeaf: true },
    { key: "blood_pressure", label: "Blood Pressure", isLeaf: true },
    { key: "oxygen", label: "Oxygen", isLeaf: true },
    { key: "wheelchair", label: "Wheelchair", isLeaf: true },
    { key: "pain_relief", label: "Pain Relief", isLeaf: true },
    { key: "vitamins", label: "Vitamins", isLeaf: true },
  ],

  // ── Communication ──
  communication: [
    { key: "yes", label: "Yes", isLeaf: true },
    { key: "no", label: "No", isLeaf: true },
    { key: "maybe", label: "Maybe", isLeaf: true },
    { key: "please", label: "Please", isLeaf: true },
    { key: "thank_you", label: "Thank You", isLeaf: true },
    { key: "sorry", label: "Sorry", isLeaf: true },
    { key: "help", label: "Help", isLeaf: true },
    { key: "stop", label: "Stop", isLeaf: true },
    { key: "wait", label: "Wait", isLeaf: true },
    { key: "i_want", label: "I Want", isLeaf: true },
    { key: "i_need", label: "I Need", isLeaf: true },
    { key: "i_feel", label: "I Feel", isLeaf: true },
    { key: "i_dont_know", label: "I Don't Know", isLeaf: true },
    { key: "more", label: "More", isLeaf: true },
    { key: "done", label: "Done", isLeaf: true },
  ],
};

export const fetchTreeRoot = async (): Promise<TreeNode[]> => {
  return Promise.resolve(TREE_DATA.root);
};

export const fetchTreeChildren = async (parentKey: string): Promise<TreeNode[]> => {
  return Promise.resolve(TREE_DATA[parentKey] || []);
};

export async function* generateIntentStream(labels: string[]): AsyncGenerator<string> {
  // AI would normally process these into a natural sentence.
  // For now, we do a simple join with contextual connectors.
  const sentence = labels.length === 1
    ? `I want ${labels[0]}.`
    : `I ${labels.slice(0, -1).join(", ")} ${labels[labels.length - 1]}.`;

  const words = sentence.split(" ");
  for (const word of words) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    yield word + " ";
  }
}

export const synthesizeVoice = async (text: string, userId: string = "alex_demo") => {
  try {
    const AI_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8001';
    const res = await fetch(`${AI_URL}/api/voice/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, user_id: userId })
    });
    if (!res.ok) throw new Error('Synthesis failed');
    return await res.json(); // returns { audio_url: "..." }
  } catch (err) {
    console.warn("Backend TTS unreachable or failed. Falling back to native TTS.", err);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
// AI-powered Decision Tree — infinite depth via backend agents
// ─────────────────────────────────────────────────────────────

const AI_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8001';
const DEFAULT_USER_ID = 'alex_demo';

export interface AiOption {
  label: string;
  icon: string;  // snake_case identifier, maps to getIconComponent key
}

export interface AiExpandResult {
  quick_option: AiOption;
  options: AiOption[];
}

/** Call the AI agents to get next-level options for a given path. */
export const expandTreeAI = async (
  currentPath: string[],
  userId: string = DEFAULT_USER_ID,
): Promise<AiExpandResult> => {
  try {
    const res = await fetch(`${AI_URL}/api/tree/expand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, current_path: currentPath }),
    });
    if (!res.ok) throw new Error(`AI expand failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('expandTreeAI fallback:', err);
    // Contextual fallback based on last path item
    const last = currentPath[currentPath.length - 1] ?? '';
    return {
      quick_option: { label: 'More specific', icon: 'magnifying_glass' },
      options: [
        { label: `${last} now`, icon: 'clock' },
        { label: `${last} later`, icon: 'calendar' },
        { label: 'Something else', icon: 'swap' },
      ],
    };
  }
};

/** Notify the backend of a SELECT action (lightweight path tracking). */
export const selectTreeAI = async (
  selectedKey: string,
  currentPath: string[],
  userId: string = DEFAULT_USER_ID,
): Promise<void> => {
  try {
    await fetch(`${AI_URL}/api/tree/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, selected_key: selectedKey, current_path: currentPath }),
    });
  } catch {
    // Fire-and-forget — failure is silent
  }
};

/** Persist a confirmed path and increment frequency counters. */
export const confirmTreeAI = async (
  path: string[],
  confidence: number = 0.9,
  userId: string = DEFAULT_USER_ID,
): Promise<{ ok: boolean; session_id?: string }> => {
  try {
    const res = await fetch(`${AI_URL}/api/tree/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, path, confidence }),
    });
    if (!res.ok) throw new Error(`confirm failed: ${res.status}`);
    return await res.json();
  } catch {
    return { ok: false };
  }
};
