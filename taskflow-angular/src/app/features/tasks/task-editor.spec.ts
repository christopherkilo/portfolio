import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TaskEditor } from "./task-editor";
import { TaskMutationsService } from "../../core/data/task-mutations";
import { TasksDataService } from "../../core/data/tasks-data";
import { ActivityDataService } from "../../core/data/activity-data";
import { AuthService } from "../../core/auth/auth";
import { WorkspaceContextService } from "../../core/data/workspace-context";
import { MutationQueueService } from "../../core/offline/mutation-queue";
import { ConflictResolutionService } from "../../core/conflict/conflict-resolution";
import { ProjectMutationsService } from "../../core/data/project-mutations";
import { resetAngularOfflineMemory } from "../../core/offline/queue-backend";
import {
  conflictResolutionDeps,
  sampleMember,
  sampleProject,
  sampleTask,
  stubAuth,
  stubProjectMutations,
  stubWorkspaceContext,
} from "../../testing/data-stubs";
import type { TaskRow } from "../../core/api/models";

const row: TaskRow = {
  id: "t1",
  workspace_id: "ws-1",
  project_id: "p1",
  title: "Write launch checklist",
  description: "Cover auth and dashboard",
  status: "todo",
  priority: "high",
  assignee_id: "user-1",
  due_date: "2026-12-01",
  labels: ["launch"],
  estimate: null,
  created_by: "user-1",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  archived_at: null,
  version: 3,
};

describe("TaskEditor", () => {
  let http: HttpTestingController;
  const tasksReload = vi.fn();
  const activityReload = vi.fn();

  async function render(mode: "create" | "edit" = "create") {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TaskEditor],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        TaskMutationsService,
        MutationQueueService,
        ConflictResolutionService,
        ...conflictResolutionDeps(),
        { provide: ProjectMutationsService, useValue: stubProjectMutations() },
        { provide: AuthService, useValue: stubAuth() },
        { provide: WorkspaceContextService, useValue: stubWorkspaceContext() },
        { provide: TasksDataService, useValue: { reload: tasksReload } },
        { provide: ActivityDataService, useValue: { reload: activityReload } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TaskEditor);
    fixture.componentRef.setInput("mode", mode);
    fixture.componentRef.setInput("workspaceId", "ws-1");
    fixture.componentRef.setInput("projects", [sampleProject]);
    fixture.componentRef.setInput("members", [sampleMember]);
    if (mode === "edit") {
      fixture.componentRef.setInput("task", { ...sampleTask, labels: [...sampleTask.labels] });
    }
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    http.verify();
    resetAngularOfflineMemory();
  });

  it("initializes a create form with required validation", async () => {
    const fixture = await render("create");
    const cmp = fixture.componentInstance;
    expect(cmp.form.controls.status.value).toBe("backlog");
    expect(cmp.form.controls.priority.value).toBe("medium");
    expect(cmp.form.controls.projectId.value).toBe("p1");
    cmp.form.controls.title.setValue("");
    expect(cmp.form.invalid).toBe(true);
  });

  it("blocks invalid create submit and does not call the API", async () => {
    const fixture = await render("create");
    fixture.componentInstance.form.controls.title.setValue("");
    await fixture.componentInstance.onSubmit();
    http.expectNone("/api/tasks");
  });

  it("prevents double submit on create", async () => {
    const fixture = await render("create");
    fixture.componentInstance.form.controls.title.setValue("New task");
    const first = fixture.componentInstance.onSubmit();
    const second = fixture.componentInstance.onSubmit();
    const req = http.expectOne("/api/tasks");
    req.flush({ success: true, data: row });
    await Promise.all([first, second]);
    http.verify();
  });

  it("creates with the API contract and reloads tasks", async () => {
    const fixture = await render("create");
    fixture.componentInstance.form.controls.title.setValue("New task");
    const pending = fixture.componentInstance.onSubmit();
    const req = http.expectOne("/api/tasks");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toMatchObject({
      workspaceId: "ws-1",
      title: "New task",
      projectId: "p1",
      assigneeId: "user-1",
      status: "backlog",
      priority: "medium",
    });
    expect(req.request.body).not.toHaveProperty("expectedVersion");
    req.flush({ success: true, data: row });
    await pending;
    expect(tasksReload).toHaveBeenCalled();
    expect(activityReload).toHaveBeenCalled();
  });

  it("initializes edit from the server task without mutating it while typing", async () => {
    const task = { ...sampleTask, labels: [...sampleTask.labels] };
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TaskEditor],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        TaskMutationsService,
        MutationQueueService,
        ConflictResolutionService,
        ...conflictResolutionDeps(),
        { provide: ProjectMutationsService, useValue: stubProjectMutations() },
        { provide: AuthService, useValue: stubAuth() },
        { provide: WorkspaceContextService, useValue: stubWorkspaceContext() },
        { provide: TasksDataService, useValue: { reload: tasksReload } },
        { provide: ActivityDataService, useValue: { reload: activityReload } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TaskEditor);
    fixture.componentRef.setInput("mode", "edit");
    fixture.componentRef.setInput("workspaceId", "ws-1");
    fixture.componentRef.setInput("projects", [sampleProject]);
    fixture.componentRef.setInput("members", [sampleMember]);
    fixture.componentRef.setInput("task", task);
    fixture.detectChanges();
    fixture.componentInstance.form.controls.title.setValue("Local draft");
    expect(task.title).toBe("Write launch checklist");
    expect(fixture.componentInstance.baselineVersion).toBe(3);
  });

  it("PATCHes with the session expectedVersion and reloads on success", async () => {
    const fixture = await render("edit");
    fixture.componentInstance.form.controls.title.setValue("Renamed");
    const pending = fixture.componentInstance.onSubmit();
    const req = http.expectOne("/api/tasks/t1");
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body.expectedVersion).toBe(3);
    expect(req.request.body.title).toBe("Renamed");
    req.flush({ success: true, data: { ...row, title: "Renamed", version: 4 } });
    await pending;
    expect(tasksReload).toHaveBeenCalled();
  });

  it("shows 403 as permission denied", async () => {
    const fixture = await render("edit");
    const pending = fixture.componentInstance.onSubmit();
    http.expectOne("/api/tasks/t1").flush(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "You cannot edit this task.", fieldErrors: {} },
      },
      { status: 403, statusText: "Forbidden" },
    );
    await pending;
    expect(fixture.componentInstance.errorMessage()).toContain("cannot edit");
    expect(fixture.componentInstance.phase()).toBe("error");
  });

  it("shows 404 when the task is gone", async () => {
    const fixture = await render("edit");
    const pending = fixture.componentInstance.onSubmit();
    http.expectOne("/api/tasks/t1").flush(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Task not found.", fieldErrors: {} },
      },
      { status: 404, statusText: "Not Found" },
    );
    await pending;
    expect(fixture.componentInstance.errorMessage()).toContain("not found");
    expect(fixture.componentInstance.phase()).toBe("error");
  });

  it("preserves the local draft and latest entity on 409 without retrying", async () => {
    const fixture = await render("edit");
    fixture.componentInstance.form.controls.title.setValue("Local draft");
    const pending = fixture.componentInstance.onSubmit();
    http.expectOne("/api/tasks/t1").flush(
      {
        success: false,
        error: {
          code: "STALE_VERSION",
          message: "This item changed while you were editing it.",
          fieldErrors: {},
        },
        data: { latest: { ...row, title: "Server title", version: 9 } },
      },
      { status: 409, statusText: "Conflict" },
    );
    await pending;
    expect(fixture.componentInstance.form.controls.title.value).toBe("Local draft");
    expect(fixture.componentInstance.conflict()?.latest.title).toBe("Server title");
    expect(fixture.componentInstance.conflict()?.latest.version).toBe(9);
    expect(fixture.componentInstance.conflict()?.expectedVersion).toBe(3);
    expect(fixture.componentInstance.conflict()?.draft.title).toBe("Local draft");
    expect(fixture.componentInstance.phase()).toBe("conflict");
    expect(TestBed.inject(ConflictResolutionService).dialogOpen()).toBe(true);
    const opened = TestBed.inject(ConflictResolutionService).session();
    expect(opened?.entityType === "task" ? opened.localDraft.title : null).toBe(
      "Local draft",
    );
    http.verify();
  });

  it("applies server field errors from 400", async () => {
    const fixture = await render("create");
    fixture.componentInstance.form.controls.title.setValue("New task");
    const pending = fixture.componentInstance.onSubmit();
    http.expectOne("/api/tasks").flush(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Check the form.",
          fieldErrors: { title: ["Enter a task title."] },
        },
      },
      { status: 400, statusText: "Bad Request" },
    );
    await pending;
    expect(fixture.componentInstance.fieldError("title")).toBe("Enter a task title.");
  });

  it("keeps the local draft and unresolved session when the dialog is closed", async () => {
    const fixture = await render("edit");
    fixture.componentInstance.form.controls.title.setValue("Local draft");
    const pending = fixture.componentInstance.onSubmit();
    http.expectOne("/api/tasks/t1").flush(
      {
        success: false,
        error: {
          code: "STALE_VERSION",
          message: "This item changed while you were editing it.",
          fieldErrors: {},
        },
        data: { latest: { ...row, title: "Server title", version: 9 } },
      },
      { status: 409, statusText: "Conflict" },
    );
    await pending;
    const conflicts = TestBed.inject(ConflictResolutionService);
    conflicts.hideDialog();
    expect(conflicts.dialogOpen()).toBe(false);
    const session = conflicts.session();
    expect(session?.entityType === "task" ? session.localDraft.title : null).toBe(
      "Local draft",
    );
    expect(fixture.componentInstance.form.controls.title.value).toBe("Local draft");
    expect(fixture.componentInstance.conflict()?.expectedVersion).toBe(3);
  });
});
