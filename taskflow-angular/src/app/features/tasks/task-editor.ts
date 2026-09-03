import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { userFacingMutationError } from "../../core/api/mutation-error";
import { isStaleVersionError } from "../../core/api/http-rx";
import {
  STATUS_LABELS,
  TASK_COLUMNS,
  type Project,
  type Task,
  type TaskPriority,
  type TeamMember,
} from "../../core/api/models";
import {
  applyServerFieldErrors,
  buildTaskForm,
  controlMessage,
  seedTaskDraft,
  taskFormDraft,
  taskFormToWriteBody,
  type TaskFormGroup,
} from "../../core/data/task-form";
import { TaskMutationsService } from "../../core/data/task-mutations";
import type { MutationPhase, TaskVersionConflict } from "../../core/data/mutation-state";
import {
  ConflictResolutionService,
  memberNameMap,
} from "../../core/conflict/conflict-resolution";
import type { ConflictCompletion } from "../../core/conflict/session";
import { QUEUED_SAVE_MESSAGE } from "../../core/offline/policy";
import { ConflictNotice } from "../../shared/ui/conflict-notice";

const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

@Component({
  selector: "tf-task-editor",
  imports: [ReactiveFormsModule, ConflictNotice],
  templateUrl: "./task-editor.html",
  styleUrl: "./task-editor.scss",
})
export class TaskEditor {
  private readonly fb = inject(FormBuilder);
  private readonly mutations = inject(TaskMutationsService);
  readonly conflicts = inject(ConflictResolutionService);

  readonly mode = input<"create" | "edit">("create");
  readonly workspaceId = input<string | null>(null);
  readonly projects = input<Project[]>([]);
  readonly members = input<TeamMember[]>([]);
  readonly task = input<Task | null>(null);

  readonly saved = output<string>();
  readonly cancelled = output<void>();

  /**
   * Draft baseline captured when this editor instance is created.
   * Parent remounts on open (`@if` + task id) so list reloads cannot
   * patchValue over a dirty form or swap expectedVersion.
   */
  baselineVersion = 1;
  baselineAssigneeIds: string[] = [];
  readonly form: TaskFormGroup;
  readonly submitted = signal(false);
  readonly phase = signal<MutationPhase>("idle");
  readonly errorMessage = signal<string | null>(null);
  readonly queuedNotice = signal<string | null>(null);
  readonly conflict = signal<TaskVersionConflict | null>(null);
  readonly labelInput = signal("");

  readonly liveProjects = computed(() =>
    this.projects().filter((project) => !project.archived),
  );
  readonly columns = TASK_COLUMNS;
  readonly priorities = PRIORITIES;
  readonly statusLabels = STATUS_LABELS;
  readonly submitting = computed(() => this.phase() === "submitting");
  readonly title = computed(() =>
    this.mode() === "create" ? "Create task" : "Edit task",
  );

  constructor() {
    this.form = buildTaskForm(this.fb, seedTaskDraft(null, [], []));
    effect(() => {
      const event = this.conflicts.completion();
      untracked(() => this.applyCompletion(event));
    });
  }

  ngOnInit(): void {
    const task = this.task();
    const session = this.conflicts.session();
    if (
      session?.entityType === "task" &&
      task &&
      session.entityId === task.id
    ) {
      this.form.reset(session.localDraft);
      this.baselineVersion = session.baseVersion;
      this.baselineAssigneeIds = [...session.localDraft.assigneeIds];
      this.phase.set("conflict");
      this.conflict.set({
        entityType: "task",
        entityId: task.id,
        expectedVersion: session.baseVersion,
        latest: session.latestServer ?? task,
        draft: session.localDraft,
        message: "This item changed while you were editing it.",
      });
      return;
    }
    const seed = seedTaskDraft(task, this.projects(), this.members());
    this.form.reset(seed);
    this.baselineVersion = task?.version ?? 1;
    this.baselineAssigneeIds = task?.assigneeId ? [task.assigneeId] : [];
  }

  fieldError(name: keyof TaskFormGroup["controls"]): string | null {
    const control = this.form.controls[name];
    if (!control.invalid) return null;
    if (!this.submitted() && !control.touched) return null;
    return controlMessage(control);
  }

  toggleAssignee(memberId: string): void {
    const current = this.form.controls.assigneeIds.value;
    const next = current.includes(memberId)
      ? current.filter((id) => id !== memberId)
      : [...current, memberId];
    this.form.controls.assigneeIds.setValue(next);
    this.form.controls.assigneeIds.markAsDirty();
  }

  isAssigneeSelected(memberId: string): boolean {
    return this.form.controls.assigneeIds.value.includes(memberId);
  }

  addLabel(): void {
    const value = this.labelInput().trim().toLowerCase();
    const labels = this.form.controls.labels.value;
    if (!value || labels.includes(value) || labels.length >= 8) {
      this.labelInput.set("");
      return;
    }
    this.form.controls.labels.setValue([...labels, value]);
    this.form.controls.labels.markAsDirty();
    this.labelInput.set("");
  }

  removeLabel(label: string): void {
    this.form.controls.labels.setValue(
      this.form.controls.labels.value.filter((item) => item !== label),
    );
    this.form.controls.labels.markAsDirty();
  }

  onLabelKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.addLabel();
    }
  }

  reviewConflict(): void {
    const conflict = this.conflict();
    if (!conflict) return;
    const session = this.conflicts.session();
    if (session?.entityId === conflict.entityId) {
      this.conflicts.showDialog();
      return;
    }
    this.openResolver(conflict);
  }

  keepEditing(): void {
    this.conflicts.hideDialog();
  }

  private openResolver(conflict: TaskVersionConflict): void {
    this.conflicts.openFromTaskConflict(conflict, this.task(), {
      memberNames: memberNameMap(this.members()),
      projectNames: Object.fromEntries(
        this.projects().map((project) => [project.id, project.name]),
      ),
    });
  }

  private applyCompletion(event: ConflictCompletion | null): void {
    if (!event || event.entityType !== "task") return;
    if (event.entityId !== this.task()?.id) return;
    if (this.phase() !== "conflict" && !this.conflict()) return;
    this.conflict.set(null);
    this.phase.set("idle");
    this.saved.emit(event.entityId);
  }

  async onSubmit(): Promise<void> {
    if (this.submitting()) return;
    this.submitted.set(true);
    this.errorMessage.set(null);
    this.queuedNotice.set(null);
    this.form.markAllAsTouched();
    const body = taskFormToWriteBody(this.form);
    if (!body) return;
    const workspaceId = this.workspaceId();
    if (!workspaceId) {
      this.errorMessage.set("No workspace available.");
      this.phase.set("error");
      return;
    }

    this.phase.set("submitting");
    try {
      if (this.mode() === "create") {
        const created = await this.mutations.create(
          { workspaceId, ...body },
          this.form.controls.assigneeIds.value.slice(1),
        );
        this.phase.set("idle");
        this.saved.emit(created.id);
        return;
      }
      const task = this.task();
      if (!task) {
        this.errorMessage.set("This task is no longer available.");
        this.phase.set("error");
        return;
      }
      await this.mutations.update(task.id, this.baselineVersion, body, {
        previousIds: this.baselineAssigneeIds,
        nextIds: this.form.controls.assigneeIds.value,
      }).then((result) => {
        if (result === "queued") {
          this.queuedNotice.set(QUEUED_SAVE_MESSAGE);
        }
      });
      this.phase.set("idle");
      this.saved.emit(task.id);
    } catch (error) {
      this.handleFailure(error);
    }
  }

  private handleFailure(error: unknown): void {
    if (isStaleVersionError(error)) {
      const latest = this.mutations.latestFromError(error);
      this.phase.set("conflict");
      this.conflict.set({
        entityType: "task",
        entityId: this.task()?.id ?? "",
        expectedVersion: this.baselineVersion,
        latest: latest ?? this.task()!,
        draft: taskFormDraft(this.form),
        message: error.message,
      });
      const conflict = this.conflict();
      if (conflict) this.openResolver(conflict);
      return;
    }
    const facing = userFacingMutationError(error);
    this.phase.set("error");
    this.errorMessage.set(facing.message);
    if (facing.kind === "validation") {
      applyServerFieldErrors(this.form, facing.fieldErrors);
    }
  }
}
