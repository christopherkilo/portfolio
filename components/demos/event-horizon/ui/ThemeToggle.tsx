"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/demos/event-horizon/ThemeContext";
import { cn } from "@/lib/demos/event-horizon/utils";

export function ThemeToggle({
  showLabel = false,
  className,
}: {
  showLabel?: boolean;
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const label = "Toggle color theme";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface/70 px-2.5 text-muted transition-colors hover:bg-surface-elevated hover:text-ink",
        showLabel && "w-full justify-start px-3",
        className,
      )}
      aria-label={label}
      title={label}
    >
      <Sun className="theme-icon-light size-4" aria-hidden />
      <Moon className="theme-icon-dark size-4" aria-hidden />
      {showLabel ? (
        <span className="text-sm font-medium">
          Switch to {theme === "light" ? "dark" : "light"} theme
        </span>
      ) : null}
    </button>
  );
}
