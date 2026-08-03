# TaskFlow Audit History

Phase 3 durable activity as audit trail + per-task history.

## Architecture

`activity_events` is append-only for ordinary clients (UPDATE/DELETE policies deny). Phase 3 adds:

- `changes` (jsonb) — structured before/after-style payload when recorded
- `request_id` — optional correlation id
- `source` — defaults to `api`
- Indexes on `(workspace_id, entity_type, entity_id, created_at)` and actor

### Atomic update + audit (Phase 3 stabilization)

For versioned task/project patches, the row update and `activity_events` insert happen **inside** `update_task_versioned` / `update_project_versioned`. No-op identical patches skip both version bump and audit. Notifications remain best-effort after the RPC succeeds.

Attachment `attachment_added` activity is recorded only after Storage-verified completion (idempotent — no duplicate on re-complete).

### APIs

| Endpoint intent | Who | Service |
| --- | --- | --- |
| Task history | Any member with task access (viewer+) | `getTaskHistory` |
| Workspace audit log | **Admin+** only | `getWorkspaceAudit` → `AuditAccessDeniedError` (**403**) for others |

Core mutations still **require** activity recording (failure fails the request). Notifications remain best-effort.

### UI

Task-level history panel + admin audit view consume these APIs. They read Query/API data — not a separate audit store and not Realtime presence.

### Intentionally omitted

**Live cursors** are unrelated to audit. Audit answers “what changed and who did it,” not “where is someone’s pointer right now.” No shared canvas.

## ELI15

Audit history is the black box recorder: every important change leaves a note that can’t be edited away by normal users. Looking at one task’s timeline is fine for everyone on the team; reading the whole workspace’s security-camera reel is only for admins.

The task update and its audit receipt are written together, so TaskFlow never changes the work without recording what happened.

## Related

[TASKFLOW_PERMISSIONS.md](./TASKFLOW_PERMISSIONS.md) · [TASKFLOW_DATABASE.md](./TASKFLOW_DATABASE.md) · [TASKFLOW_BACKEND_ARCHITECTURE.md](./TASKFLOW_BACKEND_ARCHITECTURE.md)
