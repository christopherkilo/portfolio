"use client";

import { cn } from "@/lib/demos/event-horizon/utils";
import { EventHorizonMark } from "@/components/demos/event-horizon/brand/EventHorizonMark";

type LockupSize = "sm" | "md" | "lg";

const typeSize: Record<LockupSize, string> = {
  sm: "text-sm tracking-[0.12em]",
  md: "text-[0.95rem] tracking-[0.14em] sm:text-lg",
  lg: "text-xl tracking-[0.16em] sm:text-2xl",
};

/**
 * Detail level for the O-mark.
 * Sized above surrounding caps so the accretion ring stays legible at nav scale.
 */
const markDetail: Record<LockupSize, "xs" | "sm" | "md"> = {
  sm: "md",
  md: "md",
  lg: "md",
};

type EventHorizonLockupProps = {
  className?: string;
  size?: LockupSize;
  animate?: boolean;
};

/**
 * Wordmark — black-hole mark replaces the letter O in Horizon.
 * EVENT H[●]RIZON
 */
export function EventHorizonLockup({
  className,
  size = "md",
  animate = true,
}: EventHorizonLockupProps) {
  return (
    <span
      className={cn(
        "eh-lockup group inline-flex max-w-full items-center justify-center",
        className,
      )}
      aria-label="Event Horizon"
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex select-none items-center whitespace-nowrap font-display font-bold uppercase leading-none text-ink",
          typeSize[size],
        )}
      >
        <span>Event H</span>
        <span
          className={cn(
            "eh-lockup-o inline-flex shrink-0 items-center justify-center self-center overflow-visible",
            /* ~50% larger than prior 0.86em; slightly proud of surrounding caps */
            size === "sm" && "mx-[0.045em] h-[1.28em] w-[1.28em]",
            size === "md" && "mx-[0.05em] h-[1.3em] w-[1.3em]",
            size === "lg" && "mx-[0.055em] h-[1.32em] w-[1.32em]",
          )}
        >
          <EventHorizonMark
            decorative
            animate={animate}
            size={markDetail[size]}
            className="!size-full drop-shadow-[0_0_7px_rgba(255,140,43,0.32)]"
          />
        </span>
        <span>rizon</span>
      </span>
    </span>
  );
}
