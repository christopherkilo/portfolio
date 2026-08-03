# TaskFlow State Management

## Split

| Concern | Tool |
| --- | --- |
| Server entities + collaboration data | TanStack Query |
| Live sync | Supabase Realtime → Query invalidation (`RealtimeManager`) |
| Dialogs, density, week start, filters, connection/presence mirrors, conflict draft | Zustand UI store |
| Offline mutation outbox | IndexedDB via `mutationQueue` (memory fallback) — **not** Zustand, **not** Query |
| Progress / workload / activity sentences | Pure selectors over Query data |

## Offline queue vs Zustand vs TanStack Query

- **TanStack Query** — cache of server truth (tasks, attachments metadata, notifications, …). Mutations that succeed online update/invalidate here.
- **Zustand** — ephemeral UI: modals, `connectionStatus`, `presenceUsers` mirror, `conflictDraft`, `pendingOfflineCount`. Never the durable outbox.
- **Offline queue** — durable pending writes (`task_update`, `task_status`, `comment_create`, `notification_read`). Survives refresh via IndexedDB; replayed on reconnect; conflicts surface through Zustand + the same conflict dialog as online stale versions.

Do not put queued payloads into Query as “fake server rows,” and do not persist the outbox inside the Zustand `persist` slice (settings only).

## Optimistic mutations

Assign, comment create/delete, notification read, member role/remove use snapshot → rollback → invalidate. Versioned patches use `expectedVersion`; offline-safe patches enqueue instead of optimistically inventing a server version.

## Why Zustand still doesn’t hold server data

Two sources of truth cause drift. Query owns remote rows; Realtime refreshes Query; the outbox owns unsent writes; Zustand owns chrome.
