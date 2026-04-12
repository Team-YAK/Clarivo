"use client";

import React, { useState, useEffect, useCallback } from "react";
import ButtonGrid, { StackAddEvent } from "@/components/patient/ButtonGrid";
import WordStack, { StackItem } from "@/components/patient/WordStack";
import SentenceOutput from "@/components/patient/SentenceOutput";
import CaregiverPanel from "@/components/caregiver/CaregiverPanel";
import { Sun, Moon, SidebarSimple, Desktop, Gear } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { GlowCard } from "@/components/ui/spotlight-card";

let idCounter = 0;
const nextId = () => `stack-${++idCounter}`;

export default function PatientScreen() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // ── Stack state ──
  const [stackItems, setStackItems] = useState<StackItem[]>([]);
  const [undoHistory, setUndoHistory] = useState<StackItem[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // ── Stack handlers ──
  const handleAddToStack = useCallback((event: StackAddEvent) => {
    const newItem: StackItem = {
      id: nextId(),
      key: event.key,
      label: event.label,
    };
    setStackItems((prev) => [...prev, newItem]);
    setUndoHistory([]); // Clear redo history on new action
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setStackItems((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx === -1) return prev;
      const removed = prev[idx];
      setUndoHistory((undo) => [...undo, removed]);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const handleUndo = useCallback(() => {
    setStackItems((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setUndoHistory((undo) => [...undo, last]);
      return prev.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setUndoHistory((undo) => {
      if (undo.length === 0) return undo;
      const last = undo[undo.length - 1];
      setStackItems((prev) => [...prev, last]);
      return undo.slice(0, -1);
    });
  }, []);

  const handleClear = useCallback(() => {
    setStackItems([]);
    setUndoHistory([]);
  }, []);

  const handleSubmit = useCallback(() => {
    if (stackItems.length > 0) {
      setIsSynthesizing(true);
    }
  }, [stackItems]);

  const handleSynthesisClose = useCallback(() => {
    setIsSynthesizing(false);
    setStackItems([]);
    setUndoHistory([]);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-surface to-surface-container-low transition-colors duration-500">
      {/* Hyper Minimalist Top Navigation Bar */}
      <header className="fixed top-0 w-full h-14 flex items-center justify-between px-6 md:px-12 bg-surface/60 backdrop-blur-xl z-50 border-b border-outline-variant/10">
        <div className="flex items-center gap-6">
          {/* Deliberately minimal for aphasia interface */}
        </div>
        <div className="flex items-center gap-3 relative">
          <Link
            href="/caregiver"
            className="flex items-center gap-2 p-2 px-4 rounded-full transition-all text-outline-variant hover:text-on-surface hover:bg-surface-container-high font-bold text-sm"
          >
            <Desktop size={22} weight="fill" />
            <span className="hidden md:inline">Dashboard</span>
          </Link>

          <button
            onClick={() => setIsSplitView(!isSplitView)}
            className={`p-2.5 rounded-full transition-all shadow-sm ${
              isSplitView
                ? "bg-primary-container text-on-primary-container"
                : "text-outline-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <SidebarSimple size={22} weight="fill" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-full transition-all shadow-sm ${
                showSettings
                  ? "bg-primary-container text-on-primary-container"
                  : "text-outline-variant hover:text-on-surface hover:bg-surface-container-high"
              }`}
            >
              <Gear size={22} weight="fill" />
            </button>
            <AnimatePresence>
              {showSettings && mounted && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-14 w-56 z-50"
                >
                  <GlowCard
                    customSize
                    glowColor="blue"
                    className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-xl rounded-2xl"
                  >
                    <div className="p-2">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-3 py-2 mb-1">
                        Settings
                      </h4>
                      <button
                        onClick={() => {
                          setTheme(theme === "dark" ? "light" : "dark");
                        }}
                        className="flex items-center gap-3 px-3 py-3 w-full hover:bg-surface-container-low rounded-xl transition-colors text-on-surface font-semibold text-sm"
                      >
                        {theme === "dark" ? (
                          <Sun
                            size={20}
                            weight="bold"
                            className="text-orange-400"
                          />
                        ) : (
                          <Moon
                            size={20}
                            weight="bold"
                            className="text-purple-500"
                          />
                        )}
                        {theme === "dark"
                          ? "Enable Light Mode"
                          : "Enable Dark Mode"}
                      </button>
                    </div>
                  </GlowCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex w-full h-full pt-14 overflow-hidden">
        {/* Patient Area */}
        <motion.div
          layout
          className="flex-1 min-w-0 h-full relative bg-transparent overflow-hidden px-4 md:px-8 pb-0 pt-4"
        >
          <div className="h-full flex flex-col">
            <ButtonGrid onAddToStack={handleAddToStack} />
          </div>
        </motion.div>

        <AnimatePresence>
          {isSplitView && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "30%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex shrink-0 h-full"
            >
              {/* Vertical Separator */}
              <div className="w-2 h-full bg-surface-container-high shadow-inner shrink-0 relative transition-colors duration-500">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-outline-variant/40 rounded-full" />
              </div>

              {/* Caregiver Panel (Right) */}
              <aside className="min-w-[340px] max-w-[500px] w-full shrink-0 h-full relative overflow-hidden bg-surface-container shadow-[inset_1px_0_10px_rgba(0,0,0,0.05)] transition-colors duration-500">
                <div className="absolute inset-0 flex flex-col">
                  <CaregiverPanel />
                </div>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Word Stack Bar (Fixed Bottom) */}
      <WordStack
        items={stackItems}
        onReorder={setStackItems}
        onRemoveItem={handleRemoveItem}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onSubmit={handleSubmit}
        canUndo={stackItems.length > 0}
        canRedo={undoHistory.length > 0}
      />

      {/* Sentence Streaming Overlay */}
      <AnimatePresence>
        {isSynthesizing && (
          <SentenceOutput
            labels={stackItems.map((item) => item.label)}
            onClose={handleSynthesisClose}
            onSpeak={() => console.log("Playing synthesized audio...")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
