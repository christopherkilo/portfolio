# 17 — Phase 9 product surfaces (comments, attachments, history, notifications, audit)

Phase 9 completes the remaining major TaskFlow surfaces in Angular. React/Next TaskFlow under `/demos/taskflow` remains the known-good product and was **not** changed.

Architecture stays:

```text
Angular UI
    ↓
existing Next API
    ↓
server/taskflow
    ↓
Supabase / Storage / RLS
```

The Phase 6 browser Supabase client remains **Realtime + Presence only**. Attachment bytes move through **server-issued signed URLs**, never through unrestricted Storage SDK access.

---

## React behavior inventory (inspected)

### Comments

Sources: `TaskComments.tsx`, `commentQueries.ts`, `commentService.ts`, `commentRepository.ts`, `app/api/taskflow/tasks/[taskId]/comments/route.ts`, `app/api/taskflow/comments/[commentId]/route.ts`.

| | |
| --- | --- |
| **List** | `GET /api/taskflow/tasks/:id/comments`. Viewer + task access. Ordered `created_at` **ascending**. Soft-deleted omitted. Author joined from `profiles`. |
| **Create** | `POST` `{ body }` 1–4000 trimmed. Member+. Records activity `commented`. Notifies assignees except author. |
| **Edit** | `PATCH /api/taskflow/comments/:id` `{ body }`. Author **or** admin+. |
| **Delete** | `DELETE` same path. Soft-delete. Author or admin+. Activity `comment_deleted`. No confirm dialog. |
| **UI** | Loaded only in task detail (`TasksView`), not cards. Loading / error+retry / empty “No comments yet”. Relative timestamps. Initials + display_name/email. Viewer copy: “Viewers can read comments but cannot post.” |
| **Optimistic** | Create/delete optimistic in TanStack; rollback on error. Angular does **not** copy optimistic writes (Phases 4–8 pattern). |
| **Realtime** | Workspace channel `comments` → invalidate `taskflowKeys.comments(taskId)` + default tasks/activity. |
| **Offline** | If `isConnectionOffline()`, enqueue `comment_create` `{ body }` with `entityId = taskId`. Clears textarea and shows pending note. Replay `POST` same payload. **Not idempotent** (server assigns id). |

### Attachments

Sources: `TaskAttachments.tsx`, `attachmentQueries.ts`, `limits.ts`, `attachmentService.ts`, `TASKFLOW_ATTACHMENTS.md`.

Flow (actual):

```text
POST .../attachments/initiate { fileName, mimeType, sizeBytes }
  → pending metadata + signed PUT URL (path chosen by server)
client PUT file to signedUrl (Content-Type, x-upsert: false)
POST .../attachments/complete { attachmentId }
  → verify Storage object → status ready + activity
GET .../attachments/:id/download → signed GET URL, window.open
DELETE .../attachments/:id → soft-delete (unsafe offline)
```

| Constraint | Value |
| --- | --- |
| Max size | 10 MB |
| MIME | `image/png`, `image/jpeg`, `image/webp`, `application/pdf`, `text/plain` |
| List | Ready + not deleted, `created_at` descending |
| Upload UI | Hidden native file input + “Add file”. **No drag/drop.** Disabled when offline (`isConnectionOffline`). |
| Delete | No confirm. Disabled offline. `canEdit` = same as `canComment` (member+). Server: uploader or admin/owner. |
| Storage | Private bucket `taskflow-attachments`. Path `{workspaceId}/{taskId}/{attachmentId}/{safeName}` **server-built**. |

Failed PUT does **not** call complete. Pending rows age out via `cleanup_stale_pending_attachments` (24h).

### Task history

Sources: `TaskHistoryPanel.tsx`, `getTaskHistory`, `GET /api/taskflow/tasks/:id/history`.

- Viewer + task access.
- Loads workspace activity (limit 100) then **filters** to this task.
- Newest first (`created_at` desc).
- UI shows first **12**.
- Formatter: `changes[key].from → to` or `summary`. Heading is raw `action`.
- No retry control in React (gap). No actor name.
- Realtime: activity/task invalidation, not a second stream.

### Notifications

Sources: `TopNav.tsx`, `notificationQueries.ts`, `notificationService.ts`, `notificationRepository.ts`.

| | |
| --- | --- |
| **List** | `GET /api/taskflow/notifications` — current user, limit 40, `created_at` desc. |
| **Unread** | Derived client-side: `!read_at`. No count endpoint. |
| **Mark one** | `PATCH /api/taskflow/notifications/:id/read`. Optimistic; rollback on error. |
| **Mark all** | `POST /api/taskflow/notifications/read-all` `{ count }`. Optimistic; rollback. |
| **Nav** | Only `entity_type === "task" && entity_id` → `/demos/taskflow/tasks?task=id`. Others mark-read only. **No arbitrary URLs.** |
| **Realtime** | `notifications` table (filter `user_id`) → invalidate notifications key **only**. |
| **Offline queue type** | `notification_read` is in React’s *safe type list and replay*, but **TopNav never enqueues**. Offline clicks just fail/hang on the PATCH. |
| **Grouping** | Server `occurrence_count` / `last_occurred_at`. UI: `N× title`. |

### Audit

Sources: `AuditView.tsx`, `getWorkspaceAudit`, `GET /api/taskflow/workspaces/:id/audit`.

- Admin+ else `AUDIT_ACCESS_DENIED` **403**. React `/audit` is **not** role-gated; page shows a permission message.
- Server loads 200 newest, then filters `entityType`, `action`, optional `actorId`.
- React UI: entity select (all/task/project/member/workspace) + free-text action + Refresh. **No actor filter. No pagination.**
- Shows action, entity type/title, relative time, summary, JSON `changes` if present.
- Query `retry: false`.

Dashboard activity (`GET /api/activity`) is a **related but separate** feed (workspace-scoped, mapped `ActivityItem`). History/audit use the richer `ActivityEventRow` (`changes`, `metadata`). Do not unify the three UIs into one store.

---

## Angular architecture

Narrow services (no global store, no NgRx, no TanStack):

| Service | Owns |
| --- | --- |
| `CommentsDataService` | comments for **active task id** only |
| `CommentMutationsService` | create / update / delete |
| `AttachmentsDataService` | attachments for active task |
| `AttachmentMutationsService` | initiate / PUT signed / complete / delete / download |
| `TaskHistoryDataService` | history for active task |
| `NotificationsDataService` | current-user notifications |
| `NotificationMutationsService` | mark one / mark all |
| `AuditDataService` | workspace audit + filters |

Task detail (`?task=`) sets `activeTaskId` on comments/attachments/history. Cards never fetch those resources.

---

## Comment architecture

- `httpResource` URL is undefined until a task is selected.
- Create via Reactive Form (`body`, trimmed, max 4000). Loading + double-submit guard. Draft kept until server 2xx.
- Success: reload comments + activity.
- Edit/delete for author or admin+ (UX); 403 remains authoritative.
- Realtime `comments`: coalesced `comments.reload()` + `activity.reload()`. **Not** `tasks.reload()` / `reloadAll()`.

### Comment offline decision

**Online-only.**

React queues `comment_create`, but replay `POST { body }` is **not idempotent**. A lost success + replay duplicates a user-visible message. Phase 9 will not copy that convenience. Offline create throws `OFFLINE_UNSAFE_ACTION` (same family as projects).

`comment_create` stays in `UNSAFE_OFFLINE_ACTIONS` and is **not** added to `ANGULAR_QUEUEABLE_TYPES`.

---

## Attachment / storage architecture

Same three-step flow as React. Angular `fetch` PUT to the **signed URL from initiate**. The browser Supabase client is not used for Storage.

Mapping **omits** `storage_path`. UI never lets the user supply a bucket or path.

Offline upload/delete: `assertOnlineForUnsafeAction`. **No file bytes in IndexedDB.**

### Attachment security

- No service-role key in Angular
- Path/bucket chosen by server
- Signed upload/download URLs from API
- MIME/size checked client (UX) and server (authority)
- Delete not queued
- Download opens API-provided URL with `noopener`

---

## Task history model

`GET /api/taskflow/tasks/:id/history` → newest first, UI cap **12** (React). Formatter in `history-format.ts`: known actions get readable sentences; `changes.from/to` mapped through status/priority labels when those keys appear; unknown actions fall back to `summary` or “Updated this item.” No client-synthesized events.

Realtime: `activity_events` / task updates coalesced into `history.reload()` + existing activity reload.

---

## Notification model

`GET /api/taskflow/notifications`. `unreadCount` = items without `read_at`.

Mark-read / mark-all: wait for server, then `notifications.reload()`. **No optimistic decrement** (unlike React). Failure leaves unread state unchanged.

Navigation: only UUID task ids → `/tasks?task=<id>`. Reject `javascript:`, `http(s):`, and non-id strings.

### Notification offline decision

**Online-only.**

`notification_read` is replay-safe in principle (PATCH is idempotent), but React’s UI **does not enqueue** it. Angular will not invent a queue path the product UI does not use. Offline mark-read uses the existing 503 unsafe-action path.

Realtime: `notifications` → `notifications.reload()` only.

---

## Audit model

`GET /api/taskflow/workspaces/:id/audit?entityType=&action=`. Bounded 200. Same filters as React UI. 403 / `AUDIT_ACCESS_DENIED` → in-page permission state (no `permissionGuard`). `canViewAudit` is UX only.

---

## Permissions (UX)

| Flag | Rule |
| --- | --- |
| `canComment` / `canUploadAttachment` / `canDeleteAttachment` | member+ (`canEditTask`) |
| Own comment edit/delete | `author_id === currentUserId` **or** admin+ |
| `canViewAudit` | admin+ (existing) |

---

## Realtime invalidation (Phase 6 coalescing, 75ms)

| Table | Reloads |
| --- | --- |
| `notifications` | notifications only |
| `comments` | comments + activity + history |
| `task_attachments` | attachments + activity + history |
| `activity_events` | activity + history + audit |
| `tasks` | tasks + activity + history + audit |
| `projects` | projects + tasks + activity + history + audit |
| `workspace_members` | members + tasks + activity + history + audit |
| default | tasks + activity + history + audit |

Reconnect: workspace domains **plus** comments, attachments, history, notifications, and audit. Conflict dialog state is untouched (Phase 8). Domain `.reload()` remains the unit of work — there is still no `reloadAll()` default.

---

## Offline + realtime

`NetworkStatusService` / `navigator.onLine` still gate enqueue vs unsafe. Realtime `offline` is not treated as browser offline. Comments/attachments/notification writes never inspect Realtime connection status.

---

## Auth / logout

Notifications resource URL is undefined when unauthenticated (list clears to default). Active task ids cleared when the tasks page destroys. Queue remains user-bound. Signed download URLs are not persisted.

---

## Accessibility

Comments: labeled textarea, validation, busy submit. Attachments: visually hidden file input with accessible trigger, upload status, labeled Download/Delete. Notifications: named trigger, unread in accessible name + text (not color-only), Escape/click-outside, `aria-expanded`. Audit: headings, labeled filters. History: chronological list.

---

## Tests

Angular `ng test --watch=false`: **275 passed**. Coverage includes load/empty/error/retry, create validation, draft preservation, permission-disabled composer, coalesced comment/notification reloads, offline rejection, no file bytes in the outbox, mark-read failure (no fake unread decrement), safe notification navigation, 403 audit, unknown history events, and Phase 4–8 regressions.

Production build: **PASS**. `tasks-page.scss` anyComponentStyle warning: **FIXED** by moving task-detail styles into `TaskDetailPanel`.

Portfolio `tsc --noEmit` + `vitest run`: **366 passed**.

---

## Manual parity

Human two-client React + Angular session was not available. **PARTIAL.**

---

## REACT → ANGULAR PRODUCT-SURFACE LESSONS

1. **Parity is not a license to copy unsafe offline behavior.** React queues `comment_create`, but the POST is not idempotent. Angular kept comments online-only rather than reproducing duplicate-on-replay.
2. **Replay-type lists can lie about the product.** `notification_read` is in React’s safe-type enum, but TopNav never enqueues it. Queue policy must follow the actual UI path, not the type union.
3. **Signed Storage URLs are not a browser data client.** The Phase 6 Realtime/Presence boundary holds: Angular PUTs to a server-issued URL and never uses the Supabase JS client for buckets or tables.
4. **Do not map `storage_path` into UI models.** Once it is on a view-model, templates and tests start treating it as data. Omitting it is cheaper than sanitizing later.
5. **Notification payloads are not routes.** Only UUID task ids become `/tasks?task=`. Arbitrary `entity_id` strings (including `https://` and `javascript:`) are ignored.
6. **History, dashboard activity, and audit share a row shape but not a store.** Reuse a formatter (`formatHistoryEvent`); keep three `httpResource` owners.
7. **Realtime should invalidate the domain that changed.** Comment events must not reload the task board. Notification events must not reload activity. Coalescing still collapses a burst into one reload per domain.
8. **Client validation is UX; MIME is not proof.** Size/type/extension checks catch mistakes early. Initiate/complete still enforce the same rules on the server.
9. **Never put File/Blob in the Phase 7 outbox.** Offline upload/delete fail with the existing 503 unsafe-action message.
10. **Audit authorization is a 403 page, not a missing route.** Viewers can open `/audit`; the API remains authoritative.
11. **Extracting task-detail styles is the right budget fix.** Expanding comments/attachments/history in `tasks-page.scss` would have raised the warning. A dedicated panel component removed duplication without a visual redesign.
12. **Do not synthesize audit events on the client.** Unknown actions fall back to `summary` / action name. Empty history is empty.
