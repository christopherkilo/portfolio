"use client";

import { useState } from "react";
import { Button } from "@/components/demos/taskflow/ui/Button";
import { TaskflowApiError } from "@/lib/demos/taskflow/api/client";
import {
  useCreateComment,
  useDeleteComment,
  useTaskComments,
  useUpdateComment,
} from "@/lib/demos/taskflow/queries";
import { formatRelativeTime } from "@/lib/demos/taskflow/utils";

function authorLabel(
  author:
    | { display_name?: string; email?: string | null }
    | null
    | undefined,
) {
  return author?.display_name?.trim() || author?.email?.trim() || "Member";
}

function authorInitials(
  author:
    | { display_name?: string; email?: string | null }
    | null
    | undefined,
) {
  const source =
    author?.display_name?.trim() || author?.email?.trim() || "TF";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function TaskComments({
  taskId,
  workspaceId,
  currentUserId,
  canComment,
}: {
  taskId: string;
  workspaceId: string;
  currentUserId: string | null;
  canComment: boolean;
}) {
  const comments = useTaskComments(taskId);
  const createComment = useCreateComment(taskId, workspaceId);
  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId, workspaceId);

  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [error, setError] = useState("");
  const [pendingNote, setPendingNote] = useState("");

  async function submitNew() {
    const next = body.trim();
    if (!next || !canComment) return;
    setError("");
    try {
      const { isConnectionOffline } = await import(
        "@/lib/demos/taskflow/offline/safeMutations"
      );
      if (isConnectionOffline()) {
        const { enqueueMutation } = await import(
          "@/lib/demos/taskflow/offline/mutationQueue"
        );
        const { useTaskflowUiStore } = await import(
          "@/lib/demos/taskflow/store"
        );
        await enqueueMutation({
          type: "comment_create",
          entityId: taskId,
          workspaceId,
          payload: { body: next },
        });
        const { listQueuedMutations, computeOfflineQueueCounts } = await import(
          "@/lib/demos/taskflow/offline/mutationQueue"
        );
        const items = await listQueuedMutations();
        useTaskflowUiStore
          .getState()
          .setOfflineQueueCounts(computeOfflineQueueCounts(items));
        setBody("");
        setError("");
        setPendingNote("Comment saved as pending — will send when online.");
        return;
      }
      await createComment.mutateAsync(next);
      setBody("");
      setPendingNote("");
    } catch (err) {
      setError(
        err instanceof TaskflowApiError
          ? err.message
          : "Couldn’t add comment.",
      );
    }
  }

  async function submitEdit(commentId: string) {
    const next = editBody.trim();
    if (!next) return;
    setError("");
    try {
      await updateComment.mutateAsync({ commentId, body: next });
      setEditingId(null);
      setEditBody("");
    } catch (err) {
      setError(
        err instanceof TaskflowApiError
          ? err.message
          : "Couldn’t update comment.",
      );
    }
  }

  async function remove(commentId: string) {
    setError("");
    try {
      await deleteComment.mutateAsync(commentId);
      if (editingId === commentId) {
        setEditingId(null);
        setEditBody("");
      }
    } catch (err) {
      setError(
        err instanceof TaskflowApiError
          ? err.message
          : "Couldn’t delete comment.",
      );
    }
  }

  if (comments.isLoading) {
    return (
      <div className="rounded-lg border border-border bg-elevated/30 px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Comments
        </p>
        <p className="mt-2 text-xs text-muted" role="status">
          Loading comments…
        </p>
      </div>
    );
  }

  if (comments.isError) {
    const message =
      comments.error instanceof TaskflowApiError
        ? comments.error.message
        : "Couldn’t load comments.";
    return (
      <div className="rounded-lg border border-border bg-elevated/30 px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Comments
        </p>
        <p className="mt-2 text-xs text-danger" role="alert">
          {message}
        </p>
        <div className="mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void comments.refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const items = comments.data ?? [];

  return (
    <div className="space-y-3 rounded-lg border border-border bg-elevated/30 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Comments
      </p>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center">
          <p className="text-xs font-medium text-ink">No comments yet</p>
          <p className="mt-1 text-xs text-muted">
            Start the discussion for this task.
          </p>
        </div>
      ) : (
        <ul className="space-y-2" data-density-list>
          {items.map((comment) => {
            const isOwn = Boolean(
              currentUserId && comment.author_id === currentUserId,
            );
            const name = authorLabel(comment.author);
            const initials = authorInitials(comment.author);
            const isEditing = editingId === comment.id;

            return (
              <li
                key={comment.id}
                className="rounded-lg border border-border bg-surface/60 px-3 py-2"
              >
                <div className="flex items-start gap-2">
                  <span
                    className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent"
                    aria-hidden
                  >
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-xs font-medium text-ink">{name}</p>
                      <time
                        className="text-[11px] text-muted"
                        dateTime={comment.created_at}
                      >
                        {formatRelativeTime(comment.created_at)}
                      </time>
                    </div>

                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={editBody}
                          onChange={(event) => setEditBody(event.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink"
                          aria-label="Edit comment"
                        />
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingId(null);
                              setEditBody("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={
                              updateComment.isPending || !editBody.trim()
                            }
                            onClick={() => void submitEdit(comment.id)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                        {comment.body}
                      </p>
                    )}

                    {isOwn && !isEditing ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="text-[11px] font-medium text-accent hover:underline"
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditBody(comment.body);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-[11px] font-medium text-danger hover:underline"
                          disabled={deleteComment.isPending}
                          onClick={() => void remove(comment.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canComment ? (
        <div className="space-y-2 border-t border-border pt-3">
          <label className="block text-xs text-muted">
            Add a comment
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={3}
              placeholder="Share an update…"
              className="mt-1 w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink"
            />
          </label>
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              disabled={createComment.isPending || !body.trim()}
              onClick={() => void submitNew()}
            >
              {createComment.isPending ? "Posting…" : "Post comment"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted">
          Viewers can read comments but cannot post.
        </p>
      )}

      {pendingNote ? (
        <p role="status" className="text-xs text-amber-700 dark:text-amber-300">
          {pendingNote} <span className="font-medium">Pending</span>
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
