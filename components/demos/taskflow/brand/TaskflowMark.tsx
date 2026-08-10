"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type MarkSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClass: Record<MarkSize, string> = {
  xs: "size-5",
  sm: "size-7",
  md: "size-9",
  lg: "size-12",
  xl: "size-16",
};

export type TaskflowMarkProps = {
  className?: string;
  title?: string;
  size?: MarkSize;
  decorative?: boolean;
  /** Flat mark without rounded field — for monochrome contexts. */
  variant?: "field" | "glyph";
};

/**
 * TaskFlow mark — connected milestones on a rising flow path.
 * Communicates workflow, momentum, and collaboration without checklist tropes.
 */
export function TaskflowMark({
  className,
  title = "TaskFlow",
  size = "md",
  decorative = false,
  variant = "field",
}: TaskflowMarkProps) {
  const uid = useId().replace(/:/g, "");
  const fieldId = `tf-field-${uid}`;
  const glowId = `tf-glow-${uid}`;

  return (
    <svg
      viewBox="0 0 32 32"
      className={cn(sizeClass[size], "shrink-0", className)}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
    >
      {!decorative ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={fieldId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="55%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <radialGradient id={glowId} cx="70%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#6EE7B7" stopOpacity="0" />
        </radialGradient>
      </defs>

      {variant === "field" ? (
        <>
          <rect width="32" height="32" rx="8" fill={`url(#${fieldId})`} />
          <rect width="32" height="32" rx="8" fill={`url(#${glowId})`} />
          <rect
            x="1.25"
            y="1.25"
            width="29.5"
            height="29.5"
            rx="6.75"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
          />
        </>
      ) : null}

      {/* Parallel collaboration lane */}
      <path
        d="M6.5 21.5 C11 21.5 12.2 15.8 16 15.8 C19.8 15.8 21 10.2 25.5 10.2"
        fill="none"
        stroke={variant === "field" ? "#6EE7B7" : "#10B981"}
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity={variant === "field" ? 0.72 : 0.55}
      />

      {/* Primary workflow path */}
      <path
        d="M6.5 23.5 C11.5 23.5 12 16 16 16 C20 16 20.5 8.5 25.5 8.5"
        fill="none"
        stroke={variant === "field" ? "#FFFFFF" : "#10B981"}
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Milestone nodes */}
      <circle
        cx="6.5"
        cy="23.5"
        r="2.15"
        fill={variant === "field" ? "#A7F3D0" : "#10B981"}
      />
      <circle
        cx="16"
        cy="16"
        r="2.85"
        fill={variant === "field" ? "#FFFFFF" : "#059669"}
      />
      <circle
        cx="16"
        cy="16"
        r="1.15"
        fill={variant === "field" ? "#10B981" : "#6EE7B7"}
      />
      <circle
        cx="25.5"
        cy="8.5"
        r="2.15"
        fill={variant === "field" ? "#ECFDF5" : "#6EE7B7"}
      />
    </svg>
  );
}
