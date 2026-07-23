"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { NAV_ITEMS, PROJECTS, TASKS } from "@/lib/demos/taskflow/data";
import { cn } from "@/lib/demos/taskflow/utils";

type Item = { id: string; label: string; hint?: string; href: string };

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const nav = NAV_ITEMS.map((n) => ({
      id: `nav-${n.href}`,
      label: n.label,
      hint: "Navigate",
      href: n.href,
    }));
    const projects = PROJECTS.map((p) => ({
      id: `proj-${p.id}`,
      label: p.name,
      hint: "Project",
      href: `/demos/taskflow/projects?project=${p.id}`,
    }));
    const tasks = TASKS.slice(0, 8).map((t) => ({
      id: `task-${t.id}`,
      label: t.title,
      hint: "Task",
      href: `/demos/taskflow/tasks?task=${t.id}`,
    }));
    return [...nav, ...projects, ...tasks];
  }, []);

  const filtered = items.filter((item) =>
    `${item.label} ${item.hint}`.toLowerCase().includes(query.toLowerCase()),
  );

  const closePalette = useCallback(() => {
    setQuery("");
    setActive(0);
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) {
          closePalette();
        } else {
          setQuery("");
          setActive(0);
          onOpenChange(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePalette, open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePalette();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && filtered[active]) {
        e.preventDefault();
        router.push(filtered[active].href);
        closePalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, active, closePalette, router]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`command-option-${active}`)?.scrollIntoView({
      block: "nearest",
    });
  }, [active, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-overlay px-4 pt-[15vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePalette}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div
            className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="size-4 text-muted" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Jump to pages, projects, tasks…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                aria-label="Command search"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded="true"
                aria-controls="command-results"
                aria-activedescendant={
                  filtered[active] ? `command-option-${active}` : undefined
                }
              />
            </div>
            <ul
              id="command-results"
              className="max-h-72 overflow-y-auto p-2"
              role="listbox"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted">
                  No results
                </li>
              ) : (
                filtered.map((item, i) => (
                  <li key={item.id}>
                    <button
                      id={`command-option-${i}`}
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                        i === active ? "bg-accent/15 text-ink" : "text-muted hover:bg-subtle",
                      )}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => {
                        router.push(item.href);
                        closePalette();
                      }}
                    >
                      <span className="font-medium text-ink">{item.label}</span>
                      <span className="text-xs text-muted">{item.hint}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
