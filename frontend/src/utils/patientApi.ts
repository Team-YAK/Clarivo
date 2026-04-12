// Removed local TREE_DATA in favor of dynamic backend AI expansion.

const AI_URL_INTENT = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8001';
const DEFAULT_USER_ID_INTENT = 'alex_demo';

export async function* generateIntentStream(
  path: string[],
  labels: string[],
  userId: string = DEFAULT_USER_ID_INTENT,
  inputMode: string = 'composer',
): AsyncGenerator<string> {
  try {
    const res = await fetch(`${AI_URL_INTENT}/api/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, user_id: userId, input_mode: inputMode }),
    });
    if (!res.ok || !res.body) throw new Error(`Intent failed: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const json = JSON.parse(line.slice(6));
          if (json.done) return;
          if (json.token) yield json.token;
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  } catch (err) {
    console.warn('generateIntentStream backend fallback:', err);
    // Fallback: simple sentence from labels when backend is unreachable
    const sentence = labels.length === 1
      ? `I want ${labels[0]}.`
      : `I want ${labels.join(' and ')}.`;
    for (const word of sentence.split(' ')) {
      await new Promise((r) => setTimeout(r, 150));
      yield word + ' ';
    }
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
  key?: string;
  label: string;
  icon: string;  // kebab-case Phosphor icon name (e.g. "fork-knife")
}

export interface AiExpandResult {
  quick_option: AiOption;
  options: AiOption[];
}

/** Call the AI agents to get next-level options for a given path. */
export const expandTreeAI = async (
  currentPath: string[],
  userId: string = DEFAULT_USER_ID,
): Promise<AiExpandResult | null> => {
  try {
    const tapTs = Date.now();
    const res = await fetch(`${AI_URL}/api/tree/expand`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-tap-ts': String(tapTs),
      },
      body: JSON.stringify({ user_id: userId, current_path: currentPath }),
    });
    if (!res.ok) throw new Error(`AI expand failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('expandTreeAI gracefully caught network failure:', err);
    return null;
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
