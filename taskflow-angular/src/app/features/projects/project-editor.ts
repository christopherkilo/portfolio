import { Component, computed, effect, inject, input, output, signal, untracked } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { userFacingMutationError } from "../../core/api/mutation-error";
import { isStaleVersionError } from "../../core/api/http-rx";
import type { Project } from "../../core/api/models";
import {
  PROJECT_COLORS,
  buildProjectForm,
  projectFormDraft,
  projectFormToCreateBody,
  seedProjectDraft,
  type ProjectFormGroup,
} from "../../core/data/project-form";
import { ProjectMutationsService } from "../../core/data/project-mutations";
import {
  applyServerFieldErrors,
  controlMessage,
  trimmedRequired,
} from "../../core/data/task-form";
import type { MutationPhase, ProjectVersionConflict } from "../../core/data/mutation-state";
import { ConflictResolutionService } from "../../core/conflict/conflict-resolution";
import type { ConflictCompletion } from "../../core/conflict/session";
import { ConflictNotice } from "../../shared/ui/conflict-notice";

@Component({
  selector: "tf-project-editor",
  imports: [ReactiveFormsModule, ConflictNotice],
  templateUrl: "./project-editor.html",
  styleUrl: "./project-editor.scss",
})
export class ProjectEditor {
  private readonly fb = inject(FormBuilder);
  private readonly mutations = inject(ProjectMutationsService);
  readonly conflicts = inject(ConflictResolutionService);

  readonly mode = input<"create" | "edit">("create");
  readonly workspaceId = input<string | null>(null);
  readonly project = input<Project | null>(null);

  readonly saved = output<string>();
  readonly cancelled = output<void>();
  readonly archived = output<void>();

  baselineVersion = 1;
  readonly form: ProjectFormGroup;
  readonly rename = this.fb.nonNullable.control("", {
    validators: [trimmedRequired("Enter a project name."), Validators.maxLength(120)],
  });
  readonly submitted = signal(false);
  readonly phase = signal<MutationPhase>("idle");
  readonly errorMessage = signal<string | null>(null);
  readonly conflict = signal<ProjectVersionConflict | null>(null);
  readonly colors = PROJECT_COLORS;
  readonly submitting = computed(() => this.phase() === "submitting");

  constructor() {
    this.form = buildProjectForm(this.fb, seedProjectDraft(null));
    effect(() => {
      const event = this.conflicts.completion();
      untracked(() => this.applyCompletion(event));
    });
  }

  ngOnInit(): void {
    const project = this.project();
    this.form.reset(seedProjectDraft(project));
    this.rename.setValue(project?.name ?? "");
    this.baselineVersion = project?.version ?? 1;
  }

  fieldError(name: keyof ProjectFormGroup["controls"]): string | null {
    const control = this.form.controls[name];
    if (!control.invalid) return null;
    if (!this.submitted() && !control.touched) return null;
    return controlMessage(control);
  }

  renameError(): string | null {
    if (!this.rename.invalid) return null;
    if (!this.submitted() && !this.rename.touched) return null;
    return controlMessage(this.rename);
  }

  selectColor(color: string): void {
    this.form.controls.color.setValue(color);
    this.form.controls.color.markAsDirty();
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

  private openResolver(conflict: ProjectVersionConflict): void {
    this.conflicts.openFromProjectConflict(conflict, this.project());
  }

  private applyCompletion(event: ConflictCompletion | null): void {
    if (!event || event.entityType !== "project") return;
    if (event.entityId !== this.project()?.id) return;
    if (this.phase() !== "conflict" && !this.conflict()) return;
    this.conflict.set(null);
    this.phase.set("idle");
    if (event.action === "discarded" && event.latestProject?.archived) {
      this.archived.emit();
      return;
    }
    this.saved.emit(event.entityId);
  }

  async onSubmit(): Promise<void> {
    if (this.submitting()) return;
    this.submitted.set(true);
    this.errorMessage.set(null);

    if (this.mode() === "create") {
      this.form.markAllAsTouched();
      const workspaceId = this.workspaceId();
      const body = workspaceId ? projectFormToCreateBody(this.form, workspaceId) : null;
      if (!workspaceId) {
        this.errorMessage.set("No workspace available.");
        this.phase.set("error");
        return;
      }
      if (!body) return;
      this.phase.set("submitting");
      try {
        const created = await this.mutations.create(body);
        this.phase.set("idle");
        this.saved.emit(created.id);
      } catch (error) {
        this.handleFailure(error);
      }
      return;
    }

    this.rename.markAsTouched();
    if (this.rename.invalid) return;
    const project = this.project();
    if (!project) {
      this.errorMessage.set("This project is no longer available.");
      this.phase.set("error");
      return;
    }
    this.phase.set("submitting");
    try {
      const updated = await this.mutations.rename(
        project.id,
        this.baselineVersion,
        this.rename.value.trim(),
      );
      this.baselineVersion = updated.version;
      this.rename.setValue(updated.name);
      this.phase.set("idle");
      this.saved.emit(project.id);
    } catch (error) {
      this.handleFailure(error);
    }
  }

  async archiveOrRestore(): Promise<void> {
    if (this.submitting()) return;
    const project = this.project();
    if (!project) return;
    this.errorMessage.set(null);
    this.phase.set("submitting");
    try {
      const updated = await this.mutations.setArchived(
        project.id,
        this.baselineVersion,
        !project.archived,
      );
      this.baselineVersion = updated.version;
      this.phase.set("idle");
      if (updated.archived) {
        this.archived.emit();
      } else {
        this.saved.emit(updated.id);
      }
    } catch (error) {
      this.handleFailure(error, { archived: !project.archived });
    }
  }

  private handleFailure(
    error: unknown,
    extras?: { archived?: boolean },
  ): void {
    if (isStaleVersionError(error)) {
      const latest = this.mutations.latestFromError(error);
      this.phase.set("conflict");
      this.conflict.set({
        entityType: "project",
        entityId: this.project()?.id ?? "",
        expectedVersion: this.baselineVersion,
        latest: latest ?? this.project()!,
        draft:
          this.mode() === "create"
            ? projectFormDraft(this.form)
            : {
                name: this.rename.value,
                description: this.project()?.description ?? "",
                dueDate: this.project()?.dueDate ?? "",
                color: this.project()?.color ?? PROJECT_COLORS[0],
                archived: extras?.archived ?? this.project()?.archived,
              },
        message: error.message,
      });
      const conflict = this.conflict();
      if (conflict && this.mode() === "edit") this.openResolver(conflict);
      return;
    }
    const facing = userFacingMutationError(error);
    this.phase.set("error");
    this.errorMessage.set(facing.message);
    if (facing.kind === "validation") {
      applyServerFieldErrors(this.form, facing.fieldErrors);
      if (facing.fieldErrors["name"]?.[0]) {
        this.rename.setErrors({ message: facing.fieldErrors["name"][0] });
      }
    }
  }
}
