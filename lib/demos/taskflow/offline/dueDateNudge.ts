"use client";

/** Best-effort due-date nudges via API when the app opens online. */
export async function maybeCreateDueDateNotifications(workspaceId: string) {
  try {
    await fetch(
      `/api/taskflow/workspaces/${workspaceId}/due-nudges`,
      { method: "POST", credentials: "same-origin" },
    );
  } catch {
    /* ignore */
  }
}
