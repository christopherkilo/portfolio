"use client";

import { cn } from "@/lib/utils";

export function NightFrame({
  children,
  className,
  accent = "#34E8FF",
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[#07070C] p-5",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(237,237,242,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(237,237,242,.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <span
        aria-hidden
        className="absolute left-0 top-0 h-px w-16"
        style={{ backgroundColor: accent }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function MonoLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] uppercase tracking-[0.22em] text-[#9AA0B5]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function QRPlaceholder({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid grid-cols-5 gap-0.5 rounded-md bg-[#EDEDF2] p-1.5",
        className,
      )}
    >
      {Array.from({ length: 25 }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "aspect-square rounded-[1px]",
            [0, 1, 2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 19, 20, 22, 23, 24].includes(
              index,
            )
              ? "bg-[#07070C]"
              : "bg-transparent",
          )}
        />
      ))}
    </div>
  );
}
