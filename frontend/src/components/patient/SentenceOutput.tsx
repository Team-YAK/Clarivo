import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { generateIntentStream } from "@/utils/patientApi";
import { SpeakerHigh, X } from "@phosphor-icons/react";

interface SentenceOutputProps {
  labels: string[];
  onClose: () => void;
  onSpeak: () => void;
}

export default function SentenceOutput({
  labels,
  onClose,
  onSpeak,
}: SentenceOutputProps) {
  const [sentence, setSentence] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let active = true;
    const runStream = async () => {
      const generator = generateIntentStream(labels);
      for await (const word of generator) {
        if (!active) break;
        setSentence((prev) => prev + word);
      }
      if (active) setIsDone(true);
    };
    runStream();
    return () => {
      active = false;
    };
  }, [labels]);

  const handleSpeak = () => {
    setIsPlaying(true);
    onSpeak();

    // Simulate audio playback length
    setTimeout(() => {
      setIsPlaying(false);
      onClose(); // Automatically dismiss after speaking
    }, 2500);
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
            disabled={isPlaying}
            onClick={handleSpeak}
            className={`flex items-center justify-center gap-4 px-10 py-5 rounded-2xl font-bold text-xl transition-all shadow-lg ${
              isPlaying
                ? "bg-primary-container text-primary opacity-50 translate-y-1 shadow-none"
                : "bg-primary hover:bg-primary/90 text-on-primary hover:-translate-y-1"
            }`}
          >
            <SpeakerHigh
              size={32}
              weight={isPlaying ? "fill" : "bold"}
              className={isPlaying ? "animate-pulse" : ""}
            />
            {isPlaying ? "Playing Audio..." : "Speak Sentence"}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
