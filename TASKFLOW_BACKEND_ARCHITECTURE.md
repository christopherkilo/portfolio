# TaskFlow Backend Architecture

## Failure policy

**Required / atomic:** core row mutation, consistency constraints, invitation accept, task+assignees create, activity audit for those mutations, versioned task/project updates.

**Best-effort:** user-facing notifications after a successful core commit — failures are logged and do not flip the HTTP result to an error.

Phase 3 stabilization: task/project field updates and their audit rows commit **inside** `update_task_versioned` / `update_project_versioned`. Notifications stay best-effort after that commit.

## Assignment

Authoritative: `task_assignees`. Deprecation: stop treating `tasks.assignee_id` as writable truth; it remains a synced primary for display.

## Notification path

Service → `NotificationRepository.createViaRpc` → `create_or_group_notification` (SECURITY DEFINER; respects `notification_preferences` + unread grouping). Legacy `create_taskflow_notification` remains for simpler inserts where used.

Unread grouping uniqueness is `(user_id, workspace_id, group_key)` so the same `group_key` does not collide across workspaces.

## Phase 3 services / routes overview

| Area | Service | Route surface (under `/api/taskflow` or existing task/project APIs) |
| --- | --- | --- |
| Versioned updates | `taskService` / `projectService` → `update_*_versioned` RPCs (`p_patch` jsonb) | Task/project PATCH with `expectedVersion` |
| Attachments | `attachmentService` | `tasks/[taskId]/attachments` (+ initiate/complete), `attachments/[id]`, download |
| Audit / history | `auditService` (+ audit written in versioned RPCs) | `tasks/[taskId]/history`, `workspaces/[workspaceId]/audit` |
| Notification prefs / due nudges | `notificationPreferenceService` | `notification-preferences`, `workspaces/[workspaceId]/due-nudges` |
| Conflicts / offline | Domain errors + client outbox | `STALE_VERSION` 409 (+ `latest`), `OFFLINE_UNSAFE_ACTION` 503 (client-enforced) |
| Presence | N/A (ephemeral Realtime) | No Postgres write path |

New focused modules: `attachmentService.ts`, `auditService.ts`, `notificationPreferenceService.ts`.

## Phase 3 final stabilization

Migration `20260802200000_taskflow_phase3_stabilization.sql`:

- Attachment lifecycle `pending` → `ready` / `failed` / `deleted`; complete verifies Storage; only uploader completes; private bucket policies in SQL; `cleanup_stale_pending_attachments` (24h)
- JSONB patches: omitted key = leave alone; explicit `null` = clear; no-op identical patches return current row (no version bump, no audit)
- Update + audit atomic in versioned RPCs; notifications remain best-effort

## Repository layout

`taskAssigneeRepository.ts` is separate from `commentRepository.ts`.

See [TASKFLOW_COLLABORATION.md](./TASKFLOW_COLLABORATION.md) · [TASKFLOW_CONFLICT_HANDLING.md](./TASKFLOW_CONFLICT_HANDLING.md) · [TASKFLOW_ATTACHMENTS.md](./TASKFLOW_ATTACHMENTS.md) · [TASKFLOW_AUDIT_HISTORY.md](./TASKFLOW_AUDIT_HISTORY.md).
