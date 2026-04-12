/**
 * shared/api-contract.ts
 * Canonical request/response types for both backends (E2 port 8001 + E3 port 8002).
 * Used by frontend utils (E1/E2) as the single source of truth.
 * DO NOT import backend-specific logic here — types only.
 */

// ─── Icons (Composer mode) ───────────────────────────────────────────────────

export interface IconDef {
  key: string;
  icon_name: string;
  label: string;
  category: string;
  tags: string[];
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  user_id: string;
  path: string[];
  path_key: string;
  input_mode: "tree" | "composer" | "custom";
  sentence: string;
  confidence: number;
  audio_url?: string | null;
  feedback?: "positive" | "correction" | null;
  correction?: string | null;
  is_first_occurrence: boolean;
  flagged: boolean;
  post_session_question?: PostSessionQuestion | null;
  status: "pending" | "confirmed";
  timestamp: string; // ISO
}

export interface PostSessionQuestion {
  question_id: string;
  question: string;
}

// ─── Intent (E2 /api/intent SSE) ────────────────────────────────────────────

export interface IntentRequest {
  path: string[];
  user_id: string;
  input_mode?: "tree" | "composer" | "custom";
}

/** SSE tokens arrive as `data: {"token": "..."}`. Final event: */
export interface IntentDoneEvent {
  done: true;
  session_id: string;
  full_sentence: string;
  confidence: number;
}

// ─── Confirm (E2 /api/confirm) ───────────────────────────────────────────────

export interface ConfirmRequest {
  session_id: string;
  user_id: string;
}

export interface ConfirmResponse {
  audio_url: string;
  sentence: string;
  session_id: string;
  voice_source?: string | null;
  post_session_question?: PostSessionQuestion | null;
}

// ─── Feedback (E2 /api/feedback) ────────────────────────────────────────────

export interface FeedbackRequest {
  session_id: string;
  user_id: string;
  thumbs_up: boolean;
  correction?: string;
}

// ─── Clarify (E2 /api/clarify) ──────────────────────────────────────────────

export interface ClarifyRequest {
  path: string[];
  user_id: string;
  input_mode?: "tree" | "composer";
}

export interface ClarifyOption {
  label: string;
  path: string[];
  icon?: string;
}

export interface ClarifyResponse {
  options: ClarifyOption[];
}

// ─── Caregiver Panel (E3 /api/caregiver/panel) ───────────────────────────────

export interface CaregiverPanel {
  last_session: Session | null;
  pending_question: PostSessionQuestion | null;
  knowledge_score: number;
  knowledge_breakdown: {
    profile: number;
    medical: number;
    preferences: number;
    conversation: number;
  };
  urgent: boolean;
}

// ─── Live Activity (E2 /api/live) ────────────────────────────────────────────

export interface LiveActivity {
  mode: "Tree" | "Composer" | "Playback" | "Idle";
  breadcrumb: string[];
  streamingSentence: string;
  session_id: string | null;
}

// ─── Pending Question (E3 /api/question/pending) ─────────────────────────────

export interface PendingQuestionResponse {
  pending: boolean;
  question: PostSessionQuestion | null;
  session_id?: string;
}

// ─── Insights (E3 /api/insights) ─────────────────────────────────────────────

export interface InsightsResponse {
  sessions_by_day: Record<string, number>; // "YYYY-MM-DD" -> count
  top_paths: TopPath[];
  sessions_by_period: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  mood_log: (MoodEntry | null)[]; // null = no entry that day
}

export interface TopPath {
  path_key: string;
  label: string;
  count: number;
  input_mode: "tree" | "composer";
}

export interface MoodEntry {
  date: string;
  score: number; // 1–10
  notes?: string;
  timestamp: string;
}

// ─── Digest (E2 /api/digest) ─────────────────────────────────────────────────

export interface DigestResponse {
  digest: string;
  generated_at: string;
}

// ─── Caregiver Simplify (E2 /api/caregiver/simplify) ────────────────────────

export interface SimplifyRequest {
  text: string;
  user_id?: string;
}

export interface SimplifyResponse {
  simplified: string;
  audio_url?: string;
}

// ─── Voice Clone (E2 /api/voice/clone) ───────────────────────────────────────

export interface VoiceCloneResponse {
  voice_id: string;
  success: boolean;
}

// ─── Profile (E3 /api/profile) ───────────────────────────────────────────────

export interface UserProfile {
  _id: string;
  profile: {
    name: string;
    diagnosis_date?: string;
    caregiver_name?: string;
  };
  medical: {
    medications: string[];
    allergies: string[];
    conditions?: string[];
    doctor_name?: string;
  };
  preferences: {
    communication_notes?: string;
    known_preferences?: string;
    always_know?: string;
  };
  routine?: {
    meals?: Record<string, string>;
    medications?: Record<string, string>;
  };
  voice_id?: string;
  knowledge_score: number;
  knowledge_breakdown: Record<string, number>;
  path_frequencies: Record<string, number>;
  context_answers: Array<{ question_id?: string; question: string; answer: string; timestamp: string }>;
  mood_log: MoodEntry[];
}
