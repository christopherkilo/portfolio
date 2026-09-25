"use client";

import { useId } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type AiEngineeringBlogCoverProps = {
  className?: string;
  title?: string;
  showTitle?: boolean;
};

/**
 * Editorial cover: a work-order becoming a validated workflow.
 * Graphite + portfolio yellow — not a generic “AI brain” image.
 */
export function AiEngineeringBlogCover({
  className,
  title = "AI Engineering",
  showTitle = true,
}: AiEngineeringBlogCoverProps) {
  const uid = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const lineId = `ai-blog-line-${uid}`;
  const glassId = `ai-blog-glass-${uid}`;
  const glowId = `ai-blog-glow-${uid}`;

  return (
    <div
      className={cn("relative isolate h-full w-full overflow-hidden bg-[#090A08]", className)}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_22%,rgba(248,231,28,0.22),transparent_52%),radial-gradient(ellipse_at_86%_78%,rgba(248,231,28,0.10),transparent_48%),linear-gradient(165deg,#090A08_0%,#12140E_48%,#0A0B08_100%)]" />
      <div
        className={cn(
          "pointer-events-none absolute -left-16 top-[-28%] size-64 rounded-full bg-[#F8E71C]/16 blur-3xl",
          !reducedMotion && "blog-cover-drift",
        )}
      />
      <div className="pointer-events-none absolute -bottom-20 -right-10 size-72 rounded-full bg-[#F8E71C]/10 blur-3xl" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 225"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={lineId} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#F8E71C" stopOpacity="0.12" />
            <stop offset="50%" stopColor="#F8E71C" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F8E71C" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id={glassId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F8E71C" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#3A3A12" stopOpacity="0.16" />
          </linearGradient>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M168 118 C210 118 228 78 268 78 S318 142 352 142"
          fill="none"
          stroke={`url(#${lineId})`}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M168 118 C210 118 228 78 268 78 S318 142 352 142"
          fill="none"
          stroke="#F8E71C"
          strokeOpacity="0.18"
          strokeWidth="0.7"
          strokeDasharray="3 7"
        />

        {/* Work order */}
        <g transform="translate(28 52)">
          <rect
            width="128"
            height="122"
            rx="12"
            fill={`url(#${glassId})`}
            stroke="#F8E71C"
            strokeOpacity="0.42"
            strokeWidth="1"
          />
          <rect x="14" y="16" width="72" height="6" rx="1.5" fill="#F8E71C" opacity="0.55" />
          <rect x="14" y="30" width="48" height="4" rx="1.5" fill="#F8E71C" opacity="0.22" />
          <rect x="14" y="52" width="100" height="14" rx="3" fill="#F8E71C" opacity="0.12" />
          <circle cx="24" cy="59" r="3" fill="#86EFAC" opacity="0.9" />
          <rect x="32" y="56" width="36" height="5" rx="1.5" fill="#F8E71C" opacity="0.38" />
          <rect x="14" y="72" width="100" height="14" rx="3" fill="#F8E71C" opacity="0.08" />
          <circle cx="24" cy="79" r="3" fill="#86EFAC" opacity="0.75" />
          <rect x="32" y="76" width="44" height="5" rx="1.5" fill="#F8E71C" opacity="0.28" />
          <rect x="14" y="92" width="100" height="14" rx="3" fill="#F8E71C" opacity="0.16" />
          <circle cx="24" cy="99" r="3" fill="#F8E71C" opacity="0.85" />
          <rect x="32" y="96" width="52" height="5" rx="1.5" fill="#F8E71C" opacity="0.55" />
        </g>

        {/* Spec */}
        <g transform="translate(232 54)" filter={`url(#${glowId})`}>
          <rect
            width="44"
            height="44"
            rx="10"
            fill={`url(#${glassId})`}
            stroke="#F8E71C"
            strokeOpacity="0.5"
            strokeWidth="1.1"
          />
          <rect x="10" y="12" width="24" height="4" rx="1.5" fill="#F8E71C" opacity="0.7" />
          <rect x="10" y="20" width="18" height="3.5" rx="1.5" fill="#F8E71C" opacity="0.35" />
          <rect x="10" y="28" width="14" height="3.5" rx="1.5" fill="#F8E71C" opacity="0.25" />
        </g>

        {/* Lock */}
        <g transform="translate(288 118)">
          <rect
            width="42"
            height="42"
            rx="10"
            fill={`url(#${glassId})`}
            stroke="#F8E71C"
            strokeOpacity="0.4"
            strokeWidth="1"
          />
          <rect
            x="14"
            y="20"
            width="14"
            height="11"
            rx="2"
            fill="none"
            stroke="#F8E71C"
            strokeOpacity="0.85"
            strokeWidth="1.4"
          />
          <path
            d="M17 20 V16 a4 4 0 0 1 8 0 v4"
            fill="none"
            stroke="#F8E71C"
            strokeOpacity="0.85"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      </svg>

      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
      {showTitle ? (
        <p className="absolute bottom-4 left-4 font-display text-sm font-semibold uppercase tracking-[0.22em] text-white sm:bottom-5 sm:left-5 sm:text-base">
          {title}
        </p>
      ) : null}
    </div>
  );
}
