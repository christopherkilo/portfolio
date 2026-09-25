"use client";

import { useId } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type EventHorizonBlogCoverProps = {
  className?: string;
  title?: string;
  showTitle?: boolean;
};

/**
 * Editorial cover for “Taking Event Horizon to AWS”:
 * Event Horizon identity (singularity) feeding an ingestion pipeline
 * into a distributed systems cluster — not a brand-only black hole.
 */
export function EventHorizonBlogCover({
  className,
  title = "Event Horizon",
  showTitle = true,
}: EventHorizonBlogCoverProps) {
  const uid = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const lineId = `eh-blog-line-${uid}`;
  const glassId = `eh-blog-glass-${uid}`;
  const glowId = `eh-blog-glow-${uid}`;
  const ringId = `eh-blog-ring-${uid}`;
  const coreId = `eh-blog-core-${uid}`;

  return (
    <div
      className={cn("relative isolate h-full w-full overflow-hidden bg-[#07060A]", className)}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_22%_44%,rgba(255,140,43,0.32),transparent_52%),radial-gradient(ellipse_at_84%_62%,rgba(255,122,0,0.16),transparent_48%),linear-gradient(165deg,#07060A_0%,#16110c_50%,#07060A_100%)]" />
      <div
        className={cn(
          "pointer-events-none absolute left-[8%] top-[8%] size-64 rounded-full bg-[#FF8C2B]/22 blur-3xl",
          !reducedMotion && "blog-cover-drift",
        )}
      />
      <div className="pointer-events-none absolute -bottom-16 -right-8 size-72 rounded-full bg-[#FF7A00]/12 blur-3xl" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 225"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={lineId} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FFC27A" stopOpacity="0.2" />
            <stop offset="48%" stopColor="#FF8C2B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.28" />
          </linearGradient>
          <linearGradient id={glassId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFC27A" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#3A1C08" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id={ringId} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#FFC27A" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF8C2B" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id={coreId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF8C2B" stopOpacity="0.28" />
            <stop offset="62%" stopColor="#FF7A00" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M118 114 C168 114 186 78 232 78 S286 146 332 118"
          fill="none"
          stroke={`url(#${lineId})`}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M118 114 C168 114 186 78 232 78 S286 146 332 118"
          fill="none"
          stroke="#FFC27A"
          strokeOpacity="0.2"
          strokeWidth="0.7"
          strokeDasharray="3 7"
        />

        {/* Event Horizon singularity — product identity */}
        <g transform="translate(78 114)">
          <ellipse
            rx="54"
            ry="17"
            fill="none"
            stroke={`url(#${ringId})`}
            strokeWidth="1.2"
            strokeDasharray="4 6"
            transform="rotate(-12)"
          />
          <circle r="40" fill={`url(#${coreId})`} />
          <circle r="30" fill="none" stroke="#FFC27A" strokeOpacity="0.5" strokeWidth="1.1" />
          <circle r="22" fill="none" stroke="#FF8C2B" strokeOpacity="0.85" strokeWidth="5" />
          <circle r="13" fill="#05040A" />
          <circle r="4" fill="#FF8C2B" opacity="0.35" />
        </g>

        {/* Ingestion / queue */}
        <g transform="translate(210 54)" filter={`url(#${glowId})`}>
          <rect
            width="46"
            height="48"
            rx="11"
            fill={`url(#${glassId})`}
            stroke="#FFC27A"
            strokeOpacity="0.5"
            strokeWidth="1.1"
          />
          <rect x="10" y="13" width="26" height="5" rx="1.5" fill="#FFC27A" opacity="0.85" />
          <rect x="10" y="22" width="20" height="5" rx="1.5" fill="#FF8C2B" opacity="0.7" />
          <rect x="10" y="31" width="14" height="5" rx="1.5" fill="#FF7A00" opacity="0.55" />
        </g>

        {/* Distributed AWS cluster */}
        <g transform="translate(318 104)">
          <circle
            r="26"
            fill={`url(#${glassId})`}
            stroke="#FFC27A"
            strokeOpacity="0.48"
            strokeWidth="1.1"
          />
          <circle cx="-11" cy="-8" r="7" fill="#FF8C2B" opacity="0.28" />
          <circle cx="10" cy="-6" r="6" fill="#FFC27A" opacity="0.32" />
          <circle cx="2" cy="10" r="7.5" fill="#FF7A00" opacity="0.38" />
          <circle r="4" fill="#FFF4E5" opacity="0.9" />
          <path
            d="M-11 -8 L10 -6 M10 -6 L2 10 M2 10 L-11 -8"
            fill="none"
            stroke="#FFC27A"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
        </g>
      </svg>

      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
      {showTitle ? (
        <p className="absolute bottom-4 left-4 font-display text-sm font-semibold uppercase tracking-[0.22em] text-white sm:bottom-5 sm:left-5 sm:text-base">
          {title}
        </p>
      ) : null}
    </div>
  );
}
