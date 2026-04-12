"use client";

import React, { useState, useEffect, useCallback } from "react";
import ButtonGrid, { StackAddEvent } from "@/components/patient/ButtonGrid";
import WordStack, { StackItem } from "@/components/patient/WordStack";
import SentenceOutput from "@/components/patient/SentenceOutput";
import PartnerPanel from "@/components/patient/PartnerPanel";
import { Desktop, FlowerLotus } from "@phosphor-icons/react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

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
    if (newPercent >= 50 && newPercent <= 80) {
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
      icon: event.icon,
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
    <BackgroundGradientAnimation 
      containerClassName="dark h-screen overflow-hidden transition-colors duration-500 relative"
      className="flex flex-col h-full w-full"
    >
      {/* Glass header */}
      <header className="fixed top-0 w-full h-16 flex items-center justify-between px-6 md:px-12 bg-black/20 backdrop-blur-3xl backdrop-saturate-150 z-50 border-b border-white/5 shadow-2xl"
        style={{ WebkitBackdropFilter: 'blur(64px) saturate(1.5)' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 shadow-sm backdrop-blur-md">
            <FlowerLotus size={20} weight="fill" className="text-primary" />
          </div>
          <span className="font-headline font-black text-xl tracking-tight text-white drop-shadow-sm">Clarivo</span>
        </div>

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

      {/* Main Layout Grid */}
      <main className="flex-1 flex flex-col pt-14 overflow-hidden select-none">
        {/* Top Section: 50:50 Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Patient Area (Left 50%) */}
          <div className="w-1/2 h-full relative bg-transparent overflow-hidden px-4 md:px-8 pt-4 pb-6 border-r border-white/5">
            <div className="h-full flex flex-col">
              <ButtonGrid onAddToStack={handleAddToStack} />
            </div>
          </div>

          {/* Partner Area (Right 50%) */}
          <div className="w-1/2 h-full relative bg-transparent overflow-hidden px-4 md:px-8 pt-4 pb-6">
            <div className="h-full flex flex-col">
              <PartnerPanel />
            </div>
          </div>
        </div>

        {/* Bottom Panel Area: Fixed Height */}
        <div className="h-48 shrink-0 bg-surface/30 backdrop-blur-xl relative border-t border-white/10">
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
            onAddToStack={handleAddToStack}
          />
        </div>
      </main>

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
    </BackgroundGradientAnimation>
  );
}
