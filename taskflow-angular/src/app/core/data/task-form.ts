import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  type AbstractControl,
  type ValidationErrors,
  type ValidatorFn,
} from "@angular/forms";
import type { Task, TaskPriority, TaskStatus, TeamMember, Project } from "../api/models";
import { todayDateOnly } from "./dates";
import type { TaskDraftValue } from "./mutation-state";

export type TaskFormGroup = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  status: FormControl<TaskStatus>;
  priority: FormControl<TaskPriority>;
  projectId: FormControl<string>;
  dueDate: FormControl<string>;
  estimate: FormControl<number | null>;
  labels: FormControl<string[]>;
  assigneeIds: FormControl<string[]>;
}>;

export type TaskWriteBody = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string | null;
  dueDate: string | null;
  labels: string[];
  estimate: number | null;
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function minSelected(count: number, message: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (Array.isArray(value) && value.length >= count) return null;
    return { message };
  };
}

export function trimmedRequired(message: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? "").trim();
    return value.length > 0 ? null : { message };
  };
}

export function dateOnlyRequired(message: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? "");
    return DATE_ONLY.test(value) ? null : { message };
  };
}

export function optionalEstimate(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    if (Number.isNaN(n) || n < 0 || n > 400) {
      return { message: "Estimate must be between 0 and 400 hours." };
    }
    return null;
  };
}

export function controlMessage(control: AbstractControl | null): string | null {
  if (!control?.errors) return null;
  if (typeof control.errors["message"] === "string") return control.errors["message"];
  if (control.errors["required"]) return "This field is required.";
  if (control.errors["maxlength"]) {
    const max = control.errors["maxlength"].requiredLength as number;
    return `Must be ${max} characters or fewer.`;
  }
  return "Invalid value.";
}

export function seedTaskDraft(
  task: Task | null | undefined,
  projects: Project[],
  members: TeamMember[],
): TaskDraftValue {
  const liveProjects = projects.filter((project) => !project.archived);
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "backlog",
    priority: task?.priority ?? "medium",
    projectId: task?.projectId ?? liveProjects[0]?.id ?? "",
    dueDate: task?.dueDate || todayDateOnly(),
    estimate: task?.estimate ?? null,
    labels: [...(task?.labels ?? [])],
    assigneeIds: task?.assigneeId
      ? [task.assigneeId]
      : members[0]?.id
        ? [members[0].id]
        : [],
  };
}

export function buildTaskForm(fb: FormBuilder, seed: TaskDraftValue): TaskFormGroup {
  return fb.group({
    title: fb.nonNullable.control(seed.title, {
      validators: [trimmedRequired("Enter a task title."), Validators.maxLength(160)],
    }),
    description: fb.nonNullable.control(seed.description, {
      validators: [Validators.maxLength(2000)],
    }),
    status: fb.nonNullable.control(seed.status),
    priority: fb.nonNullable.control(seed.priority),
    projectId: fb.nonNullable.control(seed.projectId, {
      validators: [trimmedRequired("Choose a project.")],
    }),
    dueDate: fb.nonNullable.control(seed.dueDate, {
      validators: [dateOnlyRequired("Choose a due date.")],
    }),
    estimate: fb.control<number | null>(seed.estimate, { validators: [optionalEstimate()] }),
    labels: fb.nonNullable.control<string[]>([...seed.labels]),
    assigneeIds: fb.nonNullable.control<string[]>([...seed.assigneeIds], {
      validators: [minSelected(1, "Choose an assignee.")],
    }),
  });
}

export function taskFormDraft(form: TaskFormGroup): TaskDraftValue {
  const value = form.getRawValue();
  return {
    title: value.title,
    description: value.description,
    status: value.status,
    priority: value.priority,
    projectId: value.projectId,
    dueDate: value.dueDate,
    estimate: value.estimate,
    labels: [...value.labels],
    assigneeIds: [...value.assigneeIds],
  };
}

export function taskFormToWriteBody(form: TaskFormGroup): TaskWriteBody | null {
  if (form.invalid) return null;
  const value = form.getRawValue();
  const assigneeId = value.assigneeIds[0] ?? "";
  const estimate =
    value.estimate === null || value.estimate === undefined || Number.isNaN(Number(value.estimate))
      ? null
      : Number(value.estimate);
  return {
    title: value.title.trim(),
    description: value.description.trim(),
    status: value.status,
    priority: value.priority,
    projectId: value.projectId,
    assigneeId: assigneeId || null,
    dueDate: value.dueDate || null,
    labels: value.labels,
    estimate,
  };
}

export function applyServerFieldErrors(
  form: FormGroup,
  fieldErrors: Record<string, string[]>,
): void {
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const control = form.get(field === "assigneeId" ? "assigneeIds" : field);
    const message = messages[0];
    if (control && message) {
      control.setErrors({ ...(control.errors ?? {}), message });
      control.markAsTouched();
    }
  }
}
