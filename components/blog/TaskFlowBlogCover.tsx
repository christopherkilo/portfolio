"use client";

import { useId } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type TaskFlowBlogCoverProps = {
  className?: string;
  title?: string;
};

/**
 * Editorial cover: two clients sharing one API — emerald glass, not a kanban screenshot.
 */
export function TaskFlowBlogCover({
  className,
  title = "TaskFlow",
}: TaskFlowBlogCoverProps) {
  const uid = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const lineId = `tf-blog-line-${uid}`;
  const glassId = `tf-blog-glass-${uid}`;
  const glowId = `tf-blog-glow-${uid}`;

  return (
    <div
      className={cn("relative isolate h-full w-full overflow-hidden bg-[#070A09]", className)}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_20%,rgba(16,185,129,0.26),transparent_52%),radial-gradient(ellipse_at_84%_78%,rgba(6,95,70,0.28),transparent_48%),linear-gradient(165deg,#070A09_0%,#0C1411_48%,#080B0A_100%)]" />
      <div
        className={cn(
          "pointer-events-none absolute -left-16 top-[-30%] size-64 rounded-full bg-[#10B981]/20 blur-3xl",
          !reducedMotion && "blog-cover-drift",
        )}
      />
      <div className="pointer-events-none absolute -bottom-20 -right-10 size-72 rounded-full bg-[#059669]/18 blur-3xl" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 225"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={lineId} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#34D399" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id={glassId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#064E3B" stopOpacity="0.14" />
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
          d="M78 86 C120 86 132 128 200 128 S280 86 322 86"
          fill="none"
          stroke={`url(#${lineId})`}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M78 86 L78 128 M322 86 L322 128"
          fill="none"
          stroke="#6EE7B7"
          strokeOpacity="0.28"
          strokeWidth="1"
        />

        {/* React client */}
        <g transform="translate(34 58)">
          <rect
            width="88"
            height="56"
            rx="10"
            fill={`url(#${glassId})`}
            stroke="#A7F3D0"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
          <rect x="10" y="12" width="28" height="4" rx="1.5" fill="#D1FAE5" opacity="0.4" />
          <rect x="10" y="22" width="68" height="8" rx="2" fill="#10B981" opacity="0.28" />
          <rect x="10" y="34" width="44" height="8" rx="2" fill="#34D399" opacity="0.22" />
        </g>

        {/* Shared API / Postgres */}
        <g transform="translate(168 104)" filter={`url(#${glowId})`}>
          <circle
            r="26"
            fill={`url(#${glassId})`}
            stroke="#6EE7B7"
            strokeOpacity="0.55"
            strokeWidth="1.1"
          />
          <circle r="8" fill="#10B981" opacity="0.55" />
          <circle r="3.2" fill="#ECFDF5" opacity="0.92" />
        </g>

        {/* Angular client */}
        <g transform="translate(278 58)">
          <rect
            width="88"
            height="56"
            rx="10"
            fill={`url(#${glassId})`}
            stroke="#34D399"
            strokeOpacity="0.5"
            strokeWidth="1"
          />
          <rect x="10" y="12" width="34" height="4" rx="1.5" fill="#A7F3D0" opacity="0.4" />
          <rect x="10" y="22" width="52" height="8" rx="2" fill="#059669" opacity="0.35" />
          <rect x="10" y="34" width="64" height="8" rx="2" fill="#10B981" opacity="0.22" />
        </g>
      </svg>

      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
      <p className="absolute bottom-4 left-4 font-display text-sm font-semibold uppercase tracking-[0.22em] text-white sm:bottom-5 sm:left-5 sm:text-base">
        {title}
      </p>
    </div>
  );
}
