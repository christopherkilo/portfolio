"use client";

import { useId } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/demos/event-horizon/utils";

type MarkSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClass: Record<MarkSize, string> = {
  xs: "size-5",
  sm: "size-7",
  md: "size-9",
  lg: "size-12",
  xl: "size-16",
};

export type EventHorizonMarkProps = {
  className?: string;
  title?: string;
  animate?: boolean;
  size?: MarkSize;
  decorative?: boolean;
};

/**
 * Event Horizon mark — refinement of the established identity.
 * Opaque core eclipses; accretion carries subtle brightness variation and slow orbit.
 */
export function EventHorizonMark({
  className,
  title = "Event Horizon",
  animate = false,
  size = "md",
  decorative = false,
}: EventHorizonMarkProps) {
  const uid = useId().replace(/:/g, "");
  const reduced = useReducedMotion();
  const shouldOrbit = animate && !reduced;
  const compact = size === "xs" || size === "sm";

  const discId = `eh-disc-${uid}`;
  const ringId = `eh-ring-${uid}`;
  const lensId = `eh-lens-${uid}`;
  const rimId = `eh-rim-${uid}`;
  const glowId = `eh-glow-${uid}`;

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn(sizeClass[size], "shrink-0 overflow-visible", className)}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      data-eh-mark={size}
    >
      {!decorative ? <title>{title}</title> : null}
      <defs>
        <radialGradient id={discId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" />
          <stop offset="38%" stopColor="#000" />
          <stop offset="46%" stopColor="#FF7A00" stopOpacity="0.4" />
          <stop offset="54%" stopColor="#FF8C2B" stopOpacity="0.92" />
          <stop offset="66%" stopColor="#FFC27A" stopOpacity="0.3" />
          <stop offset="82%" stopColor="#FF8C2B" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>

        {/* Sunset accretion: primary → soft glow */}
        <linearGradient id={ringId} x1="8%" y1="50%" x2="92%" y2="50%">
          <stop offset="0%" stopColor="#C45400" stopOpacity="0.22" />
          <stop offset="20%" stopColor="#FF7A00" stopOpacity="0.5" />
          <stop offset="42%" stopColor="#FF8C2B" stopOpacity="0.85" />
          <stop offset="58%" stopColor="#FFC27A" stopOpacity="0.95" />
          <stop offset="78%" stopColor="#FF8C2B" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#8A4200" stopOpacity="0.18" />
        </linearGradient>

        <radialGradient id={lensId} cx="30%" cy="36%" r="58%">
          <stop offset="0%" stopColor="#FFC27A" stopOpacity="0.18" />
          <stop offset="45%" stopColor="#FF8C2B" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>

        <radialGradient id={rimId} cx="50%" cy="50%" r="50%">
          <stop offset="68%" stopColor="#000" stopOpacity="0" />
          <stop offset="82%" stopColor="#FFC27A" stopOpacity="0.22" />
          <stop offset="90%" stopColor="#FF7A00" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>

        <filter id={glowId} x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation={compact ? 0.6 : 1.05} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {!compact ? (
        <ellipse cx="32" cy="32" rx="29" ry="11.5" fill={`url(#${lensId})`} opacity="0.7" />
      ) : null}

      <g>
        {shouldOrbit ? (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 32 32"
            to="360 32 32"
            dur="36s"
            repeatCount="indefinite"
          />
        ) : null}
        <ellipse cx="32" cy="32" rx="26" ry="9.5" fill={`url(#${discId})`} />
        <ellipse
          cx="32"
          cy="32"
          rx="22.5"
          ry="7.2"
          fill="none"
          stroke={`url(#${ringId})`}
          strokeWidth={compact ? 2.2 : 2.6}
          opacity="0.9"
          filter={compact ? undefined : `url(#${glowId})`}
        />
        {!compact ? (
          <>
            <ellipse cx="46" cy="31.2" rx="5.5" ry="1.7" fill="#FFC27A" opacity="0.36" filter={`url(#${glowId})`} />
            <ellipse cx="38" cy="33.4" rx="3.2" ry="1.1" fill="#FFC27A" opacity="0.26" />
            <ellipse cx="19" cy="32.6" rx="4.8" ry="1.5" fill="#C45400" opacity="0.3" />
            <ellipse cx="25" cy="30.8" rx="2.6" ry="0.9" fill="#FF7A00" opacity="0.22" />
          </>
        ) : null}
      </g>

      <circle
        cx="32"
        cy="32"
        r="13.4"
        fill="none"
        stroke="#FFC27A"
        strokeWidth={compact ? 1.35 : 1.1}
        opacity={compact ? 0.9 : 0.72}
        filter={compact ? undefined : `url(#${glowId})`}
      />
      {!compact ? (
        <circle cx="32" cy="32" r="12.55" fill="none" stroke="#FF7A00" strokeWidth="0.55" opacity="0.38" />
      ) : null}

      {!compact ? <circle cx="32" cy="32" r="14.2" fill={`url(#${rimId})`} /> : null}

      <circle cx="32" cy="32" r="11.5" fill="#000000" />
      <circle cx="32" cy="32" r="11.5" fill="none" stroke="#050505" strokeWidth="1.25" />
    </svg>
  );
}
