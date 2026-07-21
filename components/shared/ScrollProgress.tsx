"use client";

import { motion, useReducedMotion, useScroll } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[70] h-px overflow-visible bg-white/[0.03]"
      aria-hidden
    >
      <motion.div
        className="relative h-full origin-left bg-primary"
        style={{ scaleX: scrollYProgress }}
      >
        <span className="scroll-progress-edge absolute right-0 top-1/2 h-[3px] w-8 -translate-y-1/2 rounded-full bg-primary/90" />
      </motion.div>
    </div>
  );
}
