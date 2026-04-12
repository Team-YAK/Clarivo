"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  fetchCaregiverPanel,
  fetchSessionHistory,
  submitContextAnswer,
  submitFeedback,
  startConversation,
  endConversation,
  addUtterance,
  fetchActiveConversation,
} from '@/utils/caregiverApi';
import { Session, CaregiverPanel as CaregiverPanelData } from '../../../../shared/api-contract';
import { Warning, Brain, ArrowCounterClockwise, ThumbsUp, ThumbsDown, Check, Microphone, MicrophoneSlash, ChatTeardropText } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function CaregiverPanel() {
  const [panelData, setPanelData] = useState<CaregiverPanelData | null>(null);
  const [history, setHistory] = useState<Session[]>([]);
  const [contextAnswer, setContextAnswer] = useState("");
  const [correctionText, setCorrectionText] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [submittingContext, setSubmittingContext] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeConv, setActiveConv] = useState<any>(null);

  // Use refs to avoid re-creating SpeechRecognition on every state change
  const recognitionRef = useRef<any>(null);
  const activeConvRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync with state
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [activeConv?.utterances?.length]);

  // Initialize SpeechRecognition once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = async (event: any) => {
      const last = event.results[event.results.length - 1];
      if (!last.isFinal) return;
      const transcript = last[0].transcript.trim();
      const conv = activeConvRef.current;
      if (conv?.id && transcript) {
        console.log("Transcribed:", transcript);
        try {
          await addUtterance(conv.id, "Visitor", transcript);
        } catch (e) {
          console.error("Failed to save utterance:", e);
        }
      }
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      // Don't stop recording on no-speech errors, just let it restart
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setIsRecording(false);
      }
    };

    rec.onend = () => {
      // Auto-restart if we're still supposed to be recording
      if (isRecordingRef.current) {
        try { rec.start(); } catch { /* already started */ }
      }
    };

    recognitionRef.current = rec;

    return () => {
      try { rec.stop(); } catch { /* not running */ }
    };
  }, []); // Empty deps — only initialize once

  const fetchData = useCallback(async () => {
    try {
      const [pData, hData, active] = await Promise.all([
        fetchCaregiverPanel(),
        fetchSessionHistory(),
        fetchActiveConversation(),
      ]);
      setPanelData(pData);
      setHistory(hData);
      if (active?.id) {
        setActiveConv(active);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleContextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contextAnswer.trim() || !panelData?.pending_question) return;
    setSubmittingContext(true);
    await submitContextAnswer(panelData.pending_question.question_id, contextAnswer);
    setContextAnswer("");
    await fetchData();
    setSubmittingContext(false);
  };

  const handleFeedback = async (sessionId: string, thumbsUp: boolean) => {
    if (thumbsUp) {
      await submitFeedback(sessionId, true);
      fetchData();
    } else {
      setEditingSessionId(editingSessionId === sessionId ? null : sessionId);
    }
  };

  const handleCorrectionSubmit = async (sessionId: string) => {
    if (!correctionText.trim()) return;
    await submitFeedback(sessionId, false, correctionText);
    setEditingSessionId(null);
    setCorrectionText("");
    fetchData();
  };

  const toggleConversation = async () => {
    if (activeConv) {
      // End conversation
      try {
        await endConversation(activeConv.id);
      } catch (e) { console.error(e); }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ok */ }
      }
      setIsRecording(false);
      setActiveConv(null);
    } else {
      // Start conversation
      try {
        const res = await startConversation();
        const convId = res.conversation_id || res.id;
        const conv = { id: convId, utterances: [] };
        setActiveConv(conv);
        setIsRecording(true);
        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch { /* already started */ }
        }
      } catch (e) {
        console.error("Failed to start conversation:", e);
      }
    }
    fetchData();
  };

  return (
    <aside className="w-full h-full bg-surface-container-low border-l border-outline-variant/20 flex flex-col overflow-y-auto no-scrollbar ring-2 ring-error/10 ring-inset">
      
      {/* Urgency Alert */}
      <AnimatePresence>
        {panelData?.urgent && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-error text-on-error p-4 flex items-center gap-4 shadow-lg animate-pulse"
          >
            <Warning size={24} weight="bold" />
            <span className="font-headline font-extrabold text-sm tracking-wider uppercase">
              Patient logged high distress level.
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
        {/* Transcription Sidebar (Replaces Live Activity) */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <ChatTeardropText size={16} weight="bold" />
              Live Transcript
            </h3>
            <button 
              onClick={toggleConversation}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-tight transition-all flex items-center gap-2 shadow-md ${
                activeConv 
                ? 'bg-error text-on-error hover:bg-error/90' 
                : 'bg-primary text-on-primary hover:bg-primary/90'
              }`}
            >
              {activeConv ? <MicrophoneSlash size={16} weight="bold" /> : <Microphone size={16} weight="bold" />}
              {activeConv ? 'End Conversation' : 'Start Conversation'}
            </button>
          </div>
          
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 shadow-xl h-[400px] flex flex-col">
            <div ref={transcriptContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {activeConv && activeConv.utterances && activeConv.utterances.length > 0 ? (
                activeConv.utterances.map((u: any, i: number) => (
                  <div key={i} className={`flex flex-col ${u.speaker === 'Patient' ? 'items-start' : 'items-end'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${u.speaker === 'Patient' ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {u.speaker}
                    </span>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
                      u.speaker === 'Patient' 
                      ? 'bg-primary-container text-on-primary-container rounded-tl-none' 
                      : 'bg-surface-container-highest text-on-surface rounded-tr-none border border-outline-variant/10'
                    }`}>
                      {u.text}
                    </div>
                  </div>
                ))
              ) : activeConv ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                    <Microphone size={24} weight="fill" />
                  </div>
                  <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest animate-pulse">Listening for dialogue...</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-50">
                  <ChatTeardropText size={40} weight="thin" className="text-on-surface-variant" />
                  <p className="text-on-surface-variant text-sm font-medium">Start a conversation to see the transcript here.</p>
                </div>
              )}
            </div>
            
            {activeConv && (
              <div className="p-3 bg-primary/5 border-t border-primary/10">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Active Transcription Enabled</span>
                </div>
              </div>
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
                  strokeDashoffset={panelData ? 251.2 - (251.2 * panelData.knowledge_score) / 100 : 251.2} 
                  strokeWidth="8"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                ></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-headline font-extrabold text-2xl text-primary">
                  {panelData ? `${panelData.knowledge_score}%` : '...'}
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-headline font-bold text-lg text-on-surface">Kishan&apos;s Profile</h4>
              <p className="text-on-surface-variant text-sm">Deep learning accuracy</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Profile', val: panelData?.knowledge_breakdown?.profile || 0 },
              { label: 'Medical', val: panelData?.knowledge_breakdown?.medical || 0 },
              { label: 'Prefs', val: panelData?.knowledge_breakdown?.preferences || 0 },
              { label: 'Conv.', val: panelData?.knowledge_breakdown?.conversation || 0 }
            ].map(item => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase">
                  <span>{item.label}</span><span>{item.val}%</span>
                </div>
                <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${item.val}%`, transition: 'width 1s ease' }}></div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Claude Question Card */}
        <AnimatePresence>
          {panelData?.pending_question && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-primary-container text-on-primary-container p-6 rounded-xl shadow-md border-b-4 border-primary"
            >
              <div className="flex items-center gap-3 mb-4">
                <Brain size={24} weight="fill" className="text-primary-fixed" />
                <h4 className="font-headline font-bold">Insight Needed</h4>
              </div>
              <p className="mb-4 text-sm leading-relaxed opacity-90">{panelData.pending_question.question}</p>
              <form onSubmit={handleContextSubmit} className="flex gap-2">
                <input 
                  value={contextAnswer}
                  onChange={(e) => setContextAnswer(e.target.value)}
                  className="w-full bg-white/10 border-none rounded-lg p-3 text-sm placeholder:text-white/40 focus:ring-2 focus:ring-primary-fixed outline-none transition-shadow" 
                  placeholder="Type answer here..." 
                  type="text" 
                  disabled={submittingContext}
                />
                <button type="submit" disabled={submittingContext} className="bg-primary text-on-primary px-4 rounded-lg font-bold">
                  {submittingContext ? '...' : 'Send'}
                </button>
              </form>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Session History */}
        <motion.section variants={itemVariants}>
          <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4">Session History</h3>
          <motion.div variants={containerVariants} className="space-y-3">
            {history.length > 0 ? history.map((session, index) => {
              const confidenceColor = session.flagged ? "bg-red-500" : (index % 2 === 0 ? "bg-teal-500" : "bg-amber-500");
              const isEditing = editingSessionId === session.id;
              
              return (
                <motion.div variants={itemVariants} key={session.id} className="bg-surface-container-lowest p-4 rounded-xl flex flex-col group shadow-sm transition-colors border border-transparent hover:border-outline-variant/30">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className={`w-2 h-2 rounded-full ${confidenceColor} mt-2`}></div>
                      <div>
                        <p className="text-xs text-on-surface-variant font-medium">{session.timestamp}</p>
                        <p className="text-on-surface font-semibold text-sm">&quot;{session.sentence}&quot;</p>
                      </div>
                    </div>
                    {/* Replay button */}
                    <button className="text-on-surface-variant hover:text-primary transition-colors p-1">
                      <ArrowCounterClockwise size={20} weight="bold" />
                    </button>
                  </div>
                  
                  {/* Feedback Controls */}
                  <div className="mt-3 pt-3 border-t border-outline-variant/10 flex items-center justify-end gap-2">
                    <button onClick={() => handleFeedback(session.id, true)} className="px-3 py-1 text-xs font-bold bg-surface-container hover:bg-teal-100 hover:text-teal-800 text-on-surface-variant rounded-full flex gap-1 items-center transition-colors">
                      <ThumbsUp size={14} weight="fill" /> Correct
                    </button>
                    <button onClick={() => handleFeedback(session.id, false)} className={`px-3 py-1 text-xs font-bold rounded-full flex gap-1 items-center transition-colors ${isEditing ? 'bg-red-100 text-red-800' : 'bg-surface-container hover:bg-red-100 hover:text-red-800 text-on-surface-variant'}`}>
                      <ThumbsDown size={14} weight="fill" /> Needs Fix
                    </button>
                  </div>

                  {/* Inline Correction Editor */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3"
                      >
                        <div className="flex gap-2">
                          <input 
                            value={correctionText}
                            onChange={(e) => setCorrectionText(e.target.value)}
                            placeholder="Type how it should have sounded..."
                            className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <button onClick={() => handleCorrectionSubmit(session.id)} className="bg-primary text-on-primary px-3 rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors">
                            <Check size={16} weight="bold" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
