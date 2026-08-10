"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { TaskflowMark } from "@/components/demos/taskflow/brand/TaskflowMark";
import { NAV_ITEMS } from "@/lib/demos/taskflow/data";
import { useActiveWorkspaceId } from "@/lib/demos/taskflow/api/hooks";
import { cn } from "@/lib/demos/taskflow/utils";

const icons: Record<string, LucideIcon> = {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Users,
  ScrollText,
  Settings,
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { workspace, workspaces, setWorkspaceId, isLoading } =
    useActiveWorkspaceId();

  return (
    <aside className="flex h-full w-[var(--sidebar)] flex-col border-r border-border bg-surface">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <TaskflowMark size="sm" decorative />
        <Link
          href="/demos/taskflow/dashboard"
          className="font-display text-sm font-semibold tracking-tight"
        >
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
        <label htmlFor="taskflow-workspace" className="text-xs text-muted">
          Workspace
        </label>
        {isLoading ? (
          <p className="mt-1 text-sm text-muted">Loading…</p>
        ) : workspaces.length > 1 ? (
          <select
            id="taskflow-workspace"
            className="mt-1 w-full rounded-md border border-border bg-bg px-2 py-1.5 text-sm font-medium text-ink"
            value={workspace?.id ?? ""}
            onChange={(event) => setWorkspaceId(event.target.value || null)}
          >
            {workspaces.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="mt-1 text-sm font-medium">
            {workspace?.name ?? "No workspace"}
          </p>
        )}
      </div>
    </aside>
  );
}
