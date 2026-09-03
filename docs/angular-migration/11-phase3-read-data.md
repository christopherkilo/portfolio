# 11 — Phase 3 read-only real data

Phase 3 replaces the Phase 1 placeholder dashboard, projects, and tasks views with **read-only live TaskFlow data** from the existing Next APIs. Auth remains Phase 2 Option A (cookies). No mutations, realtime, offline queue, TanStack Angular Query, NgRx, or generic query cache.

React/Next TaskFlow under `/demos/taskflow` is unchanged.

---

## Pre-phase auth gate

Live Google OAuth still requires a human account and (if missing) `http://localhost:4200/auth/callback` in Supabase redirect URLs. This session did not complete an authenticated Google round-trip.

Validated without a session:

- Unauthenticated Angular `/dashboard` → `/signin?next=/dashboard`
- `GET /api/me` on the Angular origin returns 401
- Workspace/project/task GETs on the Angular origin return 401 (not a separate SPA auth path)
- React `/demos/taskflow/signin` still loads

**Do not redesign authentication in Phase 3.** Phase 2 Option A stands.

---

## Current read flow (inspected from React source)

Not inferred from Phase 0 alone. Sources: `lib/demos/taskflow/api/hooks.ts`, `queries/workspaceKeys.ts`, `url.ts` / `url-state.ts`, `DashboardView.tsx`, `ProjectsView.tsx`, `TasksView.tsx`, `store/selectors/*`, `query/client.tsx`.

| Surface | Query key | Endpoint | Notes |
| --- | --- | --- | --- |
| Me | `["taskflow","me"]` | `GET /api/me` | Auth only (Phase 2) |
| Workspaces | `["taskflow","workspaces"]` | `GET /api/workspaces` | Server **creates default workspace if list empty** |
| Projects | `["taskflow","projects", workspaceId]` | `GET /api/projects?workspaceId=` | `enabled: Boolean(workspaceId)`; `select: mapProject` |
| Tasks | `["taskflow","tasks", workspaceId]` | `GET /api/tasks?workspaceId=` | Optional `projectId` exists on API; **UI does not send it**. Filters are **client-side** |
| Members | `["taskflow","members", workspaceId]` | `GET /api/members?workspaceId=` | Dashboard pulse + task assignee labels |
| Activity | `["taskflow","activity", workspaceId]` | `GET /api/activity?workspaceId=` | Dashboard feed; missing id → `[]` |

TanStack defaults: `staleTime` 15s, `refetchOnWindowFocus: false`, `retry: 1`.

**Workspace selection:** `useActiveWorkspaceId` — Zustand persist `activeWorkspaceId` in `taskflow-ui-v1`. Pick order: preferred id if still a member → workspace named `Portfolio Demo Workspace` → first row. Sidebar `<select>` only when `workspaces.length > 1`.

**Dashboard metrics:** **client-derived**, not a dashboard endpoint. `useWorkspaceData()` loads projects+tasks+members+activity. `dashboardInsights` / `overdueTasks` / `upcomingDeadlines` / `projectHealth` / `recentActivity`.

**Projects URL:** `q` (search), `project` (detail modal). Status/sort are **local `useState`**, not URL.

**Tasks URL:** `q`, `projectFilter`, `assignee`, `priority`, `status`, `due`, `label`, `overdue=1`, `view=list|board`, `task` (detail modal). **No dedicated task route.** Create/edit/DnD are mutations (Phase 4).

**Task detail:** modal. Title, description, status, priority, project, assignee, due, plus comments/attachments/history **reads** in React. Phase 3 ports core fields only; comments/attachments/history remain deferred.

**Pagination:** none on these list endpoints.

**Role-dependent reads:** list endpoints are viewer-min. Dashboard does not hide numbers by role. Audit 403 is out of scope.

**Loading/empty/error:** `QueryLoadingState` / `QueryErrorState` / `EmptyState`. Empty arrays are not errors. `SCHEMA_NOT_READY` has special copy.

---

## Locked server-state decision

**Angular-native resources.** Phase 0 listed TanStack Angular Query *or* a `QueryCacheService`. Phase 3 **locks**:

- `HttpClient` + **`httpResource`**
- signals / computed
- domain injectable services
- **no** `@tanstack/angular-query-experimental`
- **no** NgRx / Apollo
- **no** generic `QueryCacheService` / TanStack clone

**Why TanStack was rejected here:** this milestone is read-only. We need `enabled` (skip without workspace), reload for later realtime, and shared ownership — `httpResource` request functions + `.reload()` cover that without installing a second cache product. Optimistic snapshots and prefix invalidation belong to Phase 4/6; if those prove that native resources are insufficient, **stop and decide** — do not quietly clone TanStack.

---

## Angular primitives used

| Primitive | Where | Why |
| --- | --- | --- |
| **`httpResource`** | Workspace, projects, tasks, members, activity | GET lists; skip with `undefined`; reactive to `workspaceId` / auth; `.reload()` |
| **`computed`** | Mapped rows, dashboard insights, filtered lists | Derived read models; no duplicate arrays |
| **signals** | Preferred workspace id, project status/sort, filters-open | Local UI, not server cache |
| **Router `queryParamMap`** | Task filters, `task`, project `q`/`project` | Matches React URL-driven filters |
| **RxJS** | `toSignal(queryParamMap)` only | Real event stream → signal |
| **`resource` / `rxResource`** | Not used | No non-HTTP loader; no RxJS HTTP composition benefit |

---

## Domain services and ownership

| Service | Owns | Endpoints |
| --- | --- | --- |
| `AuthService` | Session identity | `GET /api/me`, sign-in/out (Phase 2) |
| `UiStateService` | Theme, mobile drawer | none |
| `WorkspaceContextService` | Workspace list + current id | `GET /api/workspaces` |
| `ProjectsDataService` | Project rows | `GET /api/projects?workspaceId=` |
| `TasksDataService` | Task rows | `GET /api/tasks?workspaceId=` |
| `MembersDataService` | Members (for labels/pulse) | `GET /api/members?workspaceId=` |
| `ActivityDataService` | Activity (dashboard) | `GET /api/activity?workspaceId=` |
| `WorkspaceReadsService` | Combined loading/error + `reloadAll()` | none (not a cache) |

Reload contract (future RealtimeService):

- `workspace.reload()`
- `projects.reload()`
- `tasks.reload()`
- `members.reload()`
- `activity.reload()`
- `reads.reloadAll()`

No query-key invalidation map.

---

## Provider lifetimes

**All of the above are `providedIn: 'root'`.**

Dashboard, projects, tasks, and the sidebar would otherwise each create their own `httpResource` (duplicate `/api/projects`, etc.). Root scope matches React’s QueryClient: one replica per process.

They are **not** route-scoped. Lazy pages inject the same singletons; leaving `/tasks` does not destroy the task resource. Acceptable for this app size. If memory becomes an issue later, move list resources to a shell route injector — not to each feature page.

`httpResource` does **not** refetch on every navigation. Workspace id change **does** refetch child lists (request URL changes).

---

## Workspace context

Pick order copied from React `pickActiveWorkspace`.

Persistence: `localStorage` key **`taskflow-angular-workspace`** `{ activeWorkspaceId }`. React uses `taskflow-ui-v1` (Zustand). Dev ports isolate origins; production same-origin should **not** share the Zustand blob (HOST-001). Product behavior (remember last workspace) is preserved with an Angular-only key.

Sidebar: loading text, name if one workspace, `<select>` if multiple.

---

## Routes with real data

| Route | Real data | Notes |
| --- | --- | --- |
| `/dashboard` | Yes | Derived stats, health, overdue, upcoming, activity |
| `/projects` | Yes | Search URL `q`; status/sort local; read-only detail `?project=` |
| `/tasks` | Yes | URL filters; board/list; read-only detail `?task=` |
| `/calendar` `/audit` `/settings` | No | Phase 1 placeholders |
| `/team` | Yes | Phase 5 members, invite, roles — [13-phase5-team-permissions.md](./13-phase5-team-permissions.md) |

Create/edit/DnD/archive controls are **omitted**, not fake-disabled (except Phase 1 search/command in chrome).

Task detail: title, description, status, priority, project, assignee, due, version, labels. Comments/history/attachments **deferred**.

---

## Envelope and errors

Existing `{ success, data | error }` via `parseTaskflowEnvelope` / `TaskflowApiError`.

401 → Phase 2 `authErrorInterceptor` only. Data services do not redirect.

403 / 404 / 500 stay distinct in `userFacingLoadError`. `SCHEMA_NOT_READY` uses React’s special title. No stack traces in UI.

Loading uses `isLoading()` **and** `hasValue()` so default `[]` is not shown as an empty success during first fetch.

Empty arrays → empty UI, not error.

---

## Request lifecycle / network observations

Intended authenticated waterfall:

1. `GET /api/me` (AuthService initialize) — once
2. `GET /api/workspaces`
3. Parallel: projects, tasks, members, activity for `currentWorkspaceId`

Navigating dashboard → projects → tasks should **not** refetch those four if the workspace is unchanged.

Unauthenticated: resources skip (`undefined` request) after `/api/me` 401; no project/task loop.

---

## React / Angular data parity

Same APIs, same mappers (`mapProject` / `mapTask` / `mapMember` / `mapActivity`), same dashboard selectors.

**Not live-compared on a signed-in account in this session.** When a human session is available, compare project names/counts and task titles/status on the same workspace.

Architecture contrast (same backend):

- React: TanStack `useQuery` + shared QueryClient
- Angular: `httpResource` on root domain services + `computed` insights

---

## Auth integration

`httpResource` uses `HttpClient` → credentials + 401 interceptor. `/api/me` still uses `SKIP_AUTH_REDIRECT`. Unit test: projects 401 calls `handleUnauthorized`; 403 does not.

---

## Tests

Angular **65** passed (12 files). Next **361** passed. Angular production build **PASS**. No TaskFlow runtime files outside `taskflow-angular/` except these docs.

---

## Manual validation

| Check | Result |
| --- | --- |
| Signed-out `/dashboard` → signin | PASS (Playwright Phase 2; architecture unchanged) |
| Google OAuth + same-account React comparison | **Not completed** (no human session) |
| Empty/loading/error UI | Unit tests PASS |
| React TaskFlow code | **UNCHANGED** this phase |

---

## Accessibility

Loading: `role="status"` `aria-live="polite"`. Errors: `role="alert"` + Retry. Search/filter labels. Board `aria-label` per column. Dialogs: `role="dialog"`, focus trap, Escape. Headings on dashboard/projects/tasks. No fake create buttons.

---

## REACT → ANGULAR DATA LESSONS

1. **TanStack `useQuery` → domain service + `httpResource`.** The cache is the resource instance, not a key map (yet).
2. **`enabled: Boolean(workspaceId)` → return `undefined` from the request function.**
3. **`invalidateQueries` → `service.reload()`.** Enough for Phase 3; realtime can call the same methods.
4. **`useWorkspaceData` hook → inject several services + a thin `WorkspaceReadsService` for combined loading/error.** Not one `TaskFlowStore`.
5. **`isLoading` / `data` / `error` → `isLoading()` / `value()` / `error()` / `hasValue()`.** Do not treat `defaultValue: []` as “loaded empty.”
6. **Dashboard numbers are not an API.** Port selectors or they will drift.
7. **Task filters are URL state, not query params on `GET /api/tasks`.** Sending them would be a backend redesign.
8. **Task detail is a modal (`?task=`), not a new route.**
9. **Root providers prevent the “dashboard cache vs projects cache” split.** Route-level providers would refetch on every lazy load.
10. **Guards stay UX; 401 stays in the interceptor.** Data services must not each `navigate(['/signin'])`.

---

## Strictly deferred

Team/invites are in [13-phase5-team-permissions.md](./13-phase5-team-permissions.md). Still deferred: realtime/presence, offline IDB, attachments, notifications, audit data, TanStack Angular Query, NgRx, `QueryCacheService`, optimistic updates, full ConflictDialog.
