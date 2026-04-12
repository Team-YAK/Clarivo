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

type ConvMode = "idle" | "listening" | "processing";

interface PartnerPanelProps {
  onTranslationComplete?: () => void;
}

const BAR_COUNT = 28;

// Returns the first supported MIME type, or '' to let the browser choose
function getSupportedMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const t of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch { /* ignore */ }
  }
  return "";
}

export default function PartnerPanel({ onTranslationComplete }: PartnerPanelProps = {}) {
  const [mode, setMode] = useState<ConvMode>("idle");
  const [liveText, setLiveText] = useState("");
  const [results, setResults] = useState<AiOption[]>([]);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Soundwave bars — updated via RAF, stored as a ref to avoid extra renders
  const waveformRef = useRef<(HTMLDivElement | null)[]>([]);
  const levelsRef = useRef<number[]>(Array(BAR_COUNT).fill(0));

  // Audio analysis
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  // Session refs
  const isListeningRef = useRef(false);
  const convIdRef = useRef<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Web Speech API refs
  const recognitionRef = useRef<any>(null);

  // MediaRecorder fallback refs
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Audio analysis (soundwave) ────────────────────────────────
  const startAnalysis = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.82;

      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

      const tick = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const data = dataArrayRef.current;
        const binCount = data.length;

        for (let i = 0; i < BAR_COUNT; i++) {
          // Map bars to lower-mid frequency range (most vocal energy)
          const binIdx = Math.floor((i / BAR_COUNT) * (binCount * 0.6));
          const raw = data[binIdx] / 255;
          // Smooth with previous value
          levelsRef.current[i] = levelsRef.current[i] * 0.6 + raw * 0.4;

          const el = waveformRef.current[i];
          if (el) {
            const pct = Math.max(8, levelsRef.current[i] * 100);
            el.style.height = `${pct}%`;
            el.style.opacity = `${0.3 + levelsRef.current[i] * 0.7}`;
          }
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.warn("[Waveform] AudioContext failed:", e);
    }
  }, []);

  const stopAnalysis = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
    // Reset all bars to baseline
    waveformRef.current.forEach((el) => {
      if (el) { el.style.height = "8%"; el.style.opacity = "0.2"; }
    });
  }, []);

  // ── Translate & log ───────────────────────────────────────────
  const translateAndLog = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMode("processing");
    setResults([]);

    try {
      const res = await reverseTranslateSentence(trimmed);
      if (res?.options) setResults(res.options);

      try {
        const cid = convIdRef.current;
        if (cid) {
          await addUtterance(cid, "Partner", trimmed);
        } else {
          const activeConv = await fetchActiveConversation();
          if (activeConv?.id) await addUtterance(activeConv.id, "Partner", trimmed);
        }
      } catch { /* best-effort */ }

      // Notify parent that conversation context has updated —
      // ButtonGrid will re-fetch its current path with the new context
      onTranslationComplete?.();
    } finally {
      if (isListeningRef.current) {
        setMode("listening");
        setLiveText("");
      } else {
        setMode("idle");
      }
    }
  }, [onTranslationComplete]);

  // ── Web Speech API (primary) ──────────────────────────────────
  const startSpeechRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return false;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const final = result[0].transcript.trim();
          if (final) {
            setLiveText("");
            translateAndLog(final);
          }
        } else {
          interim += result[0].transcript;
        }
      }
      setLiveText(interim);
    };

    recognition.onerror = (e: any) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      console.warn("[STT] error:", e.error);
    };

    recognition.onend = () => {
      setLiveText("");
      if (isListeningRef.current) {
        try { recognition.start(); } catch { /* already restarting */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    return true;
  }, [translateAndLog]);

  // ── MediaRecorder fallback ────────────────────────────────────
  const scheduleNextChunk = useCallback((stream: MediaStream) => {
    if (!isListeningRef.current) return;

    const mimeType = getSupportedMimeType();
    chunksRef.current = [];

    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch (e) {
      console.error("[MediaRecorder] Could not create recorder:", e);
      setSpeechError("Your browser doesn't support audio recording. Please use Chrome or Safari.");
      return;
    }

    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      if (!isListeningRef.current) return;

      const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
      if (blob.size > 1200) {
        try {
          const text = await transcribeAudio(blob);
          if (text?.trim()) translateAndLog(text.trim());
        } catch { /* ignore */ }
      }

      if (isListeningRef.current) scheduleNextChunk(stream);
    };

    recorder.onerror = () => {
      if (isListeningRef.current) scheduleNextChunk(stream);
    };

    try {
      recorder.start();
    } catch (e) {
      console.error("[MediaRecorder] start() failed:", e);
      return;
    }

    // Stop after 6s — silence detection via SpeechRecognition happens separately
    chunkTimerRef.current = setTimeout(() => {
      try {
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      } catch { /* ok */ }
    }, 6000);
  }, [translateAndLog]);

  // ── Stop all recording ────────────────────────────────────────
  const stopAll = useCallback(() => {
    isListeningRef.current = false;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ok */ }
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (chunkTimerRef.current) { clearTimeout(chunkTimerRef.current); chunkTimerRef.current = null; }
    if (recorderRef.current) {
      try { if (recorderRef.current.state !== "inactive") recorderRef.current.stop(); } catch { /* ok */ }
      recorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    stopAnalysis();
    setLiveText("");
  }, [stopAnalysis]);

  // ── Start conversation ────────────────────────────────────────
  const handleStart = useCallback(async () => {
    setSpeechError(null);
    setLiveText("");
    setResults([]);
    isListeningRef.current = true;
    setMode("listening");

    // Create conversation in DB
    try {
      const res = await startConversation();
      const id = res?.conversation_id || res?.id || null;
      convIdRef.current = id;
    } catch { /* non-fatal */ }

    // Always get mic stream for waveform analysis
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });
      streamRef.current = stream;
      startAnalysis(stream);
    } catch (e) {
      setSpeechError("Microphone access denied. Please allow microphone access and try again.");
      isListeningRef.current = false;
      setMode("idle");
      return;
    }

    // Try Web Speech API first (Chrome, Safari, Edge)
    const usedSpeech = startSpeechRecognition();
    if (!usedSpeech) {
      // Fall back to chunked MediaRecorder (Firefox)
      scheduleNextChunk(stream);
    }
  }, [startAnalysis, startSpeechRecognition, scheduleNextChunk]);

  // ── End conversation ──────────────────────────────────────────
  const handleEnd = useCallback(async () => {
    stopAll();
    if (convIdRef.current) {
      try { await endConversation(convIdRef.current); } catch { /* ok */ }
      convIdRef.current = null;
    }
    setMode("idle");
    setResults([]);
  }, [stopAll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      stopAll();
    };
  }, [stopAll]);

  const isActive = mode !== "idle";

  return (
    <div className="flex flex-col h-full w-full bg-[#050505]/60 rounded-3xl p-6 border border-white/5 relative overflow-hidden liquid-glass-card">
      {/* Ambient glow when listening */}
      <AnimatePresence>
        {mode === "listening" && (
          <motion.div
            key="glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at top right, rgba(239,68,68,0.08) 0%, transparent 65%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 shrink-0 relative z-10">
        <div className="p-2.5 rounded-xl bg-[#14F1D9]/10 border border-[#14F1D9]/20 shadow-sm">
          <ChatCircleText size={24} weight="fill" className="text-[#14F1D9]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-headline font-black text-white">Partner Input</h2>
          <p className="text-sm text-white/50 font-medium truncate">
            {mode === "listening"
              ? "Listening for speech…"
              : mode === "processing"
              ? "Translating…"
              : "Start a conversation to begin listening"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {mode === "listening" && (
            <motion.div
              key="rec"
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
              key="proc"
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

      {/* Toggle button */}
      <div className="shrink-0 mb-5 z-10">
        {!isActive ? (
          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-base bg-[#14F1D9] text-[#050505] hover:bg-[#14F1D9]/80 shadow-[0_0_20px_rgba(20,241,217,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Play size={20} weight="fill" />
            Start Conversation
          </button>
        ) : (
          <button
            onClick={handleEnd}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-base bg-[#FF2E63]/10 text-[#FF2E63] ring-1 ring-[#FF2E63]/30 hover:bg-[#FF2E63]/20 active:scale-[0.98] transition-all"
          >
            <StopCircle size={20} weight="fill" />
            End Conversation
          </button>
        )}
      </div>

      {/* Error */}
      {speechError && (
        <p className="text-sm text-red-400 font-medium mb-4 shrink-0 z-10">⚠ {speechError}</p>
      )}

      {/* Soundwave + live text */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="wave-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="shrink-0 mb-5 z-10 overflow-hidden"
          >
            {/* Waveform visualizer */}
            <div className="relative flex items-end justify-center gap-[3px] h-14 mb-3 px-2">
              {Array.from({ length: BAR_COUNT }, (_, i) => (
                <div
                  key={i}
                  ref={(el) => { waveformRef.current[i] = el; }}
                  className="flex-1 rounded-full transition-none"
                  style={{
                    height: "8%",
                    opacity: 0.2,
                    background: `hsl(${160 + (i / BAR_COUNT) * 60}, 80%, 60%)`,
                    minWidth: 0,
                  }}
                />
              ))}
              {/* Gradient overlay — fades edges */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(to right, var(--glass-bg,#000) 0%, transparent 12%, transparent 88%, var(--glass-bg,#000) 100%)" }}
              />
            </div>

            {/* Live transcript */}
            <div
              className={`px-4 py-3 rounded-2xl border text-base min-h-[48px] transition-colors ${
                liveText
                  ? "bg-surface border-tertiary/30 text-on-surface"
                  : "bg-surface/40 border-white/5 text-outline/40"
              }`}
            >
              {liveText || (mode === "processing" ? "Processing…" : "Waiting for speech…")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
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
                  className="flex flex-col items-center justify-center bg-white/5 w-32 h-32 rounded-3xl shadow-sm border border-white/10 hover:border-[#14F1D9]/50 transition-colors cursor-default"
                >
                  <span className="text-5xl mb-3 select-none">{item.icon}</span>
                  <span className="font-extrabold text-white text-center px-2 w-full text-sm tracking-tight capitalize leading-tight line-clamp-2">
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
