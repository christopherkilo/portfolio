import { describe, expect, it } from "vitest";
import {
  createProjectSchema,
  createTaskSchema,
  createWorkspaceSchema,
  updateTaskSchema,
} from "@/server/taskflow/schemas";
import { roleAtLeast } from "@/server/taskflow/auth/roles";
import { normalizeSupabaseUrl } from "@/server/taskflow/supabase/env";
import {
  mapActivity,
  mapProject,
  mapTask,
} from "@/lib/demos/taskflow/api/mappers";

describe("TaskFlow Zod validation", () => {
  it("accepts valid workspace payloads", () => {
    const parsed = createWorkspaceSchema.parse({
      name: "Atlas",
      description: "Primary workspace",
    });
    expect(parsed.name).toBe("Atlas");
  });

  it("rejects empty task titles", () => {
    const result = createTaskSchema.safeParse({
      workspaceId: "11111111-1111-1111-1111-111111111111",
      projectId: "22222222-2222-2222-2222-222222222222",
      title: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("validates task updates", () => {
    const parsed = updateTaskSchema.parse({
      status: "done",
      priority: "high",
      expectedVersion: 1,
    });
    expect(parsed.status).toBe("done");
    expect(parsed.expectedVersion).toBe(1);
  });

  it("rejects task updates without expectedVersion", () => {
    const result = updateTaskSchema.safeParse({
      status: "done",
    });
    expect(result.success).toBe(false);
  });

  it("requires workspaceId for projects", () => {
    const result = createProjectSchema.safeParse({ name: "Launch" });
    expect(result.success).toBe(false);
  });
});

describe("TaskFlow auth role helpers", () => {
  it("ranks roles for RLS assumptions", () => {
    expect(roleAtLeast("owner", "admin")).toBe(true);
    expect(roleAtLeast("member", "admin")).toBe(false);
    expect(roleAtLeast("viewer", "viewer")).toBe(true);
    expect(roleAtLeast("member", "member")).toBe(true);
  });
});

describe("TaskFlow env helpers", () => {
  it("strips /rest/v1 from project URLs", () => {
    expect(
      normalizeSupabaseUrl("https://abc.supabase.co/rest/v1/"),
    ).toBe("https://abc.supabase.co");
  });
});

describe("TaskFlow API mappers", () => {
  it("maps database rows into frontend shapes", () => {
    const project = mapProject({
      id: "p1",
      workspace_id: "w1",
      name: "Atlas",
      description: "desc",
      status: "active",
      color: "#fff",
      due_date: "2026-08-01",
      created_by: "u1",
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-08-01T00:00:00Z",
      archived_at: null,
      version: 1,
    });
    expect(project.name).toBe("Atlas");
    expect(project.dueDate).toBe("2026-08-01");

    const task = mapTask({
      id: "t1",
      workspace_id: "w1",
      project_id: "p1",
      title: "Ship",
      description: "",
      status: "todo",
      priority: "medium",
      assignee_id: "u1",
      due_date: "2026-08-02",
      labels: ["ops"],
      estimate: 2,
      created_by: "u1",
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-08-01T00:00:00Z",
      archived_at: null,
      version: 2,
    });
    expect(task.projectId).toBe("p1");
    expect(task.estimate).toBe(2);
    expect(task.version).toBe(2);

    const activity = mapActivity({
      id: "a1",
      workspace_id: "w1",
      actor_id: "u1",
      action: "created",
      entity_type: "task",
      entity_id: "t1",
      entity_title: "Ship",
      old_value: null,
      new_value: null,
      summary: "created Ship",
      metadata: {},
      changes: {},
      request_id: null,
      source: "api",
      created_at: "2026-08-01T00:00:00Z",
    });
    expect(activity.summary).toBe("created Ship");
  });
});
