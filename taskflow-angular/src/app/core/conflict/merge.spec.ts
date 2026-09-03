import { canSaveDiffs, taskFieldDiffs } from "./merge";
import type { TaskConflictDraft } from "./normalize";

const base: TaskConflictDraft = {
  title: "Deploy Tuesday",
  description: "Ship it",
  status: "todo",
  priority: "medium",
  projectId: "p1",
  dueDate: "2026-12-01",
  estimate: null,
  labels: ["launch"],
  assigneeIds: ["user-1"],
};

describe("task field diffs and default merge", () => {
  it("identifies local-only, server-only, and conflicting fields", () => {
    const local: TaskConflictDraft = {
      ...base,
      title: "Deploy Friday",
      priority: "high",
      labels: ["launch"],
      assigneeIds: ["user-1"],
    };
    const server: TaskConflictDraft = {
      ...base,
      title: "Deploy Wednesday",
      status: "in-progress",
      labels: ["launch"],
      assigneeIds: ["user-1"],
    };
    const diffs = taskFieldDiffs(base, local, server, null, {}, {});
    const byKey = Object.fromEntries(diffs.map((diff) => [diff.key, diff]));
    expect(byKey["title"]?.kind).toBe("CONFLICTING");
    expect(byKey["priority"]?.kind).toBe("LOCAL_ONLY");
    expect(byKey["priority"]?.defaultResolved).toBe("high");
    expect(byKey["status"]?.kind).toBe("SERVER_ONLY");
    expect(byKey["status"]?.defaultResolved).toBe("in-progress");
    expect(byKey["description"]?.kind).toBe("UNCHANGED");
    expect(canSaveDiffs(diffs)).toBe(false);
  });

  it("blocks save until the conflicting field has a choice", () => {
    const local: TaskConflictDraft = { ...base, title: "Mine", labels: [...base.labels], assigneeIds: [...base.assigneeIds] };
    const server: TaskConflictDraft = {
      ...base,
      title: "Theirs",
      labels: [...base.labels],
      assigneeIds: [...base.assigneeIds],
    };
    const unresolved = taskFieldDiffs(base, local, server, null, {}, {});
    expect(canSaveDiffs(unresolved)).toBe(false);
    const resolved = taskFieldDiffs(base, local, server, null, { title: "local" }, {});
    expect(canSaveDiffs(resolved)).toBe(true);
    expect(resolved.find((diff) => diff.key === "title")?.resolved).toBe("Mine");
  });

  it("treats assignee and label set differences as whole-field conflicts, not unions", () => {
    const local: TaskConflictDraft = {
      ...base,
      labels: ["bug", "urgent"],
      assigneeIds: ["user-1", "user-2"],
    };
    const server: TaskConflictDraft = {
      ...base,
      labels: ["bug", "backend"],
      assigneeIds: ["user-1", "user-3"],
    };
    const diffs = taskFieldDiffs(base, local, server, null, {}, {});
    expect(diffs.find((diff) => diff.key === "labels")?.kind).toBe("CONFLICTING");
    expect(diffs.find((diff) => diff.key === "assigneeIds")?.kind).toBe("CONFLICTING");
  });
});
