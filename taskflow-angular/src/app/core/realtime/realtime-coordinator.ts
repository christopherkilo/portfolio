import { Injectable, InjectionToken, inject } from "@angular/core";
import { Subject, auditTime } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivityDataService } from "../data/activity-data";
import { AttachmentsDataService } from "../data/attachments-data";
import { AuditDataService } from "../data/audit-data";
import { CommentsDataService } from "../data/comments-data";
import { MembersDataService } from "../data/members-data";
import { NotificationsDataService } from "../data/notifications-data";
import { ProjectsDataService } from "../data/projects-data";
import { TaskHistoryDataService } from "../data/task-history-data";
import { TasksDataService } from "../data/tasks-data";
import { WorkspaceContextService } from "../data/workspace-context";
import { RealtimeService } from "./realtime";

/** Per-domain invalidation coalescing window. Small enough to stay snappy. */
export const REALTIME_COALESCE_MS = new InjectionToken<number>(
  "tf.realtime.coalesceMs",
  { factory: () => 75 },
);

/**
 * Maps workspace-scoped realtime table events to domain `.reload()`.
 * Does not write Task[] / Project[] from payloads.
 */
@Injectable({ providedIn: "root" })
export class RealtimeCoordinatorService {
  private readonly realtime = inject(RealtimeService);
  private readonly workspace = inject(WorkspaceContextService);
  private readonly tasks = inject(TasksDataService);
  private readonly projects = inject(ProjectsDataService);
  private readonly members = inject(MembersDataService);
  private readonly activity = inject(ActivityDataService);
  private readonly comments = inject(CommentsDataService);
  private readonly attachments = inject(AttachmentsDataService);
  private readonly history = inject(TaskHistoryDataService);
  private readonly notifications = inject(NotificationsDataService);
  private readonly audit = inject(AuditDataService);
  private readonly coalesceMs = inject(REALTIME_COALESCE_MS);

  private readonly tasks$ = new Subject<void>();
  private readonly projects$ = new Subject<void>();
  private readonly members$ = new Subject<void>();
  private readonly activity$ = new Subject<void>();
  private readonly comments$ = new Subject<void>();
  private readonly attachments$ = new Subject<void>();
  private readonly history$ = new Subject<void>();
  private readonly notifications$ = new Subject<void>();
  private readonly audit$ = new Subject<void>();

  constructor() {
    this.tasks$
      .pipe(auditTime(this.coalesceMs), takeUntilDestroyed())
      .subscribe(() => this.tasks.reload());
    this.projects$
      .pipe(auditTime(this.coalesceMs), takeUntilDestroyed())
      .subscribe(() => this.projects.reload());
    this.members$
      .pipe(auditTime(this.coalesceMs), takeUntilDestroyed())
      .subscribe(() => this.members.reload());
    this.activity$
      .pipe(auditTime(this.coalesceMs), takeUntilDestroyed())
      .subscribe(() => this.activity.reload());
    this.comments$
      .pipe(auditTime(this.coalesceMs), takeUntilDestroyed())
      .subscribe(() => this.comments.reload());
    this.attachments$
      .pipe(auditTime(this.coalesceMs), takeUntilDestroyed())
      .subscribe(() => this.attachments.reload());
    this.history$
      .pipe(auditTime(this.coalesceMs), takeUntilDestroyed())
      .subscribe(() => this.history.reload());
    this.notifications$
      .pipe(auditTime(this.coalesceMs), takeUntilDestroyed())
      .subscribe(() => this.notifications.reload());
    this.audit$
      .pipe(auditTime(this.coalesceMs), takeUntilDestroyed())
      .subscribe(() => this.audit.reload());

    this.realtime.invalidations$
      .pipe(takeUntilDestroyed())
      .subscribe((event) => this.onInvalidate(event));

    this.realtime.reconnects$
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event.workspaceId !== this.workspace.currentWorkspaceId()) return;
        this.tasks.reload();
        this.projects.reload();
        this.members.reload();
        this.activity.reload();
        this.comments.reload();
        this.attachments.reload();
        this.history.reload();
        this.notifications.reload();
        this.audit.reload();
      });
  }

  private onInvalidate(event: {
    table: string;
    payload: Record<string, unknown>;
    workspaceId: string;
  }) {
    if (event.workspaceId !== this.workspace.currentWorkspaceId()) return;
    if (event.table === "notifications") {
      this.notifications$.next();
      return;
    }
    if (event.table === "comments") {
      this.comments$.next();
      this.activity$.next();
      this.history$.next();
      return;
    }
    if (event.table === "task_attachments") {
      this.attachments$.next();
      this.activity$.next();
      this.history$.next();
      return;
    }
    if (event.table === "activity_events") {
      this.activity$.next();
      this.history$.next();
      this.audit$.next();
      return;
    }
    this.tasks$.next();
    this.activity$.next();
    this.history$.next();
    this.audit$.next();
    if (event.table === "workspace_members") {
      this.members$.next();
    }
    if (event.table === "projects") {
      this.projects$.next();
    }
  }
}
