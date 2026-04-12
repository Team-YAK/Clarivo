const AI_URL_INTENT = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8001';
const DEFAULT_USER_ID_INTENT = 'alex_demo';

export interface IntentTokenEvent {
  type: 'token';
  token: string;
}

export interface IntentDoneEvent {
  type: 'done';
  sessionId: string;
  fullSentence: string;
  confidence: number;
}

export interface IntentErrorEvent {
  type: 'error';
  error: string;
}

export type IntentStreamEvent =
  | IntentTokenEvent
  | IntentDoneEvent
  | IntentErrorEvent;

export interface ConfirmIntentResponse {
  audio_url: string;
  sentence: string;
  session_id: string;
  voice_source?: string;
}

export interface IntentFlowResult {
  sentence: string;
  sessionId?: string;
  confidence?: number;
  audioUrl: string | null;
  voiceSource: string | null;
  error: string | null;
}

export async function* generateIntentStream(
  path: string[],
  userId: string = DEFAULT_USER_ID_INTENT,
  inputMode: string = 'tree',
): AsyncGenerator<IntentStreamEvent> {
  try {
    const res = await fetch(`${AI_URL_INTENT}/api/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, user_id: userId, input_mode: inputMode }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`Intent failed: ${res.status}`);
    }

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
          if (json.error) {
            yield { type: 'error', error: String(json.error) };
            return;
          }
          if (json.done) {
            yield {
              type: 'done',
              sessionId: json.session_id,
              fullSentence: json.full_sentence || '',
              confidence: json.confidence ?? 0,
            };
            return;
          }
          if (json.token) {
            yield { type: 'token', token: json.token };
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  } catch (err) {
    console.warn('generateIntentStream failed:', err);
    yield { type: 'error', error: err instanceof Error ? err.message : 'Intent request failed' };
  }
}

export const confirmIntentSession = async (
  sessionId: string,
  userId: string = DEFAULT_USER_ID_INTENT,
): Promise<ConfirmIntentResponse | null> => {
  try {
    const res = await fetch(`${AI_URL_INTENT}/api/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, user_id: userId }),
    });
    if (!res.ok) {
      throw new Error(`Confirm failed: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('confirmIntentSession failed:', err);
    return null;
  }
};

export const streamAndConfirmIntent = async ({
  path,
  userId = DEFAULT_USER_ID_INTENT,
  inputMode = 'tree',
  onToken,
}: {
  path: string[];
  userId?: string;
  inputMode?: string;
  onToken?: (token: string) => void | Promise<void>;
}): Promise<IntentFlowResult> => {
  let builtSentence = '';
  let sessionId: string | undefined;
  let confidence: number | undefined;
  let error: string | null = null;

  for await (const event of generateIntentStream(path, userId, inputMode)) {
    if (event.type === 'token') {
      builtSentence += event.token;
      await onToken?.(event.token);
      continue;
    }
    if (event.type === 'done') {
      sessionId = event.sessionId;
      confidence = event.confidence;
      builtSentence = event.fullSentence || builtSentence;
      break;
    }

    error = event.error;
    break;
  }

  const sentence = builtSentence.trim();
  if (error || !sessionId) {
    return {
      sentence,
      sessionId,
      confidence,
      audioUrl: null,
      voiceSource: null,
      error: error || 'Intent generation did not complete',
    };
  }

  const confirmed = await confirmIntentSession(sessionId, userId);
  if (!confirmed) {
    return {
      sentence,
      sessionId,
      confidence,
      audioUrl: null,
      voiceSource: null,
      error: 'Intent confirmation failed',
    };
  }

  return {
    sentence: confirmed.sentence || sentence,
    sessionId: confirmed.session_id || sessionId,
    confidence,
    audioUrl: confirmed.audio_url || null,
    voiceSource: confirmed.voice_source || null,
    error: null,
  };
};

const AI_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8001';
const DEFAULT_USER_ID = 'alex_demo';

export interface AiOption {
  key: string;
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
