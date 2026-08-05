"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/demos/event-horizon/utils";
import { EventHorizonMark } from "@/components/demos/event-horizon/brand/EventHorizonMark";

type GravityLoaderProps = {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const markSize = {
  sm: "sm" as const,
  md: "md" as const,
  lg: "xl" as const,
};

export function GravityLoader({
  label = "Loading",
  className,
  size = "md",
}: GravityLoaderProps) {
  const reduced = useReducedMotion();

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-4", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <motion.div
        className="relative"
        animate={reduced ? undefined : { scale: [1, 0.97, 1] }}
        transition={
          reduced ? undefined : { duration: 2.2, ease: "easeInOut", repeat: Infinity }
        }
      >
        <EventHorizonMark animate size={markSize[size]} title={label} />
      </motion.div>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
