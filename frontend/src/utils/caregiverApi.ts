import { CaregiverPanel, Session, InsightsResponse, PostSessionQuestion, AlertSettings } from '../../../shared/api-contract';

const DATA_BASE_URL = process.env.NEXT_PUBLIC_DATA_URL || 'http://localhost:8002';
const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8001';
const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || 'alex_demo';

const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  threshold: 3,
  timeframe: 2,
  routes: { ui: true, sms: false, email: true, call: false }
};

// --- API Functions ---
export const fetchAlertSettings = async (userId: string = DEFAULT_USER_ID): Promise<AlertSettings> => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/settings/alerts?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch alert settings');
    return await res.json();
  } catch (error) {
    console.warn('Backend unavailable — using default alert settings');
    return DEFAULT_ALERT_SETTINGS;
  }
};

export const updateAlertSettings = async (settings: AlertSettings, userId: string = DEFAULT_USER_ID) => {
  const res = await fetch(`${DATA_BASE_URL}/api/settings/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, settings })
  });
  if (!res.ok) throw new Error('Failed to update alert settings');
  return await res.json();
};

export const fetchCaregiverPanel = async (userId: string = DEFAULT_USER_ID): Promise<CaregiverPanel | null> => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/caregiver/panel?user_id=${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return null;
  }
};

export const fetchSessionHistory = async (userId: string = DEFAULT_USER_ID): Promise<Session[]> => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/sessions/history?user_id=${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.sessions || [];
  } catch {
    return [];
  }
};

export const fetchInsights = async (userId: string = DEFAULT_USER_ID): Promise<InsightsResponse | null> => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/insights?user_id=${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return null;
  }
};

export const submitContextAnswer = async (questionId: string, answer: string, userId: string = DEFAULT_USER_ID) => {
  const res = await fetch(`${DATA_BASE_URL}/api/context/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question_id: questionId, answer, user_id: userId })
  });
  if (!res.ok) throw new Error('Failed to submit context answer');
  return await res.json();
};

export const fetchContextAnswers = async (userId: string = DEFAULT_USER_ID): Promise<any[]> => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/context/answers?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch context answers');
    return await res.json();
  } catch {
    return [];
  }
};

export const submitFeedback = async (sessionId: string, thumbsUp: boolean, correction?: string, userId: string = DEFAULT_USER_ID) => {
  const res = await fetch(`${AI_BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, thumbs_up: thumbsUp, correction, user_id: userId })
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
  return await res.json();
};

export const fetchDigest = async (userId: string = DEFAULT_USER_ID): Promise<{ summary: string } | null> => {
  try {
    const res = await fetch(`${AI_BASE_URL}/api/digest?user_id=${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return null;
  }
};

export const fetchProfile = async (userId: string = DEFAULT_USER_ID): Promise<any | null> => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/profile?user_id=${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return null;
  }
};

export const updateProfileField = async (field: string, value: any, userId: string = DEFAULT_USER_ID) => {
  const res = await fetch(`${DATA_BASE_URL}/api/profile/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, field, value })
  });
  if (!res.ok) throw new Error('Failed to update profile field');
  return await res.json();
};

// --- Sync AI ---
export const syncAI = async (userId: string = DEFAULT_USER_ID): Promise<{ success: boolean }> => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/sentences/invalidate_all?user_id=${userId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Sync failed');
    return { success: true };
  } catch {
    // Graceful fallback — cache miss on next request just means fresh generation
    return { success: true };
  }
};

// --- Glossary Rules ---
export interface GlossaryRule {
  id: string;
  trigger_word: string;
  enforced_meaning: string;
  active: boolean;
  created_at: string;
}

export const fetchGlossaryRules = async (userId: string = DEFAULT_USER_ID): Promise<GlossaryRule[]> => {
  const res = await fetch(`${DATA_BASE_URL}/api/glossary?user_id=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch glossary rules');
  const data = await res.json();
  return data.rules || [];
};

export const addGlossaryRule = async (
  triggerWord: string,
  enforcedMeaning: string,
  userId: string = DEFAULT_USER_ID
): Promise<GlossaryRule | null> => {
  const res = await fetch(`${DATA_BASE_URL}/api/glossary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, trigger_word: triggerWord, enforced_meaning: enforcedMeaning }),
  });
  if (!res.ok) throw new Error('Failed to add glossary rule');
  const data = await res.json();
  return data.rule;
};

export const deleteGlossaryRule = async (ruleId: string, userId: string = DEFAULT_USER_ID): Promise<void> => {
  const res = await fetch(`${DATA_BASE_URL}/api/glossary/${ruleId}?user_id=${userId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete glossary rule');
};

export const toggleGlossaryRule = async (ruleId: string, active: boolean, userId: string = DEFAULT_USER_ID): Promise<void> => {
  const res = await fetch(`${DATA_BASE_URL}/api/glossary/${ruleId}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, rule_id: ruleId, active }),
  });
  if (!res.ok) throw new Error('Failed to toggle glossary rule');
};

export const cloneVoice = async (file: File, userId: string = DEFAULT_USER_ID) => {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('user_id', userId);

  const res = await fetch(`${AI_BASE_URL}/api/voice/clone`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Server error ${res.status}: ${errBody}`);
  }
  return await res.json();
};

// --- Conversation API ---
export const startConversation = async (userId: string = DEFAULT_USER_ID) => {
  const res = await fetch(`${DATA_BASE_URL}/api/conversations/start?user_id=${userId}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to start conversation');
  return await res.json();
};

export const addUtterance = async (conversationId: string, speaker: string, text: string) => {
  const res = await fetch(`${DATA_BASE_URL}/api/conversations/add_sentence?conversation_id=${conversationId}&speaker=${speaker}&text=${encodeURIComponent(text)}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to add utterance');
  return await res.json();
};

export const endConversation = async (conversationId: string) => {
  const res = await fetch(`${DATA_BASE_URL}/api/conversations/end?conversation_id=${conversationId}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to end conversation');
  return await res.json();
};

export const fetchActiveConversation = async (userId: string = DEFAULT_USER_ID) => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/conversations/active?user_id=${userId}`);
    if (res.status === 204 || res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch active conversation');
    return await res.json();
  } catch (err) {
    console.warn("fetchActiveConversation failed:", err);
    return null;
  }
};

export const exportSessionHistory = async (userId: string = DEFAULT_USER_ID) => {
  try {
    const sessions = await fetchSessionHistory(userId);
    const headers = ["Timestamp", "Path", "Sentence", "Confidence", "Flagged"];
    const rows = sessions.map(s => [
      s.timestamp,
      s.path.join(' > '),
      `"${s.sentence.replace(/"/g, '""')}"`,
      s.confidence,
      s.flagged ? "YES" : "NO"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `clarivo_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

export const simplifyText = async (text: string, userId: string = DEFAULT_USER_ID): Promise<{ simplified: string }> => {
  const res = await fetch(`${AI_BASE_URL}/api/caregiver/simplify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, user_id: userId })
  });
  if (!res.ok) throw new Error('Failed to simplify text');
  return await res.json();
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');

    const res = await fetch(`${AI_BASE_URL}/api/voice/transcribe`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Transcription failed');
    const data = await res.json();
    return data.text || "";
  } catch (err) {
    console.warn("Transcription failed:", err);
    return "";
  }
};
