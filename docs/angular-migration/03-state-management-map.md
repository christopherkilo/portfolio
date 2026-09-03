# 03 — State management translation

Preserve the **four-owner** split. Do not introduce one giant Angular store.

| Owner today | Job | Angular owner |
| --- | --- | --- |
| TanStack Query | Server entities / HTTP cache | Query-key cache (see below) |
| Zustand | UI + a few persisted chrome fields | `UiStateService` (signals) |
| RealtimeManager | Channel, presence, invalidate, reconnect | `RealtimeService` |
| IndexedDB queue | Durable unsent mutations | `MutationQueueService` |

Golden rule: **one source of truth per category.** Realtime does not hold tasks. Queue does not hold the board. UI store does not hold members.

NgRx is **not** recommended. It does not match these lifetimes and would duplicate Query.

---

## 1. Server entities (tasks, projects, members, …)

| | |
| --- | --- |
| **Current owner** | TanStack Query (`query/client.tsx`, hooks under `api/` and `queries/`) |
| **Source of truth** | HTTP + Postgres via RLS. Cache is a **replica** with `staleTime` 15s |
| **Persistence** | Memory only (Query cache) |
| **Realtime** | Invalidate keys; do not merge rows from payloads |
| **Target** | `QueryCacheService` **or** `@tanstack/angular-query` |

### Signals / RxJS

- Cached rows exposed to templates as **signals** (`data`, `isPending`, `error`)
- Fetches via `HttpClient` (Observable internally); convert with `firstValueFrom` or async resource
- `computed()` for board columns / calendar days derived from cached task arrays
- **No** `effect()` that writes Query data into `UiStateService`

### Why native `HttpClient` + ad-hoc `signal()` maps is risky

The live system depends on:

- stable **query keys** (`workspaceKeys.ts`, `attachmentKeys`)
- `setQueryData` snapshots for optimistic rollback
- `invalidateQueries` from Realtime **and** mutations
- `enabled: Boolean(workspaceId)`

A homemade map will drift (DATA-001). Phase 1–2 may use HttpClient only (no cache). From **read-only real data (Milestone 3)** onward, adopt either:

1. **`@tanstack/angular-query`** — closest semantic port of today’s hooks; still not NgRx; justified because invalidation *is* the architecture, or
2. A small **`QueryCacheService`** with `get/set/invalidate(prefix)` and the **same key tuples** as `taskflowKeys`

Option 2 is the “Angular-native” path if adding TanStack is undesirable for learning. It must copy key + invalidate + snapshot APIs, not a Redux slice per entity.

### Optimistic updates

Port snapshot/rollback in the cache layer, not in components. Same mutations as today: assign, comments, notification read, member role/remove.

Versioned PATCH: never optimistic-increment `version` while queued.

---

## 2. UI state

| Field group | Current | Persist | Realtime | Target |
| --- | --- | --- | --- | --- |
| `settings` (density, weekStart, displayName, email, emailNotifs, pushNotifs) | Zustand persist | localStorage `taskflow-ui-v1` | no | `UiStateService` + `localStorage` (or `toSignal` persist) |
| `activeWorkspaceId` | Zustand persist | yes | switching **restarts** realtime | same; `effect` in shell starts/stops `RealtimeService` |
| `selectedTaskId`, `selectedProjectId` | Zustand | no | no | signals |
| `commandOpen`, `shortcutHelpOpen`, `taskModalOpen`, `inviteOpen` | Zustand (+ AppShell local commandOpen) | no | no | **one** signal each |
| `connectionStatus` | Zustand (mirror of manager) | no | yes (mirror only) | signal **owned by RealtimeService**, read by indicator |
| `presenceUsers` | Zustand mirror | no | yes | signal owned by RealtimeService |
| `conflictDraft` | Zustand | no | no (HTTP 409) | `ConflictCoordinator` signal |
| `offlineQueueCounts` | Zustand mirror | no | no | computed from MutationQueueService |

**Not stored in UI service:** task rows, comment lists, notification arrays, IDB records.

`computed()`: e.g. `showChrome` from router URL (signin/invite).

`effect()`: persist partial state; sync document class for density; **start realtime** when `user` + `workspaceId` change.

---

## 3. Realtime coordination

| | |
| --- | --- |
| **Current owner** | `RealtimeManager` singleton |
| **Source of truth** | Supabase channel; presence is ephemeral |
| **Persistence** | none |
| **Target** | `RealtimeService` (`providedIn: 'root'`) |

Expose:

- `connectionStatus` signal
- `presenceUsers` signal
- `invalidate$` or direct calls into QueryCache (preferred: method `invalidateForTable(table)`)

Internally RxJS is appropriate for retry backoff (`timer`, `retry`) and `fromEvent(window, 'online')`. Bridge to signals at the service edge.

Do **not** use a `BehaviorSubject` of all tasks.

Duplicate `start(same workspace, same user)` remains a no-op (RT-002).

---

## 4. Offline outbox

| | |
| --- | --- |
| **Current owner** | `mutationQueue.ts` |
| **Source of truth** | IndexedDB (memory fallback) |
| **Persistence** | durable |
| **Realtime** | replay on `onReconnectSuccess` / online |
| **Target** | `MutationQueueService` |

Keep types, statuses, `createdAt` sort, stop-on-failure, 409 → `conflict`.

UI reads **counts** via signals; UI does not own payloads.

`Subject` justified for “queue changed” internally; expose `counts` as `computed`/signal.

---

## 5. Auth session

| | |
| --- | --- |
| **Current** | httpOnly cookies + `GET /api/me` Query |
| **Target** | `AuthSessionService`: `user` signal from `/api/me` (cached); login/logout methods |

Not Zustand. Not NgRx. Refresh is Next `proxy.ts` (Option A) or supabase-js (Option B later).

---

## 6. Conflict draft

Owned by `ConflictCoordinator`, populated by replay or in-session 409. Fields must include entity type, id, `expectedVersion`, client draft, `latest`. Dialog is a view of this signal.

---

## Library evaluation

| Library | Verdict |
| --- | --- |
| NgRx Store / Effects | **No** — wrong granularity; fights Query invalidation |
| NgRx SignalStore | **No** unless QueryCacheService proves unmaintainable after Milestone 3 |
| ComponentStore | **No** for server entities |
| `@tanstack/angular-query` | **Optional, justified** from Milestone 3 if we want identical cache semantics |
| Angular `resource()` / `httpResource()` | Watch; may eventually replace custom cache for GETs; still need invalidate-from-realtime and optimistic snapshots |

---

## Mapping cheat sheet (hooks → Angular)

| React | Angular |
| --- | --- |
| `useQuery` | cache `injectQuery(taskflowKeys.tasks(id))` or facade |
| `useMutation` | facade method; cache `onSuccess` invalidate |
| `useQueryClient().invalidateQueries` | `QueryCache.invalidate(key)` from RealtimeService |
| `useUiStore` | `inject(UiStateService)` signals |
| `useEffect` subscribe channel | `RealtimeService.start()` from shell `effect` + `DestroyRef` |
| `useState` in forms | Reactive Forms |
| Context providers | `providedIn: 'root'` + `bootstrap` providers |

Do **not** create `useXxx()` functions that hide `inject()`. Use injectable facades; components inject them. That is the idiomatic boundary.
