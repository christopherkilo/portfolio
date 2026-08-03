import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("TaskFlow Phase 1 wiring", () => {
  it("loads primary views through React Query hooks", () => {
    const files = [
      "components/demos/taskflow/tasks/TasksView.tsx",
      "components/demos/taskflow/dashboard/DashboardView.tsx",
      "components/demos/taskflow/calendar/CalendarView.tsx",
      "components/demos/taskflow/projects/ProjectsView.tsx",
      "components/demos/taskflow/team/TeamView.tsx",
      "components/demos/taskflow/shared/CommandPalette.tsx",
    ];

    for (const file of files) {
      const source = read(file);
      expect(source).toContain("useWorkspaceData");
      expect(source).not.toMatch(/\bsetTasks\b/);
      expect(source).not.toMatch(/localStorage\.getItem\(["']taskflow-workspace/);
    }
  });

  it("keeps settings on the UI-only Zustand store", () => {
    const settings = read("components/demos/taskflow/settings/SettingsView.tsx");
    expect(settings).toContain("useTaskflowUiStore");
    expect(settings).not.toContain("useWorkspaceData");
  });

  it("keeps task creation validated with Zod", () => {
    const editor = read("components/demos/taskflow/tasks/TaskEditorModal.tsx");
    expect(editor).toContain("taskDraftSchema");
    expect(editor).toContain("useCreateTaskMutation");
    expect(editor).toContain("projectId");
    expect(editor).toContain("assigneeId");
    expect(editor).toContain("priority");
    expect(editor).toContain("estimate");
  });

  it("exposes productivity selectors, shortcuts, and backend docs", () => {
    expect(
      existsSync(join(root, "lib/demos/taskflow/store/selectors/projectSelectors.ts")),
    ).toBe(true);
    expect(
      existsSync(join(root, "lib/demos/taskflow/store/selectors/memberSelectors.ts")),
    ).toBe(true);
    expect(existsSync(join(root, "lib/demos/taskflow/shortcuts.ts"))).toBe(true);
    expect(existsSync(join(root, "TASKFLOW_BACKEND_ARCHITECTURE.md"))).toBe(true);
    expect(existsSync(join(root, "TASKFLOW_DATABASE.md"))).toBe(true);
    expect(existsSync(join(root, "TASKFLOW_AUTHENTICATION.md"))).toBe(true);
    expect(existsSync(join(root, "TASKFLOW_COLLABORATION.md"))).toBe(true);
    expect(existsSync(join(root, "TASKFLOW_REALTIME.md"))).toBe(true);
    expect(existsSync(join(root, "TASKFLOW_PERMISSIONS.md"))).toBe(true);
    expect(existsSync(join(root, "TASKFLOW_INVITATIONS.md"))).toBe(true);
  });
});
