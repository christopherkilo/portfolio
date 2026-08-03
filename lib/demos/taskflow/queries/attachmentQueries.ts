"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taskflowFetch } from "@/lib/demos/taskflow/api/client";
import type { TaskAttachmentRow } from "@/server/taskflow/types/database";
import {
  ALLOWED_ATTACHMENT_MIME_CLIENT,
  MAX_ATTACHMENT_BYTES_CLIENT,
} from "@/lib/demos/taskflow/attachments/limits";

export function attachmentKeys(taskId: string) {
  return ["taskflow", "attachments", taskId] as const;
}

export function useTaskAttachments(taskId: string | null) {
  return useQuery({
    queryKey: attachmentKeys(taskId ?? ""),
    enabled: Boolean(taskId),
    queryFn: () =>
      taskflowFetch<TaskAttachmentRow[]>(
        `/api/taskflow/tasks/${taskId}/attachments`,
      ),
  });
}

export function useUploadAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!ALLOWED_ATTACHMENT_MIME_CLIENT.has(file.type)) {
        throw new Error("That file type is not allowed.");
      }
      if (file.size > MAX_ATTACHMENT_BYTES_CLIENT) {
        throw new Error("File must be 10 MB or smaller.");
      }
      const initiated = await taskflowFetch<{
        attachment: TaskAttachmentRow;
        upload: { path: string; token: string; signedUrl: string };
      }>(`/api/taskflow/tasks/${taskId}/attachments/initiate`, {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });

      const uploadResponse = await fetch(initiated.upload.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          "x-upsert": "false",
        },
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error("Upload failed. Try again.");
      }

      return taskflowFetch<TaskAttachmentRow>(
        `/api/taskflow/tasks/${taskId}/attachments/complete`,
        {
          method: "POST",
          body: JSON.stringify({ attachmentId: initiated.attachment.id }),
        },
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: attachmentKeys(taskId) });
    },
  });
}

export function useDeleteAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      taskflowFetch<{ id: string }>(
        `/api/taskflow/attachments/${attachmentId}`,
        { method: "DELETE" },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: attachmentKeys(taskId) });
    },
  });
}

export async function downloadAttachment(attachmentId: string) {
  const result = await taskflowFetch<{
    url: string;
    fileName: string;
    expiresInSeconds: number;
  }>(`/api/taskflow/attachments/${attachmentId}/download`);
  window.open(result.url, "_blank", "noopener,noreferrer");
}
