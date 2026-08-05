"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { gravityTap, springHover } from "@/lib/demos/event-horizon/animation";
import { cn } from "@/lib/demos/event-horizon/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "eh-btn-primary",
  secondary: "eh-btn-secondary",
  outline:
    "border border-border bg-transparent text-ink hover:border-accent/50 hover:bg-accent/10 hover:text-accent hover:shadow-[0_0_20px_-10px_rgba(255,140,43,0.4)]",
  ghost: "bg-transparent text-muted hover:bg-surface-elevated hover:text-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "size-10",
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
  "aria-pressed"?: boolean;
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
  "aria-pressed": ariaPressed,
}: ButtonProps) {
  const reduced = useReducedMotion();
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[color,background,border-color,box-shadow,filter,transform] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

  const hoverMotion = reduced ? undefined : { y: -1, scale: 1.01 };
  const tapMotion = reduced ? undefined : gravityTap;

  if (href) {
    return (
      <motion.div
        className="inline-flex"
        whileHover={hoverMotion}
        whileTap={tapMotion}
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
      whileHover={hoverMotion}
      whileTap={tapMotion}
      transition={springHover}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
    >
      {children}
    </motion.button>
  );
}
