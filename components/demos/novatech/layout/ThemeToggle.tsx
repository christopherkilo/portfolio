"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const STORAGE_KEY = "novatech-theme";
const THEME_EVENT = "novatech-theme-change";

function getCurrentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme, persist = false) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The active theme still works when storage is unavailable.
    }
  }

  window.dispatchEvent(new Event(THEME_EVENT));
}

function hasSavedTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

function subscribe(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemThemeChange = (event: MediaQueryListEvent) => {
    if (hasSavedTheme()) return;
    applyTheme(event.matches ? "dark" : "light");
  };

  window.addEventListener(THEME_EVENT, onStoreChange);
  media.addEventListener("change", onSystemThemeChange);

  return () => {
    window.removeEventListener(THEME_EVENT, onStoreChange);
    media.removeEventListener("change", onSystemThemeChange);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getCurrentTheme, () => "light");

  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${nextTheme} theme`;

  return (
    <button
      type="button"
      className="theme-toggle inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-ink transition-colors hover:border-primary/40 hover:bg-bg"
      aria-label={label}
      title={label}
      onClick={() => {
        applyTheme(nextTheme, true);
      }}
    >
      <Sun className="theme-icon-light size-4.5" aria-hidden />
      <Moon className="theme-icon-dark size-4.5" aria-hidden />
    </button>
  );
}
