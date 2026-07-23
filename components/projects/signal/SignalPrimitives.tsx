"use client";

import { cn } from "@/lib/utils";

export function PaperFrame({
  children,
  className,
  ink = false,
}: {
  children: React.ReactNode;
  className?: string;
  ink?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-black/8 shadow-[0_18px_50px_-28px_rgba(18,18,18,0.45)]",
        ink ? "bg-[#121212] text-[#F7F4EF]" : "bg-[#F7F4EF] text-[#121212]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MetaLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A847A]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function GridOverlay({
  visible,
  columns = 12,
  className,
}: {
  visible: boolean;
  columns?: number;
  className?: string;
}) {
  if (!visible) return null;
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-20 grid gap-0 px-[6%] py-[5%]",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <span
          key={index}
          className="border-x border-[#E85D04]/35 bg-[#E85D04]/[0.04]"
        />
      ))}
      <span className="absolute inset-x-[6%] top-[5%] border-t border-[#2F4F8A]/40" />
      <span className="absolute inset-x-[6%] bottom-[5%] border-b border-[#2F4F8A]/40" />
    </div>
  );
}

export function Folio({
  left,
  right,
  className,
}: {
  left: string;
  right: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-x-4 bottom-3 flex justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-[#8A847A]",
        className,
      )}
    >
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

export function BarcodePlaceholder({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("flex h-8 items-end gap-px bg-white p-1", className)}
    >
      {Array.from({ length: 28 }).map((_, index) => (
        <span
          key={index}
          className="bg-[#121212]"
          style={{
            width: index % 5 === 0 ? 2 : 1,
            height: `${40 + ((index * 17) % 60)}%`,
          }}
        />
      ))}
    </div>
  );
}
