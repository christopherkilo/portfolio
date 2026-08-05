"use client";

import { useId } from "react";

/**
 * NovaTech mark — two strengths converging into one outcome.
 * Twin ribbons meet at center; negative space suggests an “N” without drawing the letter.
 * Minimal, favicon-safe, memorable without the wordmark.
 */
export function NovaTechMark({
  className,
  size = "sm",
  title = "NovaTech Solutions",
  decorative = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  title?: string;
  decorative?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const fieldId = `nt-mark-field-${uid}`;
  const sizeClass = {
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
  }[size];

  return (
    <svg
      viewBox="0 0 32 32"
      className={`${sizeClass} shrink-0 ${className ?? ""}`}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
    >
      {!decorative ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={fieldId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>

      <rect width="32" height="32" rx="8" fill={`url(#${fieldId})`} />

      <rect
        x="2.25"
        y="2.25"
        width="27.5"
        height="27.5"
        rx="6.5"
        fill="none"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="1"
      />

      <path
        d="M10 24.5 C10 24.5 10 12.5 10 9.5 C10 7.8 11.4 7 12.8 7.8 C14.4 8.7 15.2 12.2 16 15.2"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 7.5 C22 7.5 22 19.5 22 22.5 C22 24.2 20.6 25 19.2 24.2 C17.6 23.3 16.8 19.8 16 16.8"
        fill="none"
        stroke="#10B981"
        strokeWidth="2.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="16" cy="16" r="2.85" fill="#14B8A6" />
      <circle cx="16" cy="16" r="1.2" fill="#FFFFFF" />
    </svg>
  );
}
