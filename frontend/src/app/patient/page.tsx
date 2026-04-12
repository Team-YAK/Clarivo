"use client";

import React, { useState, useEffect, useCallback } from "react";
import ButtonGrid, { StackAddEvent } from "@/components/patient/ButtonGrid";
import WordStack, { StackItem } from "@/components/patient/WordStack";
import SentenceOutput from "@/components/patient/SentenceOutput";
import PartnerPanel from "@/components/patient/PartnerPanel";
import { Desktop, FlowerLotus } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { GlowCard } from "@/components/ui/spotlight-card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

let idCounter = 0;
const nextId = () => `stack-${++idCounter}`;

export default function PatientScreen() {
  const [mounted, setMounted] = useState(false);
  const [splitPercent, setSplitPercent] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  // ── Drag handlers ──
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newPercent = (e.clientX / window.innerWidth) * 100;
    if (newPercent >= 20 && newPercent <= 80) {
      setSplitPercent(newPercent);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, onMouseMove, stopResizing]);

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
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-surface to-surface-container-low transition-colors duration-500 relative">
      {/* Ambient gradient orbs — give liquid glass cards something colorful to distort through */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-primary/20 blur-[130px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-8%] w-[50vw] h-[50vw] rounded-full bg-tertiary/15 blur-[110px] opacity-50" />
        <div className="absolute top-[38%] right-[18%] w-[30vw] h-[30vw] rounded-full bg-secondary/10 blur-[90px] opacity-40" />
      </div>

      {/* Glass header */}
      <header className="fixed top-0 w-full h-14 flex items-center justify-between px-6 md:px-12 bg-surface/50 backdrop-blur-2xl backdrop-saturate-150 z-50 border-b border-white/5 shadow-[0_1px_0_rgba(255,255,255,0.05)]"
        style={{ WebkitBackdropFilter: 'blur(48px) saturate(1.5)' }}
      >
        {/* Left: Branding */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-primary to-primary-container shadow-sm">
            <FlowerLotus size={18} weight="fill" className="text-on-primary" />
          </div>
          <span className="font-headline font-black text-lg tracking-tight bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent">Clarivo</span>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2">
          <Link
            href="/caregiver"
            className="flex items-center justify-center p-2.5 rounded-full transition-all text-outline-variant hover:text-on-surface hover:bg-white/10"
            title="Caregiver Dashboard"
          >
            <Desktop size={22} weight="fill" />
          </Link>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex w-full h-full pt-14 overflow-hidden select-none">
        {/* Patient Area (Left) */}
        <motion.div
          layout
          style={{ width: `${splitPercent}%` }}
          className="h-full relative bg-transparent overflow-hidden px-4 md:px-8 pb-0 pt-4"
        >
          <div className="h-full flex flex-col">
            <ButtonGrid onAddToStack={handleAddToStack} />
          </div>
        </motion.div>

        {/* Vertical Resizable Separator */}
        <div 
          onMouseDown={startResizing}
          className={`w-1.5 h-full bg-surface-container-high shadow-inner shrink-0 relative transition-colors duration-200 cursor-col-resize hover:bg-primary/20 hover:w-2 active:bg-primary/40 ${isResizing ? 'bg-primary/30 w-2' : ''}`}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-12 bg-outline-variant/40 rounded-full" />
        </div>

        {/* Partner Area (Right) */}
        <motion.div
          layout
          style={{ width: `${100 - splitPercent}%` }}
          className="h-full relative bg-transparent overflow-hidden px-4 md:px-8 pb-0 pt-4"
        >
          <div className="h-full flex flex-col">
            <PartnerPanel />
          </div>
        </motion.div>
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
            path={stackItems.map((item) => item.key)}
            onClose={handleSynthesisClose}
            onSpeak={() => console.log("Playing synthesized audio...")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
