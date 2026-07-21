"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function CustomCursor() {
  const reducedMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    setEnabled(fine && !reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement | null;
      const interactive = Boolean(
        target?.closest("a, button, input, textarea, [role='button']"),
      );
      setHovering(interactive);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90] hidden md:block"
      animate={{
        x: pos.x - (hovering ? 18 : 8),
        y: pos.y - (hovering ? 18 : 8),
        width: hovering ? 36 : 16,
        height: hovering ? 36 : 16,
        opacity: hovering ? 0.7 : 0.4,
      }}
      transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.35 }}
    >
      <div
        className={`size-full rounded-full border ${
          hovering
            ? "border-primary/70 bg-primary/10 shadow-[0_0_14px_var(--glow-yellow)]"
            : "border-white/40 bg-white/5"
        }`}
      />
    </motion.div>
  );
}
