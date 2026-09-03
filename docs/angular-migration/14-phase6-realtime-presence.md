# 14 — Phase 6 realtime and presence

Phase 6 ports TaskFlow’s existing Realtime + Presence behavior to Angular. React/Next TaskFlow under `/demos/taskflow` remains the known-good product. Product UI there was **not** redesigned.

Realtime is an **invalidation layer**, not a second entity store:

```text
Angular normal data
    ↓
HttpClient
    ↓
Next API
    ↓
server/taskflow + RLS

Angular realtime only
    ↓
Supabase publishable browser client
    ↓
Realtime channels + Presence
    ↓
domain reload signals
    ↓
HttpClient fetches authoritative data
```

No IndexedDB/outbox/replay, no ConflictDialog merge, no attachments/comments/notifications UI, no audit page, no optimistic writes, no NgRx/TanStack, no generic event bus, no live cursors, no raising the style budget.

---

## Current realtime model (inspected from React source)

Sources: `lib/demos/taskflow/realtime/RealtimeManager.ts`, `useTaskflowRealtime.ts`, `workspaceChannel.ts`, `presenceChannel.ts`, `components/demos/taskflow/layout/TaskflowRealtimeBridge.tsx`, `TopNav.tsx`, `TasksView.tsx`, `collaboration/ConnectionIndicator.tsx`, `collaboration/PresenceAvatars.tsx`.

### Channel

One channel: `taskflow-workspace-{id}`.

Postgres changes on `WORKSPACE_TABLES` with `workspace_id=eq.{id}`:

`tasks`, `task_assignees`, `projects`, `comments`, `notifications`, `activity_events`, `task_attachments`, `workspace_members`, `workspace_invitations`.

`notifications` uses `user_id=eq.{userId}` instead of workspace filter.

Presence key = `userId`. Sync uses **`metas[0]` only** (tabs collapse). Payload is `PRESENCE_SAFE_FIELDS` only. No live cursors. Presence is not persisted.

### Lifecycle (React)

`TaskflowRealtimeBridge` lives in the React layout, including invite. `useTaskflowRealtime` starts when `workspaceId` + `userId` exist and **stops on cleanup**. Duplicate `start` for the same workspace+user while online is a no-op. Workspace change: `stop` then `start`.

Backoff: `1s × 2^n`, cap 30s. Browser `offline` pauses; `online` reschedules. Success resets the attempt counter. `connected` maps to UI `online`.

React **restarts the channel on every pathname change** because `currentView` is in the hook dependency list. That is accidental reconnect churn, not a product requirement.

### Invalidation (React)

`onInvalidate(table, payload)`:

- `notifications` → notifications query only, **return**
- default **always** → tasks + activity
- `workspace_members` → members
- `projects` → projects
- comments / assignees / attachments also invalidate those query keys when `task_id` is present
- **`workspace_invitations` is subscribed and does not invalidate invitation keys**

Reconnect success: invalidate tasks / projects / activity / members (+ notifications) **and** `replayQueuedMutations()`.

When status becomes `online`: due-date nudges + replay (bridge). **Not ported.**

### Auth (React)

`createBrowserClient` from `@supabase/ssr` (`lib/demos/taskflow/supabase/browser.ts`) using `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Session cookies are readable (`httpOnly: false` defaults). The WebSocket goes **direct to Supabase** with the user JWT from that cookie-backed client.

Phase 6 auth gate: Angular can reproduce this without Bearer Option B, without a second OAuth flow, and without putting `SUPABASE_SECRET_KEY` in the SPA. Session cookies already live on the Angular origin after Option A OAuth (Phase 2 proxy).

---

## Angular architecture

| React | Angular | Notes |
| --- | --- | --- |
| `RealtimeManager` singleton | `RealtimeService` (`providedIn: 'root'`) | Signals for `connectionStatus` / `presenceUsers`; Subjects for invalidations/reconnects |
| `useTaskflowRealtime` handlers | `RealtimeCoordinatorService` | Maps tables → domain `.reload()`. Does **not** write `Task[]` / `Project[]` from payloads |
| `TaskflowRealtimeBridge` in layout (including invite) | `TaskflowShell` only | Invite/sign-in stay chromeless; no channel |
| Zustand connection/presence | signals on `RealtimeService` | Indicator and avatars only read |
| `createTaskflowBrowserClient` | `TaskflowRealtimeClientFactory` | GET public config, then `createBrowserClient`. **No `.from()` queries** |
| `NEXT_PUBLIC_*` inlined | `GET /api/taskflow/public-config` | URL + publishable key only |

### Public config

`app/api/taskflow/public-config/route.ts` returns `toPublicRealtimeConfig(getTaskflowPublicEnv())`.

Allowed: `supabaseUrl`, `publishableKey`.

Rejected: service-role / secret keys, `access_token`, `refresh_token`, `SUPABASE_SECRET_KEY`, or a publishable key whose string contains `service_role`.

No auth required (same publicity as `NEXT_PUBLIC_*`). Proxy matcher `/api/taskflow/:path*` already covers it. Angular GET uses `SKIP_AUTH_REDIRECT`.

### Channel lifecycle

`TaskflowShell` `effect` on `auth.isAuthenticated()` + `currentUser` + `workspace.currentWorkspaceId()` → `start` / `stop`. `DestroyRef` (effect cleanup) stops on shell destroy.

`Router` `NavigationEnd` → `updatePresence({ currentView })` **without** restarting the channel.

`TasksPage` → `updatePresence({ currentEntityId, currentView: task:… or /tasks })`. Destroy clears `currentEntityId`.

`AuthService.signOut` / `handleUnauthorized` call `realtime.stop()` before/with session clear. `RealtimeService` does **not** inject `AuthService` (no cycle).

Duplicate `start` same workspace+user while online is a no-op. Workspace switch tears down the old channel first. Late events are dropped when `this.workspaceId` no longer matches the subscribed id.

### Invalidation map (Angular)

| Table | Reload |
| --- | --- |
| `notifications` | nothing (no notifications resource yet) |
| default (including comments, assignees, attachments, invitations, activity, tasks) | `tasks.reload()` + `activity.reload()` |
| `workspace_members` | + `members.reload()` |
| `projects` | + `projects.reload()` |
| `workspace_invitations` | **not** `invitations.reload()` (match React) |

Bursts are coalesced per domain (`auditTime`, default 75ms via `REALTIME_COALESCE_MS`).

Reconnect success: `tasks` + `projects` + `members` + `activity` reload. **No replay. No nudges.**

### Dirty editor / `expectedVersion`

Phase 4 already copies `editSnapshot` at open and seeds the editor in `ngOnInit` only. `baselineVersion` is captured then. Project snapshot effect returns early if the same id is still open.

Checkpoint:

```text
Task v6 open + edited locally
        ↓
Realtime reports v7
        ↓
tasks.reload()
        ↓
list sees v7
form still has local draft
baselineVersion still 6
        ↓
Save
        ↓
409 STALE_VERSION
```

Realtime must not `patchValue` a dirty form from live `httpResource`.

### UI

`tf-presence-avatars` and `tf-connection-indicator` in `TopNav` before the user avatar (same order as React). Labels: Online / Connecting / Reconnecting / Offline / Connection failed. `aria-live="polite"`. No offline-queue counts (Phase 7).

`tf-entity-presence` on the task detail dialog. Max 5 avatars, overflow `+N`, self highlight.

---

## Intentional differences from React

1. Channel start/stop is auth+workspace, not pathname. View changes use `updatePresence`.
2. Realtime is not started on `/invite`.
3. Reconnect **does** call `OfflineReplayService.tryReplay()` (Phase 7). Outbox drain is sequential and auth-gated; see [15-phase7-offline-queue.md](./15-phase7-offline-queue.md).
4. Notifications table is subscribed but does not reload a notifications resource (none exists).
5. Comments/assignees/attachments keys are not separate resources; default tasks+activity reload covers list freshness.
6. Connection indicator omits pending/attention queue counts.

---

## Security

- Publishable/anon key only in the browser. Service-role never in Angular bundles or public-config JSON.
- Ordinary CRUD does not use the Supabase client.
- Presence payload is sanitized to `PRESENCE_SAFE_FIELDS`.
- Public config assert rejects secret-bearing keys on both server and client.

---

## Accessibility

Connection indicator: `role="status"` + `aria-live="polite"` + color is not the only signal (text label from `40rem`). Presence avatars: `aria-label` / `title` with name and view. Entity line is text, not color-only.

---

## Testing

Angular `ng test --watch=false` plus portfolio `npx tsc --noEmit && npm test`.

Coverage includes: no channel while unauthenticated; one channel per workspace; duplicate start no-op; workspace switch drops old events; logout leaves channel and presence; table → reload mapping; notifications do not reload tasks; burst coalescing; events do not write entity arrays; connected/disconnect/reconnect + reconnect refresh; indicator reflects service state; dirty task editor + list v7 + baseline 6 + 409; equivalent project snapshot test; presence join/sync, `metas[0]` dedupe, payload has no credentials; sign-out stops realtime before the signout POST.

---

## Manual multi-client validation

Requires two browsers / two Google accounts on Angular. **Not available in this session.** Marked **PARTIAL**. No fake production identities.

---

## Style budget warning

Phase 4: `tasks-page.scss` ~281 bytes over the 4 kB `anyComponentStyle` warning. **DEFERRED.** Budget was not raised.

---

## Authentication live smoke

Google interactive consent is still unavailable unattended. **PARTIAL.** Realtime auth **mechanism** (cookie-backed `createBrowserClient` on the Angular origin) was proven at the Phase 6 auth gate and is what this phase wires.

---

## REACT → ANGULAR REALTIME LESSONS

Written after implementation.

1. **Realtime invalidates; HttpClient remains authoritative.** Porting `postgres_changes` into `Task[]` would create a second store and skip RLS/mappers/`expectedVersion`.
2. **The publishable browser client is a leash, not a new data layer.** `createBrowserClient` is allowed for channels + presence because that is how React authenticates the WebSocket. `.from('tasks').select` is not.
3. **Public config must be boring.** URL + publishable key only. If a key named `secret` can ride along in JSON, it will.
4. **React’s pathname-in-deps restart is not the product.** `updatePresence` is the existing API; Angular uses it so view changes do not tear down the socket.
5. **`workspace_invitations` being subscribed without invalidating invitations is load-bearing React behavior**, not a bug to “fix.”
6. **Dirty editors are a realtime feature.** If `httpResource` can `patchValue` an open form, `baselineVersion` dies and 409 can never happen.
7. **Reconnect refresh is not replay.** Reloading lists after `SUBSCRIBED` is M6. Outbox drain is M7.
8. **Presence is ephemeral.** Clear it on `stop()`. Sanitize before `track()`. `metas[0]` collapses tabs.
9. **Start/stop belong in the shell, not in every feature page.** Pages may `updatePresence`; they must not `channel()`.
10. **Notifications no-op is correct until there is a notifications resource.** Matching React’s early-return matters more than inventing a reload.

---

## Phase 6 acceptance

Workspace-scoped channel; existing `WORKSPACE_TABLES`; coordinator `.reload()` only; connection indicator; presence avatars + entity line; public config browser-safe; Supabase client Realtime/Presence only; dirty-editor 409 checkpoint; channel teardown/reconnect; Angular tests + production build; React product UI unchanged.
