# TaskFlow Offline Behavior

Phase 3 client outbox for safe mutations while disconnected.

## Architecture

Three layers stay separate:

| Layer | Owns |
| --- | --- |
| TanStack Query | Server entity cache (tasks, projects, …) |
| Zustand UI store | Connection status, conflict draft, pending count, chrome |
| IndexedDB outbox (`mutationQueue`) | Durable queued mutations (memory fallback if IDB missing) |

### Safe vs unsafe

**Safe to queue** (when browser/`connectionStatus` is offline):

- `task_update`, `task_status`, `comment_create`, `notification_read`

**Blocked offline** (`OFFLINE_UNSAFE_ACTION`, HTTP **503**):

- Role changes, member remove, invitation create/accept, destructive deletes, ownership changes, attachment deletes, project patches

`assertOnlineForUnsafeAction` and project versioned patches refuse to enqueue those.

### Replay

On reconnect, `replayQueuedMutations` drains pending/failed items in `createdAt` order. A **409** marks the queue item `conflict` and opens the same conflict UI as online stale writes (draft + **retained `latest` entity**). Other failures mark `failed` and stop the batch so order is preserved.

### Queue counts (`computeOfflineQueueCounts`)

| Field | Meaning |
| --- | --- |
| `pending` | Waiting to replay |
| `failed` | Replay error (non-409) |
| `conflicted` | Status `conflict` (stale version) |
| `totalNeedsAttention` | `failed + conflicted` |

Mirrored in Zustand for the connection indicator; pending is tracked separately from attention.

### Intentionally omitted

**Live cursors** are omitted — offline/outbox work is about durable mutations, not shared pointer state. No canvas surface exists to attach cursors to.

## ELI15

When the wifi drops, TaskFlow doesn’t pretend every action still works. Safe edits (like renaming a task) go into a backpack (the queue). Dangerous stuff (kicking someone out of the team) waits until you’re online again. When the connection returns, the backpack empties in order — and if someone else already changed that task, you get a conflict dialog instead of a silent overwrite.

## Related

[TASKFLOW_CONFLICT_HANDLING.md](./TASKFLOW_CONFLICT_HANDLING.md) · [TASKFLOW_STATE_MANAGEMENT.md](./TASKFLOW_STATE_MANAGEMENT.md)
