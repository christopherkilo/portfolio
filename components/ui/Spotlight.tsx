"use client";

import { useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

type SpotlightProps = {
  children: React.ReactNode;
  className?: string;
  size?: number;
};

export function Spotlight({
  children,
  className,
  size = 280,
}: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const background = useMotionTemplate`radial-gradient(${size}px circle at ${mouseX}px ${mouseY}px, rgba(248,231,28,0.07), transparent 65%)`;

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    mouseX.set(e.clientX - bounds.left);
    mouseY.set(e.clientY - bounds.top);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className={cn("relative overflow-hidden", className)}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{ background, opacity: visible ? 0.55 : 0 }}
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
