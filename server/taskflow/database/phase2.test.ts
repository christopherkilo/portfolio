import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { taskflowKeys } from "@/lib/demos/taskflow/queries/workspaceKeys";

const root = process.cwd();

describe("TaskFlow Phase 2 migration", () => {
  it("adds collaboration tables and RLS", () => {
    const path = join(
      root,
      "supabase/migrations/20260802160000_taskflow_phase2.sql",
    );
    expect(existsSync(path)).toBe(true);
    const sql = readFileSync(path, "utf8");
    for (const table of [
      "task_assignees",
      "comments",
      "workspace_invitations",
      "notifications",
    ]) {
      expect(sql).toContain(`create table if not exists public.${table}`);
      expect(sql).toContain(
        `alter table public.${table} enable row level security`,
      );
    }
    expect(sql).toContain("accept_workspace_invitation");
    expect(sql).toContain("token_hash");
    expect(sql).toContain("dedupe_key");
  });
});

describe("TaskFlow Phase 2 query keys", () => {
  it("scopes collaboration collections", () => {
    expect(taskflowKeys.comments("t1")).toEqual([
      "taskflow",
      "comments",
      "t1",
    ]);
    expect(taskflowKeys.notifications).toEqual(["taskflow", "notifications"]);
    expect(taskflowKeys.invitations("w1")).toEqual([
      "taskflow",
      "invitations",
      "w1",
    ]);
  });
});

describe("TaskFlow service split", () => {
  it("keeps focused service modules", () => {
    for (const file of [
      "server/taskflow/services/workspaceService.ts",
      "server/taskflow/services/projectService.ts",
      "server/taskflow/services/taskService.ts",
      "server/taskflow/services/activityService.ts",
      "server/taskflow/services/memberService.ts",
      "server/taskflow/services/commentService.ts",
      "server/taskflow/services/invitationService.ts",
      "server/taskflow/services/notificationService.ts",
    ]) {
      expect(existsSync(join(root, file))).toBe(true);
    }
  });
});
