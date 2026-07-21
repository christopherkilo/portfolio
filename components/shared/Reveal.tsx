"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp } from "@/lib/animation";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);

  if (reducedMotion) {
    return (
      <div className={className} data-revealed="true">
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={cn("reveal-accents", className)}
      data-revealed={revealed}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay }}
      onAnimationComplete={() => setRevealed(true)}
    >
      {children}
    </motion.div>
  );
}
