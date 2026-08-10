"use client";

import { useId } from "react";

/**
 * Kilo Toolkit mark — diagnostic gauge on a blue field.
 */
export function KiloToolkitMark({
  className,
  size = "sm",
  title = "Kilo Toolkit",
  decorative = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  title?: string;
  decorative?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const fieldId = `kt-mark-field-${uid}`;
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
        <linearGradient id={fieldId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="55%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#60A5FA" />
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

      {/* Gauge track + needle */}
      <circle
        cx="16"
        cy="17"
        r="9.5"
        fill="none"
        stroke="#1E3A8A"
        strokeWidth="3.2"
      />
      <path
        d="M16 7.5a9.5 9.5 0 0 1 8.2 14"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="17" r="1.6" fill="#93C5FD" />
      <path
        d="M16 17 L21.5 11.2"
        stroke="#93C5FD"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}
