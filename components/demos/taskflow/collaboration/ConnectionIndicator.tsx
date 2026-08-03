"use client";

import { useTaskflowUiStore } from "@/lib/demos/taskflow/store";
import { cn } from "@/lib/demos/taskflow/utils";

const LABELS: Record<string, string> = {
  online: "Online",
  connected: "Online",
  connecting: "Connecting",
  reconnecting: "Reconnecting",
  offline: "Offline",
  failed: "Connection failed",
};

export function ConnectionIndicator() {
  const status = useTaskflowUiStore((s) => s.connectionStatus);
  const counts = useTaskflowUiStore((s) => s.offlineQueueCounts);
  const label = LABELS[status] ?? status;

  const attention =
    counts.totalNeedsAttention > 0
      ? `${counts.totalNeedsAttention} need attention`
      : null;
  const pending =
    counts.pending > 0 ? `${counts.pending} pending` : null;

  return (
    <div
      className="flex items-center gap-2 text-xs text-muted"
      role="status"
      aria-live="polite"
      title={[label, pending, attention].filter(Boolean).join(" · ")}
    >
      <span
        className={cn(
          "inline-block size-2 rounded-full",
          (status === "online" || status === "connected") && "bg-emerald-500",
          (status === "reconnecting" || status === "connecting") &&
            "bg-amber-400",
          (status === "offline" || status === "failed") && "bg-rose-500",
        )}
        aria-hidden
      />
      <span className="hidden sm:inline">{label}</span>
      {pending ? (
        <span className="hidden md:inline text-muted">· {pending}</span>
      ) : null}
      {attention ? (
        <span className="hidden md:inline text-amber-600 dark:text-amber-400">
          · {attention}
        </span>
      ) : null}
    </div>
  );
}
