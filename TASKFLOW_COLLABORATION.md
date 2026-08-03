# TaskFlow Collaboration

Phase 2 collaboration + stabilization, extended by Phase 3 resilience.

## Authoritative assignment model

`task_assignees` is the **sole assignment source of truth**.

`tasks.assignee_id` is a **denormalized primary assignee** kept in sync by a database trigger for UI compatibility. Clients and services must not treat a lone `assignee_id` write as assignment truth.

Task create uses `create_task_with_assignees` so task + assignees succeed or fail together. Assignment failures are never swallowed.

## Notification security

Direct INSERT on `notifications` is denied. Creation goes through SECURITY DEFINER RPCs (`create_taskflow_notification` / `create_or_group_notification`): actor = `auth.uid()`, recipient must be a workspace member, entity validated. Grouping coalesces unread rows by `group_key`; preferences can suppress types.

## Atomic vs best-effort

| Operation | Policy |
| --- | --- |
| Task + initial assignees | Atomic RPC |
| Invitation accept + membership | Atomic RPC |
| Invitation create (expire/replace) | Atomic RPC |
| Versioned task/project update | Atomic RPC (CAS on `version`) |
| Activity audit for core mutations | Required |
| User notifications | Best-effort (log, do not fail core) |

ELI15: Core work should not look failed just because a notification could not be delivered.

## Phase 3 collaboration surfaces

| Feature | Behavior |
| --- | --- |
| **Presence** | Ephemeral Realtime track on workspace channel; avatars + coarse view location. **No live cursors** (no shared canvas). |
| **Conflict** | `expectedVersion` + `STALE_VERSION` 409 → conflict dialog |
| **Offline-aware** | Safe mutations queue in IndexedDB; unsafe actions blocked (503) |
| **Attachments** | Private Storage + `task_attachments`; MIME/size limits |

## Immutable fields

RLS picks which rows you may touch. Triggers stop protected identity columns from changing (author, token_hash, workspace_id, …).

## Expired invitations

`create_workspace_invitation` revokes expired active rows for the same email, then inserts. Only a genuinely unexpired invitation blocks replacement.

## Related

[TASKFLOW_PERMISSIONS.md](./TASKFLOW_PERMISSIONS.md) · [TASKFLOW_REALTIME.md](./TASKFLOW_REALTIME.md) · [TASKFLOW_INVITATIONS.md](./TASKFLOW_INVITATIONS.md) · [TASKFLOW_PRESENCE.md](./TASKFLOW_PRESENCE.md) · [TASKFLOW_CONFLICT_HANDLING.md](./TASKFLOW_CONFLICT_HANDLING.md) · [TASKFLOW_OFFLINE_BEHAVIOR.md](./TASKFLOW_OFFLINE_BEHAVIOR.md) · [TASKFLOW_ATTACHMENTS.md](./TASKFLOW_ATTACHMENTS.md)
