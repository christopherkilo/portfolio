"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/demos/taskflow/data";
import { cn } from "@/lib/demos/taskflow/utils";

const icons: Record<string, LucideIcon> = {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Users,
  Settings,
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[var(--sidebar)] flex-col border-r border-border bg-surface">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <span className="inline-flex size-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-bg">
          TF
        </span>
        <Link href="/demos/taskflow/dashboard" className="font-display text-sm font-semibold tracking-tight">
          TaskFlow
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Sidebar">
        {NAV_ITEMS.map((item) => {
          const Icon = icons[item.icon];
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:bg-subtle hover:text-ink",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <p className="text-xs text-muted">Workspace</p>
        <p className="mt-1 text-sm font-medium">Nova Labs</p>
      </div>
    </aside>
  );
}
