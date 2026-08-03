# TaskFlow Presence

Phase 3 ephemeral “who’s here” via Supabase Realtime Presence — not a second data store.

## Architecture

`RealtimeManager` (`lib/demos/taskflow/realtime/RealtimeManager.ts`) owns one workspace channel:

`taskflow-workspace-{workspaceId}` (`workspaceChannelName`)

On subscribe it `track`s a **safe** presence payload:

- `userId`, `displayName`, `avatarUrl`
- `workspaceId`, `currentView`, `currentEntityId`
- `lastActiveAt`

Those fields are listed in `PRESENCE_SAFE_FIELDS`. Presence is **never** written to Postgres. Zustand only mirrors the list for avatars/indicators; TanStack Query remains the server-entity cache.

**Authoritative local self-presence:** `RealtimeManager` keeps `selfPayload` in memory and re-`track`s that payload on subscribe/reconnect/`updatePresence`. It never falls back to a generic identity when the channel flaps.

`start(workspaceId, userId, self)` is idempotent for the same workspace+user while a channel already exists (duplicate start is a no-op). Switching workspace calls `stop()` first.

Connection status (`online` / `reconnecting` / `offline`) updates from channel subscribe lifecycle (bounded backoff reconnect — see [TASKFLOW_REALTIME.md](./TASKFLOW_REALTIME.md)) and feeds the offline-aware UI.

### Intentionally omitted: live cursors

TaskFlow has **no shared canvas** (no Figma-like board, no multiplayer document surface). Live cursors would be noise without a spatial surface to attach them to. Presence is limited to avatars + coarse location (which view/entity), not pointer coordinates.

## ELI15

Presence is like a “who’s in the room” sticky on the door — names and which room they’re looking at — not little mouse arrows flying around a shared whiteboard. We skipped live cursors on purpose because TaskFlow isn’t a drawing board.

## Related

[TASKFLOW_REALTIME.md](./TASKFLOW_REALTIME.md) · [TASKFLOW_COLLABORATION.md](./TASKFLOW_COLLABORATION.md)
