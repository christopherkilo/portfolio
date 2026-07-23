"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { springHover } from "@/lib/demos/event-horizon/animation";
import { cn } from "@/lib/demos/event-horizon/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-strong",
  secondary: "bg-warm text-on-warm hover:brightness-110",
  outline:
    "border border-border bg-transparent text-ink hover:border-accent/50 hover:bg-accent/10",
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
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50",
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
