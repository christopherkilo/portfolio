"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { taskflowFetch, TaskflowApiError } from "@/lib/demos/taskflow/api/client";
import { useActiveWorkspaceId } from "@/lib/demos/taskflow/api/hooks";
import type { ActivityEventRow } from "@/server/taskflow/types/database";
import { formatRelativeTime } from "@/lib/demos/taskflow/utils";
import { Button } from "@/components/demos/taskflow/ui/Button";

export function AuditView() {
  const { workspaceId } = useActiveWorkspaceId();
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");

  const query = useQuery({
    queryKey: ["taskflow", "audit", workspaceId, entityType, action],
    enabled: Boolean(workspaceId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (entityType) params.set("entityType", entityType);
      if (action) params.set("action", action);
      const qs = params.toString();
      return taskflowFetch<ActivityEventRow[]>(
        `/api/taskflow/workspaces/${workspaceId}/audit${qs ? `?${qs}` : ""}`,
      );
    },
    retry: false,
  });

  const denied =
    query.error instanceof TaskflowApiError &&
    (query.error.status === 403 || query.error.code === "AUDIT_ACCESS_DENIED");

  const items = useMemo(() => query.data ?? [], [query.data]);

  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-display text-xl font-semibold">Workspace audit</h2>
        <p className="mt-1 text-sm text-muted">
          Append-only history for admins and owners. Ordinary members cannot
          rewrite these records.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <label className="text-xs text-muted">
          Entity
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="ml-2 h-9 rounded-lg border border-border bg-elevated px-2 text-sm text-ink"
          >
            <option value="">All</option>
            <option value="task">Task</option>
            <option value="project">Project</option>
            <option value="member">Member</option>
            <option value="workspace">Workspace</option>
          </select>
        </label>
        <label className="text-xs text-muted">
          Action
          <input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="e.g. updated"
            className="ml-2 h-9 rounded-lg border border-border bg-elevated px-2 text-sm text-ink"
          />
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void query.refetch()}
        >
          Refresh
        </Button>
      </div>

      {denied ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          Audit history is limited to workspace admins and owners.
        </p>
      ) : query.isLoading ? (
        <p className="text-sm text-muted">Loading audit events…</p>
      ) : query.isError ? (
        <p className="text-sm text-danger" role="alert">
          Couldn’t load audit history.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">No matching audit events.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">
                  {item.action}{" "}
                  <span className="text-muted">
                    · {item.entity_type}
                    {item.entity_title ? ` · ${item.entity_title}` : ""}
                  </span>
                </p>
                <p className="text-xs text-muted">
                  {formatRelativeTime(item.created_at)}
                </p>
              </div>
              <p className="mt-1 text-xs text-muted">{item.summary}</p>
              {item.changes && Object.keys(item.changes).length > 0 ? (
                <pre className="mt-2 max-h-28 overflow-auto rounded-lg bg-elevated/60 p-2 text-[11px] text-muted">
                  {JSON.stringify(item.changes, null, 2)}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
