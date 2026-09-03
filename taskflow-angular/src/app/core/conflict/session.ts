import type { Project, Task } from "../api/models";
import type { FieldChoice, FieldDiff } from "./fields";
import type { ProjectConflictDraft, TaskConflictDraft } from "./normalize";

export type ConflictSource = "editor" | "offlineQueue";

export type ConflictCompletion = {
  action: "saved" | "discarded";
  entityType: "task" | "project";
  entityId: string;
  latestVersion?: number;
  latestTask?: Task | null;
  latestProject?: Project | null;
};

type ConflictSessionBase = {
  source: ConflictSource;
  entityId: string;
  baseVersion: number;
  latestVersion: number;
  queueMutationId?: string;
  missing: boolean;
  choices: Partial<Record<string, FieldChoice>>;
  overrides: Record<string, unknown>;
  memberNames: Record<string, string>;
  projectNames: Record<string, string>;
};

export type TaskConflictSession = ConflictSessionBase & {
  entityType: "task";
  baseSnapshot: TaskConflictDraft | null;
  localDraft: TaskConflictDraft;
  latestServer: Task | null;
  touched: Set<string> | null;
};

export type ProjectConflictSession = ConflictSessionBase & {
  entityType: "project";
  baseSnapshot: ProjectConflictDraft | null;
  localDraft: ProjectConflictDraft;
  latestServer: Project | null;
  touched: Set<string> | null;
};

export type ConflictSession = TaskConflictSession | ProjectConflictSession;

export type ConflictView = {
  session: ConflictSession;
  diffs: FieldDiff[];
  visible: FieldDiff[];
  changed: number;
  autoMerged: number;
  needsDecision: number;
  canSave: boolean;
};
