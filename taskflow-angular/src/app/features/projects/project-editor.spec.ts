import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ProjectEditor } from "./project-editor";
import { ProjectMutationsService } from "../../core/data/project-mutations";
import { ProjectsDataService } from "../../core/data/projects-data";
import { ActivityDataService } from "../../core/data/activity-data";
import { ConflictResolutionService } from "../../core/conflict/conflict-resolution";
import { TaskMutationsService } from "../../core/data/task-mutations";
import {
  conflictResolutionDeps,
  sampleProject,
  stubAuth,
  stubTaskMutations,
  stubWorkspaceContext,
} from "../../testing/data-stubs";
import { AuthService } from "../../core/auth/auth";
import { WorkspaceContextService } from "../../core/data/workspace-context";
import { MutationQueueService } from "../../core/offline/mutation-queue";
import type { ProjectRow } from "../../core/api/models";

const row: ProjectRow = {
  id: "p1",
  workspace_id: "ws-1",
  name: "Atlas Launch",
  description: "Ship the portfolio demo",
  status: "planning",
  color: "#60A5FA",
  due_date: "2026-12-01",
  created_by: "user-1",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  archived_at: null,
  version: 2,
};

describe("ProjectEditor", () => {
  let http: HttpTestingController;

  async function render(mode: "create" | "edit") {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ProjectEditor],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ProjectMutationsService,
        ConflictResolutionService,
        MutationQueueService,
        ...conflictResolutionDeps(),
        { provide: TaskMutationsService, useValue: stubTaskMutations() },
        { provide: AuthService, useValue: stubAuth() },
        { provide: WorkspaceContextService, useValue: stubWorkspaceContext() },
        { provide: ProjectsDataService, useValue: { reload: vi.fn() } },
        { provide: ActivityDataService, useValue: { reload: vi.fn() } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ProjectEditor);
    fixture.componentRef.setInput("mode", mode);
    fixture.componentRef.setInput("workspaceId", "ws-1");
    if (mode === "edit") {
      fixture.componentRef.setInput("project", { ...sampleProject, version: 2 });
    }
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    http.verify();
  });

  it("initializes create with a valid payload", async () => {
    const fixture = await render("create");
    fixture.componentInstance.form.controls.name.setValue("New project");
    const pending = fixture.componentInstance.onSubmit();
    const req = http.expectOne("/api/projects");
    expect(req.request.body).toEqual({
      workspaceId: "ws-1",
      name: "New project",
      description: "",
      dueDate: req.request.body.dueDate,
      color: "#60A5FA",
      status: "planning",
    });
    req.flush({ success: true, data: row });
    await pending;
  });

  it("sends expectedVersion on rename", async () => {
    const fixture = await render("edit");
    fixture.componentInstance.rename.setValue("Atlas");
    const pending = fixture.componentInstance.onSubmit();
    const req = http.expectOne("/api/projects/p1");
    expect(req.request.body).toEqual({ name: "Atlas", expectedVersion: 2 });
    req.flush({ success: true, data: { ...row, name: "Atlas", version: 3 } });
    await pending;
    expect(fixture.componentInstance.baselineVersion).toBe(3);
  });

  it("preserves the rename draft on 409", async () => {
    const fixture = await render("edit");
    fixture.componentInstance.rename.setValue("Local name");
    const pending = fixture.componentInstance.onSubmit();
    http.expectOne("/api/projects/p1").flush(
      {
        success: false,
        error: {
          code: "STALE_VERSION",
          message: "This item changed while you were editing it.",
          fieldErrors: {},
        },
        data: { latest: { ...row, name: "Server name", version: 8 } },
      },
      { status: 409, statusText: "Conflict" },
    );
    await pending;
    expect(fixture.componentInstance.rename.value).toBe("Local name");
    expect(fixture.componentInstance.conflict()?.latest.name).toBe("Server name");
    expect(fixture.componentInstance.phase()).toBe("conflict");
    expect(TestBed.inject(ConflictResolutionService).dialogOpen()).toBe(true);
    http.verify();
  });
});
