import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

describe("TaskFlow RLS assumptions (migration source)", () => {
  it("enables RLS and role-aware policies on core tables", () => {
    const path = join(
      root,
      "supabase/migrations/20260802120000_taskflow_phase1.sql",
    );
    expect(existsSync(path)).toBe(true);
    const sql = readFileSync(path, "utf8");

    for (const table of [
      "profiles",
      "workspaces",
      "workspace_members",
      "projects",
      "tasks",
      "activity_events",
    ]) {
      expect(sql).toMatch(
        new RegExp(`enable row level security.*${table}|${table}[\\s\\S]*enable row level security`, "i"),
      );
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }

    expect(sql).toMatch(/viewer|member|admin|owner/i);
    expect(sql).toContain("workspace_members");
  });
});
