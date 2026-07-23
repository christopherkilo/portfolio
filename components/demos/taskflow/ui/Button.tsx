"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { springHover } from "@/lib/demos/taskflow/animation";
import { cn } from "@/lib/demos/taskflow/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-bg hover:bg-accent-strong",
  secondary: "bg-elevated text-ink hover:bg-subtle-strong",
  ghost: "bg-transparent text-muted hover:bg-subtle hover:text-ink",
  outline:
    "border border-border bg-transparent text-ink hover:border-accent/40 hover:bg-accent/10",
  danger: "bg-danger/15 text-danger hover:bg-danger/25",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-10 px-4 text-sm",
  icon: "size-9",
};

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  "aria-label"?: string;
  "aria-expanded"?: boolean;
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
  ...aria
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

  if (href) {
    return (
      <motion.div className="inline-flex" whileTap={{ scale: 0.98 }} transition={springHover}>
        <Link href={href} className={classes} aria-label={aria["aria-label"]}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      whileTap={{ scale: 0.98 }}
      transition={springHover}
      onClick={onClick}
      disabled={disabled}
      {...aria}
    >
      {children}
    </motion.button>
  );
}
