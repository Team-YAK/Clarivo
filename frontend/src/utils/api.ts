export interface Session {
  id: string;
  date: string;
  duration: string;
  summary: string;
  flags: number;
}

export interface LiveActivity {
  mode: 'Composer' | 'Playback' | 'Idle';
  breadcrumb: string[];
  streamingSentence: string;
}

export interface KnowledgeScore {
  percentage: number;
  label: string;
}

export interface Alert {
  active: boolean;
  message: string;
}

export interface ChartData {
  day: string;
  phrases: number;
  distress: number;
}

export const MOCK_DATA = {
  sessionHistory: [
    { id: '1', date: '2026-04-10', duration: '12m', summary: 'Discussed morning routine.', flags: 0 },
    { id: '2', date: '2026-04-09', duration: '45m', summary: 'Patient was distressed about lunch.', flags: 1 },
    { id: '3', date: '2026-04-08', duration: '10m', summary: 'General check-in.', flags: 0 },
  ] as Session[],
  
  liveActivity: {
    mode: 'Composer',
    breadcrumb: ['Needs', 'Physical', 'I am in pain', 'My head'],
    streamingSentence: 'I am experiencing a severe headache right now.',
  } as LiveActivity,

  knowledgeScore: {
    percentage: 78,
    label: 'Model Accuracy',
  } as KnowledgeScore,

  urgencyAlert: {
    active: false,
    message: 'Patient logged high distress level.',
  } as Alert,

  analytics: [
    { day: 'Mon', phrases: 12, distress: 1 },
    { day: 'Tue', phrases: 19, distress: 3 },
    { day: 'Wed', phrases: 15, distress: 0 },
    { day: 'Thu', phrases: 25, distress: 1 },
    { day: 'Fri', phrases: 8, distress: 4 },
    { day: 'Sat', phrases: 30, distress: 0 },
    { day: 'Sun', phrases: 22, distress: 0 },
  ] as ChartData[]
};

// API Utility falling back to mocks
export const fetchLiveActivity = async (): Promise<LiveActivity> => {
  try { throw new Error('API not available'); } catch { return MOCK_DATA.liveActivity; }
};
export const fetchSessionHistory = async (): Promise<Session[]> => {
  try { throw new Error('API not available'); } catch { return MOCK_DATA.sessionHistory; }
};
export const fetchKnowledgeScore = async (): Promise<KnowledgeScore> => {
  try { throw new Error('API not available'); } catch { return MOCK_DATA.knowledgeScore; }
};
export const fetchUrgencyAlert = async (): Promise<Alert> => {
  try { throw new Error('API not available'); } catch { return MOCK_DATA.urgencyAlert; }
};
export const fetchAnalytics = async (): Promise<ChartData[]> => {
  try { throw new Error('API not available'); } catch { return MOCK_DATA.analytics; }
};
