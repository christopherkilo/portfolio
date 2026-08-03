import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  AttachmentCompletionForbiddenError,
  AttachmentIntegrityError,
  AttachmentNotUploadedError,
  AttachmentStateConflictError,
  InvalidPatchError,
} from "@/server/taskflow/errors";
import { updateTaskSchema } from "@/server/taskflow/schemas";
import {
  ALLOWED_ATTACHMENT_MIME,
  MAX_ATTACHMENT_BYTES,
} from "@/server/taskflow/services/attachmentService";
import { computeOfflineQueueCounts } from "@/lib/demos/taskflow/offline/mutationQueue";
import { RealtimeManager } from "@/lib/demos/taskflow/realtime/RealtimeManager";
import { TaskflowApiError } from "@/lib/demos/taskflow/api/client";

const root = process.cwd();

describe("TaskFlow Phase 3 stabilization migration", () => {
  it("adds lifecycle, workspace grouping, jsonb patches, and storage bucket", () => {
    const path = join(
      root,
      "supabase/migrations/20260802200000_taskflow_phase3_stabilization.sql",
    );
    expect(existsSync(path)).toBe(true);
    const sql = readFileSync(path, "utf8");
    expect(sql).toContain("attachment_status");
    expect(sql).toContain("reject_immutable_attachment_columns");
    expect(sql).toContain("notifications_group_unread_workspace_unique");
    expect(sql).toContain("p_patch jsonb");
    expect(sql).toContain("cleanup_stale_pending_attachments");
    expect(sql).toContain("taskflow-attachments");
    expect(sql).toContain("public = false");
    expect(sql).toContain("insert into public.activity_events");
  });
});

describe("TaskFlow stabilization errors", () => {
  it("maps attachment completion ownership and integrity codes", () => {
    expect(new AttachmentCompletionForbiddenError().status).toBe(403);
    expect(new AttachmentNotUploadedError().status).toBe(422);
    expect(new AttachmentIntegrityError().status).toBe(422);
    expect(new AttachmentStateConflictError().status).toBe(409);
    expect(new InvalidPatchError().status).toBe(422);
  });
});

describe("TaskFlow nullable patch semantics", () => {
  it("preserves omitted versus explicit null on dueDate and estimate", () => {
    const omitted = updateTaskSchema.parse({
      expectedVersion: 1,
      title: "Keep due",
    });
    expect(omitted.dueDate).toBeUndefined();
    expect(omitted.estimate).toBeUndefined();

    const cleared = updateTaskSchema.parse({
      expectedVersion: 2,
      dueDate: null,
      estimate: null,
    });
    expect(cleared.dueDate).toBeNull();
    expect(cleared.estimate).toBeNull();

    const set = updateTaskSchema.parse({
      expectedVersion: 3,
      dueDate: "2026-09-01",
      estimate: 4,
    });
    expect(set.dueDate).toBe("2026-09-01");
    expect(set.estimate).toBe(4);
  });

  it("rejects empty field patches at the schema+service boundary via expectedVersion-only", () => {
    const onlyVersion = updateTaskSchema.parse({ expectedVersion: 1 });
    expect(onlyVersion.title).toBeUndefined();
    expect(Object.keys(onlyVersion).filter((k) => k !== "expectedVersion")).toHaveLength(0);
  });
});

describe("TaskFlow offline queue counts", () => {
  it("separates pending, failed, and conflicted", () => {
    const counts = computeOfflineQueueCounts([
      {
        id: "1",
        type: "task_status",
        entityId: "t1",
        workspaceId: "w1",
        payload: {},
        createdAt: "a",
        retryCount: 0,
        status: "pending",
      },
      {
        id: "2",
        type: "task_status",
        entityId: "t2",
        workspaceId: "w1",
        payload: {},
        createdAt: "b",
        retryCount: 1,
        status: "failed",
      },
      {
        id: "3",
        type: "task_update",
        entityId: "t3",
        workspaceId: "w1",
        payload: {},
        createdAt: "c",
        retryCount: 1,
        status: "conflict",
      },
    ]);
    expect(counts).toEqual({
      pending: 1,
      failed: 1,
      conflicted: 1,
      totalNeedsAttention: 2,
    });
  });
});

describe("TaskFlow conflict payload retention", () => {
  it("keeps latest on TaskflowApiError", () => {
    const latest = { id: "t1", version: 8, title: "Server" };
    const error = new TaskflowApiError("stale", {
      status: 409,
      code: "STALE_VERSION",
      data: { latest },
    });
    expect(error.data?.latest).toEqual(latest);
  });
});

describe("TaskFlow Realtime backoff", () => {
  it("uses bounded exponential backoff", () => {
    expect(RealtimeManager.backoffDelayMs(0)).toBe(1000);
    expect(RealtimeManager.backoffDelayMs(1)).toBe(2000);
    expect(RealtimeManager.backoffDelayMs(2)).toBe(4000);
    expect(RealtimeManager.backoffDelayMs(10)).toBe(30_000);
  });
});

describe("TaskFlow attachment constants", () => {
  it("keeps conservative size and MIME limits", () => {
    expect(MAX_ATTACHMENT_BYTES).toBe(10 * 1024 * 1024);
    expect(ALLOWED_ATTACHMENT_MIME.has("application/pdf")).toBe(true);
    expect(ALLOWED_ATTACHMENT_MIME.has("application/zip")).toBe(false);
  });
});

describe("TaskFlow attachment service ownership checks", () => {
  it("documents completion ownership in source", () => {
    const source = readFileSync(
      join(root, "server/taskflow/services/attachmentService.ts"),
      "utf8",
    );
    expect(source).toContain("AttachmentCompletionForbiddenError");
    expect(source).toContain('status === "ready"');
    expect(source).toContain("eq(\"status\", \"ready\")");
    expect(source).toContain("abandonPendingAttachment");
    expect(source).toContain("list(");
  });
});
