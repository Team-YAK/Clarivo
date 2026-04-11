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
