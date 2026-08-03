"use client";

import { useQuery } from "@tanstack/react-query";
import { taskflowFetch } from "@/lib/demos/taskflow/api/client";
import type { ActivityEventRow } from "@/server/taskflow/types/database";
import { formatRelativeTime } from "@/lib/demos/taskflow/utils";

function describeChange(event: ActivityEventRow) {
  const changes = event.changes ?? {};
  const keys = Object.keys(changes);
  if (keys.length) {
    return keys
      .map((key) => {
        const value = changes[key];
        if (value && typeof value === "object" && "from" in (value as object)) {
          const v = value as { from?: unknown; to?: unknown };
          return `${key}: ${String(v.from ?? "—")} → ${String(v.to ?? "—")}`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      })
      .join(" · ");
  }
  return event.summary;
}

export function TaskHistoryPanel({ taskId }: { taskId: string }) {
  const history = useQuery({
    queryKey: ["taskflow", "task-history", taskId],
    queryFn: () =>
      taskflowFetch<ActivityEventRow[]>(
        `/api/taskflow/tasks/${taskId}/history`,
      ),
  });

  const items = history.data ?? [];

  return (
    <section aria-labelledby="tf-history-heading">
      <h3
        id="tf-history-heading"
        className="text-xs font-semibold uppercase tracking-wider text-muted"
      >
        History
      </h3>
      {history.isLoading ? (
        <p className="mt-2 text-xs text-muted">Loading history…</p>
      ) : items.length === 0 ? (
        <p className="mt-2 text-xs text-muted">No history for this task yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.slice(0, 12).map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border bg-elevated/40 px-3 py-2 text-xs"
            >
              <p className="font-medium text-ink">{item.action}</p>
              <p className="mt-0.5 text-muted">{describeChange(item)}</p>
              <p className="mt-1 text-[11px] text-muted">
                {formatRelativeTime(item.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
