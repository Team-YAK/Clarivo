"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

/* ────────────────────────────────────────────────────────────────────────────
   GlassTextarea
   Auto-resizing textarea with:
   - Glass morphism background (matches the app's glass design language)
   - Animated focus glow ring (inspired by 21st.dev AnimatedAIChat pattern)
   - Auto-height expansion up to maxHeight, then scrollable
   Usage:
     <GlassTextarea placeholder="Add notes…" minHeight={80} maxHeight={240} />
──────────────────────────────────────────────────────────────────────────── */

export interface GlassTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Minimum textarea height in px (default: 80) */
  minHeight?: number;
  /** Maximum textarea height in px before scroll (default: 240) */
  maxHeight?: number;
  /** Show animated glow ring on focus (default: true) */
  glowOnFocus?: boolean;
  /** Extra wrapper className */
  wrapperClassName?: string;
}

export function GlassTextarea({
  minHeight = 80,
  maxHeight = 240,
  glowOnFocus = true,
  className,
  wrapperClassName,
  onChange,
  ...props
}: GlassTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize on content change
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = `${minHeight}px`;
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${Math.max(next, minHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [minHeight, maxHeight]);

  // Set initial height
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = `${minHeight}px`;
      el.style.overflowY = "hidden";
    }
  }, [minHeight]);

  // Re-adjust on window resize
  useEffect(() => {
    window.addEventListener("resize", adjustHeight);
    return () => window.removeEventListener("resize", adjustHeight);
  }, [adjustHeight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustHeight();
    onChange?.(e);
  };

  return (
    <div className={cn("relative", wrapperClassName)}>
      <textarea
        ref={textareaRef}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={handleChange}
        className={cn(
          // Layout
          "w-full resize-none rounded-2xl px-4 py-3 text-sm leading-relaxed",
          // Glass background
          "bg-surface-container/40 backdrop-blur-sm",
          // Border
          "border border-outline-variant/20",
          // Typography
          "text-on-surface placeholder:text-on-surface-variant/40",
          // Transitions & focus
          "focus:outline-none focus:border-primary/30 transition-all duration-200",
          // Scrollbar hide when not overflowing
          "no-scrollbar",
          className
        )}
        style={{ minHeight, overflow: "hidden" }}
        {...props}
      />

      {/* Animated focus glow ring — matches primary brand color */}
      <AnimatePresence>
        {glowOnFocus && isFocused && (
          <motion.span
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              boxShadow:
                "0 0 0 2px color-mix(in srgb, var(--color-primary) 30%, transparent), 0 0 16px color-mix(in srgb, var(--color-primary) 12%, transparent)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   GlassInput
   Single-line glass input with the same animated focus ring.
──────────────────────────────────────────────────────────────────────────── */

export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  glowOnFocus?: boolean;
  wrapperClassName?: string;
}

export function GlassInput({
  glowOnFocus = true,
  className,
  wrapperClassName,
  ...props
}: GlassInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={cn("relative", wrapperClassName)}>
      <input
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "w-full rounded-xl px-4 py-2.5 text-sm",
          "bg-surface-container/40 backdrop-blur-sm",
          "border border-outline-variant/20",
          "text-on-surface placeholder:text-on-surface-variant/40",
          "focus:outline-none focus:border-primary/30 transition-all duration-200",
          className
        )}
        {...props}
      />

      <AnimatePresence>
        {glowOnFocus && isFocused && (
          <motion.span
            className="absolute inset-0 rounded-xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              boxShadow:
                "0 0 0 2px color-mix(in srgb, var(--color-primary) 30%, transparent), 0 0 12px color-mix(in srgb, var(--color-primary) 10%, transparent)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
