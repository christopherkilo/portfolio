"use client";

import { useId } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type NovaTechBlogCoverProps = {
  className?: string;
  title?: string;
};

/**
 * Editorial cover: form → workflow → CRM → notifications.
 * Indigo / violet glass — not an AWS architecture diagram.
 */
export function NovaTechBlogCover({
  className,
  title = "NovaTech",
}: NovaTechBlogCoverProps) {
  const uid = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const lineId = `nt-blog-line-${uid}`;
  const glassId = `nt-blog-glass-${uid}`;
  const glowId = `nt-blog-glow-${uid}`;

  return (
    <div
      className={cn("relative isolate h-full w-full overflow-hidden bg-[#070A14]", className)}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_22%_18%,rgba(99,102,241,0.28),transparent_52%),radial-gradient(ellipse_at_86%_78%,rgba(67,56,202,0.22),transparent_48%),linear-gradient(165deg,#070A14_0%,#0E1224_48%,#0A0C18_100%)]" />
      <div
        className={cn(
          "pointer-events-none absolute -left-16 top-[-30%] size-64 rounded-full bg-[#6366F1]/20 blur-3xl",
          !reducedMotion && "blog-cover-drift",
        )}
      />
      <div className="pointer-events-none absolute -bottom-20 -right-10 size-72 rounded-full bg-[#4338CA]/18 blur-3xl" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 225"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={lineId} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#A5B4FC" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#818CF8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id={glassId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A5B4FC" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#312E81" stopOpacity="0.12" />
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
          d="M58 118 C110 118 128 86 168 86 S230 138 268 138 S318 92 352 92"
          fill="none"
          stroke={`url(#${lineId})`}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M58 118 C110 118 128 86 168 86 S230 138 268 138 S318 92 352 92"
          fill="none"
          stroke="#C7D2FE"
          strokeOpacity="0.18"
          strokeWidth="0.7"
          strokeDasharray="3 7"
        />

        {/* Form */}
        <g transform="translate(34 92)">
          <rect
            width="48"
            height="52"
            rx="10"
            fill={`url(#${glassId})`}
            stroke="#A5B4FC"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
          <rect x="8" y="12" width="32" height="5" rx="1.5" fill="#C7D2FE" opacity="0.35" />
          <rect x="8" y="22" width="24" height="5" rx="1.5" fill="#A5B4FC" opacity="0.28" />
          <rect x="8" y="32" width="20" height="5" rx="1.5" fill="#818CF8" opacity="0.35" />
        </g>

        {/* Workflow */}
        <g transform="translate(146 62)" filter={`url(#${glowId})`}>
          <rect
            width="44"
            height="48"
            rx="11"
            fill={`url(#${glassId})`}
            stroke="#818CF8"
            strokeOpacity="0.55"
            strokeWidth="1.1"
          />
          <circle cx="14" cy="16" r="3.2" fill="#A5B4FC" opacity="0.9" />
          <circle cx="30" cy="16" r="3.2" fill="#6366F1" opacity="0.85" />
          <circle cx="22" cy="32" r="3.2" fill="#C7D2FE" opacity="0.8" />
          <path
            d="M14 16 L30 16 M22 19 L22 29"
            stroke="#A5B4FC"
            strokeOpacity="0.55"
            strokeWidth="1"
          />
        </g>

        {/* CRM hub */}
        <g transform="translate(246 114)">
          <circle
            r="22"
            fill={`url(#${glassId})`}
            stroke="#A5B4FC"
            strokeOpacity="0.5"
            strokeWidth="1.1"
          />
          <circle r="7" fill="#6366F1" opacity="0.55" />
          <circle r="3" fill="#EEF2FF" opacity="0.9" />
        </g>

        {/* Notifications */}
        <g transform="translate(330 70)">
          <rect
            width="42"
            height="44"
            rx="10"
            fill={`url(#${glassId})`}
            stroke="#818CF8"
            strokeOpacity="0.4"
            strokeWidth="1"
          />
          <path
            d="M10 16 L21 24 L32 16"
            fill="none"
            stroke="#C7D2FE"
            strokeWidth="1.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <rect
            x="10"
            y="16"
            width="22"
            height="16"
            rx="2"
            fill="none"
            stroke="#A5B4FC"
            strokeOpacity="0.7"
            strokeWidth="1.2"
          />
        </g>
      </svg>

      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
      <p className="absolute bottom-4 left-4 font-display text-sm font-semibold uppercase tracking-[0.22em] text-white sm:bottom-5 sm:left-5 sm:text-base">
        {title}
      </p>
    </div>
  );
}
