"use client";

import React, { useState, useEffect, useCallback } from "react";
import ButtonGrid, { StackAddEvent } from "@/components/patient/ButtonGrid";
import WordStack, { StackItem } from "@/components/patient/WordStack";
import SentenceOutput from "@/components/patient/SentenceOutput";
import PartnerPanel from "@/components/patient/PartnerPanel";
import DrawingCanvas from "@/components/patient/DrawingCanvas";
import { Desktop, FlowerLotus, Pencil, SquaresFour } from "@phosphor-icons/react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { PageTransition } from "@/components/ui/page-transition";

const nextId = () => `stack-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

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
  const [stackState, setStackState] = useState<{
    items: StackItem[];
    redoStack: StackItem[];
  }>({
    items: [],
    redoStack: [],
  });

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  // Increments whenever partner input is translated — signals ButtonGrid to re-fetch
  const [conversationVersion, setConversationVersion] = useState(0);
  const handlePartnerTranslation = useCallback(() => {
    setConversationVersion((v) => v + 1);
  }, []);

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
    setStackState((prev) => ({
      items: [...prev.items, newItem],
      redoStack: [], // New action clears redo history
    }));
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setStackState((prev) => {
      const idx = prev.items.findIndex((item) => item.id === id);
      if (idx === -1) return prev;
      
      const removed = prev.items[idx];
      return {
        items: prev.items.filter((item) => item.id !== id),
        redoStack: [...prev.redoStack, removed],
      };
    });
  }, []);

  const handleUndo = useCallback(() => {
    setStackState((prev) => {
      if (prev.items.length === 0) return prev;
      const last = prev.items[prev.items.length - 1];
      return {
        items: prev.items.slice(0, -1),
        redoStack: [...prev.redoStack, last],
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setStackState((prev) => {
      if (prev.redoStack.length === 0) return prev;
      const last = prev.redoStack[prev.redoStack.length - 1];
      return {
        items: [...prev.items, last],
        redoStack: prev.redoStack.slice(0, -1),
      };
    });
  }, []);

  const handleClear = useCallback(() => {
    setStackState({ items: [], redoStack: [] });
  }, []);

  const handleSubmit = useCallback(() => {
    if (stackState.items.length > 0) {
      setIsSynthesizing(true);
    }
  }, [stackState.items]);

  const handleSynthesisClose = useCallback(() => {
    setIsSynthesizing(false);
    setStackState({ items: [], redoStack: [] });
  }, []);

  return (
    <PageTransition>
      <div className="h-screen overflow-hidden bg-[#050505] text-white flex flex-col selection:bg-[#14F1D9]/30">
        {/* Header — matches caregiver style */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6 md:px-12 bg-[#050505] border-b border-white/10 z-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#14F1D9]/10 border border-[#14F1D9]/20 shadow-sm">
              <FlowerLotus size={20} weight="fill" className="text-[#14F1D9]" />
            </div>
            <span className="font-headline font-black text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">Clarivo</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/caregiver"
              className="flex items-center justify-center p-2.5 rounded-full transition-all text-white/40 hover:text-white hover:bg-white/10"
              title="Caregiver Dashboard"
            >
              <Desktop size={22} weight="fill" />
            </Link>
          </div>
        </header>

        {/* Main Layout Grid */}
        <main className="flex-1 flex flex-col overflow-hidden select-none">
          {/* Top Section: 50:50 Split */}
          <div className="flex-1 flex overflow-hidden">
            {/* Patient Area (Left 50%) */}
            <div className="w-1/2 h-full flex flex-col relative overflow-hidden px-4 md:px-6 pt-4 pb-4 border-r border-white/5">
              <div className="flex justify-center mb-4 shrink-0">
                <div className="bg-white/5 p-1 rounded-full border border-white/10 flex gap-1">
                  <button
                    onClick={() => setDrawingMode(false)}
                    className={`px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${!drawingMode ? 'bg-[#14F1D9] text-[#050505] shadow-[0_0_20px_rgba(20,241,217,0.3)]' : 'text-white/50 hover:text-white'}`}
                  >
                    <SquaresFour size={16} weight="bold" /> Standard
                  </button>
                  <button
                    onClick={() => setDrawingMode(true)}
                    className={`px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${drawingMode ? 'bg-[#6C5CE7] text-white shadow-[0_0_20px_rgba(108,92,231,0.3)]' : 'text-white/50 hover:text-white'}`}
                  >
                    <Pencil size={16} weight="bold" /> Draw (AI)
                  </button>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {drawingMode ? (
                  <DrawingCanvas onComplete={(data) => {
                    handleAddToStack({
                      key: data.label.toLowerCase(),
                      label: data.label,
                      icon: data.iconKey || "✏️"
                    });
                    // Trigger TTS immediately for this inferred concept
                    setTimeout(() => {
                      setIsSynthesizing(true);
                    }, 100);
                  }} />
                ) : (
                  <ButtonGrid onAddToStack={handleAddToStack} conversationVersion={conversationVersion} />
                )}
              </div>
            </div>

            {/* Partner Area (Right 50%) */}
            <div className="w-1/2 h-full relative overflow-hidden px-4 md:px-6 pt-4 pb-4">
              <div className="h-full flex flex-col">
                <PartnerPanel onTranslationComplete={handlePartnerTranslation} />
              </div>
            </div>
          </div>

          {/* Bottom Panel Area: Fixed Height */}
          <div className="h-56 shrink-0 bg-white/[0.02] border-t border-white/10 relative">
            <WordStack
              items={stackState.items}
              onReorder={(newItems) => setStackState(prev => ({ ...prev, items: newItems }))}
              onRemoveItem={handleRemoveItem}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClear={handleClear}
              onSubmit={handleSubmit}
              canUndo={stackState.items.length > 0}
              canRedo={stackState.redoStack.length > 0}
              onAddToStack={handleAddToStack}
            />
          </div>
        </main>

        {/* Sentence Streaming Overlay */}
        <AnimatePresence>
          {isSynthesizing && (
            <SentenceOutput
              path={stackState.items.map((item) => item.key)}
              onClose={handleSynthesisClose}
              onSpeak={() => console.log("Playing synthesized audio...")}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
