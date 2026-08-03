import "server-only";

import { createTaskflowContext } from "@/server/taskflow/auth/authorization";
import type { NotificationPreferencesInput } from "@/server/taskflow/schemas";
import type { NotificationPreferenceRow } from "@/server/taskflow/types/database";

const DEFAULTS: Omit<NotificationPreferenceRow, "user_id" | "updated_at"> = {
  assignments: true,
  comments: true,
  mentions: true,
  due_dates: true,
  project_changes: true,
};

export async function getNotificationPreferences() {
  const ctx = await createTaskflowContext();
  const { data } = await ctx.supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  if (data) return data as NotificationPreferenceRow;

  return {
    user_id: ctx.user.id,
    ...DEFAULTS,
    updated_at: new Date().toISOString(),
  } satisfies NotificationPreferenceRow;
}

export async function updateNotificationPreferences(
  input: NotificationPreferencesInput,
) {
  const ctx = await createTaskflowContext();
  const patch = {
    user_id: ctx.user.id,
    assignments: input.assignments,
    comments: input.comments,
    mentions: input.mentions,
    due_dates: input.dueDates,
    project_changes: input.projectChanges,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await ctx.supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: ctx.user.id,
        assignments: input.assignments ?? true,
        comments: input.comments ?? true,
        mentions: input.mentions ?? true,
        due_dates: input.dueDates ?? true,
        project_changes: input.projectChanges ?? true,
        updated_at: patch.updated_at,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error || !data) {
    const current = await getNotificationPreferences();
    return {
      ...current,
      assignments: input.assignments ?? current.assignments,
      comments: input.comments ?? current.comments,
      mentions: input.mentions ?? current.mentions,
      due_dates: input.dueDates ?? current.due_dates,
      project_changes: input.projectChanges ?? current.project_changes,
    };
  }

  return data as NotificationPreferenceRow;
}

/** Best-effort due-date nudges when the user opens TaskFlow. */
export async function maybeCreateDueDateNotifications(workspaceId: string) {
  const ctx = await createTaskflowContext();
  const tasks = await ctx.tasks.listByWorkspace(workspaceId);
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  for (const task of tasks) {
    if (!task.due_date || task.status === "done") continue;
    if (task.due_date > soon) continue;
    const assignee = task.assignee_id;
    if (!assignee || assignee === ctx.user.id) {
      // notify self or skip — notify assignees including current user once
    }
    const target = assignee ?? ctx.user.id;
    await ctx.supabase.rpc("create_or_group_notification", {
      p_user_id: target,
      p_workspace_id: workspaceId,
      p_type: "task_due_soon",
      p_entity_type: "task",
      p_entity_id: task.id,
      p_title:
        task.due_date < today
          ? "Overdue task"
          : "Task due soon",
      p_message: task.title,
      p_metadata: { dueDate: task.due_date },
      p_group_key: `due:${target}:${task.due_date}`,
      p_dedupe_key: `due:${task.id}:${today}`,
    });
  }
}
