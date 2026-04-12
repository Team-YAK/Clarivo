"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AiOption, reverseTranslateSentence } from "@/utils/patientApi";
import { addUtterance, fetchActiveConversation } from "@/utils/caregiverApi";
import {
  ChatCircleText,
  ArrowRight,
  Spinner,
  HandPointing,
  MicrophoneStage,
  StopCircle,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

export default function PartnerPanel() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AiOption[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Refs
  const recognitionRef = useRef<any>(null);
  // We accumulate the full final transcript across all recognition results
  const finalTranscriptRef = useRef("");
  // Silence-detection timer
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect browser support on mount (client-only)
  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    setHasSpeechSupport(!!SR);
  }, []);

  // ----- Core translate + log helper -----
  const translateText = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setInputText(trimmed);
    setIsLoading(true);
    setResults([]);

    try {
      // 1. AI reverse-translation
      const res = await reverseTranslateSentence(trimmed);
      if (res?.options) {
        setResults(res.options);
      }

      // 2. Log the partner's original spoken/typed sentence to MongoDB
      try {
        const activeConv = await fetchActiveConversation();
        if (activeConv?.id) {
          await addUtterance(activeConv.id, "Partner", trimmed);
        }
      } catch {
        // best-effort logging — never block the UI
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTranslate = useCallback(() => {
    translateText(inputText);
  }, [inputText, translateText]);

  // ----- Silence detection -----
  const SILENCE_MS = 1800; // stop after 1.8 s of no new speech

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop(); // triggers onend → translateText
        } catch {
          // already stopped
        }
      }
    }, SILENCE_MS);
  }, []);

  // ----- Start recording -----
  const handleStartRecording = useCallback(() => {
    if (!hasSpeechSupport) return;
    setSpeechError(null);

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    // Always create a fresh instance — avoids stale-handler issues on re-tap
    const recognition = new SR();
    recognition.continuous = true;      // keep listening across pauses
    recognition.interimResults = true;  // show live text while speaking
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    finalTranscriptRef.current = "";
    setInputText("");
    setResults([]);

    recognition.onstart = () => {
      setIsRecording(true);
      resetSilenceTimer();
    };

    recognition.onresult = (event: any) => {
      // Reset silence timer every time we get new speech
      resetSilenceTimer();

      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      // Show combined final + live interim in the textarea
      setInputText(finalTranscriptRef.current + interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") return; // not real errors
      console.warn("Speech recognition error:", event.error);
      setSpeechError("Microphone error: " + event.error);
      setIsRecording(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      const final = finalTranscriptRef.current.trim();
      if (final) {
        translateText(final);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.warn("Failed to start speech recognition:", e);
      setSpeechError("Could not access microphone.");
    }
  }, [hasSpeechSupport, resetSilenceTimer, translateText]);

  // ----- Stop recording manually -----
  const handleStopRecording = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    try {
      recognitionRef.current?.stop();
    } catch {
      // already stopped
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognitionRef.current?.abort();
      } catch {}
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-surface-container/50 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/10 rounded-full blur-[80px] pointer-events-none" />
      {isRecording && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{
            background:
              "radial-gradient(ellipse at top right, rgba(239,68,68,0.12) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 shrink-0 relative z-10">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-tertiary to-tertiary-container shadow-sm">
          <ChatCircleText size={24} weight="fill" className="text-on-tertiary" />
        </div>
        <div>
          <h2 className="text-xl font-headline font-black text-on-surface">
            Partner Input
          </h2>
          <p className="text-sm text-outline font-medium">
            {isRecording
              ? "Listening… speak now"
              : "Type or speak a sentence to visualize it"}
          </p>
        </div>

        {/* Recording badge */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 text-red-500 text-xs font-bold uppercase tracking-wider ring-1 ring-red-500/30"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              REC
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="relative z-10 shrink-0 mb-6">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isRecording
              ? "Transcribing your speech…"
              : "e.g. Would you like me to get you a glass of water?"
          }
          readOnly={isRecording}
          className={`w-full h-32 p-5 pr-44 rounded-2xl bg-surface/80 border text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-tertiary/50 resize-none shadow-inner text-lg transition-colors ${
            isRecording
              ? "border-red-500/40 bg-red-500/5 cursor-not-allowed"
              : "border-white/10"
          }`}
          style={{ WebkitBackdropFilter: "blur(12px)" }}
        />

        {/* Button row inside textarea overlay */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {/* Mic / Stop button */}
          {hasSpeechSupport && (
            <>
              {isRecording ? (
                <button
                  onClick={handleStopRecording}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-red-500/20 text-red-500 ring-1 ring-red-500/40 hover:bg-red-500/30 transition-all"
                  title="Stop recording"
                >
                  <StopCircle size={20} weight="fill" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleStartRecording}
                  disabled={isLoading}
                  className="flex items-center justify-center p-3 rounded-xl bg-surface-variant text-outline hover:text-on-surface hover:bg-surface-variant/80 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Speak sentence"
                >
                  <MicrophoneStage size={22} weight="bold" />
                </button>
              )}
            </>
          )}

          {/* Translate button — only when not recording */}
          {!isRecording && (
            <button
              onClick={handleTranslate}
              disabled={isLoading || !inputText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-tertiary text-on-tertiary shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Spinner size={20} className="animate-spin" />
              ) : (
                <ArrowRight size={20} weight="bold" />
              )}
              Translate
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {speechError && (
        <p className="text-sm text-red-500 font-medium mb-4 shrink-0 z-10">
          ⚠ {speechError}
        </p>
      )}

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto relative z-10 px-1 min-h-0">
        {results.length === 0 && !isLoading && !isRecording ? (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
            <HandPointing size={48} weight="duotone" className="text-outline mb-4" />
            <p className="text-center font-medium max-w-[250px] text-sm">
              Type or speak above. Translation begins automatically when you
              stop speaking.
            </p>
          </div>
        ) : isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 opacity-70">
            <Spinner size={36} className="animate-spin text-tertiary" />
            <p className="text-sm font-medium text-outline">Translating…</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 content-start">
            <AnimatePresence>
              {results.map((item, i) => (
                <motion.div
                  key={`${item.label}-${i}`}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 20 }}
                  className="flex flex-col items-center justify-center bg-surface w-32 h-32 rounded-3xl shadow-sm border border-outline-variant/20 hover:border-tertiary/50 transition-colors cursor-default"
                >
                  <span className="text-5xl mb-3 drop-shadow-sm select-none">
                    {item.icon}
                  </span>
                  <span className="font-extrabold text-on-surface text-center px-2 w-full text-sm tracking-tight capitalize leading-tight line-clamp-2">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
