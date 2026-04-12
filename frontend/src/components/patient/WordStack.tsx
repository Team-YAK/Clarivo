"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  ArrowCounterClockwise,
  ArrowClockwise,
  PaperPlaneRight,
  Trash,
  X,
} from "@phosphor-icons/react";
import { getIconComponent } from "@/utils/icon-map";
import { DisplayOption } from "@/utils/tree-navigation";
import { StackAddEvent } from "./ButtonGrid";

export interface StackItem {
  id: string;
  key: string;
  label: string;
  icon: string;
}

const QUICK_ACTIONS: DisplayOption[] = [
  { key: "yes", label: "Yes", icon: "✅" },
  { key: "no", label: "No", icon: "❌" },
  { key: "and", label: "And", icon: "➕" },
  { key: "please", label: "Please", icon: "🙏" },
  { key: "thank_you", label: "Thanks", icon: "❤️" },
  { key: "want", label: "Want", icon: "🤲" },
  { key: "need", label: "Need", icon: "❗" },
  { key: "but", label: "But", icon: "🧐" },
  { key: "or", label: "Or", icon: "🔀" },
  { key: "now", label: "Now", icon: "⚡" },
  { key: "help", label: "Help", icon: "🆘" },
];

interface WordStackProps {
  items: StackItem[];
  onReorder: (items: StackItem[]) => void;
  onRemoveItem: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSubmit: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onAddToStack: (event: StackAddEvent) => void;
}

export default function WordStack({
  items,
  onReorder,
  onRemoveItem,
  onUndo,
  onRedo,
  onClear,
  onSubmit,
  canUndo,
  canRedo,
  onAddToStack,
}: WordStackProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the right when new items are added
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
  }, [items.length]);

  return (
    <div className="w-full h-full flex flex-col p-3 gap-2">
      {/* ── Quick Actions Row (Smaller) ── */}
      <div className="flex items-center justify-center gap-3 py-1 h-16 shrink-0">
        {QUICK_ACTIONS.map((action) => {
          const Icon = getIconComponent(action.icon);
          return (
            <motion.button
              key={action.key}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAddToStack({ key: action.key, label: action.label, icon: action.icon })}
              className="flex flex-col items-center group"
            >
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-primary/10 border border-white/5 transition-all">
                <Icon size={28} className="text-on-surface" />
                <span className="text-[11px] font-black uppercase tracking-widest text-on-surface/50 group-hover:text-primary transition-colors">
                  {action.label}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── Word Stack (The Queue - Enlarged) ── */}
      <div className="flex-1 flex gap-4 bg-black/30 rounded-3xl p-3 border border-white/5 min-h-0 overflow-hidden shadow-inner">
        {/* Left Side: Controls */}
        <div className="flex flex-col justify-center gap-1 shrink-0 border-r border-white/5 pr-3">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/10 transition-all disabled:opacity-20"
            title="Undo"
          >
            <ArrowCounterClockwise size={22} weight="bold" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/10 transition-all disabled:opacity-20"
            title="Redo"
          >
            <ArrowClockwise size={22} weight="bold" />
          </button>
        </div>

        {/* Middle: The Active Stack */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto no-scrollbar flex items-center pr-2"
        >
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant/30 font-bold text-sm tracking-wide bg-white/5 rounded-2xl border border-dashed border-white/10">
              Tap icons to build your message...
            </div>
          ) : (
            <Reorder.Group
              axis="x"
              values={items}
              onReorder={onReorder}
              className="flex items-center gap-3 h-full px-2"
              as="div"
            >
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => {
                  const Icon = getIconComponent(item.icon);
                  const color = "#14b8a6"; // Constant for queue or could use a shared map
                  return (
                    <Reorder.Item
                      key={item.id}
                      value={item}
                      initial={{ opacity: 0, scale: 0.8, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: 20 }}
                      className="h-full"
                      as="div"
                    >
                      <div className="group relative h-full aspect-square rounded-2xl liquid-glass-card border border-white/10 flex flex-col items-center justify-center p-2 cursor-grab active:cursor-grabbing hover:bg-white/5 transition-all shadow-lg overflow-hidden"
                           style={{ '--depth-color': color } as React.CSSProperties}>
                        
                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveItem(item.id);
                          }}
                          className="absolute top-1.5 right-1.5 z-20 p-1 rounded-full bg-error/10 text-error opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/20"
                        >
                          <X size={12} weight="bold" />
                        </button>

                        <div className="flex-1 w-full flex items-center justify-center relative z-10" style={{ containerType: 'size' }}>
                          <Icon size="110%" className="!w-[110%] !h-[110%] block text-on-surface transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <span className="relative z-10 text-center text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1 mt-1 opacity-70 group-hover:opacity-100 transition-opacity"
                              style={{ color: `color-mix(in srgb, ${color} 80%, var(--color-on-surface))` }}>
                          {item.label}
                        </span>

                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Reorder.Item>
                  );
                })}
              </AnimatePresence>
            </Reorder.Group>
          )}
        </div>

        {/* Right Side: Execution */}
        <div className="flex flex-col justify-center gap-3 shrink-0 border-l border-white/5 pl-3">
          <button
            onClick={onClear}
            disabled={items.length === 0}
            className="flex items-center justify-center p-3 rounded-xl text-error/60 hover:text-error hover:bg-error/10 transition-all disabled:opacity-20 border border-transparent hover:border-error/20"
            title="Clear All"
          >
            <Trash size={22} weight="bold" />
          </button>
          <button
            onClick={onSubmit}
            disabled={items.length === 0}
            className="flex flex-col items-center justify-center px-4 py-3 bg-gradient-to-br from-primary to-teal-500 text-on-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_8px_20px_-4px_rgba(20,184,166,0.4)] hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-30 disabled:hover:translate-y-0"
          >
            <PaperPlaneRight size={24} weight="fill" className="mb-1" />
            <span>Speak</span>
          </button>
        </div>
      </div>
    </div>
  );
}
