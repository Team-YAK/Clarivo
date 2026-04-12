"use client";

import React from "react";
import { cn } from "@/utils/cn";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  depth?: number; // 0-7, maps to DEPTH_COLORS tint
  hover?: boolean;
  onClick?: () => void;
  as?: "div" | "button" | "section" | "article";
}

const DEPTH_COLORS = [
  "#14b8a6", "#6366f1", "#0ea5e9", "#a855f7",
  "#f59e0b", "#ec4899", "#22c55e", "#ef4444",
];

export function GlassCard({
  children,
  className,
  depth,
  hover = false,
  onClick,
  as: Tag = "div",
}: GlassCardProps) {
  const depthColor = depth !== undefined ? DEPTH_COLORS[depth % DEPTH_COLORS.length] : null;

  return (
    <Tag
      onClick={onClick}
      className={cn(
        // Base glass
        "relative overflow-hidden rounded-3xl",
        "glass-card",
        // Multi-layer 3D shadow for float effect
        "shadow-[0_2px_4px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.10),0_24px_48px_rgba(0,0,0,0.06)]",
        // Top-edge specular highlight
        "before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent",
        // Hover effects
        hover && [
          "transition-all duration-300 cursor-pointer",
          "hover:translate-y-[-6px]",
          "hover:shadow-[0_4px_8px_rgba(0,0,0,0.15),0_16px_36px_rgba(0,0,0,0.18),0_36px_72px_rgba(0,0,0,0.10)]",
        ],
        className
      )}
      style={
        depthColor
          ? {
              background: `linear-gradient(135deg, color-mix(in srgb, ${depthColor} 8%, var(--glass-bg)), var(--glass-bg))`,
            }
          : undefined
      }
    >
      {children}
    </Tag>
  );
}
