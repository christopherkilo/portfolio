import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter, Router } from "@angular/router";
import { By } from "@angular/platform-browser";
import { HttpErrorResponse, provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TasksPage } from "./tasks-page";
import { TaskEditor } from "./task-editor";
import { WorkspaceReadsService } from "../../core/data/workspace-reads";
import { WorkspacePermissionsService } from "../../core/data/permissions";
import { TaskMutationsService } from "../../core/data/task-mutations";
import { TasksDataService } from "../../core/data/tasks-data";
import { ActivityDataService } from "../../core/data/activity-data";
import { WorkspaceContextService } from "../../core/data/workspace-context";
import { AuthService } from "../../core/auth/auth";
import { RealtimeService } from "../../core/realtime/realtime";
import { MutationQueueService } from "../../core/offline/mutation-queue";
import type { TaskRow } from "../../core/api/models";
import {
  sampleTask,
  stubAuth,
  stubConflictResolution,
  stubPermissions,
  stubRealtime,
  stubTaskMutations,
  stubWorkspaceContext,
  stubWorkspaceReads,
  conflictResolutionDeps,
  productSurfaceProviders,
} from "../../testing/data-stubs";
import { ConflictResolutionService } from "../../core/conflict/conflict-resolution";
import { ProjectMutationsService } from "../../core/data/project-mutations";

const v6 = { ...sampleTask, version: 6, labels: [...sampleTask.labels] };

const rowV7: TaskRow = {
  id: "t1",
  workspace_id: "ws-1",
  project_id: "p1",
  title: "Server v7",
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
  version: 7,
};

describe("TasksPage", () => {
  async function render(reads = stubWorkspaceReads()) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TasksPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: "", component: TasksPage }]),
        { provide: WorkspaceReadsService, useValue: reads },
        { provide: WorkspacePermissionsService, useValue: stubPermissions() },
        { provide: TaskMutationsService, useValue: stubTaskMutations() },
        { provide: ConflictResolutionService, useValue: stubConflictResolution() },
        { provide: AuthService, useValue: stubAuth() },
        { provide: RealtimeService, useValue: stubRealtime() },
        ...productSurfaceProviders(),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TasksPage);
    fixture.detectChanges();
    return { fixture, reads };
  }

  it("renders real task titles", async () => {
    const { fixture } = await render();
    expect(fixture.nativeElement.textContent).toContain("Write launch checklist");
  });

  it("renders an empty board without fake tasks", async () => {
    const { fixture } = await render(stubWorkspaceReads({ tasks: [] }));
    expect(fixture.nativeElement.textContent).toContain("No tasks yet");
    expect(fixture.nativeElement.textContent).not.toContain("Write launch checklist");
  });

  it("shows an accessible error with retry", async () => {
    const reads = stubWorkspaceReads({
      error: new HttpErrorResponse({ status: 500, statusText: "Server Error" }),
    });
    const { fixture } = await render(reads);
    expect(fixture.nativeElement.querySelector("[role='alert']")).toBeTruthy();
    fixture.nativeElement.querySelector("button")?.click();
    expect(reads.reloadAll).toHaveBeenCalled();
  });

  it("keeps a dirty editor draft and baselineVersion 6 after realtime reloads v7, then save 409s", async () => {
    const reads = stubWorkspaceReads({ tasks: [v6] });
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TasksPage],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: "", component: TasksPage }]),
        { provide: WorkspaceReadsService, useValue: reads },
        { provide: WorkspacePermissionsService, useValue: stubPermissions() },
        TaskMutationsService,
        MutationQueueService,
        ConflictResolutionService,
        ...conflictResolutionDeps(),
        { provide: ProjectMutationsService, useValue: { updateResolved: vi.fn(), latestFromError: vi.fn() } },
        { provide: TasksDataService, useValue: { reload: vi.fn() } },
        { provide: ActivityDataService, useValue: { reload: vi.fn() } },
        { provide: AuthService, useValue: stubAuth() },
        { provide: WorkspaceContextService, useValue: stubWorkspaceContext() },
        { provide: RealtimeService, useValue: stubRealtime() },
        ...productSurfaceProviders(),
      ],
    }).compileComponents();
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TasksPage);
    const router = TestBed.inject(Router);
    await router.navigateByUrl("/?task=t1");
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.openEdit();
    fixture.detectChanges();

    const editor = fixture.debugElement.query(By.directive(TaskEditor))
      .componentInstance as TaskEditor;
    editor.form.controls.title.setValue("Local draft");
    expect(editor.baselineVersion).toBe(6);

    reads.tasks.tasks.set([
      { ...v6, version: 7, title: "Server v7", labels: [...v6.labels] },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("Server v7");
    expect(editor.form.controls.title.value).toBe("Local draft");
    expect(editor.baselineVersion).toBe(6);

    const pending = editor.onSubmit();
    const req = http.expectOne("/api/tasks/t1");
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body.expectedVersion).toBe(6);
    expect(req.request.body.title).toBe("Local draft");
    req.flush(
      {
        success: false,
        error: {
          code: "STALE_VERSION",
          message: "This item changed while you were editing it.",
          fieldErrors: {},
        },
        data: { latest: rowV7 },
      },
      { status: 409, statusText: "Conflict" },
    );
    await pending;
    expect(editor.form.controls.title.value).toBe("Local draft");
    expect(editor.conflict()?.expectedVersion).toBe(6);
    expect(editor.conflict()?.latest.version).toBe(7);
    expect(editor.phase()).toBe("conflict");
    expect(TestBed.inject(ConflictResolutionService).dialogOpen()).toBe(true);
    http.verify();
  });
});
