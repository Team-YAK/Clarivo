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

export interface StackItem {
  id: string;
  key: string;
  label: string;
}

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
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* visionOS liquid glass bottom bar — matches card aesthetic */}
      <div
        className="liquid-glass-card rounded-t-3xl border-t border-white/8"
        style={{ '--depth-color': 'var(--color-primary)' } as React.CSSProperties}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Undo / Redo buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                title="Undo"
              >
                <ArrowCounterClockwise size={22} weight="bold" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                title="Redo"
              >
                <ArrowClockwise size={22} weight="bold" />
              </button>
            </div>

            {/* Separator */}
            <div className="w-px h-8 bg-outline-variant/30 shrink-0" />

            {/* Stack items — scrollable horizontal bar */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-x-auto no-scrollbar min-h-[52px] flex items-center"
            >
              {items.length === 0 ? (
                <span className="text-on-surface-variant/40 font-semibold text-sm italic px-3 select-none">
                  Tap icons to build your thought…
                </span>
              ) : (
                <Reorder.Group
                  axis="x"
                  values={items}
                  onReorder={onReorder}
                  className="flex items-center gap-2"
                  as="div"
                >
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => {
                      const Icon = getIconComponent(item.key);
                      return (
                        <Reorder.Item
                          key={item.id}
                          value={item}
                          initial={{ opacity: 0, scale: 0.8, width: 0 }}
                          animate={{ opacity: 1, scale: 1, width: "auto" }}
                          exit={{ opacity: 0, scale: 0.7, width: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className="shrink-0 cursor-grab active:cursor-grabbing"
                          as="div"
                        >
                          <div className="group relative flex items-center gap-1.5 px-3 py-2 bg-primary-container/60 text-on-primary-container rounded-xl border border-primary/10 shadow-sm hover:shadow-md transition-all select-none">
                            <Icon size={20} weight="regular" className="shrink-0" />
                            <span className="font-bold text-sm whitespace-nowrap">
                              {item.label}
                            </span>
                            {/* Delete button on hover */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveItem(item.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 -mr-1 p-0.5 rounded-full hover:bg-error/20 text-error transition-all"
                            >
                              <X size={14} weight="bold" />
                            </button>
                          </div>
                        </Reorder.Item>
                      );
                    })}
                  </AnimatePresence>
                </Reorder.Group>
              )}
            </div>

            {/* Separator */}
            <div className="w-px h-8 bg-outline-variant/30 shrink-0" />

            {/* Clear + Submit */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onClear}
                disabled={items.length === 0}
                className="p-2.5 rounded-xl text-error/70 hover:text-error hover:bg-error/10 transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                title="Clear all"
              >
                <Trash size={22} weight="bold" />
              </button>
              <button
                onClick={onSubmit}
                disabled={items.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-30 disabled:hover:shadow-lg disabled:hover:translate-y-0"
              >
                <PaperPlaneRight size={20} weight="fill" />
                <span className="hidden sm:inline">Speak</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
