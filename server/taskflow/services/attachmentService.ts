import "server-only";

import { randomUUID } from "node:crypto";
import {
  createTaskflowContext,
  requireTaskAccess,
  requireWorkspaceMember,
} from "@/server/taskflow/auth/authorization";
import {
  AttachmentCompletionForbiddenError,
  AttachmentIntegrityError,
  AttachmentNotFoundError,
  AttachmentNotUploadedError,
  AttachmentPermissionDeniedError,
  AttachmentStateConflictError,
  AttachmentTooLargeError,
  AttachmentTypeNotAllowedError,
  StorageUnavailableError,
} from "@/server/taskflow/errors";
import { roleAtLeast } from "@/server/taskflow/auth/roles";
import type { InitiateAttachmentInput } from "@/server/taskflow/schemas";
import { recordActivity } from "@/server/taskflow/services/activityService";
import type { TaskAttachmentRow } from "@/server/taskflow/types/database";

export const ATTACHMENT_BUCKET = "taskflow-attachments";
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
]);
/** Pending uploads older than this may be cleaned (24h). */
export const STALE_PENDING_ATTACHMENT_INTERVAL = "24 hours";

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 180);
}

async function markFailed(attachmentId: string, supabase: Awaited<
  ReturnType<typeof createTaskflowContext>
>["supabase"]) {
  await supabase
    .from("task_attachments")
    .update({
      status: "failed",
      failed_at: new Date().toISOString(),
    })
    .eq("id", attachmentId)
    .eq("status", "pending");
}

export async function listAttachments(taskId: string) {
  const { ctx } = await requireTaskAccess(taskId, "viewer");
  // Opportunistic cleanup of own stale pending rows (best-effort).
  void ctx.supabase.rpc("cleanup_stale_pending_attachments", {
    p_older_than: STALE_PENDING_ATTACHMENT_INTERVAL,
  });

  const { data, error } = await ctx.supabase
    .from("task_attachments")
    .select("*")
    .eq("task_id", taskId)
    .eq("status", "ready")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new StorageUnavailableError();
  return (data ?? []) as TaskAttachmentRow[];
}

export async function initiateAttachment(
  taskId: string,
  input: InitiateAttachmentInput,
) {
  const { ctx, task } = await requireTaskAccess(taskId, "member");

  if (!ALLOWED_ATTACHMENT_MIME.has(input.mimeType)) {
    throw new AttachmentTypeNotAllowedError();
  }
  if (input.sizeBytes > MAX_ATTACHMENT_BYTES) {
    throw new AttachmentTooLargeError();
  }

  void ctx.supabase.rpc("cleanup_stale_pending_attachments", {
    p_older_than: STALE_PENDING_ATTACHMENT_INTERVAL,
  });

  const attachmentId = randomUUID();
  const safeName = sanitizeFileName(input.fileName);
  const storagePath = `${task.workspace_id}/${taskId}/${attachmentId}/${safeName}`;

  const { data: row, error } = await ctx.supabase
    .from("task_attachments")
    .insert({
      id: attachmentId,
      workspace_id: task.workspace_id,
      task_id: taskId,
      uploaded_by: ctx.user.id,
      storage_path: storagePath,
      file_name: input.fileName,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      status: "pending",
    })
    .select("*")
    .single();
  if (error || !row) throw new StorageUnavailableError();

  const { data: signed, error: signError } = await ctx.supabase.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (signError || !signed) {
    await ctx.supabase
      .from("task_attachments")
      .update({
        status: "failed",
        failed_at: new Date().toISOString(),
        deleted_at: new Date().toISOString(),
      })
      .eq("id", attachmentId);
    throw new StorageUnavailableError();
  }

  return {
    attachment: row as TaskAttachmentRow,
    upload: {
      path: storagePath,
      token: signed.token,
      signedUrl: signed.signedUrl,
    },
  };
}

export async function completeAttachment(taskId: string, attachmentId: string) {
  const { ctx, task } = await requireTaskAccess(taskId, "member");
  const { data: row, error } = await ctx.supabase
    .from("task_attachments")
    .select("*")
    .eq("id", attachmentId)
    .eq("task_id", taskId)
    .maybeSingle();
  if (error || !row) throw new AttachmentNotFoundError();

  const attachment = row as TaskAttachmentRow;

  if (attachment.status === "ready") {
    // Idempotent: already complete — do not duplicate audit.
    return attachment;
  }

  if (attachment.status === "failed" || attachment.status === "deleted") {
    throw new AttachmentStateConflictError();
  }

  if (attachment.uploaded_by !== ctx.user.id) {
    throw new AttachmentCompletionForbiddenError();
  }

  if (attachment.status !== "pending") {
    throw new AttachmentStateConflictError();
  }

  const { data: listed, error: listError } = await ctx.supabase.storage
    .from(ATTACHMENT_BUCKET)
    .list(`${attachment.workspace_id}/${taskId}/${attachmentId}`, {
      limit: 20,
    });

  if (listError) {
    await markFailed(attachmentId, ctx.supabase);
    throw new StorageUnavailableError();
  }

  const fileName = attachment.storage_path.split("/").pop() ?? "";
  const object = (listed ?? []).find((item) => item.name === fileName);
  if (!object) {
    await markFailed(attachmentId, ctx.supabase);
    throw new AttachmentNotUploadedError();
  }

  const objectPath = `${attachment.workspace_id}/${taskId}/${attachmentId}/${object.name}`;
  if (objectPath !== attachment.storage_path) {
    await markFailed(attachmentId, ctx.supabase);
    throw new AttachmentIntegrityError();
  }

  const objectSize =
    typeof object.metadata?.size === "number"
      ? object.metadata.size
      : typeof (object as unknown as { size?: number }).size === "number"
        ? (object as unknown as { size: number }).size
        : null;

  if (objectSize != null) {
    if (objectSize <= 0 || objectSize > MAX_ATTACHMENT_BYTES) {
      await markFailed(attachmentId, ctx.supabase);
      throw new AttachmentTooLargeError();
    }
  }

  const objectMime =
    typeof object.metadata?.mimetype === "string"
      ? object.metadata.mimetype
      : typeof object.metadata?.contentType === "string"
        ? object.metadata.contentType
        : null;

  if (objectMime && !ALLOWED_ATTACHMENT_MIME.has(objectMime)) {
    await markFailed(attachmentId, ctx.supabase);
    throw new AttachmentTypeNotAllowedError();
  }

  // Prefer Storage-reported MIME when present; otherwise keep declared MIME if allowlisted.
  if (!ALLOWED_ATTACHMENT_MIME.has(attachment.mime_type)) {
    await markFailed(attachmentId, ctx.supabase);
    throw new AttachmentTypeNotAllowedError();
  }

  const now = new Date().toISOString();
  const { data: ready, error: updateError } = await ctx.supabase
    .from("task_attachments")
    .update({
      status: "ready",
      completed_at: now,
      activity_recorded_at: now,
    })
    .eq("id", attachmentId)
    .eq("status", "pending")
    .eq("uploaded_by", ctx.user.id)
    .select("*")
    .maybeSingle();

  if (updateError) throw new StorageUnavailableError();
  if (!ready) {
    // Race: another completion succeeded
    const { data: again } = await ctx.supabase
      .from("task_attachments")
      .select("*")
      .eq("id", attachmentId)
      .maybeSingle();
    if (again && (again as TaskAttachmentRow).status === "ready") {
      return again as TaskAttachmentRow;
    }
    throw new AttachmentStateConflictError();
  }

  // Only record activity when this caller won the ready transition.
  if (!(ready as TaskAttachmentRow).activity_recorded_at) {
    /* set above */
  }
  try {
    await recordActivity({
      workspaceId: task.workspace_id,
      actorId: ctx.user.id,
      action: "attachment_added",
      entityType: "task",
      entityId: taskId,
      entityTitle: task.title,
      summary: `attached ${ready.file_name}`,
      changes: {
        attachmentId,
        fileName: ready.file_name,
        mimeType: ready.mime_type,
        sizeBytes: ready.size_bytes,
      },
    });
  } catch {
    // Activity is required for ready announcement; leave ready but log.
    console.error("[taskflow-attachment-activity]", { attachmentId });
  }

  return ready as TaskAttachmentRow;
}

/**
 * Admin/owner cleanup of abandoned pending uploads — does not mark ready
 * and does not create attachment_added activity.
 */
export async function abandonPendingAttachment(attachmentId: string) {
  const ctx = await createTaskflowContext();
  const { data: row, error } = await ctx.supabase
    .from("task_attachments")
    .select("*")
    .eq("id", attachmentId)
    .maybeSingle();
  if (error || !row) throw new AttachmentNotFoundError();

  const attachment = row as TaskAttachmentRow;
  const { membership } = await requireWorkspaceMember(
    attachment.workspace_id,
    "admin",
  );
  if (!roleAtLeast(membership.role, "admin")) {
    throw new AttachmentPermissionDeniedError();
  }
  if (attachment.status !== "pending" && attachment.status !== "failed") {
    throw new AttachmentStateConflictError();
  }

  await ctx.supabase
    .from("task_attachments")
    .update({
      status: "failed",
      failed_at: new Date().toISOString(),
      deleted_at: new Date().toISOString(),
    })
    .eq("id", attachmentId);

  await ctx.supabase.storage
    .from(ATTACHMENT_BUCKET)
    .remove([attachment.storage_path]);

  return { id: attachmentId };
}

export async function getAttachmentDownloadUrl(attachmentId: string) {
  const ctx = await createTaskflowContext();
  const { data: row, error } = await ctx.supabase
    .from("task_attachments")
    .select("*")
    .eq("id", attachmentId)
    .eq("status", "ready")
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !row) throw new AttachmentNotFoundError();

  await requireWorkspaceMember(row.workspace_id, "viewer");

  const { data, error: signError } = await ctx.supabase.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(row.storage_path, 60);
  if (signError || !data?.signedUrl) throw new StorageUnavailableError();

  return {
    url: data.signedUrl,
    fileName: row.file_name,
    mimeType: row.mime_type,
    expiresInSeconds: 60,
  };
}

export async function deleteAttachment(attachmentId: string) {
  const ctx = await createTaskflowContext();
  const { data: row, error } = await ctx.supabase
    .from("task_attachments")
    .select("*")
    .eq("id", attachmentId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !row) throw new AttachmentNotFoundError();

  const attachment = row as TaskAttachmentRow;
  const { membership } = await requireWorkspaceMember(
    attachment.workspace_id,
    "member",
  );
  const canDelete =
    attachment.uploaded_by === ctx.user.id ||
    roleAtLeast(membership.role, "admin");
  if (!canDelete) throw new AttachmentPermissionDeniedError();

  await ctx.supabase
    .from("task_attachments")
    .update({
      status: "deleted",
      deleted_at: new Date().toISOString(),
    })
    .eq("id", attachmentId);

  const { error: storageError } = await ctx.supabase.storage
    .from(ATTACHMENT_BUCKET)
    .remove([attachment.storage_path]);
  if (storageError) {
    console.error("[taskflow-attachment-storage]", {
      attachmentId,
      reason: storageError.message,
    });
  }

  if (attachment.status === "ready") {
    await recordActivity({
      workspaceId: attachment.workspace_id,
      actorId: ctx.user.id,
      action: "attachment_removed",
      entityType: "task",
      entityId: attachment.task_id,
      entityTitle: attachment.file_name,
      summary: `removed attachment ${attachment.file_name}`,
      changes: { attachmentId, fileName: attachment.file_name },
    });
  }

  return { id: attachmentId };
}
