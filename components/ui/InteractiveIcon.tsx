"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springHover } from "@/lib/animation";

type InteractiveIconProps = {
  children: React.ReactNode;
  className?: string;
};

/** White at rest → electric yellow + micro-shift on hover/focus */
export function InteractiveIcon({ children, className }: InteractiveIconProps) {
  return (
    <motion.span
      className={cn(
        "inline-flex text-text/80 transition-colors duration-200 group-hover:text-primary group-focus-within:text-primary",
        className,
      )}
      whileHover={{ x: 2, y: -1, rotate: -2 }}
      transition={springHover}
    >
      {children}
    </motion.span>
  );
}
