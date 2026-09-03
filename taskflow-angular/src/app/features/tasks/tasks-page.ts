import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { map } from "rxjs";
import { userFacingLoadError } from "../../core/api/http-error";
import { isStaleVersionError } from "../../core/api/http-rx";
import { userFacingMutationError } from "../../core/api/mutation-error";
import {
  STATUS_LABELS,
  TASK_COLUMNS,
  type Project,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../../core/api/models";
import { formatDate, todayDateOnly } from "../../core/data/dates";
import type { TaskVersionConflict } from "../../core/data/mutation-state";
import { WorkspacePermissionsService } from "../../core/data/permissions";
import { activeTasks, findMember, findProject } from "../../core/data/read-model";
import { TaskMutationsService } from "../../core/data/task-mutations";
import {
  matchesDueFilter,
  normalizeViewMode,
  parseTaskFilters,
  taskFiltersAreActive,
  type TaskFilters,
} from "../../core/data/task-url";
import { WorkspaceReadsService } from "../../core/data/workspace-reads";
import { RealtimeService } from "../../core/realtime/realtime";
import {
  ConflictResolutionService,
  memberNameMap,
} from "../../core/conflict/conflict-resolution";
import type { ConflictCompletion } from "../../core/conflict/session";
import { ConflictNotice } from "../../shared/ui/conflict-notice";
import { ReadDialog } from "../../shared/ui/read-dialog";
import {
  EmptyState,
  QueryError,
  QueryLoading,
} from "../../shared/ui/query-states";
import { CommentsDataService } from "../../core/data/comments-data";
import { AttachmentsDataService } from "../../core/data/attachments-data";
import { TaskHistoryDataService } from "../../core/data/task-history-data";
import { TaskEditor } from "./task-editor";
import { TaskDetailPanel } from "./task-detail-panel";

@Component({
  selector: "tf-tasks-page",
  imports: [
    ReadDialog,
    EmptyState,
    QueryError,
    QueryLoading,
    TaskEditor,
    ConflictNotice,
    TaskDetailPanel,
  ],
  templateUrl: "./tasks-page.html",
  styleUrl: "./tasks-page.scss",
})
export class TasksPage {
  readonly reads = inject(WorkspaceReadsService);
  readonly permissions = inject(WorkspacePermissionsService);
  private readonly mutations = inject(TaskMutationsService);
  private readonly realtime = inject(RealtimeService);
  private readonly comments = inject(CommentsDataService);
  private readonly attachments = inject(AttachmentsDataService);
  private readonly history = inject(TaskHistoryDataService);
  readonly conflicts = inject(ConflictResolutionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly columns = TASK_COLUMNS;
  readonly statusLabels = STATUS_LABELS;
  readonly formatDate = formatDate;
  readonly filtersOpen = signal(false);
  readonly createOpen = signal(false);
  readonly editOpen = signal(false);
  readonly editSnapshot = signal<Task | null>(null);
  readonly confirm = signal<"archive" | "delete" | null>(null);
  readonly statusBusyId = signal<string | null>(null);
  readonly confirmBusy = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly statusConflict = signal<TaskVersionConflict | null>(null);

  private readonly query = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => ({
        taskId: params.get("task"),
        view: normalizeViewMode(params.get("view")),
        filters: parseTaskFilters(params),
      })),
    ),
    {
      initialValue: {
        taskId: null as string | null,
        view: "board" as const,
        filters: parseTaskFilters({ get: () => null }),
      },
    },
  );

  readonly loadError = computed(() => {
    const error = this.reads.error();
    return error ? userFacingLoadError(error) : null;
  });

  readonly liveTasks = computed(() => activeTasks(this.reads.tasks.tasks()));
  readonly viewMode = computed(() => this.query().view);
  readonly taskFilters = computed(() => this.query().filters);
  readonly labels = computed(() => {
    const set = new Set<string>();
    this.liveTasks().forEach((task) =>
      task.labels.forEach((label) => set.add(label)),
    );
    return [...set].sort();
  });

  readonly filteredTasks = computed(() => {
    const filters = this.taskFilters();
    const projects = this.reads.projects.projects();
    const today = todayDateOnly();
    return this.liveTasks().filter((task) =>
      matchesTaskFilters(task, filters, projects, today),
    );
  });

  readonly selected = computed((): Task | null => {
    const id = this.query().taskId;
    if (!id) return null;
    return this.liveTasks().find((task) => task.id === id) ?? null;
  });

  constructor() {
    effect(() => {
      const taskId = this.query().taskId;
      untracked(() => {
        this.comments.setActiveTask(taskId);
        this.attachments.setActiveTask(taskId);
        this.history.setActiveTask(taskId);
        void this.realtime.updatePresence({
          currentEntityId: taskId,
          currentView: taskId ? `task:${taskId}` : "/tasks",
        });
      });
    });
    effect(() => {
      const event = this.conflicts.completion();
      untracked(() => this.applyConflictCompletion(event));
    });
    inject(DestroyRef).onDestroy(() => {
      this.comments.setActiveTask(null);
      this.attachments.setActiveTask(null);
      this.history.setActiveTask(null);
      void this.realtime.updatePresence({ currentEntityId: null });
    });
  }

  readonly detailOpen = computed(
    () =>
      this.selected() !== null &&
      !this.editOpen() &&
      this.confirm() === null,
  );

  readonly hasActiveFilters = computed(() =>
    taskFiltersAreActive(this.taskFilters()),
  );

  projectName(id: string): string {
    return findProject(this.reads.projects.projects(), id)?.name ?? "";
  }

  assignee(task: Task) {
    return findMember(this.reads.members.members(), task.assigneeId);
  }

  priorityClass(priority: TaskPriority): string {
    return `priority priority-${priority}`;
  }

  columnTasks(status: string): Task[] {
    return this.filteredTasks().filter((task) => task.status === status);
  }

  toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  setView(mode: "board" | "list"): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: mode === "board" ? null : mode },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  patchFilters(patch: Partial<TaskFilters>): void {
    const next = { ...this.taskFilters(), ...patch };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: next.q || null,
        projectFilter: next.projectId === "all" ? null : next.projectId,
        assignee: next.assigneeId === "all" ? null : next.assigneeId,
        priority: next.priority === "all" ? null : next.priority,
        status: next.status === "all" ? null : next.status,
        due: next.due === "any" ? null : next.due,
        label: next.label === "all" ? null : next.label,
        overdue: next.overdueOnly ? "1" : null,
      },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  clearFilters(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: null,
        projectFilter: null,
        assignee: null,
        priority: null,
        status: null,
        due: null,
        label: null,
        overdue: null,
      },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  openTask(id: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { task: id },
      queryParamsHandling: "merge",
    });
  }

  closeTask(): void {
    this.editOpen.set(false);
    this.editSnapshot.set(null);
    this.confirm.set(null);
    this.actionError.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { task: null },
      queryParamsHandling: "merge",
    });
  }

  openCreate(): void {
    this.createOpen.set(true);
  }

  closeCreate(): void {
    this.createOpen.set(false);
  }

  onTaskCreated(id: string): void {
    this.createOpen.set(false);
    this.openTask(id);
  }

  openEdit(): void {
    const task = this.selected();
    if (!task) return;
    this.editSnapshot.set({ ...task, labels: [...task.labels] });
    this.editOpen.set(true);
  }

  closeEdit(): void {
    this.editOpen.set(false);
    this.editSnapshot.set(null);
  }

  onTaskEdited(): void {
    this.closeEdit();
  }

  openConfirm(kind: "archive" | "delete"): void {
    this.actionError.set(null);
    this.confirm.set(kind);
  }

  closeConfirm(): void {
    this.confirm.set(null);
    this.confirmBusy.set(false);
  }

  async confirmDestructive(): Promise<void> {
    const task = this.selected();
    const kind = this.confirm();
    if (!task || !kind || this.confirmBusy()) return;
    this.confirmBusy.set(true);
    this.actionError.set(null);
    try {
      if (kind === "delete") {
        await this.mutations.delete(task.id);
      } else {
        await this.mutations.archive(task.id, task.version);
      }
      this.closeConfirm();
      this.closeTask();
    } catch (error) {
      this.confirmBusy.set(false);
      if (isStaleVersionError(error)) {
        const conflict: TaskVersionConflict = {
          entityType: "task",
          entityId: task.id,
          expectedVersion: task.version,
          latest: this.mutations.latestFromError(error) ?? task,
          draft: {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            projectId: task.projectId,
            dueDate: task.dueDate,
            estimate: task.estimate ?? null,
            labels: [...task.labels],
            assigneeIds: task.assigneeId ? [task.assigneeId] : [],
            archived: true,
          },
          message: error.message,
        };
        this.statusConflict.set(conflict);
        this.openStatusResolver(conflict, task);
        this.closeConfirm();
        return;
      }
      this.actionError.set(userFacingMutationError(error).message);
    }
  }

  async changeStatus(task: Task, status: TaskStatus): Promise<void> {
    if (status === task.status || this.statusBusyId()) return;
    this.statusBusyId.set(task.id);
    this.actionError.set(null);
    this.statusConflict.set(null);
    try {
      await this.mutations.changeStatus(task.id, task.version, status);
    } catch (error) {
      if (isStaleVersionError(error)) {
        const conflict: TaskVersionConflict = {
          entityType: "task",
          entityId: task.id,
          expectedVersion: task.version,
          latest: this.mutations.latestFromError(error) ?? task,
          draft: {
            title: task.title,
            description: task.description,
            status,
            priority: task.priority,
            projectId: task.projectId,
            dueDate: task.dueDate,
            estimate: task.estimate ?? null,
            labels: [...task.labels],
            assigneeIds: task.assigneeId ? [task.assigneeId] : [],
          },
          message: error.message,
        };
        this.statusConflict.set(conflict);
        this.openStatusResolver(conflict, task);
      } else {
        this.actionError.set(userFacingMutationError(error).message);
      }
    } finally {
      this.statusBusyId.set(null);
    }
  }

  clearStatusConflict(): void {
    this.conflicts.hideDialog();
  }

  reviewStatusConflict(): void {
    const conflict = this.statusConflict();
    if (!conflict) return;
    const live =
      this.liveTasks().find((task) => task.id === conflict.entityId) ?? null;
    const session = this.conflicts.session();
    if (session?.entityId === conflict.entityId) {
      this.conflicts.showDialog();
      return;
    }
    this.openStatusResolver(conflict, live);
  }

  private openStatusResolver(conflict: TaskVersionConflict, base: Task | null): void {
    this.conflicts.openFromTaskConflict(conflict, base, {
      memberNames: memberNameMap(this.reads.members.members()),
      projectNames: Object.fromEntries(
        this.reads.projects.projects().map((project) => [project.id, project.name]),
      ),
    });
  }

  private applyConflictCompletion(event: ConflictCompletion | null): void {
    if (!event || event.entityType !== "task") return;
    if (this.statusConflict()?.entityId === event.entityId) {
      this.statusConflict.set(null);
    }
  }

  onStatusSelect(task: Task, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as TaskStatus;
    void this.changeStatus(task, value);
  }
}

function matchesTaskFilters(
  task: Task,
  filters: TaskFilters,
  projects: Project[],
  today: string,
): boolean {
  const q = filters.q.trim().toLowerCase();
  const project = findProject(projects, task.projectId);
  if (
    q &&
    !(
      task.title.toLowerCase().includes(q) ||
      task.description.toLowerCase().includes(q) ||
      task.labels.some((label) => label.toLowerCase().includes(q)) ||
      (project?.name.toLowerCase().includes(q) ?? false)
    )
  ) {
    return false;
  }
  if (filters.projectId !== "all" && task.projectId !== filters.projectId) {
    return false;
  }
  if (filters.assigneeId !== "all" && task.assigneeId !== filters.assigneeId) {
    return false;
  }
  if (filters.priority !== "all" && task.priority !== filters.priority) {
    return false;
  }
  if (filters.status !== "all" && task.status !== filters.status) {
    return false;
  }
  if (filters.label !== "all" && !task.labels.includes(filters.label)) {
    return false;
  }
  if (filters.overdueOnly && !(task.status !== "done" && task.dueDate < today)) {
    return false;
  }
  return matchesDueFilter(task.dueDate, task.status, filters.due, today);
}
