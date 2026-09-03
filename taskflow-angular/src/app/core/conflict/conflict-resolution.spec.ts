import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ConflictResolutionService } from "./conflict-resolution";
import { TaskMutationsService } from "../data/task-mutations";
import { ProjectMutationsService } from "../data/project-mutations";
import { TasksDataService } from "../data/tasks-data";
import { ActivityDataService } from "../data/activity-data";
import { AuthService } from "../auth/auth";
import { WorkspaceContextService } from "../data/workspace-context";
import { MutationQueueService } from "../offline/mutation-queue";
import { MembersDataService } from "../data/members-data";
import { NetworkStatusService } from "../realtime/network-status";
import { resetAngularOfflineMemory } from "../offline/queue-backend";
import type { Task, TaskRow } from "../api/models";
import type { TaskVersionConflict } from "../data/mutation-state";
import {
  conflictResolutionDeps,
  sampleTask,
  stubAuth,
  stubProjectMutations,
  stubWorkspaceContext,
} from "../../testing/data-stubs";
import { taskToDraft } from "./normalize";
import type { ConflictSession } from "./session";

function draftTitle(session: ConflictSession | null): string | undefined {
  return session?.entityType === "task" ? session.localDraft.title : undefined;
}

const row = (overrides: Partial<TaskRow> = {}): TaskRow => ({
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
  version: 9,
  ...overrides,
});

describe("ConflictResolutionService", () => {
  let http: HttpTestingController;
  let service: ConflictResolutionService;
  let queue: MutationQueueService;
  const tasksReload = vi.fn();
  const activityReload = vi.fn();
  const membersReload = vi.fn();
  const online = signal(true);

  beforeEach(async () => {
    tasksReload.mockReset();
    activityReload.mockReset();
    membersReload.mockReset();
    online.set(true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
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
        { provide: TasksDataService, useValue: { reload: tasksReload } },
        { provide: ActivityDataService, useValue: { reload: activityReload } },
        { provide: MembersDataService, useValue: { members: signal([]), reload: membersReload } },
        { provide: NetworkStatusService, useValue: { online } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ConflictResolutionService);
    queue = TestBed.inject(MutationQueueService);
    await queue.whenReady();
  });

  afterEach(() => {
    http.verify();
    resetAngularOfflineMemory();
  });

  function openEditor(localTitle: string, latestTitle: string, latestVersion = 9) {
    const base: Task = { ...sampleTask, version: 8, labels: [...sampleTask.labels] };
    const latest: Task = {
      ...base,
      title: latestTitle,
      version: latestVersion,
      labels: [...base.labels],
    };
    const conflict: TaskVersionConflict = {
      entityType: "task",
      entityId: "t1",
      expectedVersion: 8,
      latest,
      draft: { ...taskToDraft(base), title: localTitle },
      message: "changed",
    };
    service.openFromTaskConflict(conflict, base);
    return { base, latest, conflict };
  }

  it("resubmits a reviewed merge with expectedVersion 9, not the original 8", async () => {
    openEditor("Local title", "Write launch checklist", 9);
    expect(service.canSave()).toBe(true);
    const pending = service.submit();
    const req = http.expectOne("/api/tasks/t1");
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body.expectedVersion).toBe(9);
    expect(req.request.body.expectedVersion).not.toBe(8);
    expect(req.request.body.title).toBe("Local title");
    req.flush({
      success: true,
      data: row({ title: "Local title", version: 10 }),
    });
    await pending;
    expect(service.session()).toBeNull();
    expect(service.completion()?.action).toBe("saved");
    expect(tasksReload).toHaveBeenCalled();
  });

  it("on a second 409 keeps the resolved draft, updates latest to v10, and does not retry", async () => {
    openEditor("Local title", "Write launch checklist", 9);
    const pending = service.submit();
    const first = http.expectOne("/api/tasks/t1");
    expect(first.request.body.expectedVersion).toBe(9);
    first.flush(
      {
        success: false,
        error: {
          code: "STALE_VERSION",
          message: "This item changed while you were editing it.",
          fieldErrors: {},
        },
        data: { latest: row({ title: "Third writer", version: 10 }) },
      },
      { status: 409, statusText: "Conflict" },
    );
    await pending;
    http.verify();
    expect(service.session()?.latestVersion).toBe(10);
    expect(draftTitle(service.session())).toBe("Local title");
    expect(service.dialogOpen()).toBe(true);
    expect(service.submitting()).toBe(false);
  });

  it("does not save while a conflicting field is unresolved", () => {
    const base: Task = { ...sampleTask, title: "A", version: 8, labels: [...sampleTask.labels] };
    const latest: Task = { ...base, title: "C", version: 9, labels: [...base.labels] };
    service.openFromTaskConflict(
      {
        entityType: "task",
        entityId: "t1",
        expectedVersion: 8,
        latest,
        draft: { ...taskToDraft(base), title: "B" },
        message: "changed",
      },
      base,
    );
    expect(service.canSave()).toBe(false);
    service.choose("title", "local");
    expect(service.canSave()).toBe(true);
    expect(service.resolvedTaskDraft()?.title).toBe("B");
  });

  it("discards without PATCH and removes the queue entry after confirmation", async () => {
    const item = await queue.enqueue({
      type: "task_update",
      userId: "user-1",
      workspaceId: "ws-1",
      entityId: "t1",
      payload: { title: "Queued title" },
      expectedVersion: 8,
    });
    await queue.update(item.id, {
      status: "conflict",
      latest: row({ title: "Server title", version: 9 }),
    });
    expect(queue.conflictedCount()).toBe(1);
    service.openFromQueue(queue.list()[0]!);
    await service.discard();
    http.verify();
    expect(queue.conflictedCount()).toBe(0);
    expect(service.session()).toBeNull();
    expect(service.completion()?.action).toBe("discarded");
    expect(tasksReload).toHaveBeenCalled();
  });

  it("maps a queue conflict, saves against latest, removes that row, and resumes replay", async () => {
    const replay = TestBed.inject(
      (await import("../offline/replay")).OfflineReplayService,
    );
    const item = await queue.enqueue({
      type: "task_update",
      userId: "user-1",
      workspaceId: "ws-1",
      entityId: "t1",
      payload: { title: "Queued title" },
      expectedVersion: 8,
    });
    await queue.update(item.id, {
      status: "conflict",
      latest: row({ title: "Server title", version: 9 }),
    });
    const later = await queue.enqueue({
      type: "task_status",
      userId: "user-1",
      workspaceId: "ws-1",
      entityId: "t1",
      payload: { status: "done" },
      expectedVersion: 8,
    });
    service.openFromQueue(queue.list().find((row) => row.id === item.id)!);
    service.choose("title", "local");
    const pending = service.submit();
    const req = http.expectOne("/api/tasks/t1");
    expect(req.request.body.expectedVersion).toBe(9);
    expect(req.request.body.title).toBe("Queued title");
    req.flush({
      success: true,
      data: row({ title: "Queued title", version: 10 }),
    });
    await pending;
    expect(queue.list().some((row) => row.id === item.id)).toBe(false);
    expect(queue.list().find((row) => row.id === later.id)?.expectedVersion).toBe(8);
    expect(replay.tryReplay).toHaveBeenCalled();
  });

  it("keeps merge choices on 403 and refreshes members", async () => {
    openEditor("Local title", "Write launch checklist", 9);
    const pending = service.submit();
    http.expectOne("/api/tasks/t1").flush(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "You cannot edit this task.", fieldErrors: {} },
      },
      { status: 403, statusText: "Forbidden" },
    );
    await pending;
    expect(draftTitle(service.session())).toBe("Local title");
    expect(service.errorMessage()).toContain("cannot edit");
    expect(membersReload).toHaveBeenCalled();
    expect(service.dialogOpen()).toBe(true);
  });

  it("does not enqueue a duplicate mutation when offline during resolve", async () => {
    openEditor("Local title", "Write launch checklist", 9);
    online.set(false);
    await service.submit();
    http.expectNone("/api/tasks/t1");
    expect(draftTitle(service.session())).toBe("Local title");
    expect(service.errorMessage()).toMatch(/offline/i);
    expect(queue.list().length).toBe(0);
  });
});
