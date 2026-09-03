import { HttpClient } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { firstValueFrom, map } from "rxjs";
import {
  type ApiFailure,
  type ApiSuccess,
  TaskflowApiError,
  unwrapTaskflowEnvelope,
} from "../api/envelope";
import { catchTaskflowHttp, isStaleVersionError } from "../api/http-rx";
import { userFacingMutationError } from "../api/mutation-error";
import type { Project, ProjectRow, Task, TaskRow, TeamMember } from "../api/models";
import { AuthService } from "../auth/auth";
import type { ProjectVersionConflict, TaskVersionConflict } from "../data/mutation-state";
import { ActivityDataService } from "../data/activity-data";
import { MembersDataService } from "../data/members-data";
import { ProjectMutationsService } from "../data/project-mutations";
import { ProjectsDataService } from "../data/projects-data";
import { TaskMutationsService } from "../data/task-mutations";
import { TasksDataService } from "../data/tasks-data";
import { WorkspaceContextService } from "../data/workspace-context";
import { MutationQueueService } from "../offline/mutation-queue";
import { OfflineReplayService } from "../offline/replay";
import type { QueuedMutation } from "../offline/queued-mutation";
import { isTransportFailure } from "../offline/transport";
import { NetworkStatusService } from "../realtime/network-status";
import type { FieldChoice, FieldDiff } from "./fields";
import {
  applyProjectDiffs,
  applyTaskDiffs,
  canSaveDiffs,
  projectFieldDiffs,
  summarizeDiffs,
  taskFieldDiffs,
  visibleDiffs,
} from "./merge";
import {
  cloneProjectDraft,
  cloneTaskDraft,
  latestProjectFromUnknown,
  latestTaskFromUnknown,
  overlayTaskPayload,
  payloadTouchedKeys,
  projectToDraft,
  taskDraftToWriteBody,
  taskToDraft,
  type ProjectConflictDraft,
  type TaskConflictDraft,
} from "./normalize";
import type {
  ConflictCompletion,
  ConflictSession,
  ProjectConflictSession,
  TaskConflictSession,
} from "./session";

const OFFLINE_RESOLVE_MESSAGE =
  "You’re offline. Your choices are saved here — reconnect, then save the resolved version.";

@Injectable({ providedIn: "root" })
export class ConflictResolutionService {
  private readonly http = inject(HttpClient);
  private readonly tasksMutations = inject(TaskMutationsService);
  private readonly projectsMutations = inject(ProjectMutationsService);
  private readonly queue = inject(MutationQueueService);
  private readonly replay = inject(OfflineReplayService);
  private readonly auth = inject(AuthService);
  private readonly network = inject(NetworkStatusService);
  private readonly members = inject(MembersDataService);
  private readonly workspace = inject(WorkspaceContextService);
  private readonly tasksData = inject(TasksDataService);
  private readonly projectsData = inject(ProjectsDataService);
  private readonly activity = inject(ActivityDataService);

  readonly session = signal<ConflictSession | null>(null);
  readonly dialogOpen = signal(false);
  readonly submitting = signal(false);
  readonly refreshing = signal(false);
  readonly discardConfirming = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly completion = signal<ConflictCompletion | null>(null);

  readonly diffs = computed((): FieldDiff[] => {
    const session = this.session();
    if (!session || session.missing || !session.latestServer) return [];
    if (session.entityType === "task") {
      return taskFieldDiffs(
        session.baseSnapshot,
        session.localDraft,
        taskToDraft(session.latestServer),
        session.touched,
        session.choices,
        session.overrides,
      );
    }
    return projectFieldDiffs(
      session.baseSnapshot,
      session.localDraft,
      projectToDraft(session.latestServer),
      session.touched,
      session.choices,
      session.overrides,
    );
  });

  readonly visibleDiffs = computed(() => visibleDiffs(this.diffs()));
  readonly summary = computed(() => summarizeDiffs(this.diffs()));
  readonly canSave = computed(() => {
    const session = this.session();
    if (!session || session.missing || !session.latestServer) return false;
    return canSaveDiffs(this.diffs());
  });

  openFromTaskConflict(
    conflict: TaskVersionConflict,
    base: Task | null,
    extras?: { memberNames?: Record<string, string>; projectNames?: Record<string, string> },
  ): void {
    const latest = conflict.latest;
    this.setSession({
      source: "editor",
      entityType: "task",
      entityId: conflict.entityId,
      baseVersion: conflict.expectedVersion,
      latestVersion: latest.version,
      baseSnapshot: base ? taskToDraft(base) : null,
      localDraft: cloneTaskDraft(conflict.draft),
      latestServer: latest,
      touched: null,
      missing: false,
      choices: {},
      overrides: {},
      memberNames: extras?.memberNames ?? {},
      projectNames: extras?.projectNames ?? {},
    });
    this.dialogOpen.set(true);
  }

  openFromProjectConflict(
    conflict: ProjectVersionConflict,
    base: Project | null,
  ): void {
    const latest = conflict.latest;
    this.setSession({
      source: "editor",
      entityType: "project",
      entityId: conflict.entityId,
      baseVersion: conflict.expectedVersion,
      latestVersion: latest.version,
      baseSnapshot: base ? projectToDraft(base) : null,
      localDraft: cloneProjectDraft(conflict.draft),
      latestServer: latest,
      touched: null,
      missing: false,
      choices: {},
      overrides: {},
      memberNames: {},
      projectNames: {},
    });
    this.dialogOpen.set(true);
  }

  openFromQueue(item: QueuedMutation): void {
    const latest = latestTaskFromUnknown(item.latest);
    const serverDraft = latest ? taskToDraft(latest) : emptyTaskDraft();
    const local = overlayTaskPayload(serverDraft, item.payload);
    this.setSession({
      source: "offlineQueue",
      entityType: "task",
      entityId: item.entityId,
      baseVersion: item.expectedVersion ?? 0,
      latestVersion: latest?.version ?? item.expectedVersion ?? 0,
      queueMutationId: item.id,
      baseSnapshot: null,
      localDraft: local,
      latestServer: latest,
      touched: payloadTouchedKeys(item.payload),
      missing: !latest,
      choices: {},
      overrides: {},
      memberNames: {},
      projectNames: {},
    });
    this.dialogOpen.set(true);
  }

  openNextQueueConflict(): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    const current = this.session();
    if (current && !this.dialogOpen()) {
      this.dialogOpen.set(true);
      return;
    }
    const next = this.queue.conflictedForUser(userId)[0];
    if (next) this.openFromQueue(next);
  }

  showDialog(): void {
    if (this.session()) this.dialogOpen.set(true);
  }

  hideDialog(): void {
    if (this.submitting()) return;
    this.dialogOpen.set(false);
    this.discardConfirming.set(false);
  }

  choose(key: string, choice: FieldChoice): void {
    const session = this.session();
    if (!session) return;
    const overrides = { ...session.overrides };
    delete overrides[key];
    this.session.set({
      ...session,
      choices: { ...session.choices, [key]: choice },
      overrides,
    });
  }

  chooseRemaining(choice: FieldChoice): void {
    const session = this.session();
    if (!session) return;
    const choices = { ...session.choices };
    const overrides = { ...session.overrides };
    for (const diff of this.diffs()) {
      if (diff.kind !== "CONFLICTING") continue;
      choices[diff.key] = choice;
      delete overrides[diff.key];
    }
    this.session.set({ ...session, choices, overrides });
  }

  setOverride(key: string, value: unknown): void {
    const session = this.session();
    if (!session) return;
    this.session.set({
      ...session,
      overrides: { ...session.overrides, [key]: value },
    });
  }

  resolvedTaskDraft(): TaskConflictDraft | null {
    const session = this.session();
    if (!session || session.entityType !== "task" || !session.latestServer) {
      return null;
    }
    return applyTaskDiffs(taskToDraft(session.latestServer), this.diffs());
  }

  resolvedProjectDraft(): ProjectConflictDraft | null {
    const session = this.session();
    if (!session || session.entityType !== "project" || !session.latestServer) {
      return null;
    }
    return applyProjectDiffs(projectToDraft(session.latestServer), this.diffs());
  }

  startDiscard(): void {
    this.discardConfirming.set(true);
  }

  cancelDiscard(): void {
    this.discardConfirming.set(false);
  }

  async discard(): Promise<void> {
    const session = this.session();
    if (!session) return;
    const queueId = session.queueMutationId;
    if (queueId) {
      await this.queue.remove(queueId);
    }
    const completion: ConflictCompletion = {
      action: "discarded",
      entityType: session.entityType,
      entityId: session.entityId,
      latestVersion: session.latestServer
        ? session.latestServer.version
        : session.latestVersion,
      latestTask: session.entityType === "task" ? session.latestServer : null,
      latestProject: session.entityType === "project" ? session.latestServer : null,
    };
    this.reloadAffected(session.entityType);
    this.clearSession();
    this.completion.set(completion);
    void this.replay.tryReplay();
  }

  async refreshLatest(): Promise<void> {
    const session = this.session();
    if (!session || this.refreshing()) return;
    this.refreshing.set(true);
    this.errorMessage.set(null);
    try {
      if (session.entityType === "task") {
        const latest = await this.fetchTask(session.entityId);
        if (!latest) {
          this.session.set({ ...session, latestServer: null, missing: true });
          return;
        }
        this.session.set({
          ...session,
          latestServer: latest,
          latestVersion: latest.version,
          missing: false,
        });
        return;
      }
      const latest = await this.fetchProject(session.entityId);
      if (!latest) {
        this.session.set({ ...session, latestServer: null, missing: true });
        return;
      }
      this.session.set({
        ...session,
        latestServer: latest,
        latestVersion: latest.version,
        missing: false,
      });
    } catch (error) {
      this.applyLookupError(error);
    } finally {
      this.refreshing.set(false);
    }
  }

  async submit(): Promise<void> {
    const session = this.session();
    if (!session || !this.canSave() || this.submitting()) return;
    if (this.network.online() === false) {
      this.errorMessage.set(OFFLINE_RESOLVE_MESSAGE);
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      if (session.entityType === "task") {
        await this.submitTask(session);
      } else {
        await this.submitProject(session);
      }
    } catch (error) {
      await this.onSubmitError(error);
    } finally {
      this.submitting.set(false);
    }
  }

  private async submitTask(session: TaskConflictSession): Promise<void> {
    const draft = this.resolvedTaskDraft();
    const latest = session.latestServer;
    if (!draft || !latest) return;
    const body = taskDraftToWriteBody(draft);
    const previousIds = latest.assigneeId ? [latest.assigneeId] : [];
    const updated = await this.tasksMutations.updateResolved(
      session.entityId,
      session.latestVersion,
      body,
      {
        previousIds,
        nextIds: draft.assigneeIds,
      },
      draft.archived !== undefined && draft.archived !== latest.archived
        ? { archived: draft.archived }
        : undefined,
    );
    if (session.queueMutationId) {
      await this.queue.remove(session.queueMutationId);
    }
    this.finishSaved({
      action: "saved",
      entityType: "task",
      entityId: session.entityId,
      latestVersion: updated.version,
      latestTask: updated,
    });
  }

  private async submitProject(session: ProjectConflictSession): Promise<void> {
    const draft = this.resolvedProjectDraft();
    if (!draft) return;
    const updated = await this.projectsMutations.updateResolved(
      session.entityId,
      session.latestVersion,
      {
        name: draft.name.trim(),
        description: draft.description.trim(),
        dueDate: draft.dueDate || null,
        color: draft.color,
        archived: draft.archived,
      },
    );
    this.finishSaved({
      action: "saved",
      entityType: "project",
      entityId: session.entityId,
      latestVersion: updated.version,
      latestProject: updated,
    });
  }

  private finishSaved(completion: ConflictCompletion): void {
    this.clearSession();
    this.completion.set(completion);
    void this.replay.tryReplay();
  }

  private async onSubmitError(error: unknown): Promise<void> {
    if (isStaleVersionError(error)) {
      this.applySecondConflict(error);
      return;
    }
    const facing = userFacingMutationError(error);
    if (facing.kind === "not_found") {
      const session = this.session();
      if (session) {
        this.session.set({ ...session, missing: true, latestServer: null });
      }
      this.errorMessage.set("This item was removed.");
      return;
    }
    if (facing.kind === "forbidden") {
      this.members.reload();
      this.errorMessage.set(facing.message);
      return;
    }
    if (isTransportFailure(error) || this.network.online() === false) {
      this.errorMessage.set(OFFLINE_RESOLVE_MESSAGE);
      return;
    }
    this.errorMessage.set(facing.message);
  }

  private applySecondConflict(error: TaskflowApiError): void {
    const session = this.session();
    if (!session) return;
    if (session.entityType === "task") {
      const latest =
        this.tasksMutations.latestFromError(error) ??
        latestTaskFromUnknown(error.data?.latest);
      const resolved = this.resolvedTaskDraft();
      if (!latest) {
        this.session.set({ ...session, missing: true, latestServer: null });
        this.errorMessage.set("This item was removed.");
        return;
      }
      this.session.set({
        ...session,
        baseSnapshot: session.latestServer
          ? taskToDraft(session.latestServer)
          : session.baseSnapshot,
        localDraft: resolved ?? session.localDraft,
        latestServer: latest,
        latestVersion: latest.version,
        choices: {},
        overrides: {},
        missing: false,
      });
      this.errorMessage.set(
        "This item changed again while you were reviewing. Check the new differences.",
      );
      this.dialogOpen.set(true);
      return;
    }
    const latest =
      this.projectsMutations.latestFromError(error) ??
      latestProjectFromUnknown(error.data?.latest);
    const resolved = this.resolvedProjectDraft();
    if (!latest) {
      this.session.set({ ...session, missing: true, latestServer: null });
      this.errorMessage.set("This item was removed.");
      return;
    }
    this.session.set({
      ...session,
      baseSnapshot: session.latestServer
        ? projectToDraft(session.latestServer)
        : session.baseSnapshot,
      localDraft: resolved ?? session.localDraft,
      latestServer: latest,
      latestVersion: latest.version,
      choices: {},
      overrides: {},
      missing: false,
    });
    this.errorMessage.set(
      "This item changed again while you were reviewing. Check the new differences.",
    );
    this.dialogOpen.set(true);
  }

  private applyLookupError(error: unknown): void {
    const facing = userFacingMutationError(error);
    if (facing.kind === "not_found") {
      const session = this.session();
      if (session) {
        this.session.set({ ...session, missing: true, latestServer: null });
      }
      this.errorMessage.set("This item was removed.");
      return;
    }
    this.errorMessage.set(facing.message);
  }

  private async fetchTask(id: string): Promise<Task | null> {
    const workspaceId = this.workspace.currentWorkspaceId();
    if (!workspaceId) return null;
    const rows = await firstValueFrom(
      this.http
        .get<ApiSuccess<TaskRow[]> | ApiFailure>(
          `/api/tasks?workspaceId=${encodeURIComponent(workspaceId)}`,
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
    const row = rows.find((item) => item.id === id);
    return row ? latestTaskFromUnknown(row) : null;
  }

  private async fetchProject(id: string): Promise<Project | null> {
    const workspaceId = this.workspace.currentWorkspaceId();
    if (!workspaceId) return null;
    const rows = await firstValueFrom(
      this.http
        .get<ApiSuccess<ProjectRow[]> | ApiFailure>(
          `/api/projects?workspaceId=${encodeURIComponent(workspaceId)}`,
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
    const row = rows.find((item) => item.id === id);
    return row ? latestProjectFromUnknown(row) : null;
  }

  private reloadAffected(entityType: "task" | "project"): void {
    if (entityType === "task") this.tasksData.reload();
    else this.projectsData.reload();
    this.activity.reload();
  }

  private setSession(session: ConflictSession): void {
    this.errorMessage.set(null);
    this.discardConfirming.set(false);
    this.session.set(session);
  }

  private clearSession(): void {
    this.session.set(null);
    this.dialogOpen.set(false);
    this.discardConfirming.set(false);
    this.errorMessage.set(null);
    this.submitting.set(false);
  }
}

function emptyTaskDraft(): TaskConflictDraft {
  return {
    title: "",
    description: "",
    status: "backlog",
    priority: "medium",
    projectId: "",
    dueDate: "",
    estimate: null,
    labels: [],
    assigneeIds: [],
  };
}

export function memberNameMap(members: TeamMember[]): Record<string, string> {
  return Object.fromEntries(members.map((member) => [member.id, member.name]));
}
