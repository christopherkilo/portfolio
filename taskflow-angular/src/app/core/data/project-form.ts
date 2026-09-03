import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import type { Project } from "../api/models";
import { todayDateOnly } from "./dates";
import { trimmedRequired, dateOnlyRequired } from "./task-form";
import type { ProjectDraftValue } from "./mutation-state";

export const PROJECT_COLORS = ["#60A5FA", "#34D399", "#FBBF24", "#F472B6", "#A78BFA"];

export type ProjectFormGroup = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  dueDate: FormControl<string>;
  color: FormControl<string>;
}>;

export type CreateProjectBody = {
  workspaceId: string;
  name: string;
  description: string;
  dueDate: string | null;
  color: string;
  status: "planning";
};

export function seedProjectDraft(project?: Project | null): ProjectDraftValue {
  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    dueDate: project?.dueDate || todayDateOnly(),
    color: project?.color || PROJECT_COLORS[0],
  };
}

export function buildProjectForm(
  fb: FormBuilder,
  seed: ProjectDraftValue,
  options?: { dueDateRequired?: boolean },
): ProjectFormGroup {
  const dueValidators = options?.dueDateRequired
    ? [dateOnlyRequired("Choose a due date.")]
    : [];
  return fb.group({
    name: fb.nonNullable.control(seed.name, {
      validators: [trimmedRequired("Enter a project name."), Validators.maxLength(120)],
    }),
    description: fb.nonNullable.control(seed.description, {
      validators: [Validators.maxLength(1000)],
    }),
    dueDate: fb.nonNullable.control(seed.dueDate, { validators: dueValidators }),
    color: fb.nonNullable.control(seed.color),
  });
}

export function projectFormDraft(form: ProjectFormGroup): ProjectDraftValue {
  const value = form.getRawValue();
  return {
    name: value.name,
    description: value.description,
    dueDate: value.dueDate,
    color: value.color,
  };
}

export function projectFormToCreateBody(
  form: ProjectFormGroup,
  workspaceId: string,
): CreateProjectBody | null {
  if (form.invalid) return null;
  const value = form.getRawValue();
  return {
    workspaceId,
    name: value.name.trim(),
    description: value.description.trim(),
    dueDate: value.dueDate || null,
    color: value.color,
    status: "planning",
  };
}
