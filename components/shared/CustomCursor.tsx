"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

function subscribeFinePointer(onChange: () => void) {
  const mq = window.matchMedia("(pointer: fine)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getFinePointer() {
  return window.matchMedia("(pointer: fine)").matches;
}

function getServerFinePointer() {
  return false;
}

export function CustomCursor() {
  const reducedMotion = useReducedMotion();
  const finePointer = useSyncExternalStore(
    subscribeFinePointer,
    getFinePointer,
    getServerFinePointer,
  );
  const enabled = finePointer && !reducedMotion;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 500, damping: 35, mass: 0.35 });
  const springY = useSpring(y, { stiffness: 500, damping: 35, mass: 0.35 });
  const [hovering, setHovering] = useState(false);
  const hoveringRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const interactive = Boolean(
        target?.closest("a, button, input, textarea, [role='button']"),
      );
      const offset = interactive ? 18 : 8;
      x.set(e.clientX - offset);
      y.set(e.clientY - offset);
      if (hoveringRef.current !== interactive) {
        hoveringRef.current = interactive;
        setHovering(interactive);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90] hidden md:block"
      style={{ x: springX, y: springY }}
      animate={{
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
