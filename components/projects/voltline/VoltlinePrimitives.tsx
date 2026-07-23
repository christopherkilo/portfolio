"use client";

import { cn } from "@/lib/utils";

export function AccentBar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-1 w-12 rounded-full bg-[#C8FF3D]", className)}
    />
  );
}

export function SpecLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#B7BCC3]",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-[#C8FF3D]" aria-hidden />
      {children}
    </span>
  );
}

export function ModularFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] p-5",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative">{children}</div>
      <span aria-hidden className="absolute left-3 top-3 size-2 border-l border-t border-[#C8FF3D]/70" />
      <span aria-hidden className="absolute right-3 top-3 size-2 border-r border-t border-[#C8FF3D]/70" />
      <span aria-hidden className="absolute bottom-3 left-3 size-2 border-b border-l border-[#C8FF3D]/70" />
      <span aria-hidden className="absolute bottom-3 right-3 size-2 border-b border-r border-[#C8FF3D]/70" />
    </div>
  );
}

export function SignalLines({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 320 48"
      className={cn("h-10 w-full text-white/20", className)}
    >
      <path
        d="M0 24h70l18-12 24 24 20-16 28 18H320"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M220 24h100" stroke="#C8FF3D" strokeWidth="2" opacity="0.8" />
    </svg>
  );
}

export function DirectionMarker({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6E737A]">
      <span aria-hidden className="h-px w-6 bg-[#C8FF3D]" />
      {label}
      <span aria-hidden className="text-[#C8FF3D]">
        →
      </span>
    </div>
  );
}
