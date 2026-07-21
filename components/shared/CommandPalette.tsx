"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  FileText,
  FolderKanban,
  Home,
  Mail,
  Search,
  User,
  Wrench,
} from "lucide-react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { projects } from "@/lib/projectData";
import { cn } from "@/lib/utils";

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string;
};

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const iconMap: Record<string, React.ReactNode> = {
  home: <Home className="size-4" />,
  projects: <FolderKanban className="size-4" />,
  lab: <Wrench className="size-4" />,
  about: <User className="size-4" />,
  contact: <Mail className="size-4" />,
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const items = useMemo<CommandItem[]>(() => {
    const navItems: CommandItem[] = NAV_LINKS.map((link) => ({
      id: `nav-${link.id}`,
      label: `Go to ${link.label}`,
      hint: link.href,
      icon: iconMap[link.id] ?? <ArrowUpRight className="size-4" />,
      action: () => router.push(link.href),
      keywords: `${link.label} ${link.href}`,
    }));

    const projectItems: CommandItem[] = projects.slice(0, 5).map((p) => ({
      id: `project-${p.id}`,
      label: p.title,
      hint: "Project",
      icon: <FolderKanban className="size-4" />,
      action: () => router.push(`/projects/${p.id}`),
      keywords: `${p.title} ${p.category} ${p.technologies.join(" ")}`,
    }));

    const actions: CommandItem[] = [
      {
        id: "email",
        label: "Email me",
        hint: SITE.email,
        icon: <Mail className="size-4" />,
        action: () => {
          window.location.href = `mailto:${SITE.email}`;
        },
        keywords: "email contact mail",
      },
      {
        id: "resume",
        label: "Download resume",
        hint: "PDF",
        icon: <FileText className="size-4" />,
        action: () => {
          window.open(SITE.resume, "_blank");
        },
        keywords: "resume cv download",
      },
    ];

    return [...navItems, ...actions, ...projectItems];
  }, [router]);

  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${item.label} ${item.hint ?? ""} ${item.keywords ?? ""}`
      .toLowerCase()
      .includes(q);
  });

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isPalette = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isPalette) {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
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
        filtered[active].action();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, active, onOpenChange]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-bg/70 px-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.18 }}
          onClick={() => onOpenChange(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div
            className="glass w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
            initial={reducedMotion ? false : { opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="size-4 text-muted" aria-hidden />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, projects, actions…"
                className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
                aria-label="Command search"
              />
            </div>
            <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted">
                  No matches
                </li>
              ) : (
                filtered.map((item, i) => (
                  <li key={item.id} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                        i === active
                          ? "bg-white/[0.08] text-text ring-1 ring-primary/40"
                          : "text-muted hover:bg-white/5 hover:text-text",
                      )}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => {
                        item.action();
                        onOpenChange(false);
                      }}
                    >
                      <span
                        className={cn(
                          "transition-colors",
                          i === active ? "text-primary" : "text-secondary",
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1 font-medium text-text">
                        {item.label}
                      </span>
                      {item.hint ? (
                        <span className="text-xs text-muted">{item.hint}</span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
            <div className="border-t border-border px-4 py-2 text-[11px] text-muted">
              ↑↓ navigate · Enter select · Esc close
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
