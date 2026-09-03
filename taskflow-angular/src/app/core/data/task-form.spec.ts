import { FormBuilder } from "@angular/forms";
import {
  buildTaskForm,
  seedTaskDraft,
  taskFormToWriteBody,
} from "./task-form";
import { sampleMember, sampleProject, sampleTask } from "../../testing/data-stubs";

describe("task form helpers", () => {
  const fb = new FormBuilder();

  it("seeds create defaults without mutating the source task", () => {
    const original = { ...sampleTask, labels: [...sampleTask.labels] };
    const seed = seedTaskDraft(sampleTask, [sampleProject], [sampleMember]);
    seed.title = "changed";
    seed.labels.push("extra");
    expect(original.title).toBe("Write launch checklist");
    expect(original.labels).toEqual(["launch"]);
  });

  it("requires a title and blocks invalid submission", () => {
    const form = buildTaskForm(
      fb,
      seedTaskDraft(null, [sampleProject], [sampleMember]),
    );
    form.controls.title.setValue("  ");
    expect(form.invalid).toBe(true);
    expect(taskFormToWriteBody(form)).toBeNull();
  });

  it("builds the write payload matching the API contract", () => {
    const form = buildTaskForm(
      fb,
      seedTaskDraft(null, [sampleProject], [sampleMember]),
    );
    form.controls.title.setValue("Ship checklist");
    const body = taskFormToWriteBody(form);
    expect(body).toEqual({
      title: "Ship checklist",
      description: "",
      status: "backlog",
      priority: "medium",
      projectId: "p1",
      assigneeId: "user-1",
      dueDate: body?.dueDate,
      labels: [],
      estimate: null,
    });
    expect(body && "expectedVersion" in body).toBe(false);
    expect(body && "workspaceId" in body).toBe(false);
    expect(body && "assigneeIds" in body).toBe(false);
  });
});
