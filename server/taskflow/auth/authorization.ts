import "server-only";

import {
  assertRole,
  requireTaskflowUser,
  type TaskflowSessionUser,
} from "@/server/taskflow/auth/session";
import { NotFoundError } from "@/server/taskflow/errors";
import {
  ActivityRepository,
  ProjectRepository,
  TaskRepository,
  WorkspaceRepository,
} from "@/server/taskflow/repositories";
import { MemberRepository } from "@/server/taskflow/repositories/memberRepository";
import { CommentRepository } from "@/server/taskflow/repositories/commentRepository";
import { InvitationRepository } from "@/server/taskflow/repositories/invitationRepository";
import { NotificationRepository } from "@/server/taskflow/repositories/notificationRepository";
import { createTaskflowServerClient } from "@/server/taskflow/supabase/server";
import type { WorkspaceMemberRow, WorkspaceRole } from "@/server/taskflow/types/database";

export {
  assertCanChangeMemberRole,
  assertCanRemoveMember,
  canComment,
  canEditTask,
  canInvite,
  canManageMembers,
  canManageProjects,
} from "@/server/taskflow/auth/permissions";

export type TaskflowContext = {
  user: TaskflowSessionUser;
  supabase: Awaited<ReturnType<typeof createTaskflowServerClient>>;
  workspaces: WorkspaceRepository;
  projects: ProjectRepository;
  tasks: TaskRepository;
  activity: ActivityRepository;
  members: MemberRepository;
  comments: CommentRepository;
  invitations: InvitationRepository;
  notifications: NotificationRepository;
};

export async function createTaskflowContext(): Promise<TaskflowContext> {
  const user = await requireTaskflowUser();
  const supabase = await createTaskflowServerClient();
  return {
    user,
    supabase,
    workspaces: new WorkspaceRepository(supabase),
    projects: new ProjectRepository(supabase),
    tasks: new TaskRepository(supabase),
    activity: new ActivityRepository(supabase),
    members: new MemberRepository(supabase),
    comments: new CommentRepository(supabase),
    invitations: new InvitationRepository(supabase),
    notifications: new NotificationRepository(supabase),
  };
}

export async function requireWorkspaceMember(
  workspaceId: string,
  minimum: WorkspaceRole = "viewer",
): Promise<{
  ctx: TaskflowContext;
  membership: WorkspaceMemberRow;
}> {
  const ctx = await createTaskflowContext();
  const membership = await ctx.members.getMembership(workspaceId, ctx.user.id);
  assertRole(membership?.role, minimum);
  return { ctx, membership: membership! };
}

export async function requireWorkspaceRole(
  workspaceId: string,
  minimum: WorkspaceRole,
) {
  return requireWorkspaceMember(workspaceId, minimum);
}

export async function requireProjectAccess(
  projectId: string,
  minimum: WorkspaceRole = "viewer",
) {
  const ctx = await createTaskflowContext();
  const project = await ctx.projects.require(projectId);
  const membership = await ctx.members.getMembership(
    project.workspace_id,
    ctx.user.id,
  );
  assertRole(membership?.role, minimum);
  return { ctx, project, membership: membership! };
}

export async function requireTaskAccess(
  taskId: string,
  minimum: WorkspaceRole = "viewer",
) {
  const ctx = await createTaskflowContext();
  const task = await ctx.tasks.require(taskId);
  const membership = await ctx.members.getMembership(
    task.workspace_id,
    ctx.user.id,
  );
  assertRole(membership?.role, minimum);
  return { ctx, task, membership: membership! };
}

export function requireFound<T>(value: T | null | undefined, message: string): T {
  if (value == null) throw new NotFoundError(message);
  return value;
}
