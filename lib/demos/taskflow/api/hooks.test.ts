import { describe, expect, it } from "vitest";
import { taskflowKeys } from "@/lib/demos/taskflow/api/hooks";

describe("TaskFlow React Query keys", () => {
  it("scopes workspace collections by id", () => {
    expect(taskflowKeys.projects("w1")).toEqual([
      "taskflow",
      "projects",
      "w1",
    ]);
    expect(taskflowKeys.tasks("w1")).toEqual(["taskflow", "tasks", "w1"]);
    expect(taskflowKeys.activity("w1")).toEqual([
      "taskflow",
      "activity",
      "w1",
    ]);
    expect(taskflowKeys.me).toEqual(["taskflow", "me"]);
  });
});
