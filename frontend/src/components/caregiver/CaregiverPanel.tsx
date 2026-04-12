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
  transcribeAudio,
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
  const [interimText, setInterimText] = useState("");

  // Refs for speech recognition
  const activeConvRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  // MediaRecorder fallback (for browsers without SpeechRecognition)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<any>(null);
  const isTranscribingRef = useRef(false);

  // Keep activeConv ref in sync
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [activeConv?.utterances?.length, interimText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, []);

  const commitUtterance = (text: string) => {
    const conv = activeConvRef.current;
    if (!conv?.id) return;
    const utterance = { speaker: "Visitor", text: text.trim(), timestamp: new Date().toISOString() };
    setActiveConv((prev: any) => {
      if (!prev) return prev;
      const updated = { ...prev, utterances: [...(prev.utterances || []), utterance] };
      activeConvRef.current = updated;
      return updated;
    });
    addUtterance(conv.id, "Visitor", text.trim()).catch((e) =>
      console.error("Failed to persist utterance:", e)
    );
  };

  /**
   * Primary: Web Speech API — built-in VAD, real-time interim results,
   * auto-finalizes when the speaker naturally pauses.
   */
  const startWebSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return false; // Signal to fall back

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const finalText = result[0].transcript.trim();
          if (finalText) {
            setInterimText("");
            commitUtterance(finalText);
          }
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (e: any) => {
      // "no-speech" is normal — browser paused listening, will restart via onend
      if (e.error === "no-speech" || e.error === "aborted") return;
      console.error("[STT] SpeechRecognition error:", e.error);
    };

    recognition.onend = () => {
      setInterimText("");
      // Auto-restart as long as session is active
      if (isRecordingRef.current) {
        try { recognition.start(); } catch { /* already starting */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    console.log("[STT] Web Speech API started");
    return true;
  };

  /**
   * Fallback: MediaRecorder chunked upload to ElevenLabs backend.
   * Used only if SpeechRecognition API is unavailable (e.g. Firefox).
   * Uses 8-second chunks (up from 5s) to reduce mid-sentence cuts.
   */
  const startMediaRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1, sampleRate: 16000 },
      });
      mediaStreamRef.current = stream;

      const startCycle = () => {
        if (!isRecordingRef.current || !mediaStreamRef.current) return;
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = async () => {
          if (!chunks.length || !isRecordingRef.current) return;
          const blob = new Blob(chunks, { type: mimeType });
          if (blob.size < 1500) { if (isRecordingRef.current) startCycle(); return; }
          setInterimText("Transcribing...");
          try {
            const text = await transcribeAudio(blob);
            setInterimText("");
            if (text?.trim()) commitUtterance(text.trim());
          } catch { setInterimText(""); }
          if (isRecordingRef.current) startCycle();
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
        recordingIntervalRef.current = setTimeout(() => {
          if (recorder.state === "recording") recorder.stop();
        }, 8000);
      };
      startCycle();
    } catch (e: any) {
      console.error("[STT] Mic access denied:", e);
      isRecordingRef.current = false;
      setIsRecording(false);
      alert("Microphone access is required. Please allow microphone access and try again.");
    }
  };

  const stopRecognition = () => {
    // Stop Web Speech API
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ok */ }
      recognitionRef.current = null;
    }
    // Stop MediaRecorder fallback
    if (recordingIntervalRef.current) { clearTimeout(recordingIntervalRef.current); recordingIntervalRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch { /* ok */ }
    }
    if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
    mediaRecorderRef.current = null;
    setInterimText("");
  };

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
      } else if (!isRecordingRef.current) {
        setActiveConv(null);
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
      // ── End conversation ──
      isRecordingRef.current = false;
      setIsRecording(false);
      stopRecognition();
      try { await endConversation(activeConv.id); } catch (e) { console.error(e); }
      setActiveConv(null);
    } else {
      // ── Start conversation ──
      try {
        const res = await startConversation();
        const convId = res.conversation_id || res.id;
        const conv = { id: convId, utterances: [] };
        setActiveConv(conv);
        isRecordingRef.current = true;
        setIsRecording(true);

        // Try Web Speech API first (built-in VAD, no chunking artifacts)
        // Fall back to MediaRecorder if unavailable (e.g. Firefox)
        const usedWebSpeech = startWebSpeechRecognition();
        if (!usedWebSpeech) {
          console.log("[STT] Web Speech API unavailable, falling back to MediaRecorder");
          await startMediaRecording();
        }
      } catch (e) {
        console.error("Failed to start conversation:", e);
      }
    }
    fetchData();
  };

  return (
    <aside className="w-full h-full bg-[#050505] border-l border-white/10 flex flex-col overflow-y-auto no-scrollbar relative liquid-glass-card">
      
      {/* Urgency Alert */}
      <AnimatePresence>
        {panelData?.urgent && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#FF2E63] text-white p-4 flex items-center gap-4 shadow-2xl animate-pulse z-20 relative"
          >
            <Warning size={24} weight="bold" />
            <span className="font-black text-[10px] tracking-[0.2em] uppercase">
              CRITICAL: High Distress Detected
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6 space-y-8 flex-1 overflow-y-auto no-scrollbar z-10 relative"
      >
        {/* Transcription Sidebar (Replaces Live Activity) */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <ChatTeardropText size={16} weight="bold" className="text-[#14F1D9]" />
              Live Stream
            </h3>
            <button 
              onClick={toggleConversation}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl border ${
                activeConv 
                ? 'bg-[#FF2E63]/10 text-[#FF2E63] border-[#FF2E63]/30 hover:bg-[#FF2E63]/20' 
                : 'bg-[#14F1D9]/10 text-[#14F1D9] border-[#14F1D9]/30 hover:bg-[#14F1D9]/20'
              }`}
            >
              {activeConv ? <MicrophoneSlash size={14} weight="bold" /> : <Microphone size={14} weight="bold" />}
              {activeConv ? 'End Session' : 'Begin Live'}
            </button>
          </div>
          
          <div className="bg-black/40 rounded-2xl overflow-hidden border border-white/5 shadow-2xl h-[400px] flex flex-col relative">
            <div ref={transcriptContainerRef} className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
              {activeConv && activeConv.utterances && activeConv.utterances.length > 0 ? (
                <>
                  {activeConv.utterances.map((u: any, i: number) => (
                    <div key={i} className={`flex flex-col ${u.speaker === 'Patient' ? 'items-start' : 'items-end'}`}>
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-2 ${u.speaker === 'Patient' ? 'text-[#14F1D9]' : 'text-white/30'}`}>
                        {u.speaker}
                      </span>
                      <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm font-medium shadow-2xl leading-relaxed ${
                        u.speaker === 'Patient' 
                        ? 'bg-[#14F1D9]/10 text-white border border-[#14F1D9]/20 rounded-tl-none' 
                        : 'bg-white/5 text-white/80 rounded-tr-none border border-white/5'
                      }`}>
                        {u.text}
                      </div>
                    </div>
                  ))}
                  {/* Show interim text being transcribed */}
                  {interimText && (
                    <div className="flex flex-col items-end animate-pulse">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 text-white/20">
                        Neural Capture...
                      </span>
                      <div className="max-w-[90%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed bg-white/5 text-white/30 rounded-tr-none border border-dashed border-white/10">
                        {interimText}
                      </div>
                    </div>
                  )}
                </>
              ) : activeConv ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  {interimText ? (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-[#14F1D9]/5 flex items-center justify-center text-[#14F1D9] border border-[#14F1D9]/10 shadow-[0_0_20px_rgba(20,241,217,0.1)]">
                        <Microphone size={28} weight="fill" />
                      </div>
                      <div className="bg-white/5 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#14F1D9] border border-dashed border-[#14F1D9]/20 animate-pulse">
                        {interimText}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-[#14F1D9]/5 flex items-center justify-center text-[#14F1D9] border border-[#14F1D9]/10 animate-pulse shadow-[0_0_20px_rgba(20,241,217,0.1)]">
                        <Microphone size={28} weight="fill" />
                      </div>
                      <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Listening for pulse...</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-30">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                    <ChatTeardropText size={32} weight="thin" className="text-white" />
                  </div>
                  <p className="text-white text-[10px] font-black uppercase tracking-[0.2em] max-w-[180px]">Session history will populate here.</p>
                </div>
              )}
            </div>
            
            {activeConv && (
              <div className="p-4 bg-[#14F1D9]/5 border-t border-white/5">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#14F1D9] shadow-[0_0_8px_#14F1D9] animate-ping" />
                  <span className="text-[9px] font-black text-[#14F1D9] uppercase tracking-[0.2em]">Neural Pipeline Online</span>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* Knowledge Score */}
        <motion.section variants={itemVariants} className="bg-white/5 border border-white/5 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#14F1D9]/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-6 mb-8 z-10 relative">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-white/5" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="6"></circle>
                <circle 
                  className="text-[#14F1D9] drop-shadow-[0_0_10px_rgba(20,241,217,0.5)]" 
                  cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={panelData ? 251.2 - (251.2 * panelData.knowledge_score) / 100 : 251.2} 
                  strokeWidth="6"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                ></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-headline font-black text-2xl text-white tracking-tighter">
                  {panelData ? `${panelData.knowledge_score}` : '...'}
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-headline font-black text-sm text-white uppercase tracking-widest">Neural Accuracy</h4>
              <p className="text-white/40 text-[10px] font-bold uppercase mt-1 tracking-tighter">System Calibration Index</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 z-10 relative">
            {[
              { label: 'Profile', val: panelData?.knowledge_breakdown?.profile || 0 },
              { label: 'Medical', val: panelData?.knowledge_breakdown?.medical || 0 },
              { label: 'Prefs', val: panelData?.knowledge_breakdown?.preferences || 0 },
              { label: 'Conv.', val: panelData?.knowledge_breakdown?.conversation || 0 }
            ].map(item => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-[9px] font-black text-white/30 uppercase tracking-[0.15em]">
                  <span>{item.label}</span><span>{item.val}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#14F1D9] to-[#6C5CE7]" 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.val}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Claude Question Card */}
        <AnimatePresence>
          {panelData?.pending_question && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#6C5CE7]/10 text-white p-6 rounded-3xl shadow-2xl border border-[#6C5CE7]/30 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Brain size={80} weight="fill" className="text-[#6C5CE7]" />
              </div>
              <div className="flex items-center gap-3 mb-4 z-10 relative">
                <div className="p-2 bg-[#6C5CE7]/20 rounded-lg">
                  <Brain size={20} weight="fill" className="text-[#6C5CE7]" />
                </div>
                <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-[#6C5CE7]">Insight Needed</h4>
              </div>
              <p className="mb-6 text-sm leading-relaxed font-medium text-white/90 z-10 relative">{panelData.pending_question.question}</p>
              <form onSubmit={handleContextSubmit} className="flex gap-2 z-10 relative">
                <input 
                  value={contextAnswer}
                  onChange={(e) => setContextAnswer(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm placeholder:text-white/20 focus:border-[#6C5CE7] outline-none transition-all" 
                  placeholder="Feed AI context..." 
                  type="text" 
                  disabled={submittingContext}
                />
                <button type="submit" disabled={submittingContext} className="bg-[#6C5CE7] text-white px-5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#6C5CE7]/90 transition-all shadow-[0_0_15px_rgba(108,92,231,0.3)]">
                  {submittingContext ? '...' : 'Send'}
                </button>
              </form>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Session History */}
        <motion.section variants={itemVariants}>
          <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <ChatTeardropText size={16} weight="bold" />
            Archive
          </h3>
          <motion.div variants={containerVariants} className="space-y-4">
            {history.length > 0 ? history.map((session, index) => {
              const confidenceColor = session.flagged ? "bg-[#FF2E63] shadow-[0_0_10px_#FF2E63]" : (index % 2 === 0 ? "bg-[#14F1D9] shadow-[0_0_10px_#14F1D9]" : "bg-[#6C5CE7] shadow-[0_0_10px_#6C5CE7]");
              const isEditing = editingSessionId === session.id;
              
              return (
                <motion.div variants={itemVariants} key={session.id} className="bg-white/5 p-5 rounded-2xl flex flex-col group shadow-xl transition-all border border-transparent hover:border-white/10 relative overflow-hidden">
                  <div className="flex items-start justify-between z-10 relative">
                    <div className="flex gap-4">
                      <div className={`w-2 h-2 rounded-full ${confidenceColor} mt-2.5 shrink-0`}></div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">{session.timestamp}</p>
                        <p className="text-white font-bold text-sm tracking-tight leading-relaxed">&quot;{session.sentence}&quot;</p>
                      </div>
                    </div>
                    {/* Replay button */}
                    <button className="text-white/20 hover:text-[#14F1D9] transition-all p-1">
                      <ArrowCounterClockwise size={18} weight="bold" />
                    </button>
                  </div>
                  
                  {/* Feedback Controls */}
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-end gap-2 z-10 relative">
                    <button onClick={() => handleFeedback(session.id, true)} className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-[#14F1D9]/10 hover:text-[#14F1D9] text-white/40 rounded-full flex gap-1.5 items-center transition-all border border-transparent hover:border-[#14F1D9]/20">
                      <ThumbsUp size={12} weight="fill" /> Correct
                    </button>
                    <button onClick={() => handleFeedback(session.id, false)} className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full flex gap-1.5 items-center transition-all border ${isEditing ? 'bg-[#FF2E63]/10 text-[#FF2E63] border-[#FF2E63]/30' : 'bg-white/5 hover:bg-[#FF2E63]/10 hover:text-[#FF2E63] text-white/40 border-transparent hover:border-[#FF2E63]/20'}`}>
                      <ThumbsDown size={12} weight="fill" /> Needs Fix
                    </button>
                  </div>

                  {/* Inline Correction Editor */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 z-10 relative"
                      >
                        <div className="flex gap-2">
                          <input 
                            value={correctionText}
                            onChange={(e) => setCorrectionText(e.target.value)}
                            placeholder="Correction matrix..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#6C5CE7] transition-all"
                          />
                          <button onClick={() => handleCorrectionSubmit(session.id)} className="bg-[#6C5CE7] text-white px-4 rounded-xl flex items-center justify-center hover:bg-[#6C5CE7]/90 transition-all shadow-[0_0_15px_rgba(108,92,231,0.2)]">
                            <Check size={18} weight="bold" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              )
            }) : (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse h-24 bg-white/5 rounded-2xl border border-white/5"></div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.section>
      </motion.div>
    </aside>
  );
}
