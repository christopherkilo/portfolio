# 00 — Current TaskFlow architecture

Source of truth: the repository as of Phase 0. Versions from `package.json`.

| Package | Version |
| --- | --- |
| React | 19.2.4 |
| Next.js | 16.2.10 |
| `@tanstack/react-query` | ^5.101.4 |
| `zustand` | ^5.0.14 |
| `@supabase/ssr` / `@supabase/supabase-js` | ^0.12.4 / ^2.111.0 |
| `zod` | ^4.4.3 |
| `framer-motion` | ^12.42.2 |

TaskFlow does **not** use the portfolio Auth.js/Prisma session. It uses **Supabase Auth** (Google OAuth) against the same Postgres project as the data (`TASKFLOW_AUTHENTICATION.md`, `lib/demos/taskflow/supabase/browser.ts`).

---

## Frontend

### Route structure

Layout: `app/demos/taskflow/layout.tsx` wraps every page in `DemoShell` (portfolio return chrome), skip link `#main`, `TaskflowProviders`, and `AppShell`.

| Path | File | Notes |
| --- | --- | --- |
| `/demos/taskflow` | `app/demos/taskflow/page.tsx` | Redirects to `/dashboard` |
| `/demos/taskflow/dashboard` | `.../dashboard/page.tsx` | |
| `/demos/taskflow/projects` | `.../projects/page.tsx` | |
| `/demos/taskflow/tasks` | `.../tasks/page.tsx` | Supports `?create=1` |
| `/demos/taskflow/calendar` | `.../calendar/page.tsx` | |
| `/demos/taskflow/team` | `.../team/page.tsx` | |
| `/demos/taskflow/audit` | `.../audit/page.tsx` | Admin+ intended |
| `/demos/taskflow/settings` | `.../settings/page.tsx` | |
| `/demos/taskflow/signin` | `.../signin/page.tsx` | Public; chrome-less |
| `/demos/taskflow/invite` | `.../invite/page.tsx` | Public; chrome-less |

Nav items: `lib/demos/taskflow/data.ts` `NAV_ITEMS` / `DEMO_BASE`.

### Shell / layout

- `components/demos/taskflow/layout/AppShell.tsx` — sidebar + TopNav + page motion; hides chrome on sign-in/invite; mobile drawer with Escape/Tab trap
- `Sidebar.tsx`, `TopNav.tsx`
- Shortcuts: `lib/demos/taskflow/shortcuts.ts` (`useTaskflowShortcuts`)

### Major feature views

Under `components/demos/taskflow/`:

`dashboard/DashboardView.tsx`, `projects/ProjectsView.tsx`, `tasks/TasksView.tsx`, `calendar/CalendarView.tsx`, `team/TeamView.tsx`, `audit/AuditView.tsx`, `settings/SettingsView.tsx`, `auth/SignInView.tsx`, `invitations/AcceptInviteView.tsx`

### Shared / collaboration UI

- Command palette, shortcut help: `shared/CommandPalette.tsx`, `ShortcutHelpModal.tsx`
- Conflict / presence / connection: `collaboration/ConflictDialog.tsx`, `PresenceAvatars.tsx`, `ConnectionIndicator.tsx`
- Activity: `shared/ActivityFeed.tsx`, `audit/TaskHistoryPanel.tsx`
- Query chrome: `shared/QueryStates.tsx` (`QueryLoadingState`, `QueryErrorState` including `SCHEMA_NOT_READY`)
- Task: `tasks/TaskEditorModal.tsx`, `comments/TaskComments.tsx`, `attachments/TaskAttachments.tsx`
- Team: `invitations/InviteMemberModal.tsx`
- Primitives: `ui/Modal.tsx`, `Button.tsx`, `Dropdown.tsx`, `EmptyState.tsx`, `Skeleton.tsx`, `Tooltip.tsx`, `ProgressBar.tsx`

### Form strategy

No React Hook Form. Controlled React state inside views/modals. Server validation via Zod in `server/taskflow/schemas/index.ts`. Client attachment MIME/size pre-check in `lib/demos/taskflow/attachments/limits.ts`.

### Animation

Framer Motion: `AppShell` page variants (`lib/demos/taskflow/animation.ts`), `Modal`, mobile drawer. `useReducedMotion` respected in the shell.

### Accessibility helpers

- Skip link in layout
- `Modal.tsx`: `role="dialog"`, Escape, Tab cycle, restore focus, body scroll lock
- AppShell mobile nav: same pattern
- `QueryLoadingState` uses `role="status"` `aria-live="polite"`
- Portfolio `DemoShell` is outside TaskFlow product chrome but present on all demo routes

**Observed (do not fix in Phase 0):** `AppShell` keeps a **local** `commandOpen` while Zustand also has `commandOpen` (`store/ui.ts`). Two sources of command-palette open state.

**Observed:** `lib/demos/taskflow/data.ts` still contains pre-backend seed `TEAM` / project arrays. Live views load via Query. Seed identity leftovers also appear in `store/types.ts` `DEFAULT_SETTINGS` (Maya Chen); the live persist store uses empty `DEFAULT_UI_SETTINGS` in `store/ui.ts`.

---

## Data (TanStack Query)

Provider: `lib/demos/taskflow/query/client.tsx`

- `staleTime: 15_000`
- `refetchOnWindowFocus: false`
- `retry: 1` (me-query skips retry on 401)

Keys: `lib/demos/taskflow/queries/workspaceKeys.ts`

```
taskflow / me / workspaces / projects(id) / tasks(id) / members(id) /
activity(id) / comments(taskId) / assignees(taskId) / invitations(id) /
notifications
```

Attachments use a **separate** helper `attachmentKeys(taskId)` → `["taskflow","attachments",taskId]` in `queries/attachmentQueries.ts`, not the `taskflowKeys` object. Realtime invalidation uses the same tuple (`useTaskflowRealtime.ts`).

### Query vs mutation ownership

| Hook file | Responsibility |
| --- | --- |
| `api/hooks.ts` | me, workspaces, active workspace pick, projects/tasks/members/activity, create/update/delete task, create/update project |
| `queries/memberQueries.ts` | members, role, remove |
| `queries/commentQueries.ts` | comments CRUD |
| `queries/invitationQueries.ts` | list/invite/revoke/accept |
| `queries/notificationQueries.ts` | list, read, read-all |
| `queries/taskQueries.ts` | assign / unassign |
| `queries/attachmentQueries.ts` | list, initiate+PUT+complete, delete, download |

Active workspace: Query list + Zustand `activeWorkspaceId`, reconciled in `useActiveWorkspaceId()` (prefer stored id, else workspace named `"Portfolio Demo Workspace"`, else first).

### Optimistic updates

Documented in `TASKFLOW_STATE_MANAGEMENT.md`: assign, comment create/delete, notification read, member role/remove use snapshot → rollback → invalidate. Versioned patches send `expectedVersion` and do **not** invent a server version while offline (they enqueue).

### Invalidation

- Mutations call `invalidateWorkspace` or specific keys
- Realtime `onInvalidate` maps table → keys
- Reconnect: invalidate workspace keys + `replayQueuedMutations`

---

## UI state (Zustand)

`lib/demos/taskflow/store/ui.ts` — persist name `taskflow-ui-v1`, **partialized** to:

- `settings` (density, emailNotifs, pushNotifs, weekStart, displayName, email)
- `activeWorkspaceId`

**Not persisted:** selected task/project, modal flags, connectionStatus, presenceUsers, conflictDraft, offlineQueueCounts.

**Intentionally not in Zustand:** tasks, projects, members, comments, notifications, attachment rows, queued mutation payloads.

**Observed:** `settings.emailNotifs` / `pushNotifs` are client chrome. Authoritative per-type toggles live in `notification_preferences` via `/api/taskflow/notification-preferences`. Two preference surfaces.

---

## Realtime

- Coordinator: `RealtimeManager` class + singleton (`lib/demos/taskflow/realtime/RealtimeManager.ts`)
- React adapter: `useTaskflowRealtime.ts`
- Mount: `TaskflowRealtimeBridge.tsx` (also due-date nudges + replay when `connectionStatus === "online"`)

Channel: `taskflow-workspace-{workspaceId}` (`workspaceChannel.ts`).

Tables: `tasks`, `task_assignees`, `projects`, `comments`, `notifications`, `activity_events`, `task_attachments`, `workspace_members`, `workspace_invitations`. Filter `workspace_id=eq.{id}` (notifications by `user_id`).

Presence: ephemeral track of `PRESENCE_SAFE_FIELDS`; no Postgres; no live cursors (`TASKFLOW_PRESENCE.md`). Duplicate `start` for same workspace+user is a no-op.

Connection: `connecting | connected | online | reconnecting | offline | failed`. Bounded backoff 1s → 2s → … cap 30s. Browser `online`/`offline` events. Successful subscribe resets attempts and fires `onReconnectSuccess`.

**Realtime is not a store.** It only invalidates Query and mirrors presence/status into Zustand.

---

## Offline

`lib/demos/taskflow/offline/mutationQueue.ts`

- IndexedDB `taskflow-offline-v1` / store `mutations`; memory fallback
- Types: `task_update`, `task_status`, `comment_create`, `notification_read`
- Status: `pending | failed | conflict`
- Counts: pending, failed, conflicted, `totalNeedsAttention`

Unsafe (client `assertOnlineForUnsafeAction` / `UNSAFE_OFFLINE_ACTIONS`): role change, member remove, invitation create/accept, destructive deletes, ownership, attachment deletes, project patches (`safeMutations.ts`). Server also has `OFFLINE_UNSAFE_ACTION` 503.

Replay: `replay.ts` — `createdAt` order, **stop on first failure or 409**. 409 → mark `conflict`, set Zustand `conflictDraft` including `latest`.

---

## Conflict handling

DB: `tasks.version`, `projects.version`. RPCs `update_task_versioned` / `update_project_versioned`.

Client PATCH includes `expectedVersion` (`updateTaskSchema` / `updateProjectSchema` require it).

409 `STALE_VERSION` + `data.latest` (`StaleVersionError` in `server/taskflow/errors/index.ts`, serialized in `errors/http.ts`).

UI: `ConflictDialog` + `conflictDraft`. Status-only task moves may auto-reconcile once (`allowStatusAutoReconcile`).

JSONB patch: omit = leave; `null` = clear; identical = no-op (no version bump, no audit).

---

## Authentication

| Piece | File |
| --- | --- |
| Browser client | `lib/demos/taskflow/supabase/browser.ts` (publishable key) |
| Cookie server client | `server/taskflow/supabase/server.ts` `createTaskflowServerClient` |
| Admin client | `createTaskflowAdminClient()` — **secret key, server-only** |
| Sign-in | `SignInView.tsx` `signInWithOAuth({ provider: "google", redirectTo: origin/auth/callback?next= })` |
| Callback | `app/auth/callback/route.ts` PKCE `exchangeCodeForSession`; cookies written on **redirect response** |
| Proxy | `proxy.ts` — refresh cookies; unauthenticated **page** routes → `/demos/taskflow/signin?next=` |
| Current user | `GET /api/me` + `useTaskflowMe`; profile upsert in `session.ts` |

Public pages (no proxy redirect): `/demos/taskflow/signin`, `/demos/taskflow/invite`, `/auth/callback`.

API routes are **not** redirected by proxy; they call `requireTaskflowUser()` and return 401.

Fetches: `taskflowFetch` uses `credentials: "same-origin"` (`api/client.ts`).

Event Horizon Auth.js lives at `/api/auth/callback/google`. TaskFlow callback is `/auth/callback`. Different stacks.

---

## Authorization

Layers (`TASKFLOW_PERMISSIONS.md`): UI hiding → `server/taskflow/auth` → RLS → RPC/triggers.

Roles: `viewer < member < admin < owner` (`auth/roles.ts`).

| Capability | Minimum |
| --- | --- |
| Read workspace/task | viewer |
| Edit tasks, comments, initiate attachments | member |
| Projects, invites, member roles*, workspace audit | admin |
| Full / owner protections | owner |

\* Admins cannot modify owners or other admins; owner removal forbidden (`permissions.ts`).

Workspace audit: `AuditAccessDeniedError` → 403. Task history: viewer+ with task access.

Notifications: clients cannot INSERT; SECURITY DEFINER RPCs only.

---

## Backend

Shape: Route Handler → Zod parse → service → repository → user-scoped Supabase (RLS).

Entry: `createTaskflowContext()` / `requireWorkspaceMember` / `requireTaskAccess` (`auth/authorization.ts`).

Services: `server/taskflow/services/` (workspace, project, task, member, comment, invitation, notification, attachment, audit, activity, notificationPreference).

Envelope:

```json
{ "success": true, "data": T }
{ "success": false, "error": { "code", "message", "fieldErrors" }, "data": { "latest" }? }
```

Failure policy (`TASKFLOW_BACKEND_ARCHITECTURE.md`): core mutation + audit atomic; notifications best-effort after commit.

---

## Database

Migrations in order (`TASKFLOW_DATABASE.md`):

1. `supabase/migrations/20260802120000_taskflow_phase1.sql`
2. `20260802160000_taskflow_phase2.sql`
3. `20260802180000_taskflow_stabilization.sql`
4. `20260802190000_taskflow_phase3.sql`
5. `20260802200000_taskflow_phase3_stabilization.sql`

Combined: `supabase/APPLY_ALL_TASKFLOW.sql`.

Major tables (see `server/taskflow/types/database.ts`): `profiles`, `workspaces`, `workspace_members`, `workspace_invitations`, `projects`, `tasks`, `task_assignees`, `comments`, `activity_events`, `notifications`, `notification_preferences`, `task_attachments`.

Notable RPCs: `create_task_with_assignees`, `update_task_versioned`, `update_project_versioned`, `create_workspace_invitation`, `accept_workspace_invitation`, `create_or_group_notification`, `create_taskflow_notification`, `cleanup_stale_pending_attachments`.

Storage: private bucket `taskflow-attachments`.

GET `/api/workspaces` calls `ensureDefaultWorkspace()` when the user has none (`app/api/workspaces/route.ts`).

---

## Tests (behavioral coverage to preserve)

Client: `lib/demos/taskflow/**/*.test.ts` (hooks, mutationQueue, safeMutations, RealtimeManager, url, ui-wiring, productivity).

Server: `server/taskflow/**/*.test.ts` (auth, schemas, errors, RLS SQL assertions, phase2/3/stabilization, attachment limits).

Demo routing: `lib/demoRoutes.test.ts`.
