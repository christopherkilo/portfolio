# 01 — Target Angular architecture

This document designs the Angular **frontend only**. The Next.js Route Handlers, `server/taskflow`, RLS, and React app stay in place. Angular is a second client of the same HTTP contract (`04-api-contract-inventory.md`).

## Why not a mechanical folder copy

The suggested tree (`core/`, `shared/`, `features/`) is a good **starting** shape for a standalone Angular app, but TaskFlow’s real seams are:

- **Server-entity cache** (today: TanStack Query) — not a feature folder
- **Ephemeral UI** (today: Zustand) — not a global NgRx store
- **Realtime coordinator** — invalidation only
- **Durable outbox** — IndexedDB, not UI state
- **Auth session** — cookies today; see `05-auth-migration-decision.md`

Folders exist to match those seams, not to mirror every React file.

## Recommended tree (validated)

```
src/app/
  core/
    auth/          # session facade, login redirect, current-user signal
    api/           # HttpClient wrapper, envelope unwrap, TaskflowApiError
    query/         # query-key cache (see state doc) — NOT a second Zustand
    guards/        # UX-only: authGuard, roleCanActivate
    interceptors/  # credentials / optional Bearer; error mapping
    realtime/      # RealtimeService (supabase channel + presence)
    offline/       # MutationQueueService, replay, safe/unsafe
    services/      # NetworkStatusService, ConflictCoordinator
  shared/
    ui/            # button, skeleton, empty, tooltip, progress
    dialogs/       # Modal host, ConflictDialog, ShortcutHelp
    forms/         # shared validators, error display
    layout/        # AppShell, Sidebar, TopNav, ConnectionIndicator
    directives/    # focus trap, click-outside
    pipes/         # relative time, initials
  features/
    dashboard/
    projects/
    tasks/         # list, editor modal, comments, attachments, history
    calendar/
    team/          # members, invite modal
    audit/
    settings/
    notifications/ # TopNav panel, not a primary route
    invitations/   # /invite accept page
    auth/          # /signin
```

**Adjustments vs the prompt sketch:**

- `notifications/` is a **feature module of UI**, not a top-level route (matches TopNav).
- `layout/` lives in `shared/` because every authenticated route uses it; it is not a “feature.”
- `core/query/` is explicit: without it, features will reinvent a server cache (DATA-001).
- There is **no** `features/workspaces/` page today; workspace pick lives in TopNav. Keep that as a small `core` or `shared` service, not a fake feature.

## Standalone components

Use **standalone components and routes** (`loadComponent` / `loadChildren` per feature). No NgModules for feature code.

Each route component owns:

- composition of presentational children
- injecting feature + core services
- binding signals into the template

Presentational pieces (`Button`, `Skeleton`, `ActivityFeed`) stay standalone and **do not** inject Query or HttpClient.

## Dependency injection boundaries

| Token / service | providedIn | Why |
| --- | --- | --- |
| `AuthSessionService` | `root` | One session for the SPA |
| `TaskflowApiClient` | `root` | One envelope + error type |
| `QueryCacheService` (or TanStack Angular Query) | `root` | One server-entity cache |
| `UiStateService` | `root` | Replaces Zustand; persist slice only |
| `RealtimeService` | `root` | One channel coordinator (same as RealtimeManager singleton) |
| `MutationQueueService` | `root` | One IndexedDB queue |
| Feature facades (`TasksFacade`, …) | `root` or route `providers` | Thin: call API + cache keys. Prefer `root` so realtime invalidation stays global |

**Do not** provide HttpClient wrappers per feature. **Do not** inject `RealtimeService` into presentational list items.

Guards inject `AuthSessionService` only. They never call RLS and never treat `403` as “hide the button only.”

## Feature ownership

A feature **owns**:

- its routes
- its page components
- feature-specific dialogs (TaskEditor, InviteMember)
- feature-specific Reactive Forms

A feature **does not own**:

- cookie/JWT storage
- IndexedDB schema
- channel subscribe/unsubscribe
- the query-key catalog (`taskflowKeys` equivalent)

## Lazy-loading candidates

Lazy-load (low initial JS, matches infrequent visits):

- `audit` (admin-only UI)
- `calendar`
- `settings`
- `invitations` accept page
- `signin` (already public; can be eager if it is the first paint)

Eager or preloaded (shell always needs them):

- dashboard, tasks, projects, team
- layout, command palette, conflict dialog, connection indicator

Task editor / comments / attachments should load with the **tasks** chunk, not as a separate micro-app.

## Shared vs core

- **core:** singletons with side effects (network, IDB, supabase channel, auth). Import core from features; never the reverse.
- **shared:** reusable UI with no product policy. May inject nothing, or only tiny tokens (e.g. `Theme`).

If a “shared” widget starts calling `/api/tasks`, it is a feature component that was misplaced.

## API / data service responsibilities

Preserve the current split:

```
HttpClient (transport)
  → TaskflowApiClient (envelope, credentials)
    → resource methods (TasksApi, ProjectsApi, …)
      → QueryCacheService (GET cache + mutation hooks)
        → feature components (signals)
```

Resource methods map 1:1 to `04-api-contract-inventory.md`. They return `Promise` or `Observable` of **unwrapped `data`**, throwing a typed `TaskflowApiError` (code, fieldErrors, `latest`).

Realtime **never** writes entities into this cache except by `invalidate(key)`.

## Signals vs RxJS

| Use signals | Use RxJS |
| --- | --- |
| UI flags, selection, density, connection enum, presence list for template | HttpClient streams, supabase channel callbacks bridged once |
| `computed()` for derived lists (filter/sort board) | Replay/backoff timers, online/offline `fromEvent` |
| `effect()` only for glue (focus, title, start/stop realtime) | Multiplexed upload progress if needed |

**Do not** put the task list in a `BehaviorSubject` *and* a signal cache. One owner.

`effect()` must not become a hidden store (no “sync Query into a second signal map”).

`Subject` / `BehaviorSubject`: justified for (1) a single `destroy$` if not using `takeUntilDestroyed`, (2) bridging supabase callback → Angular, immediately converted to signals in the service.

## Route guards

- `authGuard`: if no session, navigate to `/signin?next=`
- `roleGuard('admin')`: for audit **UX**. API still 403s. Viewer hitting `/audit` should see the same empty/denied pattern as React (`AuditView`), not a false “secure” page.

Guards are **not** security. Document this in every guard file comment.

## Interceptors

- Attach `withCredentials` (Option A) or `Authorization` (Option B later)
- Map HTTP errors to `TaskflowApiError`
- Do **not** auto-retry unsafe mutations
- Do **not** swallow 409; pass `latest` through

## Reactive Forms

Replace ad-hoc `useState` fields in TaskEditor, InviteMember, Settings, project create:

- `FormGroup` / `FormControl` with validators matching Zod shapes (title required, invitation email, etc.)
- Server `fieldErrors` mapped onto controls
- Dirty checking for conflict dialog “keep my draft”

Do not use template-driven forms for versioned PATCH bodies.

## Dialog / focus

Port `Modal.tsx` behavior into a `DialogService` + `FocusTrapDirective`:

- `role="dialog"`, labelled by title
- Escape, Tab cycle, restore focus, body scroll lock
- Used by TaskEditor, Invite, Conflict, ShortcutHelp, Command palette

Angular CDK overlay is acceptable **if** it preserves this behavior; do not regress A11Y-001 for a prettier overlay.

Command palette: **one** open flag (today AppShell local + Zustand `commandOpen` diverge). Target: `UiStateService.commandOpen` only.

## Error handling

Reuse codes from `server/taskflow/errors/index.ts`: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `CONFLICT`/`STALE_VERSION`, `OFFLINE_UNSAFE_ACTION`, `SCHEMA_NOT_READY`, etc.

UI: `QueryErrorState` equivalent — schema vs generic vs 403.

## Loading states

Per-query `status` on the cache (pending / success / error), not a single global spinner. Skeleton patterns stay as in `QueryStates.tsx` / `Skeleton.tsx`.

## Why NgRx is not the default

TaskFlow already has four stores with different lifetimes. NgRx would collapse them into one mental model and fight Query-style invalidation. Native services + a query-key cache are sufficient. Revisit only if multiple teams must time-travel debug a single event log — that is not the Phase 1 learning path.

## Coexistence with React

Until Angular is served, this tree lives in a **future** app (not created in Phase 0). React URLs stay `/demos/taskflow/*`. Angular routes should use a **distinct base** when hosted beside React (decision in milestones / open decisions) so bookmarks do not clash.
