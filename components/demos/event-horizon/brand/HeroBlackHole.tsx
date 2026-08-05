"use client";

import { useEffect, useId, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/demos/event-horizon/utils";

/**
 * Single hero backdrop black hole.
 * Reuses the brand accretion language with slow CSS/SVG motion — never a second focal mark.
 */
export function HeroBlackHole({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const reduced = useReducedMotion();
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    function onVisibility() {
      setPageVisible(document.visibilityState === "visible");
    }
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const animate = !reduced && pageVisible;
  const discId = `hero-disc-${uid}`;
  const ringId = `hero-ring-${uid}`;
  const lensId = `hero-lens-${uid}`;
  const glowId = `hero-glow-${uid}`;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(34rem,72vh)] overflow-hidden",
        className,
      )}
      aria-hidden
      data-eh-hero-bh={animate ? "animate" : "static"}
    >
      <div
        className={cn(
          "eh-hero-bh absolute left-1/2 top-[52%] w-[min(20rem,68vw)] -translate-x-1/2 -translate-y-1/2 sm:w-[min(22rem,58vw)] lg:w-[min(24rem,42vw)]",
          animate && "eh-hero-bh-breathe",
        )}
      >
        <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible">
          <defs>
            <radialGradient id={discId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000" />
              <stop offset="36%" stopColor="#000" />
              <stop offset="46%" stopColor="#FF7A00" stopOpacity="0.34" />
              <stop offset="54%" stopColor="#FF8C2B" stopOpacity="0.78" />
              <stop offset="62%" stopColor="#FFC27A" stopOpacity="0.34" />
              <stop offset="78%" stopColor="#FF7A00" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={ringId} x1="6%" y1="50%" x2="94%" y2="50%">
              <stop offset="0%" stopColor="#8A4200" stopOpacity="0.2" />
              <stop offset="18%" stopColor="#FF7A00" stopOpacity="0.45" />
              <stop offset="40%" stopColor="#FF8C2B" stopOpacity="0.85" />
              <stop offset="58%" stopColor="#FFC27A" stopOpacity="0.92" />
              <stop offset="78%" stopColor="#FF8C2B" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#5C2E00" stopOpacity="0.16" />
            </linearGradient>
            <radialGradient id={lensId} cx="30%" cy="34%" r="60%">
              <stop offset="0%" stopColor="#FFC27A" stopOpacity="0.14" />
              <stop offset="45%" stopColor="#FF8C2B" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="0.7" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse cx="32" cy="32" rx="30" ry="12" fill={`url(#${lensId})`} opacity="0.5" />

          <g>
            {animate ? (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 32 32"
                to="360 32 32"
                dur="48s"
                repeatCount="indefinite"
              />
            ) : null}
            <ellipse cx="32" cy="32" rx="26.5" ry="9.8" fill={`url(#${discId})`} />
            <ellipse
              cx="32"
              cy="32"
              rx="23"
              ry="7.4"
              fill="none"
              stroke={`url(#${ringId})`}
              strokeWidth="2.5"
              opacity="0.88"
              filter={`url(#${glowId})`}
            />
            <ellipse cx="47" cy="31" rx="5.8" ry="1.8" fill="#FFC27A" opacity="0.24" filter={`url(#${glowId})`} />
            <ellipse cx="39" cy="33.5" rx="3.4" ry="1.15" fill="#FFC27A" opacity="0.18" />
            <ellipse cx="18" cy="32.8" rx="5" ry="1.55" fill="#C45400" opacity="0.2" />
            <ellipse cx="24" cy="30.6" rx="2.8" ry="0.95" fill="#FF7A00" opacity="0.14" />
          </g>

          <circle
            cx="32"
            cy="32"
            r="13.5"
            fill="none"
            stroke="#FFC27A"
            strokeWidth="0.95"
            opacity="0.45"
            filter={`url(#${glowId})`}
          />
          <circle cx="32" cy="32" r="12.6" fill="none" stroke="#FF7A00" strokeWidth="0.45" opacity="0.22" />
          <circle cx="32" cy="32" r="11.5" fill="#000000" />

          {animate ? (
            <>
              <circle cx="48" cy="28" r="0.55" fill="#FFC27A" opacity="0.32">
                <animate attributeName="cx" values="48;34;48" dur="14s" repeatCount="indefinite" />
                <animate attributeName="cy" values="28;31;28" dur="14s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.4;0.2" dur="14s" repeatCount="indefinite" />
              </circle>
              <circle cx="20" cy="36" r="0.45" fill="#FF8C2B" opacity="0.26">
                <animate attributeName="cx" values="20;30;20" dur="18s" repeatCount="indefinite" />
                <animate attributeName="cy" values="36;33;36" dur="18s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.16;0.32;0.16" dur="18s" repeatCount="indefinite" />
              </circle>
              <circle cx="40" cy="40" r="0.4" fill="#FFC27A" opacity="0.22">
                <animate attributeName="cx" values="40;33;40" dur="16s" repeatCount="indefinite" />
                <animate attributeName="cy" values="40;34;40" dur="16s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.12;0.3;0.12" dur="16s" repeatCount="indefinite" />
              </circle>
            </>
          ) : null}
        </svg>
      </div>
    </div>
  );
}
