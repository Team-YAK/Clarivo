import { Session, LiveActivity, KnowledgeScore, Alert, ChartData, MOCK_DATA } from './api';

const DATA_BASE_URL = process.env.NEXT_PUBLIC_DATA_URL || 'http://localhost:8002';
const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8001';
const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || 'yuki_demo';

export interface PendingQuestion {
  question: string;
  question_id: string;
}

export interface CaregiverPanelResponse {
  last_session: Session | null;
  pending_question: PendingQuestion | null;
  knowledge_score: number;
  knowledge_breakdown: {
    overall: number;
    profile: number;
    medical: number;
    preferences: number;
    conversation: number;
  };
  urgent: boolean;
}

export const MOCK_CAREGIVER_PANEL: CaregiverPanelResponse = {
  last_session: MOCK_DATA.sessionHistory[0],
  pending_question: { question: "Does Alex prefer a specific dessert for celebration tonight?", question_id: "q1" },
  knowledge_score: 78,
  knowledge_breakdown: {
    overall: 78,
    profile: 92,
    medical: 78,
    preferences: 85,
    conversation: 64
  },
  urgent: false
};

// --- API Functions ---
export const fetchCaregiverPanel = async (userId: string = DEFAULT_USER_ID): Promise<CaregiverPanelResponse> => {
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
    return MOCK_DATA.sessionHistory;
  }
};

export const fetchInsights = async (userId: string = DEFAULT_USER_ID): Promise<any> => {
  try {
    const res = await fetch(`${DATA_BASE_URL}/api/insights?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch (error) {
    console.warn('Backend unavailable — using mock data for Insights');
    return {
      sessions_by_day: { "Mon": 5, "Tue": 8, "Wed": 6, "Thu": 10, "Fri": 15 },
      top_paths: [{ path: "Food > Dessert", count: 12 }, { path: "Needs > Physical", count: 8 }],
      sessions_by_period: { "Morning": 12, "Afternoon": 25, "Evening": 8 },
      mood_log: MOCK_DATA.analytics
    };
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

export const cloneVoice = async (file: File, userId: string = DEFAULT_USER_ID) => {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('user_id', userId);
  
  try {
    const res = await fetch(`${AI_BASE_URL}/api/voice/clone`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to clone voice');
    return await res.json();
  } catch (error) {
    console.warn('Mock cloneVoice', file.name);
    return { success: true, voice_id: 'mock_voice_123' };
  }
};
