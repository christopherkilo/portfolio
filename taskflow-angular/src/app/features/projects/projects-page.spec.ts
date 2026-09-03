import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter, Router } from "@angular/router";
import { By } from "@angular/platform-browser";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ProjectsPage } from "./projects-page";
import { ProjectEditor } from "./project-editor";
import { WorkspaceReadsService } from "../../core/data/workspace-reads";
import { WorkspacePermissionsService } from "../../core/data/permissions";
import { ProjectMutationsService } from "../../core/data/project-mutations";
import { ProjectsDataService } from "../../core/data/projects-data";
import { ActivityDataService } from "../../core/data/activity-data";
import type { ProjectRow } from "../../core/api/models";
import {
  sampleProject,
  stubPermissions,
  stubWorkspaceReads,
  conflictResolutionDeps,
  stubTaskMutations,
  stubAuth,
  stubWorkspaceContext,
} from "../../testing/data-stubs";
import { ConflictResolutionService } from "../../core/conflict/conflict-resolution";
import { TaskMutationsService } from "../../core/data/task-mutations";
import { AuthService } from "../../core/auth/auth";
import { WorkspaceContextService } from "../../core/data/workspace-context";
import { MutationQueueService } from "../../core/offline/mutation-queue";

const v6 = { ...sampleProject, version: 6, name: "Atlas Launch" };

const rowV7: ProjectRow = {
  id: "p1",
  workspace_id: "ws-1",
  name: "Server v7",
  description: "Ship the portfolio demo",
  status: "planning",
  color: "#60A5FA",
  due_date: "2026-12-01",
  created_by: "user-1",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  archived_at: null,
  version: 7,
};

describe("ProjectsPage", () => {
  async function render(reads = stubWorkspaceReads()) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ProjectsPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: "", component: ProjectsPage }]),
        { provide: WorkspaceReadsService, useValue: reads },
        { provide: WorkspacePermissionsService, useValue: stubPermissions() },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProjectsPage);
    fixture.detectChanges();
    return fixture;
  }

  it("renders real project names", async () => {
    const fixture = await render();
    expect(fixture.nativeElement.textContent).toContain("Atlas Launch");
  });

  it("renders an empty list without fake cards", async () => {
    const fixture = await render(stubWorkspaceReads({ projects: [] }));
    expect(fixture.nativeElement.textContent).toContain("No projects match");
    expect(fixture.nativeElement.textContent).not.toContain("Atlas Launch");
  });

  it("keeps a dirty project snapshot and baselineVersion 6 after realtime reloads v7, then save 409s", async () => {
    const reads = stubWorkspaceReads({ projects: [v6] });
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ProjectsPage],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: "", component: ProjectsPage }]),
        { provide: WorkspaceReadsService, useValue: reads },
        { provide: WorkspacePermissionsService, useValue: stubPermissions() },
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
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ProjectsPage);
    const router = TestBed.inject(Router);
    await router.navigateByUrl("/?project=p1");
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const editor = fixture.debugElement.query(By.directive(ProjectEditor))
      .componentInstance as ProjectEditor;
    editor.rename.setValue("Local draft");
    expect(editor.baselineVersion).toBe(6);

    reads.projects.projects.set([{ ...v6, version: 7, name: "Server v7" }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("Server v7");
    expect(editor.rename.value).toBe("Local draft");
    expect(editor.baselineVersion).toBe(6);
    expect(fixture.componentInstance.editSnapshot()?.version).toBe(6);

    const pending = editor.onSubmit();
    const req = http.expectOne("/api/projects/p1");
    expect(req.request.body).toEqual({
      name: "Local draft",
      expectedVersion: 6,
    });
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
    expect(editor.rename.value).toBe("Local draft");
    expect(editor.conflict()?.expectedVersion).toBe(6);
    expect(editor.conflict()?.latest.version).toBe(7);
    expect(editor.phase()).toBe("conflict");
    http.verify();
  });
});
