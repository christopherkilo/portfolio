"use client";

import { useId } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type StarLenzBlogCoverProps = {
  className?: string;
  title?: string;
  showTitle?: boolean;
};

const GOLD = "#D4B87A";

/**
 * Original StarLenz mark for blog covers:
 * gold lens rings + a 4-point star. Navy field from the product identity.
 * Not a constellation map, not Orion, not app geometry.
 */
export function StarLenzBlogCover({
  className,
  title = "StarLenz",
  showTitle = true,
}: StarLenzBlogCoverProps) {
  const uid = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const glowId = `sl-logo-glow-${uid}`;
  const goldId = `sl-logo-gold-${uid}`;

  const field = [
    [8, 16],
    [14, 68],
    [22, 28],
    [31, 86],
    [38, 12],
    [47, 54],
    [58, 22],
    [67, 78],
    [76, 14],
    [84, 48],
    [91, 82],
    [11, 42],
    [93, 24],
    [5, 88],
    [72, 62],
  ] as const;

  return (
    <div
      className={cn("relative isolate h-full w-full overflow-hidden bg-[#06101F]", className)}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(58,110,210,0.32),transparent_55%),radial-gradient(ellipse_at_18%_12%,rgba(88,52,160,0.2),transparent_42%),linear-gradient(168deg,#071428_0%,#0A1630_50%,#08101F_100%)]" />
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-[42%] size-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3A6ED2]/20 blur-3xl",
          !reducedMotion && "blog-cover-drift",
        )}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 225"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={goldId} x1="18%" y1="8%" x2="82%" y2="92%">
            <stop offset="0%" stopColor="#F0E0B0" />
            <stop offset="45%" stopColor={GOLD} />
            <stop offset="100%" stopColor="#A88848" />
          </linearGradient>
          <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {field.map(([x, y], i) => (
          <circle
            key={`${x}-${y}`}
            cx={(x / 100) * 400}
            cy={(y / 100) * 225}
            r={i % 4 === 0 ? 1.1 : 0.55}
            fill={i % 5 === 0 ? "#B8DCFF" : "#F4F7FF"}
            opacity={i % 3 === 0 ? 0.8 : 0.35}
          />
        ))}

        <g transform="translate(200 100)">
          <circle r="58" fill="none" stroke={`url(#${goldId})`} strokeWidth="1.25" />
          <circle r="44" fill="none" stroke={GOLD} strokeOpacity="0.45" strokeWidth="0.7" />

          {[0, 90, 180, 270].map((deg) => (
            <line
              key={deg}
              x1="0"
              y1="-58"
              x2="0"
              y2="-51"
              stroke={GOLD}
              strokeWidth="1.1"
              strokeLinecap="round"
              transform={`rotate(${deg})`}
            />
          ))}

          {/* Original 4-point star — the lens looking at a star */}
          <g filter={`url(#${glowId})`}>
            <path
              d="M0 -28 L5 -5 L28 0 L5 5 L0 28 L-5 5 L-28 0 L-5 -5 Z"
              fill="#9FD0FF"
              fillOpacity="0.18"
              stroke={`url(#${goldId})`}
              strokeWidth="1.35"
              strokeLinejoin="round"
            />
            <circle r="10" fill="#5BA8FF" opacity="0.22" />
            <circle r="4.2" fill="#CDE8FF" opacity="0.7" />
            <circle r="1.8" fill="#FFFFFF" />
          </g>
        </g>
      </svg>

      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#06101F] to-transparent" />
      {showTitle ? (
        <p
          className="absolute bottom-4 left-4 font-display text-sm font-semibold uppercase tracking-[0.22em] sm:bottom-5 sm:left-5 sm:text-base"
          style={{ color: GOLD }}
        >
          {title}
        </p>
      ) : null}
    </div>
  );
}
