"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/demos/taskflow/utils";

export function ProgressBar({
  value,
  className,
  color,
}: {
  value: number;
  className?: string;
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-1.5 overflow-hidden rounded-full bg-subtle-strong", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: color ?? "var(--accent)" }}
        initial={{ width: 0 }}
        whileInView={{ width: `${clamped}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
