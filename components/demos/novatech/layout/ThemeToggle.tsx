"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const STORAGE_KEY = "novatech-theme";
const THEME_EVENT = "novatech-theme-change";

function getNovatechRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-demo="novatech"]');
}

function getCurrentTheme(): Theme {
  return getNovatechRoot()?.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme, persist = false) {
  const root = getNovatechRoot();
  if (root) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }

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

function readSavedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
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
  const theme = useSyncExternalStore(subscribe, getCurrentTheme, () => "dark");

  useEffect(() => {
    applyTheme(readSavedTheme() ?? "dark");
  }, []);

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
