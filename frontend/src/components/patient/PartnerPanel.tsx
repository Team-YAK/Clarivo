"use client";

import React, { useState } from "react";
import { AiOption, reverseTranslateSentence } from "@/utils/patientApi";
import { ChatCircleText, ArrowRight, Spinner, HandPointing } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

export default function PartnerPanel() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AiOption[]>([]);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setResults([]);
    try {
      const res = await reverseTranslateSentence(inputText);
      if (res && res.options) {
        setResults(res.options);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-surface-container/50 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/10 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6 shrink-0 relative z-10">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-tertiary to-tertiary-container shadow-sm">
          <ChatCircleText size={24} weight="fill" className="text-on-tertiary" />
        </div>
        <div>
          <h2 className="text-xl font-headline font-black text-on-surface">Partner Input</h2>
          <p className="text-sm text-outline font-medium">Type a sentence to visualize it</p>
        </div>
      </div>

      {/* Input Area */}
      <div className="relative z-10 shrink-0 mb-8">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Would you like me to get you a glass of water?"
          className="w-full h-32 p-5 rounded-2xl bg-surface/80 border border-white/10 text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-tertiary/50 resize-none glass-textarea shadow-inner text-lg"
          style={{ WebkitBackdropFilter: "blur(12px)" }}
        />
        <button
          onClick={handleTranslate}
          disabled={isLoading || !inputText.trim()}
          className="absolute bottom-4 right-4 flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-tertiary text-on-tertiary shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Spinner size={20} className="animate-spin" />
          ) : (
            <ArrowRight size={20} weight="bold" />
          )}
          Translate
        </button>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto relative z-10 px-2 min-h-0">
        {results.length === 0 && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
            <HandPointing size={48} weight="duotone" className="text-outline mb-4" />
            <p className="text-center font-medium max-w-[250px]">
              Type a sentence above and press Translate to see it broken down into core concepts.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 content-start">
            <AnimatePresence>
              {results.map((item, i) => {
                // If it's a raw emoji, let's just display it. If it's a phosphor string, we won't try to load it dynamically here unless we build an IconMap, but the instruction said "single relevant emoji". So we rely on emoji being in item.icon.
                return (
                  <motion.div
                    key={`${item.label}-${i}`}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center justify-center bg-surface w-32 h-32 rounded-3xl shadow-sm border border-outline-variant/20 hover:border-tertiary/50 transition-colors"
                  >
                    <span className="text-5xl mb-3 drop-shadow-sm">{item.icon}</span>
                    <span className="font-extrabold text-[#111827] text-center px-2 truncate w-full text-base tracking-tight capitalize">
                      {item.label}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
