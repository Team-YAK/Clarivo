"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

/* ────────────────────────────────────────────────────────────────────────────
   Shared glow ring component
──────────────────────────────────────────────────────────────────────────── */
function FocusGlowRing({ active, radius = "rounded-2xl" }: { active: boolean; radius?: string }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.span
          className={cn("absolute inset-0 pointer-events-none", radius)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            boxShadow:
              "0 0 0 2px color-mix(in srgb, var(--color-primary) 30%, transparent), 0 0 14px color-mix(in srgb, var(--color-primary) 12%, transparent)",
          }}
        />
      )}
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   GlassInput — single-line glass input with animated focus glow
──────────────────────────────────────────────────────────────────────────── */
export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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
          "focus:outline-none focus:border-primary/30",
          "hover:border-outline-variant/40",
          "shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]",
          "transition-all duration-200",
          className
        )}
        {...props}
      />
      <FocusGlowRing active={isFocused} radius="rounded-xl" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   GlassTextarea — auto-resizing glass textarea with animated focus glow
   Inspired by the 21st.dev AnimatedAIChat auto-resize pattern
──────────────────────────────────────────────────────────────────────────── */
export interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Minimum height in px (default: 80) */
  minHeight?: number;
  /** Maximum height before scroll (default: 240) */
  maxHeight?: number;
  glowOnFocus?: boolean;
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

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = `${minHeight}px`;
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${Math.max(next, minHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [minHeight, maxHeight]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = `${minHeight}px`;
      el.style.overflowY = "hidden";
    }
  }, [minHeight]);

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
          "w-full resize-none rounded-2xl px-4 py-3 text-sm leading-relaxed",
          "bg-surface-container/40 backdrop-blur-sm",
          "border border-outline-variant/20",
          "text-on-surface placeholder:text-on-surface-variant/40",
          "focus:outline-none focus:border-primary/30",
          "hover:border-outline-variant/40",
          "shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]",
          "transition-all duration-200 no-scrollbar",
          className
        )}
        style={{ minHeight, overflow: "hidden" }}
        {...props}
      />
      <FocusGlowRing active={isFocused} radius="rounded-2xl" />
    </div>
  );
}
