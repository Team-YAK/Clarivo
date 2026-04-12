"use client";
/* eslint-disable react-hooks/static-components */

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CaretDown } from "@phosphor-icons/react";
import {
  expandTreeAI,
} from "@/utils/patientApi";
import { getIconComponent } from "@/utils/icon-map";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import {
  DisplayOption,
  extendBreadcrumbs,
  normalizeAiExpandResult,
} from "@/utils/tree-navigation";

export interface StackAddEvent {
  key: string;
  label: string;
}

interface ButtonGridProps {
  onAddToStack: (item: StackAddEvent) => void;
}

// ── Navigation frame ───────────────────────────────────────────
interface NavFrame {
  path: string[];
  breadcrumbs: DisplayOption[];
  options: DisplayOption[];
  quickOption: DisplayOption | null;
}

const DEPTH_COLORS = [
  "#14b8a6", "#6366f1", "#0ea5e9", "#a855f7",
  "#f59e0b", "#ec4899", "#22c55e", "#ef4444",
];

function getIconColor(option: DisplayOption, index: number): string {
  return DEPTH_COLORS[index % DEPTH_COLORS.length];
}

// ── Skeleton card ──────────────────────────────────────────────
function SkeletonCard({ large = false }: { large?: boolean }) {
  return (
    <div
      className={[
        "rounded-3xl bg-surface-container-high/30 animate-pulse",
        large ? "aspect-square" : "aspect-square",
      ].join(" ")}
    />
  );
}

// ── Deep Option Card (inner levels) ───────────────────────────
function OptionCard({
  option,
  onSelect,
  onExpand,
  index = 0,
  featured = false,
}: {
  option: DisplayOption;
  onSelect: (opt: DisplayOption) => void;
  onExpand: (opt: DisplayOption) => void;
  index?: number;
  featured?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const color = getIconColor(option, index);

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

  const Icon = useMemo(
    () => {
      if (!isVisible) return null;
      return getIconComponent(option.icon);
    },
    [isVisible, option.icon]
  );

  return (
    <div ref={ref} className="relative group">
      {isVisible && Icon ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15, delay: index * 0.03 }}
          className="aspect-square w-full h-full relative"
        >
          <LiquidButton
            size="xxl"
            onClick={() => onSelect(option)}
            className={[
              "!w-full !h-full !rounded-[1.5rem] !px-0 !py-0 flex-col shadow-lg border",
              featured
                ? "border-primary/40 ring-2 ring-primary/20"
                : "border-white/5",
            ].join(" ")}
            style={{
              background: `linear-gradient(135deg, ${color}10, ${color}05)`,
            }}
          >
            <div className="flex flex-col items-center justify-center w-full h-full p-2 gap-1">
              {featured && (
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">
                  Likely
                </span>
              )}
              {/* Icon: 65-70% of card height */}
              <div className="flex-1 flex items-center justify-center min-h-0">
                <Icon
                  weight="fill"
                  color={color}
                  className="!w-12 !h-12 sm:!w-14 sm:!h-14 drop-shadow-[0_2px_15px_rgba(0,0,0,0.5)]"
                />
              </div>
              {/* Decorative label */}
              <span className="text-[10px] font-bold text-on-surface-variant/40 text-center leading-tight uppercase tracking-wider px-1">
                {option.label}
              </span>
            </div>
          </LiquidButton>

          {/* Expand deeper */}
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
          >
            <CaretDown size={16} weight="bold" />
          </button>
        </motion.div>
      ) : (
        <div className="w-full aspect-square rounded-2xl bg-surface-container-high/30 animate-pulse" />
      )}
    </div>
  );
}

// ── Main ButtonGrid ────────────────────────────────────────────
export default function ButtonGrid({ onAddToStack }: ButtonGridProps) {
  const [navStack, setNavStack] = useState<NavFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState<NavFrame>({
    path: [],
    breadcrumbs: [],
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
      const normalized = normalizeAiExpandResult(result);
      setCurrentFrame({
        path: [],
        breadcrumbs: [],
        options: normalized.options,
        quickOption: normalized.quickOption,
      });
      setLoading(false);
    }).catch(err => {
      console.warn('ButtonGrid initial mount gracefully caught failure:', err);
      setLoading(false);
    });
  }, []);

  // SELECT
  const handleSelect = useCallback(
    (opt: DisplayOption) => {
      onAddToStack({ key: opt.key, label: opt.label });
    },
    [onAddToStack]
  );

  // EXPAND
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
        const normalized = normalizeAiExpandResult(result);

        const newFrame: NavFrame = {
          path: newPath,
          breadcrumbs: extendBreadcrumbs(currentFrame.breadcrumbs, opt),
          options: normalized.options,
          quickOption: normalized.quickOption,
        };

        setNavStack((prev) => [...prev, currentFrame]);
        setCurrentFrame(newFrame);
      } catch (err) {
        console.warn("AI generation failed or is offline.", err);
      } finally {
        setLoading(false);
        setGridKey((k) => k + 1);
      }
    },
    [currentFrame]
  );

  // BACK
  const handleBack = useCallback(() => {
    if (navStack.length === 0) return;
    const stack = [...navStack];
    const prev = stack.pop()!;
    setNavStack(stack);
    setCurrentFrame(prev);
    setGridKey((k) => k + 1);
  }, [navStack]);

  const depth = currentFrame.path.length;
  return (
    <section className="h-full flex-1 min-w-0 bg-transparent flex flex-col overflow-hidden relative">
      {/* Breadcrumb — icon-based */}
      <div className="flex items-center gap-3 px-2 pb-3 flex-shrink-0">
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

        {/* Breadcrumb icons only (no text) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {currentFrame.breadcrumbs.map((crumb, i) => {
            const BreadcrumbIcon = getIconComponent(crumb.icon);
            const isLast = i === currentFrame.breadcrumbs.length - 1;
            return (
              <React.Fragment key={`${crumb.key}-${i}`}>
                {i > 0 && <span className="text-on-surface-variant/20 text-sm">/</span>}
                <div
                  className={[
                    "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all",
                    isLast
                      ? "bg-primary/10"
                      : "cursor-pointer hover:bg-surface-container-high",
                  ].join(" ")}
                  onClick={() => {
                    if (!isLast && navStack[i + 1]) {
                      setNavStack(navStack.slice(0, i + 1));
                      setCurrentFrame(navStack[i + 1]);
                      setGridKey((k) => k + 1);
                    }
                  }}
                >
                  <BreadcrumbIcon
                    size={18}
                    weight="fill"
                    className={isLast ? "text-primary" : "text-on-surface-variant/50"}
                  />
                  <span
                    className={[
                      "text-xs font-bold",
                      isLast ? "text-primary" : "text-on-surface-variant/40",
                    ].join(" ")}
                  >
                    {crumb.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {depth > 0 && (
          <span className="ml-auto text-[10px] font-bold text-on-surface-variant/20 uppercase tracking-widest shrink-0">
            {depth}
          </span>
        )}
      </div>

      {/* Grid */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain pt-4 pb-32 px-1 scroll-smooth"
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
              className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-6 content-start px-4 md:px-8 pb-12"
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
              className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-6 content-start px-4 md:px-8 pb-12"
            >
              {currentFrame.quickOption && (
                <OptionCard
                  key={`quick-${currentFrame.quickOption.key}`}
                  option={currentFrame.quickOption}
                  onSelect={handleSelect}
                  onExpand={handleExpand}
                  index={0}
                  featured
                />
              )}

              {currentFrame.options.map((opt, i) => (
                <OptionCard
                  key={`${opt.key}-${i}`}
                  option={opt}
                  onSelect={handleSelect}
                  onExpand={handleExpand}
                  index={currentFrame.quickOption ? i + 1 : i}
                />
              ))}

              {currentFrame.options.length === 0 && !currentFrame.quickOption && (
                <div className="col-span-full flex flex-col items-center justify-center p-16 gap-4">
                  {/* Icon-based empty state (no text) */}
                  {(() => {
                    const HelpIcon = getIconComponent("help");
                    return (
                      <HelpIcon
                        size={64}
                        weight="fill"
                        className="text-on-surface-variant/20"
                      />
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
