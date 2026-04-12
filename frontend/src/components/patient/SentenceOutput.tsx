import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { generateIntentStream, synthesizeVoice } from "@/utils/patientApi";
import { addUtterance, fetchActiveConversation } from "@/utils/caregiverApi";
import { SpeakerHigh, X } from "@phosphor-icons/react";

interface SentenceOutputProps {
  labels: string[];
  path: string[];
  onClose: () => void;
  onSpeak: () => void;
}

export default function SentenceOutput({
  labels,
  path,
  onClose,
  onSpeak,
}: SentenceOutputProps) {
  const [sentence, setSentence] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const sentenceRef = useRef("");

  // Stream the sentence word-by-word via backend /api/intent SSE
  useEffect(() => {
    let active = true;
    const runStream = async () => {
      let builtSentence = "";
      // Pass path keys (for backend AI) + labels (for fallback display)
      const generator = generateIntentStream(path, labels);
      for await (const word of generator) {
        if (!active) break;
        builtSentence += word;
        sentenceRef.current = builtSentence;
        setSentence(builtSentence);
      }
      if (active) {
        setIsDone(true);
      }
    };
    runStream();
    return () => {
      active = false;
    };
  }, [labels, path]);

  // When streaming is done, synthesize voice via ElevenLabs
  useEffect(() => {
    if (!isDone || isSynthesizing || audioUrl) return;
    const finalSentence = sentenceRef.current.trim();
    if (!finalSentence) return;

    setIsSynthesizing(true);

    (async () => {
      try {
        const res = await synthesizeVoice(finalSentence);
        if (res?.audio_url) {
          setAudioUrl(res.audio_url);
        } else {
          fallbackSpeech(finalSentence);
        }

        // Log patient utterance to any active conversation
        try {
          const activeConv = await fetchActiveConversation();
          if (activeConv?.id) {
            await addUtterance(activeConv.id, "Patient", finalSentence);
          }
        } catch {
          // conversation logging is best-effort
        }
      } catch (e) {
        console.error("ElevenLabs synthesis failed:", e);
        fallbackSpeech(finalSentence);
      } finally {
        setIsSynthesizing(false);
      }
    })();
  }, [isDone]);

  // Auto-play when audio URL arrives
  useEffect(() => {
    if (audioUrl && !isPlaying) {
      playAudio();
    }
  }, [audioUrl]);

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
    setIsPlaying(true);

    const AI_URL = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8001";
    const audio = new Audio(`${AI_URL}${audioUrl}`);
    audio.play().catch((err) => {
      console.error("Audio playback failed:", err);
      setIsPlaying(false);
    });
    audio.onended = () => {
      setIsPlaying(false);
      setTimeout(onClose, 1000);
    };
    audio.onerror = () => {
      console.error("Audio load error");
      setIsPlaying(false);
    };

    onSpeak();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed inset-x-4 bottom-24 z-50 bg-surface-container-highest/95 backdrop-blur-2xl shadow-2xl rounded-[2rem] p-8 border-t-4 border-t-primary border border-outline-variant/30 flex flex-col gap-6"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI Intent Synthesizer
          </p>
          <div className="min-h-[60px]">
            <p className="text-3xl font-headline font-black text-on-surface leading-tight">
              &quot;{sentence}&quot;
              {!isDone && (
                <span className="animate-pulse ml-2 text-primary">|</span>
              )}
            </p>
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
          className="flex justify-end gap-4 border-t border-outline-variant/20 pt-6"
        >
          <button
            disabled={isPlaying || isSynthesizing}
            onClick={playAudio}
            className={`flex items-center justify-center gap-4 px-10 py-5 rounded-2xl font-bold text-xl transition-all shadow-lg ${
              isPlaying || isSynthesizing
                ? "bg-primary-container text-primary opacity-50 translate-y-1 shadow-none"
                : "bg-primary hover:bg-primary/90 text-on-primary hover:-translate-y-1"
            }`}
          >
            <SpeakerHigh
              size={32}
              weight={isPlaying ? "fill" : "bold"}
              className={isPlaying ? "animate-pulse" : ""}
            />
            {isSynthesizing
              ? "Generating Voice..."
              : isPlaying
                ? "Playing Audio..."
                : "Speak Sentence"}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
