import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

describe("TaskFlow Phase 3 migration", () => {
  it("adds versioning, attachments, prefs, grouping, and versioned RPCs", () => {
    const path = join(
      root,
      "supabase/migrations/20260802190000_taskflow_phase3.sql",
    );
    expect(existsSync(path)).toBe(true);
    const sql = readFileSync(path, "utf8");

    expect(sql).toContain("add column if not exists version bigint");
    expect(sql).toContain("create table if not exists public.task_attachments");
    expect(sql).toContain(
      "alter table public.task_attachments enable row level security",
    );
    expect(sql).toContain("update_task_versioned");
    expect(sql).toContain("update_project_versioned");
    expect(sql).toContain("create_or_group_notification");
    expect(sql).toContain(
      "create table if not exists public.notification_preferences",
    );
    expect(sql).toContain("add column if not exists changes jsonb");
    expect(sql).toContain("add column if not exists group_key");
    expect(sql).toContain("occurrence_count");
  });
});

describe("TaskFlow Phase 3 service modules", () => {
  it("keeps focused Phase 3 service modules", () => {
    for (const file of [
      "server/taskflow/services/attachmentService.ts",
      "server/taskflow/services/auditService.ts",
      "server/taskflow/services/notificationPreferenceService.ts",
    ]) {
      expect(existsSync(join(root, file))).toBe(true);
    }
  });
});
