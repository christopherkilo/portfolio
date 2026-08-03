# TaskFlow Realtime

## Strategy

Optimistic Query updates first → API persists → Realtime invalidates scoped keys.

**RealtimeManager is not a second app store.** It coordinates one workspace channel, presence sync, and connection status, then calls invalidate handlers so TanStack Query refetches. Server entities stay in Query; UI chrome (including mirrored presence list) stays in Zustand.

## Workspace-scoped assignees

`task_assignees.workspace_id` is required and kept equal to `tasks.workspace_id` by trigger.

Realtime filter:

`workspace_id=eq.{activeWorkspaceId}`

Events from another workspace are ignored so Workspace A assignments do not refresh Workspace B.

Channel name: `taskflow-workspace-{workspaceId}` (`workspaceChannelName`).

## Tables

`tasks`, `task_assignees`, `projects`, `comments`, `activity_events`, `task_attachments`, `workspace_members`, `workspace_invitations`, `notifications` (by `user_id`)

## Presence

Ephemeral Presence on the same channel (`PRESENCE_SAFE_FIELDS` only). See [TASKFLOW_PRESENCE.md](./TASKFLOW_PRESENCE.md).

**Live cursors intentionally omitted** — TaskFlow has no shared canvas surface.

Duplicate `start` for the same workspace+user while a channel exists is a no-op.

## Reconnect (Phase 3 stabilization)

`RealtimeManager` uses **bounded exponential backoff** on channel error/timeout/unexpected close: 1s → 2s → 4s … capped at **30s** (`backoffDelayMs`). Successful subscribe resets the attempt counter and can trigger an authoritative refetch (`onReconnectSuccess`). Browser online/offline notifications schedule or pause reconnect without inventing a second store.
