"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/demos/taskflow/ui/Button";
import {
  downloadAttachment,
  useDeleteAttachment,
  useTaskAttachments,
  useUploadAttachment,
} from "@/lib/demos/taskflow/queries/attachmentQueries";
import { TaskflowApiError } from "@/lib/demos/taskflow/api/client";
import { isConnectionOffline } from "@/lib/demos/taskflow/offline/safeMutations";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskAttachments({
  taskId,
  canEdit,
}: {
  taskId: string;
  canEdit: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const attachments = useTaskAttachments(taskId);
  const upload = useUploadAttachment(taskId);
  const remove = useDeleteAttachment(taskId);
  const [error, setError] = useState("");
  const offline = isConnectionOffline();

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      await upload.mutateAsync(file);
    } catch (err) {
      setError(
        err instanceof TaskflowApiError || err instanceof Error
          ? err.message
          : "Upload failed.",
      );
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const items = attachments.data ?? [];

  return (
    <section aria-labelledby="tf-attachments-heading">
      <div className="flex items-center justify-between gap-2">
        <h3
          id="tf-attachments-heading"
          className="text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Attachments
        </h3>
        {canEdit ? (
          <>
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
              onChange={(e) => void onPick(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={upload.isPending || offline}
              onClick={() => inputRef.current?.click()}
              title={offline ? "Connect to upload files" : undefined}
            >
              {upload.isPending ? "Uploading…" : "Add file"}
            </Button>
          </>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] text-muted">
        PNG, JPEG, WebP, PDF, or plain text · max 10 MB · private storage
      </p>
      {error ? (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {attachments.isLoading ? (
        <p className="mt-2 text-xs text-muted">Loading attachments…</p>
      ) : items.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
          No attachments yet.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-elevated/40 px-3 py-2 text-xs"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{item.file_name}</p>
                <p className="text-muted">
                  {item.mime_type} · {formatBytes(item.size_bytes)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void downloadAttachment(item.id)}
                >
                  Download
                </Button>
                {canEdit ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={remove.isPending || offline}
                    onClick={() => void remove.mutateAsync(item.id)}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
