/**
 * icon-map.tsx — Dynamic Mapping Engine
 *
 * This file no longer contains the hardcoded ICON_MAP.
 * Instead, it provides a helper that intelligently resolves icons from:
 * 1. Native Emojis (from the AI backend)
 * 2. Phosphor components (via the dynamic mapping in phosphor-map.json)
 */

import React from "react";
import * as PhosphorIcons from "@phosphor-icons/react";
import PHOSPHOR_MAP_RAW from "./phosphor-map.json";

// Typed mapping from concept key -> Phosphor component name
const PHOSPHOR_MAP: Record<string, string> = PHOSPHOR_MAP_RAW;

/**
 * Retrieve the React component for a given concept key.
 * Supports:
 *   1. Emojis (native text)
 *   2. PHOSPHOR_MAP keys -> Phosphor components
 *   3. Direct Phosphor component names
 *   4. Inline SVG strings
 */
export const getIconComponent = (key: string): React.ComponentType<any> => {
  const toPascal = (value: string) =>
    value
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");

  // 1. New backend payload: emoji (native text rendering)
  const isEmoji = key && (/\p{Emoji_Presentation}/u.test(key) || Array.from(key).some(c => c.charCodeAt(0) > 127));
  if (isEmoji) {
    const EmojiIcon = (props: { className?: string; style?: React.CSSProperties; color?: string; weight?: string; size?: number | string }) => {
      const len = Math.max(1, Array.from(key).length);
      
      let fontSize = `${80 / len}cqi`;
      if (props.size !== undefined) {
        if (typeof props.size === 'number') {
          fontSize = `${props.size}px`;
        } else if (typeof props.size === 'string' && props.size.endsWith('%')) {
          const scale = parseFloat(props.size) / 100;
          fontSize = `${(80 * scale) / len}cqi`;
        } else {
          fontSize = props.size;
        }
      }

      return (
        <span
          className={props.className}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            lineHeight: 1,
            whiteSpace: "nowrap",
            fontSize,
            ...(props.size !== undefined ? { width: "100%", height: "100%" } : {}),
            ...props.style,
          }}
        >
          {key}
        </span>
      );
    };
    EmojiIcon.displayName = "EmojiIcon";
    return EmojiIcon as any;
  }

  // 2. Direct Phosphor component name (PascalCase or kebab-case)
  const directPascal = (PhosphorIcons as any)[toPascal(key)];
  if (directPascal) return directPascal;
  
  const directKebab = (PhosphorIcons as any)[key];
  if (directKebab) return directKebab;

  // 3. Mapping-based lookup
  const mappedName = PHOSPHOR_MAP[key];
  if (mappedName) {
    const Icon = (PhosphorIcons as any)[mappedName];
    if (Icon) return Icon;
  }

  // 4. Inline SVG string (Disabled as a precaution against "script tag" error)
  if (key && key.trim().startsWith("<svg")) {
    return () => <span className="select-none text-[10px] opacity-30">[SVG]</span>;
  }

  // 5. Fallback
  return PhosphorIcons.Question;
};
