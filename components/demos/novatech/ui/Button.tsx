"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { buttonTransition, springHover } from "@/lib/demos/novatech/animation";
import { cn } from "@/lib/demos/novatech/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "nt-btn-primary",
  secondary: "nt-btn-success",
  outline: "nt-btn-outline",
  ghost: "bg-transparent text-muted hover:bg-ink/5 hover:text-ink",
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
  const reducedMotion = useReducedMotion();
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[color,background-color,border-color,box-shadow,filter] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

  const hover = reducedMotion ? undefined : { y: -1 };
  const tap = reducedMotion ? undefined : { scale: 0.98 };

  if (href) {
    if (reducedMotion) {
      return (
        <Link href={href} className={classes} aria-label={ariaLabel} onClick={onClick}>
          {children}
        </Link>
      );
    }

    return (
      <motion.div
        className="inline-flex"
        whileHover={hover}
        whileTap={tap}
        transition={springHover}
      >
        <Link href={href} className={classes} aria-label={ariaLabel} onClick={onClick}>
          {children}
        </Link>
      </motion.div>
    );
  }

  if (reducedMotion) {
    return (
      <button
        type={type}
        className={classes}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      whileHover={hover}
      whileTap={tap}
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
