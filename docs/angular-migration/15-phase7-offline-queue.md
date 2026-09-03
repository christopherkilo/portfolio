# 15 — Phase 7 offline queue and replay

Phase 7 ports TaskFlow’s durable offline-mutation outbox to Angular. React/Next TaskFlow under `/demos/taskflow` remains the known-good product. Product UI there was **not** redesigned.

The outbox is **not** another server-state store:

```text
User performs an approved offline-safe action
        ↓
mutation serialized into Angular IndexedDB
        ↓
UI shows pending / attention counts (not a local Task[] database)
        ↓
network + authenticated session
        ↓
replay through existing Next API (current session cookies)
        ↓
server remains authoritative
        ↓
success → remove entry → domain .reload()
```

No entity cache in IndexedDB. No generic HttpInterceptor queue. No Phase 8 merge dialog. No comments/notifications/attachments queue types (those UIs do not exist in Angular yet).

---

## Current React offline architecture (inspected)

Sources: `lib/demos/taskflow/offline/mutationQueue.ts`, `replay.ts`, `safeMutations.ts`, `mutationQueue.test.ts`, `safeMutations.test.ts`, `TaskflowRealtimeBridge.tsx`, `useTaskflowRealtime.ts`, `ConnectionIndicator.tsx`, `hooks.ts` (`useUpdateTaskMutation`), `TasksView.tsx` archive path, `TeamView.tsx`.

### IndexedDB

| | |
| --- | --- |
| **Name** | `taskflow-offline-v1` |
| **Version** | `1` |
| **Store** | `mutations` (`keyPath: "id"`) |
| **Indexes** | none |
| **Fallback** | in-memory array if `indexedDB` is missing |

### Queue schema

`id`, `type`, `entityId`, `workspaceId`, `payload`, `expectedVersion?`, `createdAt`, `retryCount`, `status` (`pending` \| `failed` \| `conflict`), `errorMessage?`.

No `userId`. No tokens/cookies/secrets. Replay uses whatever session cookies exist at send time.

### Offline-safe types (React)

`task_update`, `task_status`, `comment_create`, `notification_read`.

`patchTaskWithVersion` queues when `isConnectionOffline()`: browser `navigator.onLine === false` **or** Zustand realtime `connectionStatus === "offline"`. Status-only body (`{ status }`) → `task_status`; otherwise `task_update`. Payload is stored **without** `expectedVersion`; that field is merged back at replay.

Create task is **not** queued. Task DELETE is **not** queued. Archive goes through `updateTask` / `patchTaskWithVersion` with `{ archived: true }`, so React **will** queue archive as `task_update`. Project PATCH throws `OFFLINE_UNSAFE_ACTION` 503. Comment create and notification read enqueue from those React components (not present in Angular).

### Explicitly unsafe (React)

Two lists exist (observed Phase 0 mismatch):

- `mutationQueue.UNSAFE_OFFLINE_ACTIONS`: `member_role`, `member_remove`, `invitation_accept`, `invitation_create`, `attachment_delete`, `destructive_delete`, `ownership_change`
- `safeMutations.UNSAFE_OFFLINE_ACTIONS`: `role_change`, `member_remove`, `invitation_accept`, `invitation_create`, `destructive_delete`, `ownership_change`

Client throws `TaskflowApiError` 503 `OFFLINE_UNSAFE_ACTION` with “This action needs an active connection.” Project PATCH: “Project changes need an active connection.”

### Enqueue vs transport failure

React queues **only** when already classified offline **before** the request. It does **not** enqueue after a mid-request transport failure while `navigator.onLine` is still true. Online 400/401/403/404/409/500 are never converted into queue entries.

### Replay

Triggers:

1. `TaskflowRealtimeBridge` when `connectionStatus === "online"` (also due-date nudges)
2. `useTaskflowRealtime` `onReconnectSuccess` (invalidate workspace keys **and** replay)

Algorithm (`replay.ts`):

- pending **or** failed (not `conflict`)
- sort `createdAt` localeCompare (oldest first)
- sequential `for` (no `Promise.all`)
- `task_update` / `task_status` → `PATCH /api/tasks/:id` with `{ ...payload, expectedVersion }`
- 409 → status `conflict`, `retryCount++`, Zustand `setConflictDraft` with `latest`, **stop**
- any other error → status `failed`, `retryCount++`, **stop**
- success → `removeQueuedMutation`

Failed entries **are** retried on the next replay pass. Conflicted entries are not.

There is **no** in-process replay lock and **no** Web Locks / BroadcastChannel. Two React tabs can theoretically double-replay.

There is **no** auth gate: replay does not check `/api/me`. 401 is treated as a generic failure (marked `failed`).

### Logout / user ownership

React does **not** store `userId` and does **not** clear the outbox on logout. User B on the same origin **can** replay User A’s queue. This is unsafe. Angular does **not** copy it.

### UI

`ConnectionIndicator`: realtime label + `N pending` + `N need attention` (`failed + conflicted`). No overlay of queued payloads onto task rows. Returning `"queued"` from `patchTaskWithVersion` is treated as mutation success by TanStack (editor closes; count bumps).

### Answers to the Phase 7 inspection list

1. Safe: `task_update`, `task_status`, `comment_create`, `notification_read`
2. Unsafe: role/member/invite/attachment-delete/destructive/ownership/project PATCH
3. Create task: **not** safe
4. Task PATCH: **safe** (`task_update`)
5. Status changes: **safe** (`task_status`)
6. Project mutations: **unsafe**
7. Comment create: **safe in React**; not implemented in Angular
8. Notification read: **safe in React**; not implemented in Angular
9. 409 during replay: mark `conflict`, keep `expectedVersion`, stash `latest` in Zustand (not IDB), stop
10. Generic 4xx: mark `failed`, stop
11. 5xx/network: mark `failed`, stop
12. Automatic retry: yes, on next online/reconnect, for pending+failed
13. Stop after first failure: **yes**
14. Later entries may depend on earlier: assumed; that is why replay is ordered and stops
15. Logout: **retains** queue; **no** user binding (unsafe)

---

## Angular IndexedDB

| | |
| --- | --- |
| **Name** | `taskflow-angular-offline-v1` |
| **Version** | `1` |
| **Store** | `mutations` (`keyPath: "id"`) |
| **Indexes** | `createdAt`, `userId` |
| **Fallback** | process memory if IDB unavailable |

React `taskflow-offline-v1` is **never** opened. Two frameworks cannot replay the same mutation.

---

## Queue model

```text
id, type, userId, workspaceId, entityId, payload,
expectedVersion?, createdAt, retryCount,
status: pending | failed | conflict,
errorMessage?, latest?
```

`userId` is required (cross-account protection). `latest` is stored on 409 so Phase 8 can recover after reload. Payload is stripped of `expectedVersion` and rejected if it contains credential-like keys.

Counts are **derived** from entries: `pending`, `failed`, `conflicted`, `totalNeedsAttention`.

---

## Offline-safe mutations (Angular Phase 7)

Only types that exist in this app:

- `task_update` — task editor PATCH, including archive `{ archived: true }` (matches React)
- `task_status` — board status-only PATCH

Enqueue when:

- browser is offline (`navigator.onLine === false`), or
- an approved PATCH fails with a **transport** error (`HttpErrorResponse.status === 0` / `TypeError`)

Not when Realtime is disconnected while HTTP still works (Phase 7 STEP 6; unlike React’s `isConnectionOffline` OR).

---

## Explicitly unsafe mutations

Never queued. `assertOnlineForUnsafeAction` throws 503 `OFFLINE_UNSAFE_ACTION`:

- task create, delete, assignee add/remove / mixed assignee+field edits
- project create / rename / archive
- member role change, member remove
- invitation create, revoke, accept
- comment create, notification read (not implemented; still rejected)
- attachment delete, ownership change

Team UI copy is unchanged (“Role changes require an active connection.” etc.). Invite accept also uses the shared 503 message.

---

## Network vs realtime vs replay

| Signal | Owner | Meaning |
| --- | --- | --- |
| `NetworkStatusService.online` | browser `online`/`offline` | reachability only |
| `RealtimeService.connectionStatus` | Supabase channel | socket health |
| `MutationQueueService` counts | IndexedDB | unsent / failed / conflicted writes |

Realtime disconnected ≠ queue every mutation.

---

## Enqueue flow

`TaskMutationsService.update` / `changeStatus` / `archive` → if offline or transport failure → `MutationQueueService.enqueue` with **queue-time** `expectedVersion`. No interceptor. GET is never queued. 403/409 HTTP responses are never converted into pending retries.

Form language on queue accept: “Saved locally — waiting to sync” (editor + pending count in the indicator). Not “Saved.”

Pending UI does **not** overlay queued payloads onto `httpResource` task rows (matches React).

---

## Replay lifecycle

`OfflineReplayService` (one owner per Angular instance):

1. Auth status is `authenticated` and `currentUser` exists
2. Browser reports online
3. Queue has hydrated
4. Drain `pending` + `failed` for **that user only**, oldest `createdAt` first, one at a time
5. `PATCH /api/tasks/:id` with stored payload + stored `expectedVersion` (never rebased)

Triggers: shell `effect` (auth + network, untracked), realtime `reconnects$`, both funneled through `tryReplay()`.

### Stop-on-failure

| Result | Queue | Continue? |
| --- | --- | --- |
| 2xx | remove | yes |
| 409 STALE_VERSION | `conflict`, keep `expectedVersion` + `latest`, reload tasks/activity | **stop** |
| 401 | leave `pending` (auth interceptor handles session) | **stop** |
| transport | leave `pending` | **stop** |
| 403 | `failed`, reload members | **stop** |
| 4xx validation / 5xx | `failed` | **stop** |

Failed entries retry on a later replay. Conflicted entries wait for Phase 8.

### Concurrent / multi-tab

- In-process `inFlight` flag (synchronous, before any `await`)
- `navigator.locks.request('taskflow-angular-outbox-replay')` when Web Locks exist (released when the tab closes)

If Web Locks are missing, same-tab double loops are still prevented; two tabs without locks have the same risk as React. Documented, not ignored.

### Realtime coordination

Reconnect still coalesces domain reloads (Phase 6 `auditTime` 75ms). Replay success also `tasks.reload()` + `activity.reload()`. One extra coalesced reload is acceptable. Replay does not invent a second invalidation engine.

---

## Sync UI

`tf-connection-indicator` (TopNav):

- Label: browser Offline **or** realtime status text
- `N pending`
- Conflict: “1 offline change needs conflict resolution.”
- Other failures: “N need attention”
- `role="status"` + `aria-live="polite"` + `aria-label`/`title` (not color-only)
- Extra count text from `48rem` (same idea as React `md:inline`)

---

## User / logout

Queue is **not** deleted on logout (do not casually destroy user work). Replay is filtered by `userId`. User B never sends User A’s mutations. Workspace id on the record is not rewritten from the current UI workspace.

---

## Security

- [x] no auth token in the offline DB
- [x] no Supabase secret
- [x] queue bound to `userId`
- [x] unsafe permission mutations never queue
- [x] server auth still runs on replay
- [x] `expectedVersion` retained
- [x] 403 cannot be bypassed
- [x] account switch cannot cross-replay
- [x] React and Angular databases isolated

---

## Tests

Angular `ng test --watch=false`: **194 passed**. Coverage includes DB name isolation, durability across service recreation, createdAt order, counts, policy (safe PATCH vs unsafe team/invite/project, GET/403/409 not queued), auth gate, sequential replay, in-flight lock, Web Locks name/release, 401/403/409/5xx/transport, expectedVersion N vs server N+1, cross-user filter, workspace id preserved.

---

## Manual offline validation

Google interactive consent is unavailable unattended. **PARTIAL.** Cases A–G were not executed against a live Google session in this pass.

---

## Style budget warning

Phase 4: `tasks-page.scss` ~281 bytes over the 4 kB `anyComponentStyle` warning. **DEFERRED.** Indicator/editor styles are component-local and were not used to hide it.

---

## REACT → ANGULAR OFFLINE LESSONS

1. **The outbox is a request log, not a replica.** Porting IndexedDB as a Task[] store would fight RLS, mappers, and `expectedVersion`.
2. **React’s missing `userId` is a product bug, not a port target.** Same-origin User B must not replay User A. Angular stores `userId` and filters replay.
3. **React ORs realtime-offline into enqueue.** Phase 7 forbids treating a dead socket as “queue everything.” Angular enqueues on browser offline + transport failure only.
4. **`expectedVersion` is frozen at queue time.** Rebasing to live `httpResource.version` on replay is a silent overwrite.
5. **401 during replay is not “failed work.”** It is a session problem. Leave the row pending; let the auth interceptor run.
6. **Stop-on-failure is load-bearing.** Mutation 2 may assume Mutation 1 landed.
7. **Two tabs plus one IDB need a small lock, not a framework.** In-process flag + Web Locks is enough. React has neither.
8. **Reconnect + replay + postgres_changes must share Phase 6 coalescing.** Do not add an offline-specific invalidator.
9. **Queue acceptance is not a server save.** “Saved locally — waiting to sync” plus pending counts; never a fake success toast.
10. **Distinct DB names are the HOST-001 fix.** `taskflow-angular-offline-v1` vs `taskflow-offline-v1` is non-negotiable while both apps share an origin.

---

## Phase 7 acceptance

Workspace-isolated Angular IDB; only `task_update` / `task_status` queue; unsafe team/invite/project stay online-only; durable queue; authenticated sequential replay; 409 preserves mutation + `latest`; `expectedVersion` not rebased; cross-user filter; sync indicator; tests + production build; React UI unchanged.
