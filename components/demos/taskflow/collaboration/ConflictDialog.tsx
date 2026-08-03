"use client";

import { Button } from "@/components/demos/taskflow/ui/Button";
import { Modal } from "@/components/demos/taskflow/ui/Modal";
import { useTaskflowUiStore } from "@/lib/demos/taskflow/store";
import {
  computeOfflineQueueCounts,
  listQueuedMutations,
  removeQueuedMutation,
} from "@/lib/demos/taskflow/offline/mutationQueue";
import { replayQueuedMutations } from "@/lib/demos/taskflow/offline/replay";

export function ConflictDialog() {
  const conflict = useTaskflowUiStore((s) => s.conflictDraft);
  const setConflictDraft = useTaskflowUiStore((s) => s.setConflictDraft);
  const setOfflineQueueCounts = useTaskflowUiStore(
    (s) => s.setOfflineQueueCounts,
  );

  if (!conflict) return null;

  const latest = conflict.latest as Record<string, unknown> | null;
  const latestTitle =
    (latest?.title as string | undefined) ||
    (latest?.name as string | undefined) ||
    "Updated item";

  async function syncCounts() {
    const remaining = await listQueuedMutations();
    setOfflineQueueCounts(computeOfflineQueueCounts(remaining));
  }

  async function discardQueued() {
    if (conflict?.queuedMutationId) {
      await removeQueuedMutation(conflict.queuedMutationId);
    } else {
      const items = await listQueuedMutations();
      const match = items.find(
        (i) => i.entityId === conflict!.entityId && i.status === "conflict",
      );
      if (match) await removeQueuedMutation(match.id);
    }
    await syncCounts();
    setConflictDraft(null);
    void replayQueuedMutations();
  }

  return (
    <Modal
      open={Boolean(conflict)}
      onClose={() => setConflictDraft(null)}
      title="Someone else changed this"
    >
      <div className="space-y-4 text-sm">
        <p className="text-muted">
          {conflict.message ||
            "This item changed while you were editing. Your draft is still available below."}
        </p>
        <div className="rounded-lg border border-border bg-elevated/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Latest on server
          </p>
          <p className="mt-1 font-medium">{latestTitle}</p>
          {latest?.description != null ? (
            <p className="mt-1 text-xs text-muted line-clamp-3">
              {String(latest.description)}
            </p>
          ) : null}
          {typeof conflict.latestVersion === "number" ||
          typeof latest?.version === "number" ? (
            <p className="mt-2 text-[11px] text-muted">
              Version{" "}
              {conflict.latestVersion ??
                (latest?.version as number | undefined)}
              {typeof conflict.expectedVersion === "number"
                ? ` · your draft expected ${conflict.expectedVersion}`
                : null}
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Your unsaved draft
          </p>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-ink">
            {JSON.stringify(conflict.draft, null, 2)}
          </pre>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => void discardQueued()}>
            Discard draft
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setConflictDraft(null);
              window.location.reload();
            }}
          >
            Reload latest
          </Button>
          <Button onClick={() => setConflictDraft(null)}>
            Keep editing draft
          </Button>
        </div>
      </div>
    </Modal>
  );
}
