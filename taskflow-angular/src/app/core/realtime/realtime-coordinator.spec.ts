import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { Subject } from "rxjs";
import {
  REALTIME_COALESCE_MS,
  RealtimeCoordinatorService,
} from "./realtime-coordinator";
import { RealtimeService } from "./realtime";
import { WorkspaceContextService } from "../data/workspace-context";
import { TasksDataService } from "../data/tasks-data";
import { ProjectsDataService } from "../data/projects-data";
import { MembersDataService } from "../data/members-data";
import { ActivityDataService } from "../data/activity-data";
import { AttachmentsDataService } from "../data/attachments-data";
import { AuditDataService } from "../data/audit-data";
import { CommentsDataService } from "../data/comments-data";
import { NotificationsDataService } from "../data/notifications-data";
import { TaskHistoryDataService } from "../data/task-history-data";
import { sampleTask } from "../../testing/data-stubs";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("RealtimeCoordinatorService", () => {
  let invalidations$: Subject<{
    table: string;
    payload: Record<string, unknown>;
    workspaceId: string;
  }>;
  let reconnects$: Subject<{ workspaceId: string }>;
  let tasksReload: ReturnType<typeof vi.fn>;
  let projectsReload: ReturnType<typeof vi.fn>;
  let membersReload: ReturnType<typeof vi.fn>;
  let activityReload: ReturnType<typeof vi.fn>;
  let commentsReload: ReturnType<typeof vi.fn>;
  let attachmentsReload: ReturnType<typeof vi.fn>;
  let historyReload: ReturnType<typeof vi.fn>;
  let notificationsReload: ReturnType<typeof vi.fn>;
  let auditReload: ReturnType<typeof vi.fn>;
  const tasksList = signal([sampleTask]);
  const workspaceId = signal("ws-1");

  beforeEach(() => {
    invalidations$ = new Subject();
    reconnects$ = new Subject();
    tasksReload = vi.fn();
    projectsReload = vi.fn();
    membersReload = vi.fn();
    activityReload = vi.fn();
    commentsReload = vi.fn();
    attachmentsReload = vi.fn();
    historyReload = vi.fn();
    notificationsReload = vi.fn();
    auditReload = vi.fn();
    tasksList.set([sampleTask]);
    workspaceId.set("ws-1");
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: REALTIME_COALESCE_MS, useValue: 15 },
        RealtimeCoordinatorService,
        {
          provide: RealtimeService,
          useValue: { invalidations$, reconnects$ },
        },
        {
          provide: WorkspaceContextService,
          useValue: { currentWorkspaceId: workspaceId },
        },
        {
          provide: TasksDataService,
          useValue: { reload: tasksReload, tasks: tasksList },
        },
        {
          provide: ProjectsDataService,
          useValue: { reload: projectsReload },
        },
        {
          provide: MembersDataService,
          useValue: { reload: membersReload },
        },
        {
          provide: ActivityDataService,
          useValue: { reload: activityReload },
        },
        {
          provide: CommentsDataService,
          useValue: { reload: commentsReload },
        },
        {
          provide: AttachmentsDataService,
          useValue: { reload: attachmentsReload },
        },
        {
          provide: TaskHistoryDataService,
          useValue: { reload: historyReload },
        },
        {
          provide: NotificationsDataService,
          useValue: { reload: notificationsReload },
        },
        {
          provide: AuditDataService,
          useValue: { reload: auditReload },
        },
      ],
    });
    TestBed.inject(RealtimeCoordinatorService);
  });

  afterEach(() => {
    invalidations$.complete();
    reconnects$.complete();
  });

  it("reloads tasks and activity for default table events", async () => {
    invalidations$.next({
      table: "tasks",
      payload: { title: "from payload" },
      workspaceId: "ws-1",
    });
    await wait(40);
    expect(tasksReload).toHaveBeenCalledTimes(1);
    expect(activityReload).toHaveBeenCalledTimes(1);
    expect(projectsReload).not.toHaveBeenCalled();
    expect(membersReload).not.toHaveBeenCalled();
    expect(commentsReload).not.toHaveBeenCalled();
    expect(notificationsReload).not.toHaveBeenCalled();
    expect(tasksList()[0]?.title).toBe("Write launch checklist");
  });

  it("reloads notifications only for notification events", async () => {
    invalidations$.next({
      table: "notifications",
      payload: { id: "n1" },
      workspaceId: "ws-1",
    });
    await wait(40);
    expect(notificationsReload).toHaveBeenCalledTimes(1);
    expect(tasksReload).not.toHaveBeenCalled();
    expect(activityReload).not.toHaveBeenCalled();
  });

  it("reloads comments and activity without tasks", async () => {
    invalidations$.next({
      table: "comments",
      payload: {},
      workspaceId: "ws-1",
    });
    await wait(40);
    expect(commentsReload).toHaveBeenCalledTimes(1);
    expect(activityReload).toHaveBeenCalledTimes(1);
    expect(historyReload).toHaveBeenCalledTimes(1);
    expect(tasksReload).not.toHaveBeenCalled();
  });

  it("reloads members for workspace_members and projects for projects", async () => {
    invalidations$.next({
      table: "workspace_members",
      payload: {},
      workspaceId: "ws-1",
    });
    invalidations$.next({
      table: "projects",
      payload: {},
      workspaceId: "ws-1",
    });
    await wait(40);
    expect(membersReload).toHaveBeenCalledTimes(1);
    expect(projectsReload).toHaveBeenCalledTimes(1);
    expect(tasksReload).toHaveBeenCalledTimes(1);
  });

  it("does not treat workspace invitations as a comments reload", async () => {
    invalidations$.next({
      table: "workspace_invitations",
      payload: {},
      workspaceId: "ws-1",
    });
    await wait(40);
    expect(tasksReload).toHaveBeenCalled();
    expect(commentsReload).not.toHaveBeenCalled();
    expect(notificationsReload).not.toHaveBeenCalled();
  });

  it("coalesces a burst of table events into one reload", async () => {
    invalidations$.next({ table: "tasks", payload: {}, workspaceId: "ws-1" });
    invalidations$.next({
      table: "comments",
      payload: {},
      workspaceId: "ws-1",
    });
    invalidations$.next({
      table: "activity_events",
      payload: {},
      workspaceId: "ws-1",
    });
    await wait(40);
    expect(tasksReload).toHaveBeenCalledTimes(1);
    expect(activityReload).toHaveBeenCalledTimes(1);
    expect(commentsReload).toHaveBeenCalledTimes(1);
    expect(historyReload).toHaveBeenCalledTimes(1);
  });

  it("ignores events for another workspace", async () => {
    invalidations$.next({
      table: "tasks",
      payload: {},
      workspaceId: "ws-other",
    });
    await wait(40);
    expect(tasksReload).not.toHaveBeenCalled();
  });

  it("reloads workspace domains on reconnect without writing rows", async () => {
    reconnects$.next({ workspaceId: "ws-1" });
    expect(tasksReload).toHaveBeenCalledTimes(1);
    expect(projectsReload).toHaveBeenCalledTimes(1);
    expect(membersReload).toHaveBeenCalledTimes(1);
    expect(activityReload).toHaveBeenCalledTimes(1);
    expect(notificationsReload).toHaveBeenCalledTimes(1);
    expect(tasksList()[0]?.title).toBe("Write launch checklist");
  });
});
