"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_BASE } from "@/lib/demos/taskflow/data";

export { SHORTCUT_LIST } from "@/lib/demos/taskflow/shortcuts-catalog";

export type ShortcutHandlers = {
  onNewTask?: () => void;
  onOpenCommand?: () => void;
  onOpenShortcuts?: () => void;
  enabled?: boolean;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function useTaskflowShortcuts({
  onNewTask,
  onOpenCommand,
  onOpenShortcuts,
  enabled = true,
}: ShortcutHandlers) {
  const router = useRouter();
  const chord = useRef<string | null>(null);
  const chordTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const key = event.key;

      if (key === "?" || (event.shiftKey && key === "/")) {
        event.preventDefault();
        onOpenShortcuts?.();
        return;
      }

      if (key === "/") {
        event.preventDefault();
        onOpenCommand?.();
        return;
      }

      if (chord.current === "g") {
        chord.current = null;
        if (chordTimer.current) window.clearTimeout(chordTimer.current);
        const map: Record<string, string> = {
          d: `${DEMO_BASE}/dashboard`,
          c: `${DEMO_BASE}/calendar`,
          t: `${DEMO_BASE}/tasks`,
          p: `${DEMO_BASE}/projects`,
        };
        const href = map[key.toLowerCase()];
        if (href) {
          event.preventDefault();
          router.push(href);
        }
        return;
      }

      if (key.toLowerCase() === "g") {
        chord.current = "g";
        if (chordTimer.current) window.clearTimeout(chordTimer.current);
        chordTimer.current = window.setTimeout(() => {
          chord.current = null;
        }, 1000);
        return;
      }

      if (key.toLowerCase() === "t") {
        event.preventDefault();
        onNewTask?.();
        return;
      }

      if (key.toLowerCase() === "p") {
        event.preventDefault();
        router.push(`${DEMO_BASE}/projects`);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (chordTimer.current) window.clearTimeout(chordTimer.current);
    };
  }, [onNewTask, onOpenCommand, onOpenShortcuts, router, enabled]);
}

export function useCompletionBurst() {
  const [burst, setBurst] = useState(false);
  const timer = useRef<number | null>(null);

  function celebrate() {
    if (typeof window !== "undefined") {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduced) return;
    }
    setBurst(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBurst(false), 900);
  }

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return { burst, celebrate };
}
