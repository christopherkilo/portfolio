# TaskFlow Database

## Migrations (apply in order)

1. `20260802120000_taskflow_phase1.sql`
2. `20260802160000_taskflow_phase2.sql`
3. `20260802180000_taskflow_stabilization.sql`
4. `20260802190000_taskflow_phase3.sql`
5. `20260802200000_taskflow_phase3_stabilization.sql`

## Stabilization highlights

- Dropped broad notification INSERT policy; added `create_taskflow_notification`
- Immutable-column triggers (comments, invitations, assignees, notifications)
- `task_assignees.workspace_id` NOT NULL + sync/consistency triggers
- `tasks.assignee_id` denormalized via `sync_task_primary_assignee`
- `create_task_with_assignees` atomic create
- `create_workspace_invitation` expired-row replacement

## Phase 3 highlights

- **Version columns:** `tasks.version`, `projects.version` (bigint, default 1)
- **Versioned RPCs:** `update_task_versioned`, `update_project_versioned` (compare-and-swap; `STALE_VERSION` on mismatch)
- **Audit columns on `activity_events`:** `changes` jsonb, `request_id`, `source`; append-only UPDATE/DELETE deny; entity/actor indexes
- **Attachments:** `task_attachments` (+ RLS); private Storage bucket `taskflow-attachments`
- **Notification grouping:** `group_key`, `occurrence_count`, `last_occurred_at`; unique unread group index; `create_or_group_notification`
- **Preferences:** `notification_preferences` (per-user toggles; RLS = own row only)

## Phase 3 final stabilization (`20260802200000`)

- **`attachment_status`:** `pending` | `ready` | `failed` | `deleted` (+ `completed_at` / `failed_at` / `activity_recorded_at`); immutable identity trigger; `cleanup_stale_pending_attachments(interval default 24h)`
- **Storage:** private `taskflow-attachments` bucket + object policies applied in SQL (select ready+member; insert/update pending uploader; delete uploader or admin/owner)
- **Versioned RPCs (jsonb `p_patch`):** omitted key = leave field; explicit JSON `null` = clear (e.g. `dueDate`, `estimate`); identical patch → return current (no version bump, no audit insert); meaningful update + `activity_events` insert atomic in the same RPC
- **Notifications:** unique unread index on `(user_id, workspace_id, group_key)`; grouping RPC matches that scope

Do not rewrite applied migrations.

See [TASKFLOW_CONFLICT_HANDLING.md](./TASKFLOW_CONFLICT_HANDLING.md) · [TASKFLOW_ATTACHMENTS.md](./TASKFLOW_ATTACHMENTS.md) · [TASKFLOW_AUDIT_HISTORY.md](./TASKFLOW_AUDIT_HISTORY.md).
