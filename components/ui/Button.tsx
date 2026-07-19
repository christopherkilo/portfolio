"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonTransition, springHover } from "@/lib/animation";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-[0_0_0_1px_rgba(124,58,237,0.4),0_10px_30px_-12px_var(--glow-primary)] hover:brightness-110",
  secondary:
    "bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25",
  ghost: "bg-transparent text-text hover:bg-white/5",
  outline:
    "border border-border bg-transparent text-text hover:border-primary/50 hover:bg-primary/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  href?: string;
  external?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  external,
  type = "button",
  onClick,
  disabled,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

  if (href) {
    if (external) {
      return (
        <motion.a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={springHover}
          aria-label={ariaLabel}
        >
          {children}
        </motion.a>
      );
    }

    return (
      <motion.div
        className="inline-flex"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={springHover}
      >
        <Link href={href} className={classes} aria-label={ariaLabel}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={buttonTransition}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </motion.button>
  );
}
