import { MOCK_DATA } from './api';
import { CaregiverPanel, Session, InsightsResponse, PostSessionQuestion, AlertSettings } from '../../../shared/api-contract';

const DATA_BASE_URL = process.env.NEXT_PUBLIC_DATA_URL || 'http://localhost:8002';
const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8001';
const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || 'alex_demo';

export const MOCK_CAREGIVER_PANEL: CaregiverPanel = {
  last_session: MOCK_DATA.sessionHistory[0] as unknown as Session,
  pending_question: { question: "Does Alex prefer a specific dessert for celebration tonight?", question_id: "q1" } as PostSessionQuestion,
  knowledge_score: 78,
  knowledge_breakdown: {
    profile: 92,
    medical: 78,
    preferences: 85,
    conversation: 64
  },
  urgent: false
};

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
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/settings/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, settings })
    });
    if (!res.ok) throw new Error('Failed to update alert settings');
    return await res.json();
  } catch (error) {
    console.warn('Mock updateAlertSettings', settings);
    return { success: true };
  }
};

export const fetchCaregiverPanel = async (userId: string = DEFAULT_USER_ID): Promise<CaregiverPanel> => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/caregiver/panel?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch (error) {
    console.warn('Backend unavailable — using mock data for Caregiver Panel');
    return MOCK_CAREGIVER_PANEL;
  }
};

export const fetchSessionHistory = async (userId: string = DEFAULT_USER_ID): Promise<Session[]> => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/sessions/history?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.sessions || [];
  } catch (error) {
    console.warn('Backend unavailable — using mock data for Session History');
    return MOCK_DATA.sessionHistory as unknown as Session[];
  }
};

export const fetchInsights = async (userId: string = DEFAULT_USER_ID): Promise<InsightsResponse> => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/insights?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch (error) {
    console.warn('Backend unavailable — using mock data for Insights');
    return {
      sessions_by_day: { "Mon": 5, "Tue": 8, "Wed": 6, "Thu": 10, "Fri": 15 },
      top_paths: [{ input_mode: 'tree', path_key: 'food_dessert', label: "Food > Dessert", count: 12 }, { input_mode: 'tree', path_key: 'needs_physical', label: "Needs > Physical", count: 8 }],
      sessions_by_period: { "morning": 12, "afternoon": 25, "evening": 8 },
      mood_log: MOCK_DATA.analytics as any
    } as InsightsResponse;
  }
};

export const submitContextAnswer = async (questionId: string, answer: string, userId: string = DEFAULT_USER_ID) => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/context/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId, answer, user_id: userId })
    });
    if (!res.ok) throw new Error('Failed to submit context answer');
    return await res.json();
  } catch (error) {
    console.warn('Mock submitContextAnswer', { questionId, answer });
    return { success: true };
  }
};

export const submitFeedback = async (sessionId: string, thumbsUp: boolean, correction?: string, userId: string = DEFAULT_USER_ID) => {
  try {
    const res = await fetch(`${AI_BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, thumbs_up: thumbsUp, correction, user_id: userId })
    });
    if (!res.ok) throw new Error('Failed to submit feedback');
    return await res.json();
  } catch (error) {
    console.warn('Mock submitFeedback', { sessionId, thumbsUp, correction });
    return { success: true };
  }
};

export const fetchDigest = async (userId: string = DEFAULT_USER_ID): Promise<{ summary: string }> => {
  try {
    const res = await fetch(`${AI_BASE_URL}/api/digest?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch digest');
    return await res.json();
  } catch (error) {
    console.warn('Backend unavailable — using mock digest');
    return { summary: "Alex has had a relatively calm week with a slight increase in communication during the afternoons. He often requests desserts." };
  }
};

export const fetchProfile = async (userId: string = DEFAULT_USER_ID): Promise<any> => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/profile?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return await res.json();
  } catch (error) {
    console.warn('Backend unavailable — using mock data for Profile');
    return {
      profile: { name: "Kishan", diagnosis_date: "2024-04-12", caregiver_name: "Yuki" },
      medical: { medications: ["Aspirin 100mg", "Lisinopril 10mg"], allergies: ["Penicillin"], conditions: ["Hypertension"] },
      preferences: {
        communication_notes: "Alex gets frustrated when misunderstood. Give him time.", 
        known_preferences: "Loves Italian food, especially tiramisu. Watches football on Sundays.",
        always_know: "His daughter Maria lives in Boston. He misses her."
      },
      routine: { meals: { breakfast: "08:00", lunch: "12:30", dinner: "18:00" } }
    };
  }
};

export const updateProfileField = async (field: string, value: any, userId: string = DEFAULT_USER_ID) => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/profile/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, field, value })
    });
    if (!res.ok) throw new Error('Failed to update profile field');
    return await res.json();
  } catch (error) {
    console.warn('Mock updateProfileField', { field, value });
    return { success: true };
  }
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

let FALLBACK_GLOSSARY: GlossaryRule[] = [
  { id: 'gr_001', trigger_word: 'Bobby', enforced_meaning: "Kishan's Golden Retriever dog", active: true, created_at: new Date().toISOString() },
  { id: 'gr_002', trigger_word: 'Blue Pill', enforced_meaning: 'Aspirin (taken at 8am)', active: true, created_at: new Date().toISOString() },
  { id: 'gr_003', trigger_word: 'The Lake', enforced_meaning: 'Lake Tahoe summer cabin', active: false, created_at: new Date().toISOString() },
];

export const fetchGlossaryRules = async (userId: string = DEFAULT_USER_ID): Promise<GlossaryRule[]> => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/glossary?user_id=${userId}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.rules || [];
  } catch {
    console.warn('Backend unavailable — using mock data for Glossary');
    return FALLBACK_GLOSSARY;
  }
};

export const addGlossaryRule = async (
  triggerWord: string,
  enforcedMeaning: string,
  userId: string = DEFAULT_USER_ID
): Promise<GlossaryRule | null> => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/glossary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, trigger_word: triggerWord, enforced_meaning: enforcedMeaning }),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.rule;
  } catch {
    // Optimistic local fallback
    const newRule = { id: `gr_${Date.now()}`, trigger_word: triggerWord, enforced_meaning: enforcedMeaning, active: true, created_at: new Date().toISOString() };
    FALLBACK_GLOSSARY.push(newRule);
    return newRule;
  }
};

export const deleteGlossaryRule = async (ruleId: string, userId: string = DEFAULT_USER_ID): Promise<void> => {
  try {
    await fetch(`${DATA_BASE_URL}/api/glossary/${ruleId}?user_id=${userId}`, { method: 'DELETE' });
  } catch {
    // Swallow — UI already updated optimistically
    FALLBACK_GLOSSARY = FALLBACK_GLOSSARY.filter(rule => rule.id !== ruleId);
  }
};

export const toggleGlossaryRule = async (ruleId: string, active: boolean, userId: string = DEFAULT_USER_ID): Promise<void> => {
  try {
    await fetch(`${DATA_BASE_URL}/api/glossary/${ruleId}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, rule_id: ruleId, active }),
    });
  } catch {
    // Swallow — UI already updated optimistically
    const rule = FALLBACK_GLOSSARY.find(r => r.id === ruleId);
    if (rule) rule.active = active;
  }
};

export const cloneVoice = async (file: File, userId: string = DEFAULT_USER_ID) => {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('user_id', userId);
  
  try {
    const res = await fetch(`${AI_BASE_URL}/api/voice/clone`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Server error ${res.status}: ${errBody}`);
    }
    return await res.json();
  } catch (error) {
    console.error('cloneVoice failed:', error);
    throw error;  // Let the caller handle the error instead of silently mocking
  }
};

// --- Conversation API ---
export const startConversation = async (userId: string = DEFAULT_USER_ID) => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/conversations/start?user_id=${userId}`, { method: 'POST' });
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable - mock startConversation");
    return { id: "mock_conv_123", status: "active" };
  }
};

export const addUtterance = async (conversationId: string, speaker: string, text: string) => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/conversations/add_sentence?conversation_id=${conversationId}&speaker=${speaker}&text=${encodeURIComponent(text)}`, { method: 'POST' });
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable - mock addUtterance");
    return { success: true };
  }
};

export const endConversation = async (conversationId: string) => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/conversations/end?conversation_id=${conversationId}`, { method: 'POST' });
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable - mock endConversation");
    return { success: true };
  }
};

export const fetchActiveConversation = async (userId: string = DEFAULT_USER_ID) => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/conversations/active?user_id=${userId}`);
    if (res.status === 204 || res.status === 404) return null;
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable - mock fetchActiveConversation");
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
  try {
    const res = await fetch(`${AI_BASE_URL}/api/caregiver/simplify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, user_id: userId })
    });
    if (!res.ok) throw new Error('Failed to simplify text');
    return await res.json();
  } catch (error) {
    console.warn('Mock simplifyText', { text });
    return { simplified: "Time for lunch 🍽️\nDoctor appointment later 👨‍⚕️" };
  }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const formData = new FormData();
    const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8001';
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
