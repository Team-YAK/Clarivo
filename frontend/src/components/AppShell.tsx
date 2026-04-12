"use client";

import React, { useState, useEffect } from "react";
import { LoadingScreen } from "@/components/ui/loading-screen";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Hidden SVG filter defs — liquid glass effect used by card ::after pseudo-elements */}
      <svg
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Card-level glass: subtle wavy edge distortion */}
          <filter
            id="card-glass"
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.012"
              numOctaves="2"
              seed="92"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="0.4" result="blur" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blur"
              scale="6"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Button-level glass: slightly more pronounced distortion for small elements */}
          <filter
            id="btn-glass"
            x="-8%"
            y="-8%"
            width="116%"
            height="116%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.025 0.025"
              numOctaves="3"
              seed="92"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="0.3" result="blur" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blur"
              scale="4"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {mounted && <LoadingScreen />}
      {children}
    </>
  );
}
