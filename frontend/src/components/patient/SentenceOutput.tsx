import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { streamAndConfirmIntent } from "@/utils/patientApi";
import { addUtterance, fetchActiveConversation } from "@/utils/caregiverApi";
import { SpeakerHigh, X, Waveform, MicrophoneStage } from "@phosphor-icons/react";

interface SentenceOutputProps {
  path: string[];
  onClose: () => void;
  onSpeak: () => void;
}

export default function SentenceOutput({
  path,
  onClose,
  onSpeak,
}: SentenceOutputProps) {
  const [sentence, setSentence] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [voiceSource, setVoiceSource] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sentenceRef = useRef("");
  const playbackStartedRef = useRef(false);

  // Stream the sentence and finalize it via backend /api/confirm.
  useEffect(() => {
    let active = true;
    const runStream = async () => {
      setIsFinalizing(true);

      const result = await streamAndConfirmIntent({
        path,
        onToken: (token) => {
          if (!active) return;
          sentenceRef.current += token;
          setSentence(sentenceRef.current);
        },
      });

      if (!active) return;

      const finalSentence = result.sentence.trim();
      sentenceRef.current = finalSentence;
      setSentence(finalSentence);
      setAudioUrl(result.audioUrl);
      setVoiceSource(result.voiceSource);
      setErrorMessage(result.error);
      setIsFinalizing(false);
      setIsDone(true);

      if (finalSentence) {
        try {
          const activeConv = await fetchActiveConversation();
          if (activeConv?.id) {
            await addUtterance(activeConv.id, "Patient", finalSentence);
          }
        } catch {
          // conversation logging is best-effort
        }
      }
    };
    runStream();
    return () => {
      active = false;
    };
  }, [path]);

  // Auto-play when audio URL arrives
  useEffect(() => {
    if (!isDone || playbackStartedRef.current) return;

    const finalSentence = sentenceRef.current.trim();
    if (!finalSentence) return;

    playbackStartedRef.current = true;

    if (audioUrl) {
      playAudio();
      return;
    }

    setVoiceSource("browser");
    fallbackSpeech(finalSentence);
  }, [audioUrl, isDone]);

  const fallbackSpeech = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setIsPlaying(false);
        setTimeout(onClose, 1000);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
      };
      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
      onSpeak();
    }
  };

  const playAudio = () => {
    if (!audioUrl) {
      fallbackSpeech(sentenceRef.current.trim());
      return;
    }

    const AI_URL = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8001";
    const fullUrl = audioUrl.startsWith("http") ? audioUrl : `${AI_URL}${audioUrl}`;

    // Validate URL format before attempting playback
    try {
      new URL(fullUrl);
    } catch {
      // Malformed URL — silently fall back to browser TTS
      setVoiceSource("browser");
      fallbackSpeech(sentenceRef.current.trim());
      return;
    }

    setIsPlaying(true);

    const audio = new Audio(fullUrl);

    audio.onerror = () => {
      // Audio unavailable (backend offline, unsupported format, etc.) — fall back silently
      setIsPlaying(false);
      setVoiceSource("browser");
      fallbackSpeech(sentenceRef.current.trim());
    };

    audio.onended = () => {
      setIsPlaying(false);
      setTimeout(onClose, 1000);
    };

    audio.play().catch(() => {
      // play() promise rejected (autoplay policy, etc.) — already handled by onerror
      setIsPlaying(false);
    });

    onSpeak();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed inset-x-4 bottom-24 z-50 liquid-glass-card shadow-[0_32px_80px_rgba(0,0,0,0.35)] rounded-[2rem] p-8 flex flex-col gap-6"
      style={{ '--depth-color': 'var(--color-primary)' } as React.CSSProperties}
    >
      {/* Top gradient glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI Intent Flow
          </p>
          <div className="min-h-[60px]">
            <p className="text-3xl font-headline font-black text-on-surface leading-tight">
              {sentence ? `\"${sentence}\"` : "…"}
              {!isDone && (
                <span className="animate-pulse ml-2 text-primary">|</span>
              )}
            </p>
            {errorMessage && (
              <p className="mt-3 text-sm font-medium text-amber-600">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-3 bg-surface hover:bg-surface-variant rounded-full transition-colors shrink-0 shadow-sm border border-outline-variant/10"
        >
          <X size={24} weight="bold" />
        </button>
      </div>

      {isDone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-end gap-3 border-t border-outline-variant/20 pt-6"
        >
          {/* Voice source badge */}
          {voiceSource && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                voiceSource === "cloned"
                  ? "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30"
                  : voiceSource === "browser"
                    ? "bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30"
                    : "bg-primary/10 text-primary ring-1 ring-primary/20"
              }`}
            >
              {voiceSource === "cloned" ? (
                <><MicrophoneStage size={14} weight="fill" /> Using Cloned Voice</>
              ) : voiceSource === "browser" ? (
                <><Waveform size={14} weight="fill" /> Browser Fallback</>
              ) : (
                <><Waveform size={14} weight="fill" /> AI Preset Voice</>
              )}
            </motion.div>
          )}
          {/* Pulsing sapphire Speak orb — liquid glass button */}
          <div className="relative">
            {/* Ambient glow ring that pulses when ready */}
            {!isPlaying && !isFinalizing && sentenceRef.current.trim() && (
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.04, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background: "radial-gradient(ellipse at center, rgba(134,212,210,0.25) 0%, transparent 70%)",
                  filter: "blur(6px)",
                }}
              />
            )}
            <motion.button
              disabled={isPlaying || isFinalizing || !sentenceRef.current.trim()}
              onClick={playAudio}
              whileHover={!isPlaying && !isFinalizing ? { y: -3, scale: 1.03 } : {}}
              whileTap={!isPlaying && !isFinalizing ? { scale: 0.97 } : {}}
              className="relative flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-bold text-xl transition-all liquid-glass-card overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                '--depth-color': 'var(--color-primary)',
                background: isPlaying || isFinalizing
                  ? 'var(--glass-bg)'
                  : 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 70%, #3b82f6), color-mix(in srgb, var(--color-primary) 40%, #06b6d4))',
                color: isPlaying || isFinalizing ? 'var(--color-primary)' : 'var(--color-on-primary)',
                boxShadow: isPlaying || isFinalizing ? 'none' : '0 0 32px color-mix(in srgb, var(--color-primary) 40%, transparent), 0 8px 24px rgba(0,0,0,0.2)',
              } as React.CSSProperties}
            >
              <SpeakerHigh
                size={32}
                weight={isPlaying ? "fill" : "bold"}
                className={isPlaying ? "animate-pulse" : ""}
              />
              {isFinalizing
                ? "Finalizing..."
                : isPlaying
                  ? "Playing Audio..."
                  : "Speak Sentence"}
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
