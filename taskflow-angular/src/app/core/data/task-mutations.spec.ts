import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TaskMutationsService } from "./task-mutations";
import { TasksDataService } from "./tasks-data";
import { ActivityDataService } from "./activity-data";
import { AuthService } from "../auth/auth";
import { WorkspaceContextService } from "./workspace-context";
import { MutationQueueService } from "../offline/mutation-queue";
import { resetAngularOfflineMemory } from "../offline/queue-backend";
import { stubAuth, stubWorkspaceContext } from "../../testing/data-stubs";
import type { TaskRow } from "../api/models";

const row: TaskRow = {
  id: "t1",
  workspace_id: "ws-1",
  project_id: "p1",
  title: "Write launch checklist",
  description: "Cover auth",
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

const writeBody = {
  title: "Write launch checklist",
  description: "Cover auth",
  status: "todo" as const,
  priority: "high" as const,
  projectId: "p1",
  assigneeId: "user-1",
  dueDate: "2026-12-01",
  labels: ["launch"],
  estimate: null,
};

describe("TaskMutationsService", () => {
  let http: HttpTestingController;
  let service: TaskMutationsService;
  const tasksReload = vi.fn();
  const activityReload = vi.fn();

  beforeEach(() => {
    tasksReload.mockReset();
    activityReload.mockReset();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        TaskMutationsService,
        MutationQueueService,
        { provide: AuthService, useValue: stubAuth() },
        { provide: WorkspaceContextService, useValue: stubWorkspaceContext() },
        { provide: TasksDataService, useValue: { reload: tasksReload } },
        { provide: ActivityDataService, useValue: { reload: activityReload } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(TaskMutationsService);
  });

  afterEach(() => {
    http.verify();
    resetAngularOfflineMemory();
  });

  it("POSTs create to /api/tasks with the React payload shape", async () => {
    const pending = service.create(
      { workspaceId: "ws-1", ...writeBody },
      ["user-2"],
    );
    const req = http.expectOne("/api/tasks");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({
      workspaceId: "ws-1",
      ...writeBody,
    });
    expect(req.request.body).not.toHaveProperty("assigneeIds");
    expect(req.request.body).not.toHaveProperty("expectedVersion");
    req.flush({ success: true, data: row });
    await Promise.resolve();
    const assign = http.expectOne("/api/taskflow/tasks/t1/assignees");
    expect(assign.request.method).toBe("POST");
    expect(assign.request.body).toEqual({ userId: "user-2" });
    assign.flush({ success: true, data: { ok: true } });
    await pending;
    expect(tasksReload).toHaveBeenCalledTimes(1);
    expect(activityReload).toHaveBeenCalledTimes(1);
  });

  it("PATCHes edits with the draft expectedVersion", async () => {
    const pending = service.update("t1", 7, writeBody, {
      previousIds: ["user-1"],
      nextIds: ["user-1"],
    });
    const req = http.expectOne("/api/tasks/t1");
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ ...writeBody, expectedVersion: 7 });
    req.flush({ success: true, data: { ...row, version: 8 } });
    await pending;
    expect(tasksReload).toHaveBeenCalledTimes(1);
  });

  it("sends status-only PATCH with expectedVersion and does not auto-retry 409", async () => {
    const pending = service.changeStatus("t1", 3, "done");
    const req = http.expectOne("/api/tasks/t1");
    expect(req.request.body).toEqual({ status: "done", expectedVersion: 3 });
    req.flush(
      {
        success: false,
        error: {
          code: "STALE_VERSION",
          message: "This item changed while you were editing it.",
          fieldErrors: {},
        },
        data: { latest: { ...row, version: 4, status: "todo" } },
      },
      { status: 409, statusText: "Conflict" },
    );
    await expect(pending).rejects.toMatchObject({ code: "STALE_VERSION", status: 409 });
    http.verify();
    expect(tasksReload).not.toHaveBeenCalled();
  });

  it("maps 409 latest to a Task without overwriting caller state", async () => {
    const pending = service.update("t1", 3, writeBody);
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
    const error = await pending.catch((err: unknown) => err);
    const latest = service.latestFromError(error);
    expect(latest?.title).toBe("Server title");
    expect(latest?.version).toBe(9);
  });

  it("sends a resolved PATCH with the reviewed version and never queues", async () => {
    const pending = service.updateResolved("t1", 9, writeBody);
    const req = http.expectOne("/api/tasks/t1");
    expect(req.request.body.expectedVersion).toBe(9);
    req.flush({ success: true, data: { ...row, version: 10 } });
    await pending;
    expect(tasksReload).toHaveBeenCalledTimes(1);
  });
});
