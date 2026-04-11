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
import { Warning, Brain, ArrowCounterClockwise } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function CaregiverPanel() {
  const [liveActivity, setLiveActivity] = useState<LiveActivity | null>(null);
  const [history, setHistory] = useState<Session[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeScore | null>(null);
  const [alertState, setAlertState] = useState<Alert | null>(null);

  useEffect(() => {
    Promise.all([
      fetchLiveActivity().then(setLiveActivity),
      fetchSessionHistory().then(setHistory),
      fetchKnowledgeScore().then(setKnowledge),
      fetchUrgencyAlert().then(setAlertState)
    ]);
  }, []);

  return (
    <aside className="w-full h-full bg-surface-container-low border-l border-outline-variant/20 flex flex-col overflow-y-auto no-scrollbar ring-2 ring-error/10 ring-inset">
      
      {/* Urgency Alert (Pinned) */}
      <AnimatePresence>
        {alertState?.active && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-error text-on-error p-4 flex items-center gap-4 shadow-lg animate-pulse"
          >
            <Warning size={24} weight="bold" />
            <span className="font-headline font-extrabold text-sm tracking-wider uppercase">
              {alertState.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6 space-y-8 flex-1 overflow-y-auto no-scrollbar"
      >
        {/* Live Activity */}
        <motion.section variants={itemVariants}>
          <div className="bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-widest text-center py-1.5 rounded-t-xl mb-2 shadow-sm">
            Caregiver view — Yuki sees icons only
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Live Activity</h3>
            {liveActivity && (
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                {liveActivity.mode} Mode Active
              </span>
            )}
          </div>
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-md border-l-4 border-primary transition-shadow">
            {liveActivity ? (
              <>
                <p className="text-on-surface-variant italic mb-1 text-sm">Synthesizing draft based on: {liveActivity.breadcrumb.join(' > ')}...</p>
                <p className="text-primary font-headline font-bold text-xl">"{liveActivity.streamingSentence}"</p>
              </>
            ) : (
              <div className="animate-pulse h-16 bg-surface-variant rounded"></div>
            )}
          </div>
        </motion.section>

        {/* Knowledge Score */}
        <motion.section variants={itemVariants} className="bg-surface-container-highest/30 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-surface-container-high" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                <circle 
                  className="text-primary-container" 
                  cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={knowledge ? 251.2 - (251.2 * knowledge.percentage) / 100 : 251.2} 
                  strokeWidth="8"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                ></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-headline font-extrabold text-2xl text-primary">
                  {knowledge ? `${knowledge.percentage}%` : '...'}
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-headline font-bold text-lg text-on-surface">Alex's Profile</h4>
              <p className="text-on-surface-variant text-sm">Deep learning accuracy</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase"><span>Profile</span><span>92%</span></div>
              <div className="h-1 bg-surface-container-high rounded-full overflow-hidden"><div className="h-full bg-primary w-[92%]"></div></div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase"><span>Medical</span><span>78%</span></div>
              <div className="h-1 bg-surface-container-high rounded-full overflow-hidden"><div className="h-full bg-primary w-[78%]"></div></div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase"><span>Preferences</span><span>85%</span></div>
              <div className="h-1 bg-surface-container-high rounded-full overflow-hidden"><div className="h-full bg-primary w-[85%]"></div></div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase"><span>Conv.</span><span>64%</span></div>
              <div className="h-1 bg-surface-container-high rounded-full overflow-hidden"><div className="h-full bg-primary w-[64%]"></div></div>
            </div>
          </div>
        </motion.section>

        {/* Claude Question Card */}
        <motion.section variants={itemVariants} className="bg-primary-container text-on-primary-container p-6 rounded-xl shadow-md border-b-4 border-primary">
          <div className="flex items-center gap-3 mb-4">
            <Brain size={24} weight="fill" className="text-primary-fixed" />
            <h4 className="font-headline font-bold">Insight Needed</h4>
          </div>
          <p className="mb-4 text-sm leading-relaxed opacity-90">Does Alex prefer a specific dessert for celebration tonight?</p>
          <input className="w-full bg-white/10 border-none rounded-lg p-3 text-sm placeholder:text-white/40 focus:ring-2 focus:ring-primary-fixed outline-none transition-shadow" placeholder="Type answer here..." type="text" />
        </motion.section>

        {/* Session History */}
        <motion.section variants={itemVariants}>
          <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4">Session History</h3>
          <motion.div variants={containerVariants} className="space-y-3">
            {history.length > 0 ? history.map((session, index) => {
              const confidenceColor = session.flags > 0 ? "bg-red-500" : (index % 2 === 0 ? "bg-teal-500" : "bg-amber-500");
              return (
                <motion.div variants={itemVariants} key={session.id} className="bg-surface-container-lowest p-4 rounded-xl flex items-start justify-between group transition-all hover:translate-x-1 shadow-sm">
                  <div className="flex gap-4">
                    <div className={`w-2 h-2 rounded-full ${confidenceColor} mt-2`}></div>
                    <div>
                      <p className="text-xs text-on-surface-variant font-medium">{session.date} • {session.duration}</p>
                      <p className="text-on-surface font-semibold text-sm">"{session.summary}"</p>
                    </div>
                  </div>
                  <button className="text-on-surface-variant hover:text-primary transition-colors">
                    <ArrowCounterClockwise size={20} weight="bold" />
                  </button>
                </motion.div>
              )
            }) : (
              <div className="animate-pulse h-32 bg-surface-variant rounded-xl"></div>
            )}
          </motion.div>
        </motion.section>
      </motion.div>
    </aside>
  );
}
