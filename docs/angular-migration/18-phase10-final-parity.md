# 18 — Phase 10 final parity, hardening, portfolio readiness

This is the **final** TaskFlow Angular migration phase. There is no Phase 11.

React/Next TaskFlow under `/demos/taskflow` remains the known-good product and was **not** changed.

Phase 10 is VERIFY / COMPARE / HARDEN / DOCUMENT. Calendar and Settings were still unexplained placeholders at the start of this phase; both are now existing-product surfaces, not redesigns.

**Final migration status: COMPLETE WITH MANUAL QA GAPS**

Automatable architecture, unit tests, accessibility checks, and production builds pass. Interactive Google OAuth, two-client live sessions, visual responsive QA, and a dedicated Angular Playwright grid were **not** available unattended and are **not** marked PASS.

---

## How to read this document

Parity status uses:

| Status | Meaning |
| --- | --- |
| **PASS** | Behavior matches the important React workflow, proven by code + behavioral tests |
| **PARTIAL** | Implementation exists, but a required live/human check was not executed |
| **INTENTIONAL DIFFERENCE** | Deliberate Angular behavior that is safer or clearer than React |
| **FAIL** | Known broken. None recorded in this phase. |

Do not treat “route exists” or “screenshot similar” as parity.

---

## STEP 0 — React ↔ Angular feature matrix

| Feature | React behavior | Angular behavior | Parity | Intentional difference | Reason |
| --- | --- | --- | --- | --- | --- |
| Authentication | Google OAuth → Next `/auth/callback` → httpOnly cookies → `GET /api/me` | Same cookie Option A via Angular origin proxy; `/signin`, `authGuard`, interceptor 401 | **PARTIAL** | Callback still Next; Angular never holds a user JWT for API calls | Live Google consent was not available unattended. Mechanism is implemented (Phases 2–6). |
| Workspace selection | Persist last workspace; picker when multiple | `WorkspaceContextService`; sidebar picker when `workspaces.length > 1` | **PASS** | — | Same `/api/workspaces` contract. |
| Dashboard | Derived stats, pulse, health, upcoming, activity | Same `read-model` selectors over `httpResource` | **PASS** | No optimistic fake numbers | Same mapped workspace data. |
| Projects | List, filters, create/edit, versioned PATCH | Reactive Forms + `expectedVersion` | **PASS** | No optimistic cache writes | Phase 4. |
| Tasks | List/board, filters in URL, editor, status | Same URL filters; board without drag/drop | **INTENTIONAL DIFFERENCE** | No board DnD | Deferred; status `<select>` is the write path. |
| Task create | Online POST; not queued | Online-only; 503 if offline | **PASS** | Same unsafe classification | `task_create` is not queueable. |
| Task edit | Versioned PATCH; offline-safe fields queue | Same; IndexedDB `task_update` | **PASS** | Queue is user-bound | Phase 7. |
| Task archive | Versioned archive/restore | Same mutation path | **PASS** | — | Existing API. |
| Task status | Status-only 409 auto-retries once | 409 opens resolver; no auto-retry | **INTENTIONAL DIFFERENCE** | No silent retry | Prevents last-write-wins on status. |
| Assignees | Member+; versioned | Same; `task_assign` online-only | **PASS** | — | Phase 4/5. |
| Calendar | Month grid, `?month=YYYY-MM`, weekStart, upcoming, task peek → board | Same grid, URL, weekStart, peek dialog, `/tasks?task=` | **PASS** | — | Implemented in Phase 10 from React `CalendarView`. |
| Team | Members, roles, remove, invite | Same UI + 403 handling | **PASS** | — | Phase 5. Live two-account matrix PARTIAL. |
| Invitations | Create/revoke/accept; token in query; `next` | Same; Angular invite `next` allowlist | **PASS** | Narrower `next` than a generic search string | INVITE-001. |
| Roles | owner/admin/member/viewer | Same `WorkspacePermissionsService` | **PASS** | Client perms are UX only | Server/RLS remain authoritative. |
| Permissions | Hidden/disabled + API 403 | Same; 403 not converted to queue | **PASS** | — | Tests cover UI + 403. Live role accounts PARTIAL. |
| Realtime | Workspace channel → query invalidation | Same tables → domain `.reload()` after 75ms coalesce | **PARTIAL** | Payload is not a second store | Live two-client not executed. Coordinator tests exist. |
| Presence | Track/untrack on workspace; not membership | Same; stop on logout/switch | **PARTIAL** | — | Unit tests for clear-on-stop. Live two-tab PARTIAL. |
| Offline | `navigator.onLine`; queue safe types | Same gate; Realtime disconnect ≠ offline | **INTENTIONAL DIFFERENCE** | Realtime `offline` is not browser offline | Avoids false outbox fills. |
| Replay | Sequential; React can cross-user in same origin IDB | User-bound `replayableForUser`; Web Locks | **INTENTIONAL DIFFERENCE** | Cross-user blocked; one replay owner | Fixes a React weakness. |
| Conflict handling | JSON draft dialog; status auto-retry; reload page | Field-level ConflictSession; no force overwrite | **INTENTIONAL DIFFERENCE** | Explicit three-way merge | Phase 8. |
| Comments | CRUD; React may queue create | CRUD; create/update/delete **online-only** | **INTENTIONAL DIFFERENCE** | No `comment_create` queue | POST is not idempotent. |
| Attachments | initiate → signed PUT → complete | Same; no Storage SDK; no File in IDB | **PASS** | — | Phase 9. Live upload PARTIAL. |
| History | Task activity, first 12, raw-ish | Same API; formatted events; unknown type safe | **INTENTIONAL DIFFERENCE** | Formatted copy | Clearer than raw JSON. |
| Notifications | Panel, unread, mark-read, navigate | Same; UUID-only `/tasks?task=`; mark-read online-only | **PASS** | Unsafe `entity_id` ignored | No arbitrary URL navigation. |
| Audit | Admin+; 403 for others | Same route + 403 permission state | **PASS** | Route is not the security boundary | Viewer can open `/audit`; API denies. |
| Settings | Density, weekStart, notification prefs API, local fake profile save | Density, weekStart, prefs API; **account read-only from `/api/me`** | **INTENTIONAL DIFFERENCE** | No fake “Profile changes saved” | React Account tab writes Zustand only. |
| Accessibility | Modal trap, labels, unread not color-only | Same + axe serious/critical = 0 on listed surfaces | **PASS** | Progress bars named | Keyboard/visual PASS is PARTIAL (see gaps). |
| Responsive behavior | Month scroller, drawers, dialogs | Same CSS patterns; 320px calendar hint | **PARTIAL** | — | Automated layout not visually measured at 320–1440. |
| Error states | Query loading/error/empty; mutation copy | Shared query states + classified HTTP | **PASS** | Stronger 403/offline/401 copy | 400/401/403/404/409/500/503 mapped. |

---

## STEP 1 — Authenticated live smoke

**Result: PARTIAL**

Required human chain was **not** executed in this unattended session:

1. Open `http://localhost:4200` signed out → protected route → `/signin`
2. Continue with Google
3. Next `/auth/callback` on the Angular origin (proxy)
4. `GET /api/me` authenticated
5. Protected route loads
6. Refresh → session survives
7. Logout → `/api/me` unauthenticated → signin
8. Refresh → remains signed out

**Missing human step:** interactive Google consent against a real Supabase redirect URL that includes `http://localhost:4200/auth/callback`.

Automated proof that remains:

- `authGuard` sends unauthenticated users to `/signin?next=`
- `guestGuard` for signin
- `GET /api/me` + 401 interceptor → `handleUnauthorized`
- Logout calls Next signout, stops Realtime, clears `currentUser`
- Failed logout keeps the session

React TaskFlow auth smoke: **not** re-run interactively. React code was not modified. Portfolio tests/build still pass.

---

## STEP 2 — Shared backend parity

**Result: PARTIAL**

Both clients target the same Next `/api/taskflow/*` and `/api/me` contract. Angular does not have a second database.

Live “Angular create → React sees it” was **not** executed (requires the STEP 1 session on both `:3000/demos/taskflow` and `:4200`).

---

## STEPS 3–22 — Workflow, permissions, realtime, offline, product surfaces

| Step | Result | Evidence |
| --- | --- | --- |
| 3 Core workflow | **PASS** (automated) / live **PARTIAL** | Task/project/comment/attachment/history/notification/audit tests from Phases 4–9 |
| 4 Permission matrix | **PASS** (unit) / live **PARTIAL** | `permissions.spec.ts`, Team UI disable, audit 403, 403 ≠ queue |
| 5 Invitations | **PASS** (unit) / live **PARTIAL** | Token allowlist, accept POST, expired/already-accepted copy |
| 6 Realtime two-client | **PARTIAL** | Coordinator coalesces table events to domain reloads; no live second client |
| 7 Presence | **PARTIAL** | Clear on `stop()`, workspace switch, empty state tests |
| 8 Dirty editor vs realtime | **PASS** | `tasks-page.spec` keeps draft + `expectedVersion` N after list reload to N+1 |
| 9 Online conflict | **PASS** | ConflictDialog + `ConflictResolutionService`; no auto-retry |
| 10 Second conflict | **PASS** | Resolver refresh on nested 409; draft preserved (`conflict-resolution.spec`) |
| 11 Offline safe mutation | **PASS** | Queue `task_update`/`task_status` with `expectedVersion`; waiting-to-sync copy |
| 12 Offline conflict | **PASS** | Replay 409 → `conflict` status; no retry loop; Phase 8 submit uses latest version |
| 13 Unsafe offline | **PASS** | Including `notification_preferences` added this phase |
| 14 Cross-user outbox | **PASS** | `replay.spec` User B does not send User A items |
| 15 Multi-tab replay | **PASS** (Chromium Web Locks) | `navigator.locks.request(REPLAY_LOCK_NAME)`; fallback = in-tab `inFlight` only if Locks missing |
| 16 Comments | **PASS** | Validation, draft on failure, double-submit busy, offline reject |
| 17 Attachments | **PASS** | Initiate/complete path; no Blob in IDB; no service secret |
| 18 Notifications | **PASS** | Unread count, mark-read failure, UUID-only navigation, logout clears list |
| 19 History / audit | **PASS** | Formatter; unknown action does not crash; audit 403 page |
| 20 Network error matrix | **PASS** | Classified in `http-error.ts` / `mutation-error.ts`; 503 offline-unsafe ≠ 500 |
| 21 Auth expiration | **PASS** (unit) | 401 clears session, no queue conversion; live expiry **PARTIAL** |
| 22 Logout cleanup | **PASS** (unit) | Auth/realtime/notifications resources unauthenticated → empty defaults. Queue remains user-owned in IDB. |

---

## STEPS 23–25 — Routes, Calendar, Settings

### Routes

| Path | Direct nav / refresh | Notes |
| --- | --- | --- |
| `/` | redirects `/dashboard` | Guarded |
| `/dashboard` `/projects` `/tasks` `/calendar` `/team` `/audit` `/settings` | lazy `loadComponent` | Guarded |
| `/signin` | chromeless | `guestGuard` |
| `/invite` | chromeless; `?token=` | Allowlisted token |
| unknown | Angular not-found | Link home to `/dashboard` |
| `/tasks?task=` | task detail | Does not require arriving from the board |

Back/forward and query params are Router-owned (task filters, calendar `month`).

### Calendar — resolved: PASS

Placeholder `FoundationPage` removed. Angular now matches React `CalendarView`:

- Month grid from `activeTasks` + `dueDate`
- `?month=YYYY-MM` written when missing (same as React)
- `weekStart` from `UiStateService`
- Upcoming deadlines (limit 6)
- Peek dialog → “Open on task board”

### Settings — resolved: PASS with one intentional difference

| Tab | React | Angular |
| --- | --- | --- |
| Appearance | Local density | Local density + `html[data-density]`; theme stays top-nav |
| Notifications | `GET/PATCH /api/taskflow/notification-preferences` | Same camelCase PATCH body |
| Account | Editable Zustand name/email; “Profile changes saved.” | **Read-only** from `AuthService` / `/api/me` |
| Preferences | Local `weekStart` | Same key `taskflow-angular-week-start` |

Due-nudges, command palette, email/push delivery remain **out of scope** (never Phase 10 product expansion).

---

## STEPS 26–32 — A11y, keyboard, responsive, browsers, console, network

| Step | Result |
| --- | --- |
| 26 axe | **PASS** — `src/app/a11y.spec.ts` covers signin, dashboard, projects, tasks, conflict dialog, team, notifications, audit, settings, invite, calendar. `color-contrast` disabled in jsdom. Target: 0 serious, 0 critical. Progress bars received accessible names this phase. |
| 27 Keyboard | **PARTIAL** — Escape/focus trap covered for mobile nav + dialogs in unit tests. Full manual keyboard pass not executed. |
| 28 Screen reader | **PARTIAL** — Semantics inspected in templates (headings, dialog names, labels, status). No live SR session. |
| 29 Responsive | **PARTIAL** — Calendar horizontal scroller + short-viewport CSS exist; viewports 320/375/768/1024/1440 and 1440×600 not visually measured. |
| 30 Cross-browser | **PARTIAL** — No Angular Playwright project. Unit tests run in jsdom. Web Locks used when `navigator.locks` exists; otherwise single-tab `inFlight` fallback (documented). |
| 31 Console | **PARTIAL** — No `console.log` in `src/`. Live uncaught-exception pass not executed. |
| 32 Network sanity | **PASS** (unit) — Realtime coalesced reloads; no `reloadAll()` default; no polling; 401 does not retry-storm; queue replay is lock-gated. |

Expected build warning: `@supabase/ssr` pulls CommonJS `cookie` (optimization bailout). Not a style-budget warning.

---

## STEPS 33–38 — Performance, memory, security, deps, dead code, tests

### Performance

| Check | Result |
| --- | --- |
| Initial bundle | 446.93 kB raw / ~116 kB transfer — under 500 kB warning |
| Lazy routes | dashboard, projects, tasks, calendar, team, settings, audit, signin, invite |
| Tasks chunk | 66 kB — largest feature (editor + comments + attachments + history) |
| Eager comments on every task | No — comments load with task detail |
| Unbounded history | Limit remains server-side; UI shows formatted subset |

**PASS** for “no obvious eager-everything regression.”

### Subscriptions

`takeUntilDestroyed` on Realtime coordinator, shell navigation, replay reconnects. Dialogs are `*if`/signal gated. Online/offline listeners live on `RealtimeService` and are removed on `stop()`. **PASS** by inspection.

### Security checklist

- [x] no service secret browser-side (`public-config.ts` rejects `service_role` / forbidden keys)
- [x] no arbitrary Supabase table reads (Realtime/Presence only)
- [x] no auth token persisted in outbox (`assertSafeQueuePayload`)
- [x] no force overwrite
- [x] no RLS bypass (writes go Next → `server/taskflow`)
- [x] 403 authoritative
- [x] upload paths server-issued
- [x] notification links validated (UUID task ids only)
- [x] cross-user replay blocked
- [x] invite redirect validated
- [x] client permissions remain UX only

**PASS**

### Dependencies

- Added **devDependency** `axe-core` for STEP 26.
- Did **not** add NgRx or TanStack Angular Query.
- Did **not** upgrade Angular/Supabase “because newer exists.”
- Node floor remains `^22.22.3` (`.nvmrc` / `engines`).
- `@supabase/ssr` still required for the cookie-backed Realtime browser client.

### Dead code

Removed `FoundationPage` after Calendar and Settings became real pages. Left `ConflictNotice` (still used by editors). No broad refactor.

### Test quality

New tests assert behavior: calendar placement + board navigation, settings density persist, read-only account, prefs PATCH body, offline prefs 503, axe serious/critical = []. Existing 409/offline/cross-user/lock tests were kept.

---

## STEPS 39–41 — Validation recorded this phase

### Angular (`taskflow-angular/`, Node v22.23.2)

| Check | Result |
| --- | --- |
| lint | **not configured** (no `ng lint` script) |
| unit tests | **302 passed** / 52 files (`npm run test:ci`) |
| production build | **PASS** |
| anyComponentStyle budget | **NONE** |
| E2E | **not configured** (0 Playwright tests against `:4200`) |
| a11y | included in the 302 (11 surface tests) |

### Portfolio root

| Check | Result |
| --- | --- |
| `npm run lint` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm test` (vitest) | **366 passed** / 56 files |
| `npm run build` | **PASS** (Next 16.2.10, React TaskFlow routes present) |
| Playwright / `test:a11y` | **not run** — targets Next preview, not Angular `:4200` |

### React TaskFlow regression

**PASS** for “not broken by this migration”: no React/TaskFlow source edits; portfolio unit tests and production build include `/demos/taskflow/*`. Interactive React signin/dashboard smoke: **PARTIAL** (same missing Google session).

---

## STEP 42 — Intentional differences

1. **Status-only 409 requires explicit resolution** — React auto-retries once. Angular never silently rebases a write.
2. **User-bound IndexedDB outbox** — User A’s queued PATCH cannot replay as User B on the same origin.
3. **Multi-tab replay protection** — `navigator.locks` exclusive owner; no duplicate PATCH when two tabs share IDB.
4. **Comments and notification-read are online-only** — React’s type union allows queueing non-idempotent POSTs / unused read types.
5. **Realtime disconnect is not browser offline** — outbox follows `navigator.onLine` only.
6. **History/audit events are formatted** — unknown types fall back to `summary` / action name instead of crashing or dumping JSON.
7. **Stronger error taxonomy** — 403/401/offline-unsafe are not collapsed into a generic retry.
8. **Account settings are read-only from `/api/me`** — React’s Account tab fakes persistence in Zustand.
9. **No board drag-and-drop** — status changes use an accessible select. Deferred, not claimed as parity.
10. **No command palette / due-nudges UI** — documented deferred product, not silent placeholders.

---

## STEP 43 — What the Angular migration taught us

1. **DI services vs hooks** — one `providedIn: 'root'` owner per domain (tasks, comments, queue) replaced “which component called `useQuery`.” Invalidation is a method on that owner, not a query-key string scattered through JSX.
2. **Signals vs mixed React state** — chrome (`UiStateService`) stayed tiny on purpose. Putting tasks in a store would have recreated the Zustand trap the migration was meant to avoid.
3. **`httpResource` vs query hooks** — the resource *is* the cache. A generic `QueryCacheService` was designed in Phase 0 and correctly not built.
4. **Reactive Forms vs controlled components** — `expectedVersion` lives next to the draft, not in a ref on the side. Dirty editors survived realtime because the form was not rebound from the list resource.
5. **Router guards vs layout checks** — `authGuard` is UX. 401 handling in the interceptor is what actually matches cookie expiry.
6. **Realtime is a lifecycle, not a store** — table events schedule `.reload()`. Applying the payload would have overwritten dirty forms and bypassed RLS-shaped reads.
7. **Offline is a policy table** — “React queued it” is not a reason to queue it. Idempotence and user ownership matter more than matching the enum.
8. **Conflicts are a domain model** — `ConflictSession` + field kinds beat a JSON blob and a force-overwrite button.
9. **Parity includes refusing unsafe React behavior** — that is still parity with the *product contract*, not with every client implementation detail.

---

## STEP 44 — Portfolio-ready project description

**One sentence.** Implemented a second Angular client against the existing TaskFlow backend (Next API, Supabase Auth/RLS, Realtime, and Storage) without replacing the React app.

**Case study.** TaskFlow is a collaborative workspace: Google auth, versioned task/project writes, invitations, comments, attachments, notifications, and audit. The Angular app sits beside `/demos/taskflow` and speaks the same HTTP contract. Realtime only invalidates domain resources. Offline writes go through a user-bound IndexedDB outbox with Web Locks so two tabs cannot double-replay. Version conflicts open an explicit three-way resolver; Angular does not auto-retry or force-overwrite. Calendar and Settings were completed as existing-product surfaces. Interactive Google OAuth on `:4200` still needs a human session, so the public claim is a second client with verified architecture and tests—not “complete live parity” and not “production deployed.”

**Stack.** Angular 22 (standalone, signals, `httpResource`, Reactive Forms, Router guards), RxJS, Angular CDK a11y, IndexedDB, Web Locks, Supabase JS (Realtime/Presence only), existing Next.js Route Handlers + `server/taskflow` + Supabase RLS/Storage.

**Architecture highlights.** Cookie Option A (no API JWT in the SPA). Domain `httpResource` services instead of NgRx/TanStack. Realtime coordinator (75ms coalesce). User-bound outbox. Typed conflict session. Server-issued attachment URLs.

**Migration challenge.** Preserve `expectedVersion` / 409, permissions, and offline safety while translating React hooks into Angular-native ownership—not a file-for-file port.

**Validation.** Angular **302** unit tests passed; production build passed (initial 447 kB). Portfolio **366** vitest tests passed; Next production build passed. Axe serious/critical **0** on representative surfaces. Live auth/two-client QA remains a documented gap.

---

## STEP 45 — Resume bullets

- Re-engineered TaskFlow as a second Angular 22 client on the existing Next/Supabase backend, keeping RLS-backed APIs authoritative and limiting the browser Supabase client to Realtime and Presence.
- Implemented versioned writes with an explicit three-way conflict resolver and a user-bound IndexedDB outbox (Web Locks, no cross-user replay, no force-overwrite), closing several React-client safety gaps without changing the server.
- Delivered remaining product surfaces (calendar, settings/notification preferences, comments, attachments via signed URLs, notifications, audit) with 302 Angular tests, 0 serious/critical axe violations on core screens, and a passing production build.

---

## STEP 46 — Interview explanations

### 30 seconds

I built a second TaskFlow client in Angular against the same backend as the React app. The point wasn’t to clone JSX—it was to learn Angular the way a real product is structured: signals and services for state, `httpResource` for server data, guards for UX, and the server still owning authz. Realtime only triggers reloads. Offline writes are queued per user. Conflicts are reviewed, not retried.

### 90 seconds

The React TaskFlow already had cookies, RLS, versioned PATCH, Realtime, and an outbox. I added an Angular SPA that proxies to those APIs. State is split: chrome signals, domain resources, a realtime coordinator, and a durable queue—never one global store. When another client changes a task, Angular invalidates that resource; an open dirty form keeps its draft and the original `expectedVersion`, so save correctly 409s. The Angular outbox is user-scoped and lock-gated across tabs, which the React client doesn’t do as strictly. I didn’t port comment-create into the queue because the POST isn’t idempotent. Calendar and Settings now match the product; the Account tab is honestly read-only instead of a fake local save. What’s still open is a human Google login pass on localhost:4200.

### Deep technical

**Why migrate?** To practice Angular on a domain that already has hard edges (auth cookies, 409, RLS, presence, uploads), and to have a comparable artifact for an Angular-first product later.

**Why Angular?** Standalone + signals + `httpResource` + DI match those edges without NgRx. The learning goal was idiomatic Angular, not a React-shaped clone.

**Why not a mechanical port?** Hooks, Query keys, and Zustand slices don’t map 1:1. Porting files would have duplicated caches and invited a second source of truth.

**State split.** `AuthService` / guards / interceptor. `httpResource` per collection. `UiStateService` for theme/density/weekStart/sidebar. `RealtimeService` + `RealtimeCoordinatorService` (auditTime 75ms). `MutationQueueService` + `OfflineReplayService`. `ConflictResolutionService` for 409 sessions.

**Realtime.** Cookie-backed `createBrowserClient` from public config. Channel per workspace. Events carry table names, not authoritative rows. Coordinator reloads the owning service. Presence is tracking, not members.

**Offline.** `navigator.onLine` only. Queue types: `task_update`, `task_status`. Replay oldest-first under Web Locks; skip other users; on 409 mark `conflict` and stop that item.

**Conflicts.** No automatic expectedVersion bump. Diff kinds CONFLICTING vs auto-merge. Reviewed submit uses latest.version. Nested 409 refreshes latest and keeps the resolved draft.

**What Angular improved.** User-bound queue, multi-tab lock, no status auto-retry, no comment queue, formatted history, honest account settings, named progress bars.

**What stays different.** No DnD, no command palette, no due-nudges UI, no dedicated Angular E2E grid, auth live smoke still needs a human.

---

## STEP 47 — Final migration status

**COMPLETE WITH MANUAL QA GAPS**

Not **COMPLETE**: interactive Google OAuth, two-client live parity, visual responsive/keyboard/SR, and Angular Playwright were not executed.

Not **NOT COMPLETE**: no critical workflow is known broken; automatable tests and builds pass; Calendar/Settings are no longer placeholders; stop-condition items (silent overwrite, cross-user replay, secrets in the browser, RLS bypass, dirty-form clobber, failed builds) were not found.

---

## Acceptance checklist

- [x] Final React/Angular parity matrix exists
- [x] Authentication smoke PARTIAL (missing human Google step documented)
- [x] Shared backend parity PARTIAL (same APIs; live two-client not run)
- [x] CRUD workflows pass in tests
- [x] Permissions validated in tests
- [x] Realtime implemented; live two-client PARTIAL
- [x] Presence implemented; live two-tab PARTIAL
- [x] Dirty-editor realtime safety tested
- [x] Online / second conflict tested
- [x] Offline queue / offline conflict tested
- [x] Cross-user replay tested
- [x] Multi-tab lock tested
- [x] Comments / attachments / notifications / history / audit tested
- [x] Calendar status resolved (PASS)
- [x] Settings status resolved (PASS + account intentional difference)
- [x] Logout isolation tested
- [x] Route matrix covered by Router tests
- [x] Accessibility automation passes (0 serious/critical)
- [x] Keyboard QA PARTIAL
- [x] Responsive QA PARTIAL
- [x] Cross-browser PARTIAL (no Angular Playwright)
- [x] Console/network sanity: code inspection + tests; live console PARTIAL
- [x] Security review passes
- [x] Dependency/dead code review complete
- [x] Angular unit tests + production build pass
- [x] Portfolio lint/tsc/vitest/build pass
- [x] React TaskFlow not modified; portfolio tests still green
- [x] Intentional differences documented
- [x] Portfolio copy / resume / interview text created
- [x] Final status assigned

---

## Known remaining QA gaps

1. Human Google OAuth on `localhost:4200` (and React `:3000/demos/taskflow`) including refresh/logout.
2. Same-workspace two-client CRUD/realtime/presence/invite accept.
3. Manual keyboard, screen reader, and viewport matrix.
4. Dedicated Angular E2E in Chromium/Firefox/WebKit.
5. Live attachment binary upload and signed-URL PUT.
6. Web Locks behavior in Firefox/WebKit (code falls back if `navigator.locks` is missing).
7. Due-nudges, command palette, and board drag/drop remain deferred (not claimed as done).

## Next project readiness

**READY** to talk about as a completed migration with documented manual gaps. **NOT READY** to claim production deployment or full interactive parity.
