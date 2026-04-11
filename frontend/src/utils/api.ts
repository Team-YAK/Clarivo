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

export const MOCK_DATA = {
  // We will keep a local copy to ensure externalDirs don't crash next.js for now.
  // In later iterations, this should be symlinked or aliased properly to /shared
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
};

// API Utility falling back to mocks
export const fetchLiveActivity = async (): Promise<LiveActivity> => {
  try {
    // Try real fetch
    // const res = await fetch('http://localhost:8001/api/live');
    // if (!res.ok) throw new Error('API down');
    // return res.json();
    throw new Error('API not available yet');
  } catch (error) {
    return MOCK_DATA.liveActivity;
  }
};

export const fetchSessionHistory = async (): Promise<Session[]> => {
  try {
    throw new Error('API not available yet');
  } catch (error) {
    return MOCK_DATA.sessionHistory;
  }
};

export const fetchKnowledgeScore = async (): Promise<KnowledgeScore> => {
  try {
    throw new Error('API not available yet');
  } catch (error) {
    return MOCK_DATA.knowledgeScore;
  }
};

export const fetchUrgencyAlert = async (): Promise<Alert> => {
  try {
    throw new Error('API not available yet');
  } catch (error) {
    return MOCK_DATA.urgencyAlert;
  }
};
