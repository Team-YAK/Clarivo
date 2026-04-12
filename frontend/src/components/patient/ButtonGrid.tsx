"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CaretDown, Lightning } from "@phosphor-icons/react";
import {
  expandTreeAI,
  selectTreeAI,
  AiOption,
  AiExpandResult,
} from "@/utils/patientApi";
import { getIconComponent } from "@/utils/icon-map";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

export interface StackAddEvent {
  key: string;
  label: string;
}

interface ButtonGridProps {
  onAddToStack: (item: StackAddEvent) => void;
}

// ── Unified display option (works for both static nodes and AI options) ───
interface DisplayOption {
  key: string;
  label: string;
  icon: string;   // identifier for getIconComponent
  isQuickOption?: boolean;
}

// ── Navigation stack frame ─────────────────────────────────────────────────
interface NavFrame {
  path: string[];           // path of keys to reach this level
  pathLabels: string[];     // human-readable labels for breadcrumb
  options: DisplayOption[];
  quickOption: DisplayOption | null;
}

// ── Color helper (from original ButtonGrid) ────────────────────────────────
const getColorFromClass = (cls: string) => {
  if (!cls) return "#1d4ed8";
  if (cls.includes("teal")) return "#14b8a6";
  if (cls.includes("red")) return "#ef4444";
  if (cls.includes("indigo")) return "#6366f1";
  if (cls.includes("amber")) return "#f59e0b";
  if (cls.includes("sky") || cls.includes("blue")) return "#0ea5e9";
  if (cls.includes("purple")) return "#a855f7";
  if (cls.includes("pink")) return "#ec4899";
  if (cls.includes("slate")) return "#94a3b8";
  if (cls.includes("orange")) return "#f97316";
  return "#3b82f6";
};

// Convert AI result into DisplayOption[]
function aiResultToDisplayOptions(result: AiExpandResult): {
  options: DisplayOption[];
  quickOption: DisplayOption | null;
} {
  const options: DisplayOption[] = result.options.map((o) => ({
    key: o.icon || o.label.toLowerCase().replace(/\s+/g, "_"),
    label: o.label,
    icon: o.icon || o.label.toLowerCase().replace(/\s+/g, "_"),
  }));

  const qo = result.quick_option;
  const quickOption: DisplayOption | null = qo
    ? {
        key: qo.icon || qo.label.toLowerCase().replace(/\s+/g, "_"),
        label: qo.label,
        icon: qo.icon || qo.label.toLowerCase().replace(/\s+/g, "_"),
        isQuickOption: true,
      }
    : null;

  return { options, quickOption };
}

// ── Skeleton card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="w-full aspect-square rounded-2xl bg-surface-container-high/40 animate-pulse" />
  );
}

// ── Option card ────────────────────────────────────────────────────────────
function OptionCard({
  option,
  onSelect,
  onExpand,
  isQuick = false,
}: {
  option: DisplayOption;
  onSelect: (opt: DisplayOption) => void;
  onExpand: (opt: DisplayOption) => void;
  isQuick?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Icon = isVisible ? getIconComponent(option.icon) : null;

  return (
    <div ref={ref} className="relative group">
      {isVisible && Icon ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          className="aspect-square w-full h-full relative"
        >
          <LiquidButton
            size="xxl"
            onClick={() => onSelect(option)}
            className={[
              "!w-full !h-full !rounded-[1.5rem] !px-0 !py-0 flex-col shadow-lg",
              isQuick
                ? "border-2 border-amber-400/60 bg-amber-500/10"
                : "border border-white/5 bg-surface-container-high/20",
            ].join(" ")}
          >
            <div className="flex flex-col items-center justify-center w-full h-full p-4 gap-3">
              {isQuick && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40">
                  <Lightning size={10} weight="fill" className="text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">AI Pick</span>
                </div>
              )}
              <Icon
                weight="fill"
                color={isQuick ? "#f59e0b" : getColorFromClass("")}
                className="!w-16 !h-16 sm:!w-20 sm:!h-20 drop-shadow-[0_2px_15px_rgba(0,0,0,0.6)] relative z-10"
              />
              <span className="font-headline font-black text-base text-on-surface text-center leading-tight drop-shadow-md px-2 z-10">
                {option.label}
              </span>
            </div>
          </LiquidButton>

          {/* Expand (go deeper) button — always shown on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand(option);
            }}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-1/2 z-10
              flex items-center justify-center w-7 h-7 rounded-full
              bg-primary text-on-primary shadow-lg
              opacity-0 group-hover:opacity-100
              hover:scale-110 active:scale-95
              transition-all duration-200"
            title={`Get more specific options for "${option.label}"`}
          >
            <CaretDown size={16} weight="bold" />
          </button>
        </motion.div>
      ) : (
        <div className="w-full aspect-square rounded-2xl bg-surface-container-high/40 animate-pulse" />
      )}
    </div>
  );
}

// ── Main ButtonGrid ────────────────────────────────────────────────────────
export default function ButtonGrid({ onAddToStack }: ButtonGridProps) {
  // Nav stack — each frame is a "level" in the tree
  const [navStack, setNavStack] = useState<NavFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState<NavFrame>({
    path: [],
    pathLabels: [],
    options: [],
    quickOption: null,
  });
  const [loading, setLoading] = useState(true);
  const [gridKey, setGridKey] = useState(0);

  // Load AI root on mount
  useEffect(() => {
    expandTreeAI([]).then((result) => {
      if (!result) {
        setLoading(false);
        return;
      }
      const { options, quickOption } = aiResultToDisplayOptions(result);
      setCurrentFrame({
        path: [],
        pathLabels: [],
        options,
        quickOption,
      });
      setLoading(false);
    }).catch(err => {
      console.warn('ButtonGrid initial mount gracefully caught failure:', err);
      setLoading(false);
    });
  }, []);

  // SELECT — add to word stack + notify backend (fire-and-forget)
  const handleSelect = useCallback(
    (opt: DisplayOption) => {
      onAddToStack({ key: opt.key, label: opt.label });
      // Notify backend of selection for frequency tracking
      selectTreeAI(opt.key, currentFrame.path).catch(() => {});
    },
    [onAddToStack, currentFrame.path]
  );

  // EXPAND — AI call → push current frame to stack → show new level
  const handleExpand = useCallback(
    async (opt: DisplayOption) => {
      const newPath = [...currentFrame.path, opt.key];
      setLoading(true);
      setGridKey((k) => k + 1);

      try {
        const result = await expandTreeAI(newPath);
        if (!result) {
          console.warn("AI returned null (backend offline or failed).");
          setLoading(false);
          setGridKey((k) => k + 1);
          return;
        }
        const { options, quickOption } = aiResultToDisplayOptions(result);

        const newFrame: NavFrame = {
          path: newPath,
          pathLabels: [...currentFrame.pathLabels, opt.label],
          options,
          quickOption,
        };

        setNavStack((prev) => [...prev, currentFrame]);
        setCurrentFrame(newFrame);
      } catch (err) {
        console.error("AI generation failed or is offline.", err);
      } finally {
        setLoading(false);
        setGridKey((k) => k + 1);
      }
    },
    [currentFrame]
  );

  // BACK — pop stack
  const handleBack = useCallback(() => {
    if (navStack.length === 0) return;
    const stack = [...navStack];
    const prev = stack.pop()!;
    setNavStack(stack);
    setCurrentFrame(prev);
    setGridKey((k) => k + 1);
  }, [navStack]);

  // Jump to a specific breadcrumb level
  const handleBreadcrumbJump = useCallback(
    (targetDepth: number) => {
      // targetDepth -1 = root, 0 = first level, etc.
      if (targetDepth < 0) {
        // Go to root
        const root = navStack[0] ?? currentFrame;
        setNavStack([]);
        setCurrentFrame(root);
      } else {
        const targetFrame = navStack[targetDepth + 1] ?? currentFrame;
        setNavStack(navStack.slice(0, targetDepth + 1));
        setCurrentFrame(targetFrame);
      }
      setGridKey((k) => k + 1);
    },
    [navStack, currentFrame]
  );

  const breadcrumbLabels = currentFrame.pathLabels;
  const depth = currentFrame.path.length;

  return (
    <section className="h-full flex-1 min-w-0 bg-transparent flex flex-col overflow-hidden relative">
      {/* Breadcrumb + Back button */}
      <div className="flex items-center gap-4 px-2 pb-4 flex-shrink-0">
        <AnimatePresence>
          {depth > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: -20, width: 0 }}
              onClick={handleBack}
              className="flex items-center justify-center p-3 bg-surface-container-high rounded-full hover:bg-surface-variant transition-colors shadow-sm shrink-0"
            >
              <ArrowLeft size={24} weight="bold" className="text-on-surface" />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 text-lg font-bold font-headline text-on-surface-variant overflow-x-auto no-scrollbar">
          {/* Root label */}
          <span
            className={
              depth === 0
                ? "text-primary shrink-0"
                : "shrink-0 cursor-pointer hover:text-primary transition-colors"
            }
            onClick={() => {
              if (depth > 0) {
                // Jump all the way back to root
                const rootFrame = navStack[0];
                if (rootFrame) {
                  setNavStack([]);
                  setCurrentFrame(rootFrame);
                  setGridKey((k) => k + 1);
                }
              }
            }}
          >
            Needs
          </span>

          {/* Dynamic breadcrumb from path labels */}
          {breadcrumbLabels.map((label, i) => (
            <React.Fragment key={`${label}-${i}`}>
              <span className="opacity-40 shrink-0">/</span>
              <span
                className={
                  i === breadcrumbLabels.length - 1
                    ? "text-primary shrink-0"
                    : "shrink-0 cursor-pointer hover:text-primary transition-colors"
                }
                onClick={() => {
                  if (i < breadcrumbLabels.length - 1) {
                    // Jump to this breadcrumb level
                    const targetFrame = navStack[i + 1];
                    if (targetFrame) {
                      setNavStack(navStack.slice(0, i + 1));
                      setCurrentFrame(targetFrame);
                      setGridKey((k) => k + 1);
                    }
                  }
                }}
              >
                {label}
              </span>
            </React.Fragment>
          ))}

          {/* Depth indicator */}
          {depth > 0 && (
            <span className="ml-1 text-xs font-normal text-on-surface-variant/40 shrink-0">
              depth {depth}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable Grid */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain pt-8 pb-32 px-1 scroll-smooth"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key={`skeleton-${gridKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 content-start px-4 md:px-8 pb-12"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={`grid-${gridKey}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 content-start px-4 md:px-8 pb-12"
            >
              {/* Quick option first (if AI-generated and not already first in options) */}
              {currentFrame.quickOption &&
                currentFrame.options[0]?.key !== currentFrame.quickOption.key && (
                  <OptionCard
                    key={`quick-${currentFrame.quickOption.key}`}
                    option={currentFrame.quickOption}
                    onSelect={handleSelect}
                    onExpand={handleExpand}
                    isQuick
                  />
                )}

              {/* All options */}
              {currentFrame.options.map((opt, i) => (
                <OptionCard
                  key={`${opt.key}-${i}`}
                  option={opt}
                  onSelect={handleSelect}
                  onExpand={handleExpand}
                  isQuick={
                    opt.key === currentFrame.quickOption?.key &&
                    i === 0
                  }
                />
              ))}

              {currentFrame.options.length === 0 && (
                <div className="col-span-full flex items-center justify-center p-12 text-on-surface-variant/50 font-bold text-lg">
                  No options found.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
