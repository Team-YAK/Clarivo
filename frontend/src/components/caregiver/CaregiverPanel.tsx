"use client";

import React, { useEffect, useState } from 'react';
import { 
  fetchLiveActivity, 
  fetchSessionHistory, 
  fetchKnowledgeScore, 
  fetchUrgencyAlert,
  LiveActivity,
  Session,
  KnowledgeScore,
  Alert
} from '@/utils/api';
import { Warning, PlayCircle, Clock } from '@phosphor-icons/react';

export default function CaregiverPanel() {
  const [liveActivity, setLiveActivity] = useState<LiveActivity | null>(null);
  const [history, setHistory] = useState<Session[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeScore | null>(null);
  const [alert, setAlert] = useState<Alert | null>(null);

  useEffect(() => {
    // Load mock data via API layer
    Promise.all([
      fetchLiveActivity().then(setLiveActivity),
      fetchSessionHistory().then(setHistory),
      fetchKnowledgeScore().then(setKnowledge),
      fetchUrgencyAlert().then(setAlert)
    ]);
  }, []);

  return (
    <div className="w-full h-full bg-zinc-50 border-l border-zinc-200 p-6 flex flex-col gap-6 overflow-y-auto">
      <h2 className="text-xl font-semibold text-zinc-900">Caregiver Dashboard</h2>

      {/* Urgency Alert */}
      {alert?.active && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md flex items-start gap-3">
          <Warning size={24} className="text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Urgency Alert</h3>
            <p className="text-sm text-red-700 mt-1">{alert.message}</p>
          </div>
        </div>
      )}

      {/* Live Activity */}
      <section className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Live Activity</h3>
        {liveActivity ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                {liveActivity.mode}
              </span>
              <span className="text-sm text-zinc-400">
                {liveActivity.breadcrumb.join(' › ')}
              </span>
            </div>
            <p className="text-lg text-zinc-800 italic border-l-2 border-zinc-200 pl-4 py-1">
              "{liveActivity.streamingSentence}"
            </p>
          </div>
        ) : (
          <div className="animate-pulse h-16 bg-zinc-100 rounded" />
        )}
      </section>

      {/* Knowledge Score */}
      <section className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">AI Knowledge Score</h3>
        {knowledge ? (
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="font-semibold text-zinc-800">{knowledge.percentage}%</span>
              <span className="text-xs text-zinc-500">{knowledge.label}</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2.5">
              <div 
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${knowledge.percentage}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="animate-pulse h-8 bg-zinc-100 rounded" />
        )}
      </section>

      {/* Session History */}
      <section className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5 flex-1">
        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Recent Sessions</h3>
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map(session => (
              <div key={session.id} className="flex flex-col gap-2 p-3 hover:bg-zinc-50 rounded-lg transition-colors border border-transparent hover:border-zinc-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <Clock size={16} />
                    <span>{session.date}</span>
                    <span className="text-zinc-300">•</span>
                    <span>{session.duration}</span>
                  </div>
                  {session.flags > 0 && (
                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {session.flags} Flag
                    </span>
                  )}
                </div>
                <p className="text-zinc-800 text-sm font-medium">{session.summary}</p>
                <div className="flex gap-2 mt-2">
                  <button className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md transition-colors">
                    <PlayCircle size={16} /> Lookback Audio
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-pulse h-32 bg-zinc-100 rounded" />
        )}
      </section>
    </div>
  );
}
