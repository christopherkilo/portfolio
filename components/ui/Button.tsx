"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonTransition, springHover } from "@/lib/animation";
import { cn } from "@/lib/utils";
import { Shimmer } from "@/components/ui/Shimmer";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-white text-[#0a0a0a] hover:bg-primary hover:shadow-[0_0_28px_-6px_var(--glow-yellow)]",
  secondary:
    "border border-white/10 bg-white/[0.04] text-secondary hover:border-white/20 hover:bg-white/[0.07] hover:text-text",
  ghost: "bg-transparent text-text hover:bg-white/5",
  outline:
    "border border-white/12 bg-transparent text-text hover:border-primary/50 hover:text-primary",
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
  /** Reserved for GitHub / signature interactions */
  shimmer?: boolean;
};

function ButtonShell({
  classes,
  ariaLabel,
  children,
  href,
  external,
  type,
  onClick,
  disabled,
  shimmer,
}: {
  classes: string;
  ariaLabel?: string;
  children: React.ReactNode;
  href?: string;
  external?: boolean;
  type: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  shimmer?: boolean;
}) {
  const content = (
    <span className="relative z-[1] inline-flex items-center gap-2 [&_svg]:transition-transform [&_svg]:duration-200 group-hover/btn:[&_svg]:translate-x-0.5">
      {children}
    </span>
  );

  const inner = href ? (
    external ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(classes, "group/btn")}
        aria-label={ariaLabel}
      >
        {content}
      </a>
    ) : (
      <Link href={href} className={cn(classes, "group/btn")} aria-label={ariaLabel}>
        {content}
      </Link>
    )
  ) : (
    <button
      type={type}
      className={cn(classes, "group/btn")}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );

  if (shimmer) {
    return <Shimmer className="inline-flex rounded-2xl">{inner}</Shimmer>;
  }

  return inner;
}

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
  shimmer,
}: ButtonProps) {
  const isGithub =
    shimmer ?? Boolean(href?.includes("github.com"));

  const classes = cn(
    "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl font-semibold transition-[colors,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

  return (
    <motion.div
      className="inline-flex"
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.96, y: 1 }}
      transition={href ? springHover : buttonTransition}
    >
      <ButtonShell
        classes={classes}
        ariaLabel={ariaLabel}
        href={href}
        external={external}
        type={type}
        onClick={onClick}
        disabled={disabled}
        shimmer={isGithub}
      >
        {children}
      </ButtonShell>
    </motion.div>
  );
}
