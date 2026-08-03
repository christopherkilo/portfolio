import { describe, expect, it } from "vitest";
import { PROJECTS, TASKS, TEAM } from "@/lib/demos/taskflow/data";
import {
  busiestMember,
  dashboardInsights,
  memberWorkloadStats,
  projectHealth,
  workloadLabel,
} from "@/lib/demos/taskflow/store/selectors";
import {
  formatActivityMessage,
  taskDiffActivities,
  taskMovedActivity,
} from "@/lib/demos/taskflow/store/activity";
import {
  matchesDueFilter,
  normalizeDueFilter,
  normalizePriority,
  normalizeStatus,
  normalizeViewMode,
} from "@/lib/demos/taskflow/url-state";
import { SHORTCUT_LIST } from "@/lib/demos/taskflow/shortcuts-catalog";

describe("TaskFlow productivity selectors", () => {
  it("derives project health from live tasks", () => {
    const project = PROJECTS[0];
    const health = projectHealth(project, TASKS);
    expect(health.total).toBeGreaterThan(0);
    expect(health.completion).toBeGreaterThanOrEqual(0);
    expect(health.completion).toBeLessThanOrEqual(100);
    expect(health.completed + health.active + health.backlog).toBeLessThanOrEqual(
      health.total + health.blocked,
    );
  });

  it("labels member workload from open assignments", () => {
    expect(workloadLabel(1)).toBe("Light");
    expect(workloadLabel(4)).toBe("Normal");
    expect(workloadLabel(7)).toBe("Busy");
    expect(workloadLabel(12)).toBe("Overloaded");

    const stats = memberWorkloadStats(TASKS, TEAM[0]);
    expect(stats.assigned).toBe(stats.completed + stats.active);
    expect(["Light", "Normal", "Busy", "Overloaded"]).toContain(stats.label);
  });

  it("builds dashboard insights from workspace facts", () => {
    const insights = dashboardInsights(TASKS, PROJECTS, TEAM, []);
    expect(insights).toHaveProperty("overdue");
    expect(insights).toHaveProperty("completedToday");
    expect(insights.busiestMember?.name).toBeTruthy();
    expect(busiestMember(TASKS, TEAM)?.member.id).toBeTruthy();
  });
});

describe("TaskFlow rich activity", () => {
  it("describes status moves with old and new values", () => {
    const draft = taskMovedActivity(
      "u1",
      TASKS[0],
      "backlog",
      "in-progress",
    );
    expect(draft.oldValue).toBe("Backlog");
    expect(draft.newValue).toBe("In Progress");
    expect(draft.summary).toContain("from Backlog to In Progress");
  });

  it("emits field-level diffs for edits", () => {
    const before = TASKS[0];
    const after = {
      ...before,
      priority: "urgent" as const,
      assigneeId: "u1",
    };
    const entries = taskDiffActivities("u1", before, after, TEAM);
    expect(entries.some((entry) => entry.action === "priority-changed")).toBe(
      true,
    );
    expect(entries.some((entry) => entry.action === "assigned")).toBe(true);
    expect(formatActivityMessage({ ...entries[0], id: "x", timestamp: "" })).toBeTruthy();
  });
});

describe("TaskFlow URL filters", () => {
  it("normalizes invalid filter values", () => {
    expect(normalizeViewMode("kanban")).toBe("board");
    expect(normalizeStatus("nope")).toBe("all");
    expect(normalizePriority("critical")).toBe("all");
    expect(normalizeDueFilter("yesterday")).toBe("any");
  });

  it("matches due filters", () => {
    expect(matchesDueFilter("2026-07-30", "todo", "today", "2026-07-30")).toBe(
      true,
    );
    expect(matchesDueFilter("2026-07-01", "todo", "overdue", "2026-07-30")).toBe(
      true,
    );
    expect(matchesDueFilter("2026-08-01", "done", "overdue", "2026-07-30")).toBe(
      false,
    );
    expect(matchesDueFilter("", "todo", "overdue", "2026-07-30")).toBe(false);
  });
});

describe("TaskFlow shortcuts catalog", () => {
  it("documents core productivity shortcuts", () => {
    const keys = SHORTCUT_LIST.map((item) => item.keys as string);
    expect(keys).toContain("T");
    expect(keys).toContain("/");
    expect(keys).toContain("?");
    expect(keys).toContain("G then D");
  });
});
