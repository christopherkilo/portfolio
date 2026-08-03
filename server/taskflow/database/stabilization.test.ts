import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  ActiveInvitationExistsError,
  DuplicateAssignmentError,
  InvalidAssigneeError,
  InvalidWorkspaceRelationshipError,
  NotificationCreationDeniedError,
  OwnerRemovalForbiddenError,
} from "@/server/taskflow/errors";
import { createTaskSchema } from "@/server/taskflow/schemas";

const root = process.cwd();

describe("TaskFlow stabilization migration", () => {
  it("locks down notifications and adds assignment workspace_id", () => {
    const path = join(
      root,
      "supabase/migrations/20260802180000_taskflow_stabilization.sql",
    );
    expect(existsSync(path)).toBe(true);
    const sql = readFileSync(path, "utf8");
    expect(sql).toContain("drop policy if exists notifications_insert_actor");
    expect(sql).toContain("create_taskflow_notification");
    expect(sql).toContain("reject_immutable_comment_columns");
    expect(sql).toContain("reject_immutable_notification_columns");
    expect(sql).toContain("task_assignees");
    expect(sql).toContain("workspace_id");
    expect(sql).toContain("create_task_with_assignees");
    expect(sql).toContain("create_workspace_invitation");
    expect(sql).toContain("ACTIVE_INVITATION_EXISTS");
    expect(sql).toContain("sync_task_primary_assignee");
  });
});

describe("TaskFlow stabilization error model", () => {
  it("maps relationship and assignment failures", () => {
    expect(new InvalidAssigneeError().status).toBe(422);
    expect(new InvalidWorkspaceRelationshipError().status).toBe(422);
    expect(new DuplicateAssignmentError().status).toBe(409);
    expect(new ActiveInvitationExistsError().status).toBe(409);
    expect(new NotificationCreationDeniedError().status).toBe(403);
    expect(new OwnerRemovalForbiddenError().status).toBe(403);
  });
});

describe("TaskFlow assignment schema", () => {
  it("accepts multi-assignee create payloads", () => {
    const parsed = createTaskSchema.parse({
      workspaceId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      projectId: "ffffffff-eeee-4ddd-8ccc-bbbbbbbbbbbb",
      title: "Ship",
      assigneeIds: [
        "11111111-2222-4333-8444-555555555555",
        "66666666-7777-4888-8999-aaaaaaaaaaaa",
      ],
    });
    expect(parsed.assigneeIds).toHaveLength(2);
  });
});

describe("TaskFlow REST collaboration routes", () => {
  it("exposes assignee, member, and invitation mutations", () => {
    const routes = [
      "app/api/taskflow/tasks/[taskId]/assignees/[userId]/route.ts",
      "app/api/taskflow/workspaces/[workspaceId]/members/[userId]/route.ts",
      "app/api/taskflow/workspaces/[workspaceId]/invitations/[invitationId]/route.ts",
    ];
    for (const route of routes) {
      const source = readFileSync(join(root, route), "utf8");
      expect(source).toMatch(/export async function (DELETE|PATCH)/);
    }
  });
});

describe("TaskFlow repository separation", () => {
  it("keeps TaskAssigneeRepository in its own module", () => {
    expect(
      existsSync(
        join(root, "server/taskflow/repositories/taskAssigneeRepository.ts"),
      ),
    ).toBe(true);
    const comments = readFileSync(
      join(root, "server/taskflow/repositories/commentRepository.ts"),
      "utf8",
    );
    expect(comments).not.toContain("class TaskAssigneeRepository");
  });
});

describe("TaskFlow realtime assignment scoping", () => {
  it("filters task_assignees by workspace_id", () => {
    const manager = readFileSync(
      join(root, "lib/demos/taskflow/realtime/RealtimeManager.ts"),
      "utf8",
    );
    const channel = readFileSync(
      join(root, "lib/demos/taskflow/realtime/workspaceChannel.ts"),
      "utf8",
    );
    expect(channel).toContain("task_assignees");
    expect(manager).toContain("workspace_id=eq.${workspaceId}");
  });
});

describe("TaskFlow notification RPC path", () => {
  it("creates notifications through controlled RPC only", () => {
    const repo = readFileSync(
      join(root, "server/taskflow/repositories/notificationRepository.ts"),
      "utf8",
    );
    expect(repo).toContain("create_or_group_notification");
    expect(repo).toContain("createViaRpc");
    expect(repo).not.toMatch(/\.from\("notifications"\)\s*\.insert/);
  });
});
