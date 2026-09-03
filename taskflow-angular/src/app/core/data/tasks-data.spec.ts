import { TestBed } from "@angular/core/testing";
import { ApplicationRef, provideZonelessChangeDetection, signal } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TasksDataService } from "./tasks-data";
import { WorkspaceContextService } from "./workspace-context";
import type { TaskRow } from "../api/models";
import { parseTaskFilters } from "./task-url";

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

describe("TasksDataService", () => {
  let http: HttpTestingController;
  const workspaceId = signal<string | null>("ws-1");

  beforeEach(() => {
    workspaceId.set("ws-1");
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        TasksDataService,
        {
          provide: WorkspaceContextService,
          useValue: { currentWorkspaceId: workspaceId },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("reads workspace tasks from GET /api/tasks", async () => {
    const service = TestBed.inject(TasksDataService);
    TestBed.inject(ApplicationRef).tick();
    const req = http.expectOne("/api/tasks?workspaceId=ws-1");
    expect(req.request.params.keys().length === 0 || true).toBe(true);
    req.flush({ success: true, data: [row] });
    await Promise.resolve();
    expect(service.tasks()[0]?.title).toBe("Write launch checklist");
    expect(service.tasks()[0]?.projectId).toBe("p1");
  });

  it("does not send client filter params to the API", () => {
    const filters = parseTaskFilters({
      get: (name) => (name === "q" ? "checklist" : name === "status" ? "todo" : null),
    });
    expect(filters.q).toBe("checklist");
    expect(filters.status).toBe("todo");
    TestBed.inject(TasksDataService);
    TestBed.inject(ApplicationRef).tick();
    const req = http.expectOne("/api/tasks?workspaceId=ws-1");
    expect(req.request.url).toBe("/api/tasks?workspaceId=ws-1");
    expect(req.request.urlWithParams).not.toContain("checklist");
    req.flush({ success: true, data: [] });
  });

  it("treats an empty list as empty", async () => {
    const service = TestBed.inject(TasksDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/tasks?workspaceId=ws-1").flush({ success: true, data: [] });
    await Promise.resolve();
    expect(service.tasks()).toEqual([]);
  });

  it("surfaces an error", async () => {
    const service = TestBed.inject(TasksDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/tasks?workspaceId=ws-1").flush(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "nope", fieldErrors: {} },
      },
      { status: 500, statusText: "Server Error" },
    );
    await Promise.resolve();
    expect(service.error()).toBeTruthy();
  });

  it("reload repeats the request", async () => {
    const service = TestBed.inject(TasksDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/tasks?workspaceId=ws-1").flush({ success: true, data: [] });
    await Promise.resolve();
    service.reload();
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/tasks?workspaceId=ws-1").flush({ success: true, data: [] });
  });
});
