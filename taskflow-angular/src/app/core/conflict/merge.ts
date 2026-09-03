import {
  classifyThreeWay,
  classifyWithoutBase,
  defaultMergedValue,
  type DiffKind,
} from "./diff";
import {
  PROJECT_COMPARE_FIELDS,
  PROJECT_FIELD_LABELS,
  TASK_COMPARE_FIELDS,
  TASK_FIELD_LABELS,
  equalForProjectField,
  equalForTaskField,
  isTextField,
  readProjectField,
  readTaskField,
  type FieldChoice,
  type FieldDiff,
  type ProjectConflictField,
  type TaskConflictField,
} from "./fields";
import type { ProjectConflictDraft, TaskConflictDraft } from "./normalize";

export type MergeSummary = {
  changed: number;
  autoMerged: number;
  needsDecision: number;
};

export function taskFieldDiffs(
  base: TaskConflictDraft | null,
  local: TaskConflictDraft,
  server: TaskConflictDraft,
  touched: Set<string> | null,
  choices: Partial<Record<string, FieldChoice>>,
  overrides: Record<string, unknown>,
): FieldDiff[] {
  const keys: TaskConflictField[] = [...TASK_COMPARE_FIELDS];
  if (typeof local.archived === "boolean" || typeof server.archived === "boolean") {
    keys.push("archived");
  }
  return keys.map((key) => {
    const equal = equalForTaskField(key);
    const baseValue = base ? readTaskField(base, key) : readTaskField(server, key);
    const localValue = readTaskField(local, key);
    const serverValue = readTaskField(server, key);
    const kind: DiffKind = base
      ? classifyThreeWay(baseValue, localValue, serverValue, equal)
      : classifyWithoutBase(
          Boolean(touched?.has(key)),
          localValue,
          serverValue,
          equal,
        );
    return finishDiff(
      key,
      TASK_FIELD_LABELS[key],
      kind,
      baseValue,
      localValue,
      serverValue,
      choices[key] ?? null,
      overrides[key],
    );
  });
}

export function projectFieldDiffs(
  base: ProjectConflictDraft | null,
  local: ProjectConflictDraft,
  server: ProjectConflictDraft,
  touched: Set<string> | null,
  choices: Partial<Record<string, FieldChoice>>,
  overrides: Record<string, unknown>,
): FieldDiff[] {
  const keys: ProjectConflictField[] = [...PROJECT_COMPARE_FIELDS];
  if (typeof local.archived === "boolean" || typeof server.archived === "boolean") {
    keys.push("archived");
  }
  return keys.map((key) => {
    const equal = equalForProjectField(key);
    const baseValue = base ? readProjectField(base, key) : readProjectField(server, key);
    const localValue = readProjectField(local, key);
    const serverValue = readProjectField(server, key);
    const kind: DiffKind = base
      ? classifyThreeWay(baseValue, localValue, serverValue, equal)
      : classifyWithoutBase(
          Boolean(touched?.has(key)),
          localValue,
          serverValue,
          equal,
        );
    return finishDiff(
      key,
      PROJECT_FIELD_LABELS[key],
      kind,
      baseValue,
      localValue,
      serverValue,
      choices[key] ?? null,
      overrides[key],
    );
  });
}

function finishDiff(
  key: FieldDiff["key"],
  label: string,
  kind: DiffKind,
  base: unknown,
  local: unknown,
  server: unknown,
  choice: FieldChoice | null,
  override: unknown,
): FieldDiff {
  const defaultResolved = defaultMergedValue(kind, local, server);
  let resolved: unknown = defaultResolved;
  if (override !== undefined) {
    resolved = override;
  } else if (choice === "local") {
    resolved = local;
  } else if (choice === "server") {
    resolved = server;
  }
  return {
    key,
    label,
    kind,
    base,
    local,
    server,
    defaultResolved,
    choice,
    override,
    resolved,
    editable: isTextField(key),
  };
}

export function visibleDiffs(diffs: FieldDiff[]): FieldDiff[] {
  return diffs.filter((diff) => diff.kind !== "UNCHANGED");
}

export function summarizeDiffs(diffs: FieldDiff[]): MergeSummary {
  const visible = visibleDiffs(diffs);
  const needsDecision = visible.filter(
    (diff) => diff.kind === "CONFLICTING" && diff.resolved === undefined,
  ).length;
  return {
    changed: visible.length,
    autoMerged: visible.filter((diff) => diff.kind !== "CONFLICTING").length,
    needsDecision,
  };
}

export function canSaveDiffs(diffs: FieldDiff[]): boolean {
  return diffs.every(
    (diff) => diff.kind !== "CONFLICTING" || diff.resolved !== undefined,
  );
}

export function applyTaskDiffs(
  server: TaskConflictDraft,
  diffs: FieldDiff[],
): TaskConflictDraft {
  const next: TaskConflictDraft = {
    ...server,
    labels: [...server.labels],
    assigneeIds: [...server.assigneeIds],
  };
  for (const diff of diffs) {
    if (diff.resolved === undefined) continue;
    switch (diff.key) {
      case "title":
        next.title = String(diff.resolved);
        break;
      case "description":
        next.description = String(diff.resolved);
        break;
      case "status":
        next.status = diff.resolved as TaskConflictDraft["status"];
        break;
      case "priority":
        next.priority = diff.resolved as TaskConflictDraft["priority"];
        break;
      case "projectId":
        next.projectId = String(diff.resolved);
        break;
      case "dueDate":
        next.dueDate = String(diff.resolved ?? "");
        break;
      case "estimate":
        next.estimate = (diff.resolved as number | null) ?? null;
        break;
      case "labels":
        next.labels = [...(diff.resolved as string[])];
        break;
      case "assigneeIds":
        next.assigneeIds = [...(diff.resolved as string[])];
        break;
      case "archived":
        next.archived = Boolean(diff.resolved);
        break;
      default:
        break;
    }
  }
  return next;
}

export function applyProjectDiffs(
  server: ProjectConflictDraft,
  diffs: FieldDiff[],
): ProjectConflictDraft {
  const next: ProjectConflictDraft = { ...server };
  for (const diff of diffs) {
    if (diff.resolved === undefined) continue;
    switch (diff.key) {
      case "name":
        next.name = String(diff.resolved);
        break;
      case "description":
        next.description = String(diff.resolved);
        break;
      case "dueDate":
        next.dueDate = String(diff.resolved ?? "");
        break;
      case "color":
        next.color = String(diff.resolved);
        break;
      case "archived":
        next.archived = Boolean(diff.resolved);
        break;
      default:
        break;
    }
  }
  return next;
}
