import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TaskMutationsService } from "../data/task-mutations";
import { ProjectMutationsService } from "../data/project-mutations";
import { MemberMutationsService } from "../data/member-mutations";
import { InvitationMutationsService } from "../data/invitation-mutations";
import { TasksDataService } from "../data/tasks-data";
import { ProjectsDataService } from "../data/projects-data";
import { MembersDataService } from "../data/members-data";
import { ActivityDataService } from "../data/activity-data";
import { InvitationsDataService } from "../data/invitations-data";
import { WorkspaceContextService } from "../data/workspace-context";
import { AuthService } from "../auth/auth";
import { MutationQueueService } from "./mutation-queue";
import { resetAngularOfflineMemory } from "./queue-backend";
import {
  ANGULAR_QUEUEABLE_TYPES,
  UNSAFE_OFFLINE_ACTIONS,
  isAngularQueueable,
} from "./policy";
import { stubAuth, stubWorkspaceContext } from "../../testing/data-stubs";

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

describe("offline mutation policy", () => {
  afterEach(() => {
    resetAngularOfflineMemory();
    vi.unstubAllGlobals();
  });

  it("queues only Angular-implemented safe types", () => {
    expect([...ANGULAR_QUEUEABLE_TYPES]).toEqual(["task_update", "task_status"]);
    expect(isAngularQueueable("comment_create")).toBe(false);
    expect(isAngularQueueable("notification_read")).toBe(false);
    expect(isAngularQueueable("GET")).toBe(false);
    expect(UNSAFE_OFFLINE_ACTIONS.has("role_change")).toBe(true);
    expect(UNSAFE_OFFLINE_ACTIONS.has("member_remove")).toBe(true);
    expect(UNSAFE_OFFLINE_ACTIONS.has("invitation_accept")).toBe(true);
    expect(UNSAFE_OFFLINE_ACTIONS.has("attachment_upload")).toBe(true);
    expect(UNSAFE_OFFLINE_ACTIONS.has("attachment_delete")).toBe(true);
    expect(UNSAFE_OFFLINE_ACTIONS.has("comment_create")).toBe(true);
    expect(UNSAFE_OFFLINE_ACTIONS.has("notification_read")).toBe(true);
    expect(UNSAFE_OFFLINE_ACTIONS.has("notification_preferences")).toBe(true);
  });

  async function setup(online = false) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        TaskMutationsService,
        ProjectMutationsService,
        MemberMutationsService,
        InvitationMutationsService,
        MutationQueueService,
        { provide: AuthService, useValue: stubAuth() },
        { provide: WorkspaceContextService, useValue: stubWorkspaceContext() },
        { provide: TasksDataService, useValue: { reload: vi.fn() } },
        { provide: ProjectsDataService, useValue: { reload: vi.fn() } },
        { provide: MembersDataService, useValue: { reload: vi.fn() } },
        { provide: ActivityDataService, useValue: { reload: vi.fn() } },
        { provide: InvitationsDataService, useValue: { reload: vi.fn() } },
      ],
    });
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(online);
    return {
      tasks: TestBed.inject(TaskMutationsService),
      projects: TestBed.inject(ProjectMutationsService),
      members: TestBed.inject(MemberMutationsService),
      invitations: TestBed.inject(InvitationMutationsService),
      queue: TestBed.inject(MutationQueueService),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it("queues an approved task PATCH while offline", async () => {
    const { tasks, queue, http } = await setup();
    const result = await tasks.update("t1", 8, writeBody, {
      previousIds: ["user-1"],
      nextIds: ["user-1"],
    });
    expect(result).toBe("queued");
    http.verify();
    const item = queue.list()[0];
    expect(item?.type).toBe("task_update");
    expect(item?.expectedVersion).toBe(8);
    expect(item?.payload).toMatchObject({ title: writeBody.title });
    expect(item?.payload).not.toHaveProperty("expectedVersion");
  });

  it("queues a status-only change as task_status", async () => {
    const { tasks, queue } = await setup();
    await expect(tasks.changeStatus("t1", 3, "done")).resolves.toBe("queued");
    expect(queue.list()[0]?.type).toBe("task_status");
  });

  it("does not queue unsafe team, invite, or project mutations", async () => {
    const { projects, members, invitations, queue, http } = await setup();
    await expect(projects.rename("p1", 1, "Nope")).rejects.toMatchObject({
      status: 503,
      code: "OFFLINE_UNSAFE_ACTION",
    });
    await expect(members.updateRole("ws-1", "m1", "viewer")).rejects.toMatchObject({
      code: "OFFLINE_UNSAFE_ACTION",
    });
    await expect(members.remove("ws-1", "m1")).rejects.toMatchObject({
      code: "OFFLINE_UNSAFE_ACTION",
    });
    await expect(
      invitations.accept("a".repeat(20)),
    ).rejects.toMatchObject({ code: "OFFLINE_UNSAFE_ACTION" });
    expect(queue.list()).toEqual([]);
    http.verify();
  });

  it("does not convert a 403 into an offline queue entry", async () => {
    const { tasks, queue, http } = await setup(true);
    const pending = tasks.update("t1", 1, writeBody);
    http.expectOne("/api/tasks/t1").flush(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "nope", fieldErrors: {} },
      },
      { status: 403, statusText: "Forbidden" },
    );
    await expect(pending).rejects.toMatchObject({ status: 403 });
    expect(queue.list()).toEqual([]);
  });

  it("does not convert a 409 into a pending retry", async () => {
    const { tasks, queue, http } = await setup(true);
    const pending = tasks.update("t1", 1, writeBody);
    http.expectOne("/api/tasks/t1").flush(
      {
        success: false,
        error: {
          code: "STALE_VERSION",
          message: "stale",
          fieldErrors: {},
        },
        data: { latest: { id: "t1", version: 2 } },
      },
      { status: 409, statusText: "Conflict" },
    );
    await expect(pending).rejects.toMatchObject({ code: "STALE_VERSION" });
    expect(queue.list()).toEqual([]);
  });
});
