import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ConflictDialog } from "./conflict-dialog";
import { ConflictResolutionService } from "../../core/conflict/conflict-resolution";
import { TaskMutationsService } from "../../core/data/task-mutations";
import { ProjectMutationsService } from "../../core/data/project-mutations";
import { TasksDataService } from "../../core/data/tasks-data";
import { ActivityDataService } from "../../core/data/activity-data";
import { AuthService } from "../../core/auth/auth";
import { WorkspaceContextService } from "../../core/data/workspace-context";
import { MutationQueueService } from "../../core/offline/mutation-queue";
import { taskToDraft } from "../../core/conflict/normalize";
import type { Task } from "../../core/api/models";
import {
  conflictResolutionDeps,
  sampleTask,
  stubAuth,
  stubProjectMutations,
  stubWorkspaceContext,
} from "../../testing/data-stubs";

describe("ConflictDialog", () => {
  async function render() {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ConflictDialog],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ConflictResolutionService,
        TaskMutationsService,
        MutationQueueService,
        ...conflictResolutionDeps(),
        { provide: ProjectMutationsService, useValue: stubProjectMutations() },
        { provide: AuthService, useValue: stubAuth() },
        { provide: WorkspaceContextService, useValue: stubWorkspaceContext() },
        { provide: TasksDataService, useValue: { reload: vi.fn() } },
        { provide: ActivityDataService, useValue: { reload: vi.fn() } },
      ],
    }).compileComponents();
    const conflicts = TestBed.inject(ConflictResolutionService);
    const base: Task = { ...sampleTask, labels: [...sampleTask.labels] };
    conflicts.openFromTaskConflict(
      {
        entityType: "task",
        entityId: "t1",
        expectedVersion: 3,
        latest: { ...base, title: "Server title", version: 9, labels: [...base.labels] },
        draft: { ...taskToDraft(base), title: "Local draft" },
        message: "changed",
      },
      base,
    );
    const fixture = TestBed.createComponent(ConflictDialog);
    fixture.detectChanges();
    return { fixture, conflicts };
  }

  it("opens an accessible dialog with product copy and no HTTP 409 jargon", async () => {
    const { fixture } = await render();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain("Someone else changed this");
    expect(text).toContain("have not been lost");
    expect(text).not.toContain("HTTP 409");
    expect(text).not.toContain("optimistic concurrency");
    expect(fixture.nativeElement.querySelector("[role='dialog']")).toBeTruthy();
    expect(fixture.nativeElement.querySelector("h2").textContent).toContain(
      "Someone else changed this",
    );
  });

  it("shows conflicting fields with labelled choices, not color-only state", async () => {
    const { fixture, conflicts } = await render();
    expect(fixture.nativeElement.textContent).toContain("Needs a decision");
    expect(fixture.nativeElement.textContent).toContain("Use mine");
    expect(fixture.nativeElement.textContent).toContain("Use latest");
    conflicts.choose("title", "local");
    fixture.detectChanges();
    const pressed = fixture.nativeElement.querySelector("[aria-pressed='true']");
    expect(pressed?.textContent).toContain("Use mine");
    expect(fixture.nativeElement.textContent).toContain("Resolved result");
  });

  it("keeps the session when the dialog is dismissed", async () => {
    const { fixture, conflicts } = await render();
    fixture.nativeElement.querySelector("[aria-label='Close dialog']")?.click();
    fixture.detectChanges();
    expect(conflicts.dialogOpen()).toBe(false);
    const session = conflicts.session();
    expect(session?.entityType === "task" ? session.localDraft.title : null).toBe(
      "Local draft",
    );
  });
});
