"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AiOption, reverseTranslateSentence } from "@/utils/patientApi";
import { addUtterance, fetchActiveConversation, startConversation, endConversation, transcribeAudio } from "@/utils/caregiverApi";
import {
  ChatCircleText,
  HandPointing,
  Spinner,
  Play,
  StopCircle,
  MicrophoneStage,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────
type ConvMode = "idle" | "listening" | "processing";

export default function PartnerPanel() {
  const [mode, setMode] = useState<ConvMode>("idle");
  const [liveText, setLiveText] = useState("");
  const [results, setResults] = useState<AiOption[]>([]);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [convId, setConvId] = useState<string | null>(null);

  // Refs that survive re-renders without triggering them
  const recognitionRef = useRef<any>(null);
  const finalRef = useRef(""); // accumulates final segments of current utterance
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef(false); // track whether recognition is currently started
  const convIdRef = useRef<string | null>(null);

  const SILENCE_MS = 1500;

  // Check browser support on mount
  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    setHasSpeechSupport(!!SR);
  }, []);

  // Keep convIdRef in sync
  useEffect(() => {
    convIdRef.current = convId;
  }, [convId]);

  // ── Translate & log ──────────────────────────────────────────
  const translateAndLog = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMode("processing");
    setResults([]); // clear previous while processing

    try {
      const res = await reverseTranslateSentence(trimmed);
      if (res?.options) setResults(res.options);

      // Log partner utterance to MongoDB
      try {
        const cid = convIdRef.current;
        if (cid) {
          await addUtterance(cid, "Partner", trimmed);
        } else {
          const activeConv = await fetchActiveConversation();
          if (activeConv?.id) await addUtterance(activeConv.id, "Partner", trimmed);
        }
      } catch {
        // best-effort
      }
    } finally {
      // Return to listening mode
      if (isListeningRef.current) {
        setMode("listening");
        setLiveText("");
      } else {
        setMode("idle");
      }
    }
  }, []);

  // ── Start MediaRecorder API ──────────────────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<any>(null);

  const startMediaRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1, sampleRate: 16000 }
      });
      mediaStreamRef.current = stream;
      setSpeechError(null);

      const startChunkCycle = () => {
        if (!isListeningRef.current || !mediaStreamRef.current) return;

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';

        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          if (chunks.length === 0) {
            if (isListeningRef.current) startChunkCycle();
            return;
          }

          const blob = new Blob(chunks, { type: mimeType });
          if (blob.size < 1000) {
            if (isListeningRef.current) startChunkCycle();
            return;
          }

          try {
            const text = await transcribeAudio(blob);
            if (text && text.trim()) {
              translateAndLog(text.trim());
            }
          } catch (e: any) {
            console.error("Transcription error:", e);
          }

          if (isListeningRef.current) startChunkCycle();
        };

        recorder.onerror = (e: any) => {
          setSpeechError("Mic error: " + (e.error || e.message || "Unknown plugin error"));
          if (isListeningRef.current) setTimeout(startChunkCycle, 1000);
        };

        mediaRecorderRef.current = recorder;
        recorder.start();

        recordingIntervalRef.current = setTimeout(() => {
          if (recorder.state === 'recording') recorder.stop();
        }, 5000);
      };

      startChunkCycle();
    } catch (e: any) {
      isListeningRef.current = false;
      setMode("idle");
      setSpeechError("Mic access denied or unavailable.");
    }
  }, [translateAndLog]);

  const stopMediaRecording = useCallback(() => {
    if (recordingIntervalRef.current) clearTimeout(recordingIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  // ── Start Conversation ───────────────────────────────────────
  const handleStartConversation = useCallback(async () => {
    setSpeechError(null);
    setLiveText("");
    setResults([]);
    isListeningRef.current = true;
    setMode("listening");

    // Create or find an active conversation
    try {
      const res = await startConversation();
      const id = res?.conversation_id || res?.id || null;
      setConvId(id);
      convIdRef.current = id;
    } catch {
      // non-fatal
    }

    startMediaRecording();
  }, [startMediaRecording]);

  // ── End Conversation ─────────────────────────────────────────
  const handleEndConversation = useCallback(() => {
    isListeningRef.current = false;
    stopMediaRecording();

    if (convIdRef.current) {
      endConversation(convIdRef.current).catch(() => {});
      setConvId(null);
      convIdRef.current = null;
    }

    setMode("idle");
    setLiveText("");
    setResults([]);
  }, [stopMediaRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      stopMediaRecording();
    };
  }, [stopMediaRecording]);

  const isActive = mode !== "idle";

  return (
    <div className="flex flex-col h-full w-full bg-surface-container/50 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/10 rounded-full blur-[80px] pointer-events-none" />
      {mode === "listening" && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          style={{
            background: "radial-gradient(ellipse at top right, rgba(239,68,68,0.10) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 shrink-0 relative z-10">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-tertiary to-tertiary-container shadow-sm">
          <ChatCircleText size={24} weight="fill" className="text-on-tertiary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-headline font-black text-on-surface">Partner Input</h2>
          <p className="text-sm text-outline font-medium truncate">
            {mode === "listening" ? "Listening for speech…"
              : mode === "processing" ? "Translating…"
              : "Start a conversation to begin listening"}
          </p>
        </div>

        {/* Status badge */}
        <AnimatePresence mode="wait">
          {mode === "listening" && (
            <motion.div
              key="rec-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 text-red-500 text-xs font-bold uppercase tracking-wider ring-1 ring-red-500/30 shrink-0"
            >
              <MicrophoneStage size={12} weight="fill" className="animate-pulse" />
              Live
            </motion.div>
          )}
          {mode === "processing" && (
            <motion.div
              key="proc-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary/15 text-on-tertiary-container text-xs font-bold uppercase tracking-wider ring-1 ring-tertiary/30 shrink-0"
            >
              <Spinner size={12} className="animate-spin" />
              AI
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Conversation toggle */}
      <div className="shrink-0 mb-5 z-10">
        {!isActive ? (
          <button
            onClick={handleStartConversation}
            disabled={!hasSpeechSupport}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-base bg-gradient-to-r from-tertiary to-emerald-500 text-on-tertiary shadow-lg hover:opacity-90 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={20} weight="fill" />
            Start Conversation
          </button>
        ) : (
          <button
            onClick={handleEndConversation}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-base bg-red-500/15 text-red-500 ring-1 ring-red-500/30 hover:bg-red-500/20 active:scale-98 transition-all"
          >
            <StopCircle size={20} weight="fill" />
            End Conversation
          </button>
        )}
        {!hasSpeechSupport && (
          <p className="text-xs text-amber-500 text-center mt-2">
            ⚠ This browser doesn't support speech recognition. Use Chrome.
          </p>
        )}
      </div>

      {/* Live transcript display */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="shrink-0 mb-5 z-10 overflow-hidden"
          >
            <div className={`p-4 rounded-2xl border text-on-surface text-base min-h-[56px] transition-colors ${
              liveText
                ? "bg-surface border-tertiary/30"
                : "bg-surface/40 border-white/5 text-outline/40"
            }`}>
              {liveText || (mode === "listening" ? "Waiting for speech…" : "Processing…")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {speechError && (
        <p className="text-sm text-red-500 font-medium mb-4 shrink-0 z-10">⚠ {speechError}</p>
      )}

      {/* Results area */}
      <div className="flex-1 overflow-y-auto relative z-10 px-1 min-h-0">
        {mode === "processing" && results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 opacity-70">
            <Spinner size={36} className="animate-spin text-tertiary" />
            <p className="text-sm font-medium text-outline">Translating…</p>
          </div>
        ) : results.length > 0 ? (
          <div className="flex flex-wrap gap-4 content-start">
            <AnimatePresence>
              {results.map((item, i) => (
                <motion.div
                  key={`${item.label}-${i}`}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 280, damping: 22 }}
                  className="flex flex-col items-center justify-center bg-surface w-32 h-32 rounded-3xl shadow-sm border border-outline-variant/20 hover:border-tertiary/50 transition-colors cursor-default"
                >
                  <span className="text-5xl mb-3 select-none">{item.icon}</span>
                  <span className="font-extrabold text-on-surface text-center px-2 w-full text-sm tracking-tight capitalize leading-tight line-clamp-2">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : !isActive ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
            <HandPointing size={48} weight="duotone" className="text-outline mb-4" />
            <p className="text-center font-medium text-sm max-w-[240px]">
              Press Start Conversation. The partner's speech will be automatically transcribed and visualized.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
