"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

const CUSTOM_CURSOR_CLASS = "has-custom-cursor";

function subscribeMedia(query: string, onChange: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function subscribeCursorCapability(onChange: () => void) {
  const unsubFine = subscribeMedia("(pointer: fine)", onChange);
  const unsubHover = subscribeMedia("(hover: hover)", onChange);
  const unsubWide = subscribeMedia("(min-width: 768px)", onChange);
  return () => {
    unsubFine();
    unsubHover();
    unsubWide();
  };
}

function getCursorCapable() {
  return (
    window.matchMedia("(pointer: fine)").matches &&
    window.matchMedia("(hover: hover)").matches &&
    window.matchMedia("(min-width: 768px)").matches
  );
}

function getServerCursorCapable() {
  return false;
}

function disarmCustomCursor() {
  document.documentElement.classList.remove(CUSTOM_CURSOR_CLASS);
}

export function CustomCursor() {
  const reducedMotion = useReducedMotion();
  const capable = useSyncExternalStore(
    subscribeCursorCapability,
    getCursorCapable,
    getServerCursorCapable,
  );
  const enabled = capable && !reducedMotion;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 500, damping: 35, mass: 0.35 });
  const springY = useSpring(y, { stiffness: 500, damping: 35, mass: 0.35 });
  const [hovering, setHovering] = useState(false);
  const hoveringRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      disarmCustomCursor();
      return;
    }

    let armed = false;
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
      if (!armed) {
        armed = true;
        document.documentElement.classList.add(CUSTOM_CURSOR_CLASS);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      disarmCustomCursor();
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90]"
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
