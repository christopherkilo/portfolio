# 08 — Migration milestones

Order adjusted only where dependencies demand it:

- Auth (M2) before real data (M3).
- Query cache (M3) before realtime (M6).
- Versioned CRUD (M4) before offline queue (M7) and full conflict UX (M8).
- Team/invites (M5) can proceed in parallel with M4 once auth exists; listed after CRUD so forms patterns exist.
- Attachments/notifications/audit (M9) after conflict so 409 handling is not re-invented during uploads.

React TaskFlow stays untouched. No `ng new` in Phase 0.

Angular concepts listed are the **learning targets**, not a license to add NgRx.

---

## MILESTONE 1 — Foundation, routing, shell

**Objective:** Standalone Angular app **beside** the repo (or a sibling folder), proxy to Next, chrome that matches AppShell without live data.

**Concepts:** standalone components, Router, `router-outlet`, DI `providedIn`, layout routes, lazy `loadComponent`, signals for chrome flags, CDK or custom focus trap.

**Source behavior:** `layout.tsx`, `AppShell`, `Sidebar`, `TopNav` structure, `NAV_ITEMS`, chrome-less signin/invite, skip link, reduced motion if CSS-ported.

**Files/features:** `shared/layout/*`, `shared/ui` stubs, `features/auth` empty page, placeholder feature pages.

**Risks:** UI-001, A11Y-001, STATE-001, HOST-001 (choose persist key names now).

**Acceptance:** Navigate all placeholder routes; sidebar active states; mobile drawer Escape/Tab; command palette **one** open signal; React `/demos/taskflow` still works.

**Non-goals:** No Angular install in Phase 0. No API. No auth. No Framer-parity animation required if CSS is equivalent.

---

## MILESTONE 2 — Authentication and protected routes

**Status:** implemented in Phase 2. See [10-phase2-auth.md](./10-phase2-auth.md).

**Objective:** Option A cookies. Sign-in via Google using existing callback. `authGuard` UX. `GET /api/me`.

**Concepts:** interceptors (`withCredentials`), guards, `AuthSessionService` signals, `HttpClient`.

**Source:** `SignInView`, `app/auth/callback/route.ts`, `proxy.ts`, `GET /api/me`.

**Risks:** AUTH-001, AUTH-002, INVITE-001 (partial), RT-003 (client init only).

**Acceptance:** Login/logout; 401 → sign-in with `next`; React OAuth still works; no secret key in Angular bundles.

**Non-goals:** Option B Bearer adapter. Changing `safeNextPath` unless required and tested. New OAuth providers.

---

## MILESTONE 3 — Read-only real data

**Status:** implemented in Phase 3. See [11-phase3-read-data.md](./11-phase3-read-data.md). TanStack Angular Query and a generic QueryCacheService were **not** used.

**Objective:** Workspace, projects, tasks, dashboard, task **read** details (no PATCH yet). Native Angular resources.

**Concepts:** HttpClient + `QueryCacheService` or TanStack Angular Query; `computed()` derived stats; loading/error/empty (`SCHEMA_NOT_READY` copy).

**Source:** `api/hooks.ts` queries, `DashboardView`, `ProjectsView`/`TasksView` read paths, mappers `api/mappers.ts`.

**Risks:** DATA-001, SEED-001, KEY-001.

**Acceptance:** Same workspace picker rule as `useActiveWorkspaceId`. Dashboard numbers match React on same workspace. No seed `TEAM` array.

**Non-goals:** Mutations, realtime, offline, DnD writes.

---

## MILESTONE 4 — CRUD and Reactive Forms

**Status:** implemented in Phase 4. See [12-phase4-mutations.md](./12-phase4-mutations.md). Optimistic updates and React status-only 409 auto-retry were **not** copied. Full ConflictDialog remains Milestone 8.

**Objective:** Create/update tasks and projects with `expectedVersion`; delete task (online); task editor form.

**Concepts:** Reactive Forms, typed errors/`fieldErrors`, versioned PATCH, optimistic updates on cache.

**Source:** `createTaskSchema`/`updateTaskSchema`/`createProjectSchema`/`updateProjectSchema`, `TaskEditorModal`, `safeMutations` online path (enqueue later).

**Risks:** CONFLICT-001 (send version even if dialog is minimal), FORM-001, PERM-001.

**Acceptance:** Create task; PATCH with version; 409 surfaces error (dialog may be stub); viewer cannot submit member-only actions (UI) and API 403 still holds.

**Non-goals:** Offline enqueue, attachment upload, member invites.

---

## MILESTONE 5 — Team, invitations, permissions UI

**Status:** implemented in Phase 5. See [13-phase5-team-permissions.md](./13-phase5-team-permissions.md). No `permissionGuard` (React has no role-gated `/team`/`/audit`). Optimistic member updates were **not** copied. Realtime members remain Milestone 6.

**Objective:** Members, roles, remove, invite modal, accept-invite page.

**Concepts:** role-based **UI**; still no trust of guards; forms for email/role.

**Source:** `TeamView`, `InviteMemberModal`, `AcceptInviteView`, member/invitation APIs.

**Risks:** PERM-001, INVITE-001, OFF-003 (don’t queue these).

**Acceptance:** Admin invite + revoke; viewer sees no invite; accept token flow; role rules match `permissions.ts` (403 on illegal PATCH).

**Non-goals:** Redesigning roles. Ownership transfer (explicitly unsupported in `assertCanChangeMemberRole`).

---

## MILESTONE 6 — Realtime and presence

**Status:** implemented in Phase 6. See [14-phase6-realtime-presence.md](./14-phase6-realtime-presence.md). Realtime is an invalidation layer only. Ordinary reads/writes stay HttpClient → Next API. No IndexedDB/outbox (M7). No ConflictDialog merge (M8). No `supabase.from('tasks').select(...)`.

**Objective:** Port `RealtimeManager` behavior; invalidate cache; presence avatars; connection indicator.

**Concepts:** root service, `effect` start/stop, RxJS backoff, supabase channel.

**Source:** `RealtimeManager.ts`, `useTaskflowRealtime.ts`, `PresenceAvatars`, `ConnectionIndicator`.

**Risks:** RT-001, RT-002, RT-003, DATA-001.

**Acceptance:** Second browser edits a task → first board refreshes without reload; workspace switch one channel; presence ephemeral; tests ported.

**Non-goals:** Live cursors (product explicitly has none). Second entity store from payloads.

---

## MILESTONE 7 — Offline queue and replay

**Status:** implemented in Phase 7. See [15-phase7-offline-queue.md](./15-phase7-offline-queue.md). Angular IDB `taskflow-angular-offline-v1` is isolated from React `taskflow-offline-v1`. Only `task_update` / `task_status` queue. Unsafe team/invite/project mutations stay 503. Replay is authenticated, oldest-first, sequential, stop-on-failure. 409 keeps `expectedVersion` and `latest` for Phase 8. No comment/notification queue types (no those UIs). No ConflictDialog merge (M8).

**Objective:** IDB outbox, safe types, unsafe 503, replay on reconnect/`online`, counts in indicator.

**Concepts:** IndexedDB in a service, not in components.

**Source:** `mutationQueue.ts`, `replay.ts`, `safeMutations` enqueue branch, `TaskflowRealtimeBridge` replay.

**Risks:** OFF-001, OFF-002, OFF-003, HOST-001.

**Acceptance:** Offline status-only and comment_create enqueue; replay order; stop on failure; role_change offline throws; Angular IDB name does not drain React queue.

**Non-goals:** Queuing attachments or invites. Changing server unsafe list.

---

## MILESTONE 8 — Conflict handling

**Status:** implemented in Phase 8. See [16-phase8-conflict-resolution.md](./16-phase8-conflict-resolution.md). React status-only 409 auto-retry was **not** copied. No force-overwrite API.

**Objective:** Full `ConflictDialog`; keep draft vs reload `latest`; queued 409 → `conflict` status; status auto-reconcile once.

**Concepts:** `ConflictCoordinator` signal; forms patch from `latest`.

**Source:** `ConflictDialog.tsx`, `handleConflict`, replay 409 path, JSONB omit/null semantics (server).

**Risks:** CONFLICT-001, A11Y-001.

**Acceptance:** Two-client edit; dialog a11y; conflicted count; auto-reconcile only for status-only; `latest` never dropped.

**Non-goals:** OT/CRDT. Changing RPC versioning.

---

## MILESTONE 9 — Attachments, notifications, audit

**Status:** implemented in Phase 9. See [17-phase9-product-surfaces.md](./17-phase9-product-surfaces.md). Comment create and notification-read stay **online-only**. Due-nudges remain deferred. Notification preferences UI is not in this phase.

**Objective:** Initiate/complete/download/delete; notification list/read/read-all/preferences; task history; workspace audit 403; due-nudges on online.

**Concepts:** multi-step upload; lazy audit route.

**Source:** `attachmentQueries.ts`, notification queries, `AuditView`, `TaskHistoryPanel`, due-nudges route.

**Risks:** UPLOAD-001, PREF-001, KEY-001, PERM-001 (audit).

**Acceptance:** Happy-path upload; failed PUT does not mark ready; notifications grouping still server-side; audit admin-only; viewer task history OK.

**Non-goals:** New MIME types. Public bucket.

---

## MILESTONE 10 — Testing, accessibility, parity QA

**Status:** implemented in Phase 10. See [18-phase10-final-parity.md](./18-phase10-final-parity.md). **Final migration status: COMPLETE WITH MANUAL QA GAPS.** There is no Phase 11.

**Objective:** Behavioral coverage + visual/a11y parity. React tests remain green.

**Concepts:** Angular unit tests for services; e2e against proxied origin; axe.

**Source:** all `lib/demos/taskflow/**/*.test.ts`; compare to React UI.

**Risks:** TEST-001, UI-001, A11Y-001.

**Acceptance:** Ported tests for queue, realtime backoff, hooks-equivalent facades; keyboard dialogs; documented remaining gaps (not silent). Calendar and Settings are real product surfaces. Authentication live smoke remains PARTIAL without a human Google session. No dedicated Angular Playwright grid.

**Non-goals:** Deleting React. Rewriting SQL tests. New product features. Claiming production deploy or complete interactive parity.

---

## Explicitly out of scope for all milestones until a later program

- Installing Angular during Phase 0
- NgRx by default
- Database/RLS rewrites
- Replacing Supabase
- ResolveOps product work
- Changing React TaskFlow URLs
