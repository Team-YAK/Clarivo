"use client";
/* eslint-disable react-hooks/static-components */

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowCounterClockwise, CaretDown } from "@phosphor-icons/react";
import {
  expandTreeAI,
} from "@/utils/patientApi";
import { getIconComponent } from "@/utils/icon-map";
import {
  DisplayOption,
  extendBreadcrumbs,
  normalizeAiExpandResult,
} from "@/utils/tree-navigation";

export interface StackAddEvent {
  key: string;
  label: string;
  icon: string;
}

interface ButtonGridProps {
  onAddToStack: (item: StackAddEvent) => void;
  conversationVersion?: number;
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
function SkeletonCard() {
  return (
    <div className="aspect-square w-full rounded-[2.5rem] shimmer-skeleton" />
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
    <div ref={ref} className="relative group aspect-square w-full">
      {isVisible && Icon ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
          className="w-full h-full relative"
        >
          <motion.button
            onClick={() => onSelect(option)}
            whileHover={{ y: -12, scale: 1.05, transition: { duration: 0.2, ease: "easeOut" } }}
            whileTap={{ scale: 0.92 }}
            className="relative w-full aspect-square rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden p-3 shadow-2xl group-hover:bg-white/10 transition-colors"
            style={{ '--depth-color': color } as React.CSSProperties}
            aria-label={option.label}
          >
            {/* Background Icon Glow */}
            <div
              className="absolute inset-0 opacity-25 blur-[40px] rounded-full pointer-events-none"
              style={{ background: color }}
            />

            {/* Icon container — Scaled to fit combinations */}
            <div
              className="flex-1 w-[85%] h-[85%] flex items-center justify-center relative z-10 overflow-hidden"
              style={{ containerType: 'size' }}
            >
              <Icon
                weight="fill"
                color={color}
                className="!w-full !h-full block transition-transform duration-300 group-hover:scale-110"
                style={{ filter: `drop-shadow(0 12px 28px ${color}70)` }}
              />
            </div>

            {/* Label — larger font, more prominent */}
            <span
              className="relative z-10 text-center text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-2 mt-1"
              style={{ color: `color-mix(in srgb, ${color} 80%, white)` }}
            >
              {option.label}
            </span>
          </motion.button>

          {/* Expand pill — glass pill, appears on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand(option);
            }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-1/2 z-20
              flex items-center justify-center px-4 py-1.5 rounded-full
              bg-[#050505] text-[11px] font-black uppercase tracking-widest
              opacity-0 group-hover:opacity-100
              hover:scale-110 active:scale-90
              transition-all duration-300 shadow-xl whitespace-nowrap border border-white/10"
            style={{
              color,
            }}
          >
            <CaretDown size={12} weight="bold" className="mr-1.5" /> more
          </button>
        </motion.div>
      ) : (
        <div className="w-full aspect-square rounded-[2.5rem] shimmer-skeleton" />
      )}
    </div>
  );
}

// ── Main ButtonGrid ────────────────────────────────────────────
export default function ButtonGrid({ onAddToStack, conversationVersion = 0 }: ButtonGridProps) {
  const [navStack, setNavStack] = useState<NavFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState<NavFrame>({
    path: [],
    breadcrumbs: [],
    options: [],
    quickOption: null,
  });
  const [loading, setLoading] = useState(true);
  const [gridKey, setGridKey] = useState(0);
  // Refresh state — stores the pre-refresh frame so user can cycle back
  const [preRefreshFrame, setPreRefreshFrame] = useState<NavFrame | null>(null);
  const [isRefreshed, setIsRefreshed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Re-fetch current path silently when conversation context updates
  // Uses the same refreshing state as the manual refresh button (no full skeleton)
  const currentFrameRef = useRef(currentFrame);
  useEffect(() => { currentFrameRef.current = currentFrame; }, [currentFrame]);

  useEffect(() => {
    if (conversationVersion === 0 || loading) return;
    let cancelled = false;
    setRefreshing(true);
    expandTreeAI(currentFrameRef.current.path).then((result) => {
      if (cancelled || !result) return;
      const normalized = normalizeAiExpandResult(result);
      setCurrentFrame((prev) => ({
        ...prev,
        options: normalized.options,
        quickOption: normalized.quickOption,
      }));
      setPreRefreshFrame(null);
      setIsRefreshed(false);
      setGridKey((k) => k + 1);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setRefreshing(false);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationVersion]);

  // SELECT
  const handleSelect = useCallback(
    (opt: DisplayOption) => {
      onAddToStack({ key: opt.key, label: opt.label, icon: opt.icon });
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
        setPreRefreshFrame(null);
        setIsRefreshed(false);
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
    setPreRefreshFrame(null);
    setIsRefreshed(false);
    setGridKey((k) => k + 1);
  }, [navStack]);

  // REFRESH — fetch alternative options excluding the current ones (cycles back on second tap)
  const handleRefresh = useCallback(async () => {
    if (refreshing || loading) return;

    // Second tap: restore original options
    if (isRefreshed && preRefreshFrame) {
      setCurrentFrame(preRefreshFrame);
      setPreRefreshFrame(null);
      setIsRefreshed(false);
      setGridKey((k) => k + 1);
      return;
    }

    // First tap: request fresh alternatives excluding current option keys
    const currentKeys = [
      ...(currentFrame.quickOption ? [currentFrame.quickOption.key] : []),
      ...currentFrame.options.map((o) => o.key),
    ];

    setRefreshing(true);
    setGridKey((k) => k + 1);
    try {
      const result = await expandTreeAI(currentFrame.path, undefined, currentKeys);
      if (!result) return;
      const normalized = normalizeAiExpandResult(result);
      setPreRefreshFrame(currentFrame);
      setCurrentFrame((prev) => ({
        ...prev,
        options: normalized.options,
        quickOption: normalized.quickOption,
      }));
      setIsRefreshed(true);
      setGridKey((k) => k + 1);
    } catch (err) {
      console.warn("Refresh failed", err);
    } finally {
      setRefreshing(false);
    }
  }, [currentFrame, isRefreshed, preRefreshFrame, refreshing, loading]);

  const depth = currentFrame.path.length;
  return (
    <section className="h-full flex-1 min-w-0 bg-transparent flex flex-col overflow-hidden relative">
      {/* Breadcrumb — glass container */}
      <div className="flex items-center gap-3 px-2 pb-3 flex-shrink-0">
        {currentFrame.breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-1.5 overflow-x-auto no-scrollbar">
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
                        ? "bg-[#14F1D9]/10"
                        : "cursor-pointer hover:bg-white/5",
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
                      className={isLast ? "text-[#14F1D9]" : "text-white/30"}
                    />
                    <span
                      className={[
                        "text-xs font-bold",
                        isLast ? "text-[#14F1D9]" : "text-white/40",
                      ].join(" ")}
                    >
                      {crumb.label}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {depth > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: -20, width: 0 }}
              onClick={handleBack}
              className="flex items-center justify-center w-8 h-8 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all shrink-0"
            >
              <ArrowLeft size={18} weight="bold" className="text-white" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Refresh button — always visible, cycles between original and alternative options */}
        <AnimatePresence>
          {!loading && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleRefresh}
              disabled={refreshing}
              title={isRefreshed ? "Restore original options" : "Shuffle for different options"}
              className={[
                "flex items-center justify-center w-8 h-8 bg-white/5 border border-white/10 rounded-full transition-all shrink-0 ml-auto",
                isRefreshed
                  ? "border-[#14F1D9]/40 text-[#14F1D9]"
                  : "hover:border-white/40 text-white/50",
                refreshing ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
            >
              <motion.div
                animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : {}}
              >
                <ArrowCounterClockwise size={16} weight="bold" />
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>
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
              className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 content-start px-4 md:px-10 pb-12"
            >
              {Array.from({ length: 6 }).map((_, i) => (
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
              className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 content-start px-4 md:px-10 pb-12"
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

              {currentFrame.options.slice(0, 5).map((opt, i) => (
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
