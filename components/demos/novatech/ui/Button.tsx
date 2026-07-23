"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonTransition, springHover } from "@/lib/demos/novatech/animation";
import { cn } from "@/lib/demos/novatech/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-contrast shadow-sm hover:bg-primary-dark",
  secondary:
    "bg-accent text-primary-contrast shadow-sm hover:brightness-110",
  outline:
    "border border-border bg-surface text-ink hover:border-primary/40 hover:bg-primary/5",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
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
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-expanded"?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  type = "button",
  onClick,
  disabled,
  "aria-label": ariaLabel,
  "aria-expanded": ariaExpanded,
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

  if (href) {
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
      aria-expanded={ariaExpanded}
    >
      {children}
    </motion.button>
  );
}
