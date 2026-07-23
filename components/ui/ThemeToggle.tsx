"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  showLabel = false,
  className,
}: {
  showLabel?: boolean;
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "light" ? "dark" : "light";
  const label = `Switch to ${next} mode`;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 text-muted backdrop-blur-xl transition hover:border-white/20 hover:text-text",
        showLabel && "w-full justify-start px-3",
        className,
      )}
      aria-label={label}
      title={label}
    >
      <Sun className="theme-icon-light size-4" aria-hidden />
      <Moon className="theme-icon-dark size-4" aria-hidden />
      {showLabel ? (
        <span className="text-sm font-medium">Switch to {next} theme</span>
      ) : null}
    </button>
  );
}
