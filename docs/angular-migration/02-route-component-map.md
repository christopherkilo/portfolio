# 02 — Route and component migration map

Routes today use `DEMO_BASE = "/demos/taskflow"` (`lib/demos/taskflow/data.ts`). Angular routes below assume a **separate** app base (placeholder `/tf/` or `/angular/taskflow/`) so React URLs stay stable. Final base is an open hosting decision.

Difficulty: **LOW** = presentational / routing. **MEDIUM** = forms + API + permissions UI. **HIGH** = versioning, realtime, IDB, focus, or multi-step protocols.

Do not assume 1 React component = 1 Angular component.

---

## Pages

### Dashboard

| | |
| --- | --- |
| **CURRENT** | Route `app/demos/taskflow/dashboard/page.tsx` → `DashboardView.tsx`. Stats, due-soon, activity. Depends on Query tasks/projects/activity, Zustand settings, `ActivityFeed`. |
| **TARGET** | `features/dashboard/dashboard.page.ts` (standalone). Inject Tasks/Projects/Activity query facades. |
| **Difficulty** | MEDIUM (derived stats must match `productivity` selectors, not seed `data.ts`) |

### Projects

| | |
| --- | --- |
| **CURRENT** | `projects/page.tsx` → `ProjectsView.tsx`. Health from tasks, create/edit, versioned PATCH. |
| **TARGET** | `features/projects/` page + `ProjectForm` (Reactive Forms). `ProjectsApi` + cache keys `projects(ws)`. |
| **Difficulty** | MEDIUM; versioned edit **HIGH** if conflict UI is in-page |

### Tasks

| | |
| --- | --- |
| **CURRENT** | `tasks/page.tsx` → `TasksView.tsx`. Board/list, filters, `?create=1`, DnD status, `TaskEditorModal`. |
| **TARGET** | `features/tasks/tasks.page.ts` + `TaskBoard` + `TaskFilters`. Editor is a **dialog**, not a route (matches today). |
| **Difficulty** | HIGH (DnD + `expectedVersion` + optional status auto-reconcile) |

### Calendar

| | |
| --- | --- |
| **CURRENT** | `calendar/page.tsx` → `CalendarView.tsx`. Week start from Zustand `settings.weekStart`. |
| **TARGET** | `features/calendar/` lazy. Same Query tasks; `computed` from `weekStart` signal. |
| **Difficulty** | MEDIUM |

### Team

| | |
| --- | --- |
| **CURRENT** | `team/page.tsx` → `TeamView.tsx`. Members, workload, invites, role/remove, `InviteMemberModal`. |
| **TARGET** | `features/team/` + invite dialog. `MembersApi`, `InvitationsApi`. |
| **Difficulty** | HIGH (role rules, offline-unsafe, optimistic member updates) |

### Audit

| | |
| --- | --- |
| **CURRENT** | `audit/page.tsx` → `AuditView.tsx`. `GET .../audit`, 403 for non-admin. |
| **TARGET** | `features/audit/` lazy. `roleGuard` is UX only; still handle 403. |
| **Difficulty** | MEDIUM |

### Settings

| | |
| --- | --- |
| **CURRENT** | `settings/page.tsx` → `SettingsView.tsx`. Mix of Zustand settings + `notification-preferences` API. |
| **TARGET** | `features/settings/`. Split **chrome settings** (density, weekStart) vs **server preferences**. |
| **Difficulty** | MEDIUM |

### Sign-in

| | |
| --- | --- |
| **CURRENT** | `signin/page.tsx` → `SignInView.tsx`. Google OAuth `redirectTo` `/auth/callback?next=`. |
| **TARGET** | `features/auth/sign-in.page.ts`. Must keep callback on Next (`app/auth/callback/route.ts`) under Option A. |
| **Difficulty** | HIGH (AUTH-001) even though UI is simple |

### Invite acceptance

| | |
| --- | --- |
| **CURRENT** | `invite/page.tsx` → `AcceptInviteView.tsx`. Token in query; `POST /api/taskflow/invitations/accept`; may require sign-in first. |
| **TARGET** | `features/invitations/accept-invite.page.ts`. Preserve `next` / token query contract. |
| **Difficulty** | HIGH (INVITE-001, auth redirect loop) |

---

## Shell

### AppShell

| | |
| --- | --- |
| **CURRENT** | `layout/AppShell.tsx`. Chrome except signin/invite; Framer page variants; mobile nav trap; mounts CommandPalette, ShortcutHelp, ConflictDialog; `useTaskflowShortcuts`. |
| **TARGET** | `shared/layout/app-shell.ts`. Router `children` outlet. `CanMatch` or layout data for chrome-less routes. **Single** `commandOpen` signal. |
| **Difficulty** | MEDIUM (a11y drawer); animations LOW if CSS not Framer |

### Sidebar

| | |
| --- | --- |
| **CURRENT** | `Sidebar.tsx` + `NAV_ITEMS`. |
| **TARGET** | `shared/layout/sidebar.ts`. RouterLink active state. |
| **Difficulty** | LOW |

### TopNav

| | |
| --- | --- |
| **CURRENT** | `TopNav.tsx`. Workspace switcher, notifications, presence, connection, user menu. |
| **TARGET** | `shared/layout/top-nav.ts`. Injects UiState, Presence, Notifications query, Auth. |
| **Difficulty** | MEDIUM |

---

## Shared collaboration / chrome

### CommandPalette

| | |
| --- | --- |
| **CURRENT** | `shared/CommandPalette.tsx`. Navigation + actions. |
| **TARGET** | `shared/dialogs/command-palette.ts`. Router + facades for “create task” etc. |
| **Difficulty** | MEDIUM |

### ShortcutHelpModal

| | |
| --- | --- |
| **CURRENT** | `ShortcutHelpModal.tsx` + `shortcuts.ts`. |
| **TARGET** | `shared/dialogs/shortcut-help.ts`. |
| **Difficulty** | LOW |

### ConflictDialog

| | |
| --- | --- |
| **CURRENT** | `collaboration/ConflictDialog.tsx` + Zustand `conflictDraft`. Keep draft vs reload `latest`. |
| **TARGET** | `shared/dialogs/conflict-dialog.ts` + `ConflictCoordinator`. Must not lose `expectedVersion` / `latest`. |
| **Difficulty** | HIGH |

### ConnectionIndicator

| | |
| --- | --- |
| **CURRENT** | `ConnectionIndicator.tsx` + `connectionStatus` + queue counts. |
| **TARGET** | `shared/ui/connection-indicator.ts`. |
| **Difficulty** | LOW (display); depends on Realtime + Queue services |

### PresenceAvatars

| | |
| --- | --- |
| **CURRENT** | `PresenceAvatars.tsx`. Ephemeral presence only. |
| **TARGET** | `shared/ui/presence-avatars.ts` + `PresenceService` (part of RealtimeService). |
| **Difficulty** | MEDIUM |

### ActivityFeed

| | |
| --- | --- |
| **CURRENT** | `shared/ActivityFeed.tsx`. |
| **TARGET** | `shared/ui/activity-feed.ts`. Input: activity rows, not a store. |
| **Difficulty** | LOW |

### Query loading / error / empty

| | |
| --- | --- |
| **CURRENT** | `QueryStates.tsx`, `EmptyState.tsx`, `Skeleton.tsx`. SCHEMA_NOT_READY copy. |
| **TARGET** | `shared/ui/query-states.ts`. Same copy and retry. |
| **Difficulty** | LOW |

---

## Task functionality

### TaskEditorModal

| | |
| --- | --- |
| **CURRENT** | `tasks/TaskEditorModal.tsx`. Create/update, assignees, labels, due date, version. |
| **TARGET** | `features/tasks/task-editor.dialog.ts` + Reactive Form. Compose comments/attachments/history **inside** or as tabs — same UX, not necessarily one component. |
| **Difficulty** | HIGH |

### TaskComments

| | |
| --- | --- |
| **CURRENT** | `comments/TaskComments.tsx` + `commentQueries.ts`. Optimistic create/delete. |
| **TARGET** | `features/tasks/task-comments.ts`. |
| **Difficulty** | MEDIUM (offline `comment_create`) |

### TaskAttachments

| | |
| --- | --- |
| **CURRENT** | `attachments/TaskAttachments.tsx` + initiate → signed PUT → complete. |
| **TARGET** | `features/tasks/task-attachments.ts` + `AttachmentsApi`. |
| **Difficulty** | HIGH (UPLOAD-001) |

### TaskHistoryPanel

| | |
| --- | --- |
| **CURRENT** | `audit/TaskHistoryPanel.tsx` → `GET .../tasks/:id/history`. |
| **TARGET** | `features/tasks/task-history.ts`. |
| **Difficulty** | LOW |

---

## Team functionality

### InviteMemberModal

| | |
| --- | --- |
| **CURRENT** | `invitations/InviteMemberModal.tsx`. Admin+; returns `acceptUrl`. |
| **TARGET** | `features/team/invite-member.dialog.ts`. Offline-unsafe. |
| **Difficulty** | MEDIUM |

---

## Providers / bridges (not pages)

| Current | Target | Difficulty |
| --- | --- | --- |
| `TaskflowProviders` (`query/client.tsx`) | `provideHttpClient`, query provider, `UiStateService` | MEDIUM |
| `TaskflowRealtimeBridge` | `RealtimeService` started from shell `effect` when workspace+user ready | HIGH |
| `lib/demos/taskflow/api/client.ts` | `TaskflowApiClient` | MEDIUM |
| `store/ui.ts` | `UiStateService` + persist interceptor | MEDIUM |
| `RealtimeManager.ts` | `RealtimeService` class (port, don’t wrap React) | HIGH |
| `mutationQueue.ts` / `replay.ts` | `MutationQueueService` | HIGH |

---

## Primitives

`Button`, `Dropdown`, `Modal`, `Tooltip`, `ProgressBar` → `shared/ui/*`. **LOW**, except **Modal HIGH** for focus (A11Y-001).

---

## Split vs merge notes

- **Do not** make TaskComments a separate lazy route; it is editor chrome.
- **Do** keep ConflictDialog global (shell-level), like today.
- **Do** keep notifications as TopNav feature, not a `/notifications` page unless product changes (forbidden in migration).
- Seed arrays in `data.ts` are **not** a migration target for live data.
