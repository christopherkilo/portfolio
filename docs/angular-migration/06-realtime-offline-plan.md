# 06 — Realtime and offline translation

Do not simplify this subsystem because Angular is new. Behavior is specified in `RealtimeManager.ts`, `useTaskflowRealtime.ts`, `TaskflowRealtimeBridge.tsx`, `mutationQueue.ts`, `replay.ts`, `safeMutations.ts`, and tests beside them.

Realtime **invalidates**. It is not a row store. The outbox is **not** UI state.

---

## Current realtime flow

```
TaskflowRealtimeBridge
  → useTaskflowRealtime(workspaceId, userId, self)
    → RealtimeManager.setHandlers / start / stop
```

On table events: `onInvalidate(table, payload)` → TanStack `invalidateQueries` (keys in `useTaskflowRealtime.ts`).

On reconnect success: invalidate workspace keys **and** `replayQueuedMutations()`.

When Zustand `connectionStatus === "online"`: due-date nudges `POST .../due-nudges` and replay (bridge).

Channel: `taskflow-workspace-{id}` (`workspaceChannel.ts`). Postgres changes on `WORKSPACE_TABLES` with `workspace_id=eq.{id}` (notifications by `user_id`).

Presence: `PRESENCE_SAFE_FIELDS` only; no DB; no cursors. Duplicate `start` same workspace+user = no-op.

Backoff: 1s × 2^n, cap 30s (`RealtimeManager.backoffDelayMs`). Browser offline pauses; online reschedules. Success resets attempt counter.

---

## Target Angular split

| Current | Angular | Why this split |
| --- | --- | --- |
| `RealtimeManager` class | `RealtimeService` (`providedIn: 'root'`) | One coordinator; same singleton semantics |
| `setHandlers` | inject `QueryCacheService` + `MutationQueueService`; call methods | Avoid callback soup; still not a store |
| Zustand `connectionStatus` / `presenceUsers` | signals **on RealtimeService** | Owner is realtime, UI only reads |
| `useTaskflowRealtime` effect | shell `effect()` + `DestroyRef`: start/stop when user+workspace change | RT-002 |
| `TaskflowRealtimeBridge` extra (nudges) | `DueNudgeService` called when status becomes `online` | Keep side effects out of the channel class |
| `workspaceChannel.ts` | same constants/module (port) | Do not rename tables |
| Browser supabase client | `SupabaseBrowserClient` factory, publishable key only | Same as React |

Suggested names are fine; **do not** add a `RealtimeStore` of tasks.

Phase 6 implemented this split as `RealtimeService` + `RealtimeCoordinatorService`. Coordinator maps table events to domain `.reload()` (native `httpResource`). There is no `QueryCacheService` and no TanStack Angular Query. Phase 7 `OfflineReplayService.tryReplay()` runs on reconnect and on browser online, behind an auth gate. Due-date nudges are not ported (notifications / later phase). `workspace_invitations` is subscribed, matching React, and does **not** reload invitations (React also does not invalidate invitation keys).

Angular starts/stops the channel from `TaskflowShell` on auth + workspace only. View/entity presence uses `updatePresence` (React restarts the channel on pathname change because `currentView` is in `useTaskflowRealtime` deps; Angular does not copy that reconnect storm).

Ordinary reads/writes stay HttpClient → Next API → `server/taskflow` + RLS. The publishable browser client is **Realtime + Presence only**.

### Invalidation map (preserve)

Port the table → key mapping from `useTaskflowRealtime.ts`:

- `notifications` → notifications key only
- default → tasks + activity
- `workspace_members` → members
- `comments` + `task_id` → comments(taskId)
- `task_assignees` + `task_id` → assignees(taskId)
- `task_attachments` + `task_id` → `["taskflow","attachments",taskId]`
- `projects` / `workspace_invitations` as in the remaining file lines

Reconnect: full workspace invalidate + replay (same as `onReconnectSuccess`). Phase 7 implemented Angular replay in `OfflineReplayService` (auth-gated, coalesced with Phase 6 domain reloads). Due-date nudges are not ported.

### RxJS vs signals

Inside `RealtimeService`:

- `fromEvent(window, 'online'|'offline')` for pause/resume
- `timer` for backoff
- supabase callback → `NgZone.run` → update signals + `query.invalidate`

Public API: signals + `start({ workspaceId, user, self })` / `stop()`.

`effect()` in AppShell is the only place that calls `start`/`stop`. Components must not each subscribe to a channel (RT-001).

### PresenceService

Can be a **facade** over `RealtimeService.presenceUsers` if templates get noisy. Do not open a second channel.

### NetworkStatusService

Browser `navigator.onLine` is **not** identical to Realtime `connectionStatus` (see `isConnectionOffline()` in `safeMutations.ts`: offline if **either** browser offline **or** status `offline`). Preserve that OR.

---

## Current offline flow

IndexedDB `taskflow-offline-v1` / store `mutations`. Memory fallback if IDB missing.

Enqueue when `patchTaskWithVersion` sees `isConnectionOffline()`.

Replay (`replay.ts`): pending+failed, sort `createdAt`, stop on first hard failure or 409. 409 → status `conflict`, `setConflictDraft` with `latest`.

Counts: pending, failed, conflicted, `totalNeedsAttention` (failed+conflicted).

Unsafe: client throws `OFFLINE_UNSAFE_ACTION` 503 (project PATCH, role, invites, deletes, attachment delete, …).

---

## Target offline

| Current | Angular |
| --- | --- |
| `mutationQueue.ts` | `MutationQueueService` — same schema, statuses, counts |
| `replay.ts` | `ReplayService` or methods on the queue service |
| `safeMutations.ts` | `VersionedPatchService` (task/project PATCH + enqueue + auto-reconcile) |
| Zustand counts | `computed` from queue list signal |
| `ConflictDialog` | `ConflictCoordinator` |

**Preserve:**

- IndexedDB durability (and memory fallback)
- Safe vs unsafe distinction (unify the two string lists — see observed bug)
- `createdAt` replay order
- Stop-on-failure
- 409 → conflict + keep `latest` + `expectedVersion` on the draft
- Status-only auto-reconcile once
- Queue counts including conflicted

**Do not** put queued payloads in `UiStateService`.

**Do not** replay from a component `ngOnInit` except via the same triggers: reconnect success, transition to `online`, explicit retry control if one exists.

### HOST-001 (same origin as React)

If Option A serves Angular on the **same origin** as React, default IDB name `taskflow-offline-v1` is shared. Two apps could replay the same queue. Angular should use a **distinct** DB name until React is retired, **or** a documented single-writer lock. Prefer distinct name: `taskflow-angular-offline-v1`.

localStorage `taskflow-ui-v1` would also clash (density, workspace id). Use `taskflow-angular-ui-v1`.

---

## Conflict handling (tied to both)

`handleConflict` in `safeMutations.ts` sets `conflictDraft` on 409/`STALE_VERSION`. Replay does the same for queued items.

Angular: any 409 from `TasksApi.patch` / `ProjectsApi.patch` / replay goes through `ConflictCoordinator.open(draft)`. Dialog options: keep draft (retry with new `expectedVersion` from `latest` or keep client fields) vs reload latest into form/cache.

Never drop `latest` on the error object (interceptor must not strip `data`).

---

## Milestone coupling

- Realtime without a query cache will “work” and still show stale boards → Milestone 3 cache first, Milestone 6 realtime.
- Offline without versioned PATCH is dangerous → Milestone 4 CRUD, Milestone 7 queue, Milestone 8 conflict polish (conflict dialog can appear as soon as PATCH exists; full replay semantics in M7–M8).
