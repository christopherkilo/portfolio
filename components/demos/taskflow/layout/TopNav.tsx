"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  Command,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { ConnectionIndicator } from "@/components/demos/taskflow/collaboration/ConnectionIndicator";
import { PresenceAvatars } from "@/components/demos/taskflow/collaboration/PresenceAvatars";
import { Button } from "@/components/demos/taskflow/ui/Button";
import { Tooltip } from "@/components/demos/taskflow/ui/Tooltip";
import { useTaskflowMe } from "@/lib/demos/taskflow/api/hooks";
import { createTaskflowBrowserClient } from "@/lib/demos/taskflow/supabase/browser";
import { DEMO_BASE } from "@/lib/demos/taskflow/data";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/demos/taskflow/queries";
import { cn, formatRelativeTime } from "@/lib/demos/taskflow/utils";

type Theme = "light" | "dark";

function initialsFromName(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.trim() || "TF";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function TopNav({
  title,
  onOpenCommand,
  onOpenMobile,
}: {
  title: string;
  onOpenCommand: () => void;
  onOpenMobile: () => void;
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const me = useTaskflowMe();
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = notifications.data ?? [];
  const unreadCount = items.filter((item) => !item.read_at).length;

  const displayName =
    me.data?.profile.display_name || me.data?.email || "TaskFlow user";
  const avatar = initialsFromName(me.data?.profile.display_name, me.data?.email);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = (nextTheme: Theme) => {
      root.dataset.theme = nextTheme;
      root.style.colorScheme = nextTheme;
      setTheme(nextTheme);
    };
    const readStoredTheme = () => {
      try {
        const stored = localStorage.getItem("taskflow-theme");
        return stored === "light" || stored === "dark" ? stored : null;
      } catch {
        return null;
      }
    };
    const current =
      root.dataset.theme === "light" || root.dataset.theme === "dark"
        ? root.dataset.theme
        : media.matches
          ? "dark"
          : "light";
    applyTheme(current);

    const onSystemChange = (event: MediaQueryListEvent) => {
      if (!readStoredTheme()) applyTheme(event.matches ? "dark" : "light");
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "taskflow-theme") return;
      applyTheme(
        event.newValue === "light" || event.newValue === "dark"
          ? event.newValue
          : media.matches
            ? "dark"
            : "light",
      );
    };
    media.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;
    const close = (event: KeyboardEvent | MouseEvent) => {
      if (
        event instanceof KeyboardEvent &&
        event.key !== "Escape"
      ) return;
      if (
        event instanceof MouseEvent &&
        notificationsRef.current?.contains(event.target as Node)
      ) return;
      setNotificationsOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("mousedown", close);
    };
  }, [notificationsOpen]);

  const themeLabel =
    theme === null
      ? "Toggle light or dark mode"
      : theme === "light"
        ? "Switch to dark mode"
        : "Switch to light mode";

  function toggleTheme() {
    const current =
      theme ??
      (document.documentElement.dataset.theme === "light" ? "light" : "dark");
    const nextTheme: Theme = current === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    try {
      localStorage.setItem("taskflow-theme", nextTheme);
    } catch {
      // The theme still applies for this session when storage is unavailable.
    }
    setTheme(nextTheme);
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createTaskflowBrowserClient();
      await supabase.auth.signOut();
      window.location.href = `${DEMO_BASE}/signin`;
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border bg-bg/85 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border lg:hidden"
          aria-label="Open sidebar"
          onClick={onOpenMobile}
        >
          <Menu className="size-4" />
        </button>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
            TaskFlow
          </p>
          <h1 className="font-display text-sm font-semibold sm:text-base">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <PresenceAvatars />
        <ConnectionIndicator />
        <button
          type="button"
          onClick={onOpenCommand}
          className="inline-flex size-11 items-center justify-center gap-2 rounded-lg border border-border bg-elevated text-xs text-muted transition hover:text-ink md:h-9 md:w-auto md:px-3"
          aria-label="Open command palette"
        >
          <Search className="size-3.5" aria-hidden />
          <span className="hidden md:inline">Search</span>
          <kbd className="ml-2 hidden items-center gap-0.5 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] md:inline-flex">
            <Command className="size-2.5" aria-hidden />K
          </kbd>
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={themeLabel}
          title={themeLabel}
        >
          <Sun className="theme-icon theme-icon-light size-4" aria-hidden />
          <Moon className="theme-icon theme-icon-dark size-4" aria-hidden />
        </Button>
        <div ref={notificationsRef} className="relative">
          <Tooltip content="Notifications">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((value) => !value)}
            >
              <Bell className="size-4" />
              {unreadCount ? (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger" />
              ) : null}
            </Button>
          </Tooltip>
          {notificationsOpen ? (
            <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-3 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Notifications</p>
                <button
                  type="button"
                  onClick={() => void markAllRead.mutateAsync()}
                  disabled={!unreadCount || markAllRead.isPending}
                  className="inline-flex items-center gap-1 rounded-md px-2 text-xs text-accent hover:bg-accent/10 disabled:opacity-50"
                >
                  <Check className="size-3.5" aria-hidden /> Mark all read
                </button>
              </div>

              {notifications.isLoading ? (
                <p className="mt-3 text-xs text-muted" role="status">
                  Loading…
                </p>
              ) : notifications.isError ? (
                <p className="mt-3 text-xs text-danger" role="alert">
                  Couldn’t load notifications.
                </p>
              ) : items.length === 0 ? (
                <div className="mt-3 rounded-lg border border-dashed border-border px-3 py-6 text-center">
                  <p className="text-xs font-medium text-ink">You’re all caught up</p>
                  <p className="mt-1 text-xs text-muted">
                    New mentions and assignments will show up here.
                  </p>
                </div>
              ) : (
                <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
                  {items.map((item) => {
                    const href =
                      item.entity_type === "task" && item.entity_id
                        ? `${DEMO_BASE}/tasks?task=${encodeURIComponent(item.entity_id)}`
                        : null;
                    const unread = !item.read_at;
                    const content = (
                      <>
                        <p className="text-sm font-medium text-ink">
                          {item.occurrence_count > 1
                            ? `${item.occurrence_count}× ${item.title}`
                            : item.title}
                        </p>
                        {item.message ? (
                          <p className="mt-0.5 text-xs text-muted">{item.message}</p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-muted">
                          {formatRelativeTime(
                            item.last_occurred_at || item.created_at,
                          )}
                        </p>
                      </>
                    );

                    return (
                      <li key={item.id}>
                        {href ? (
                          <Link
                            href={href}
                            className={cn(
                              "block rounded-lg p-3 transition hover:bg-subtle/70",
                              unread ? "bg-accent/10" : "bg-elevated",
                            )}
                            onClick={() => {
                              if (unread) void markRead.mutateAsync(item.id);
                              setNotificationsOpen(false);
                            }}
                          >
                            {content}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className={cn(
                              "w-full rounded-lg p-3 text-left transition hover:bg-subtle/70",
                              unread ? "bg-accent/10" : "bg-elevated",
                            )}
                            onClick={() => {
                              if (unread) void markRead.mutateAsync(item.id);
                            }}
                          >
                            {content}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              <p role="status" className="mt-2 text-xs text-muted">
                {unreadCount
                  ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                  : "You’re all caught up."}
              </p>
            </div>
          ) : null}
        </div>
        <Tooltip content={displayName}>
          <div
            className="hidden size-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent sm:inline-flex"
            aria-label={`Current user ${displayName}`}
          >
            {avatar}
          </div>
        </Tooltip>
        <Tooltip content="Sign out">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
          >
            <LogOut className="size-4" />
          </Button>
        </Tooltip>
      </div>
    </header>
  );
}
