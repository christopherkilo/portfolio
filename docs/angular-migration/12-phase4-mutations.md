# 12 — Phase 4 mutations (CRUD + Reactive Forms + versioned writes)

Phase 4 adds the first real write workflows to Angular TaskFlow. React/Next TaskFlow under `/demos/taskflow` remains the known-good product and was **not** changed.

No realtime, presence, IndexedDB queue, mutation replay, full ConflictDialog, attachments, notifications, invitations, team-role mutations, NgRx, TanStack Angular Query, or generic query cache.

---

## Current Mutation Flow (inspected from React source)

Not inferred from Phase 0 alone. Sources: `TaskEditorModal.tsx`, `TasksView.tsx`, `ProjectsView.tsx`, `lib/demos/taskflow/api/hooks.ts`, `lib/demos/taskflow/offline/safeMutations.ts`, `lib/demos/taskflow/store/schemas.ts` (`taskDraftSchema`), `server/taskflow/schemas/index.ts`, `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`, `app/api/projects/route.ts`, `app/api/projects/[id]/route.ts`, `app/api/taskflow/tasks/[taskId]/assignees/route.ts`.

### Task create

| | |
| --- | --- |
| **UI** | `TaskEditorModal` `mode="create"`. Form remounts with `key={mode-id}`. |
| **Client validation** | `taskDraftSchema`: title required max 160 (“Enter a task title.”); project required (“Choose a project.”); **assignee required** (“Choose an assignee.”); due date `YYYY-MM-DD` required (“Choose a due date.”); description max 2000; labels max 8 × 40 chars; estimate 0–400 optional. Stricter than the backend on assignee and due date. |
| **Defaults** | status `backlog`, priority `medium`, dueDate `todayDateOnly()`, first live (non-archived) project, first member as assignee. |
| **Route** | `POST /api/tasks` |
| **Payload** | `{ workspaceId, title, description, status, priority, projectId, assigneeId, dueDate, labels, estimate }` — **no** `expectedVersion`, **no** `assigneeIds` on the POST (extras after). |
| **Extra assignees** | `POST /api/taskflow/tasks/:id/assignees` `{ userId }` for `assigneeIds.slice(1)`. |
| **Auth** | Cookie session. Min role **member** (`canEditTask`). |
| **Success** | `onSaved(id)`, close editor; TanStack `invalidateWorkspace` (projects, tasks, activity, members). React save control is `type="button"` + `onClick`. |
| **Optimistic** | None on create. |

### Task edit

| | |
| --- | --- |
| **UI** | Same modal `mode="edit"`, opened from `?task=` detail → Edit. Interaction stays on `?task=`; no dedicated task route. |
| **Route** | `PATCH /api/tasks/:id` via `patchTaskWithVersion` |
| **Payload** | `{ ...fields, expectedVersion: initial.version ?? 1 }`. `expectedVersion` is the version on the `initial` task when the form mounted (`key` remount). |
| **Assignees** | PATCH `assigneeId` (primary), then `syncAssignees` vs previous `[initial.assigneeId]` using POST add / DELETE `/api/taskflow/tasks/:id/assignees/:userId`. |
| **Offline** | React may `enqueueMutation`. **Out of scope** for Phase 4. Angular PATCHes online only. |
| **Optimistic** | React does not optimistic-update the editor save. Assignee list mutations elsewhere can be optimistic; not copied. |

### Task status (board)

| | |
| --- | --- |
| **UI** | `TasksView.moveTask` from card `<select>` and DnD. |
| **Route** | `PATCH /api/tasks/:id` `{ status, expectedVersion: task.version ?? 1 }` |
| **409** | React `allowStatusAutoReconcile` retries **once** with `latest.version` when the body is status-only. |
| **Angular** | Status `<select>` on the board (no DnD). **No auto-retry.** 409 becomes editor/page conflict state. |

### Task archive / delete

Present in React task detail. Archive: `PATCH` `{ archived: true, expectedVersion }`. Delete: `DELETE /api/tasks/:id` (not versioned). Confirm dialogs. Angular ports both.

### Comments / attachments / history

In React **task detail**, not `TaskEditorModal`. **Deferred.**

### Project create

| | |
| --- | --- |
| **UI** | Projects page “New project” modal: name, description, dueDate, color (palette), hardcoded `status: "planning"`. |
| **Route** | `POST /api/projects` |
| **Payload** | `{ workspaceId, name, description, dueDate, color, status: "planning" }` |
| **Schema** | `createProjectSchema`: name 1–120 (“Enter a project name.”), description max 1000, color default `#60A5FA`, dueDate optional `YYYY-MM-DD`. |
| **Role** | **admin+** (`canManageProjects`). React still shows the button to everyone; API 403s. |
| **Success** | Close, reset draft, `setProjectId(created.id)`. `invalidateWorkspace`. |

### Project edit

| | |
| --- | --- |
| **UI** | Detail modal: rename + archive/restore. Not a full re-create form. |
| **Route** | `PATCH /api/projects/:id` |
| **Payload** | `{ name, expectedVersion }` or `{ archived, expectedVersion }` |
| **Schema** | `updateProjectSchema` **requires** `expectedVersion`. |
| **Delete** | **No** DELETE project route. |
| **Role** | admin+ |

### expectedVersion / 409 `STALE_VERSION`

PATCH bodies include `expectedVersion` (positive int). 409 envelope:

```json
{
  "success": false,
  "error": { "code": "STALE_VERSION", "message": "...", "fieldErrors": {} },
  "data": { "latest": <entity row> }
}
```

Default message: “This item changed while you were editing it.” React `handleConflict` writes Zustand `conflictDraft` (entity type, id, draft, latest, expectedVersion) and opens ConflictDialog (Phase 8). Status-only may auto-retry once.

### Unsaved close

React modal **does not warn**. No unsaved-changes system in Phase 4.

### Permissions (product)

`canEditTask` = member+; `canManageProjects` = admin+. Backend is authoritative. React often still shows write controls; 403 is the real gate.

---

## Angular mutation architecture

Reads stay Phase 3 domain `httpResource` services. Writes are **separate** injectables so read services do not become god objects:

| Service | Job |
| --- | --- |
| `TasksDataService` / `ProjectsDataService` / `ActivityDataService` | GET + `.reload()` |
| `TaskMutationsService` | `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`, assignee POST/DELETE |
| `ProjectMutationsService` | `POST /api/projects`, `PATCH /api/projects/:id` |
| `WorkspacePermissionsService` | UX flags from `AuthService` + `WorkspaceReadsService.members` (same ranking as `server/taskflow/auth/roles.ts`) |

Typed `HttpClient` + `unwrapTaskflowEnvelope` + `catchTaskflowHttp()`. Envelope unchanged. `TaskflowApiError.data.latest` is preserved for 409.

**No** generic QueryCacheService, **no** TanStack Angular Query, **no** NgRx, **no** global `isSaving` on `UiStateService`.

Mutation phase is **per editor/action**: `idle | submitting | error | conflict`.

---

## Reactive Forms

`FormGroup` / `FormControl` / `Validators`. The form owns the **draft**. The loaded resource owns **server state**. Typing never mutates the mapped task/project object.

### Task form

`title`, `description`, `status`, `priority`, `projectId`, `dueDate`, `estimate`, `labels`, `assigneeIds`.

Client messages match `taskDraftSchema` (including required assignee and due date). Backend remains authoritative; 400 `fieldErrors` are applied onto controls.

### Project create form

`name`, `description`, `dueDate`, `color` + `status: "planning"` on submit.

### Project edit

Separate `rename` control + archive/restore. Matches React detail, not a newly invented settings form.

Submit controls are real `<button type="submit">`, disabled while `submitting`, no double-submit.

---

## Form vs server-state ownership (lifecycle)

Strategy (needed even more once realtime arrives):

1. **Populate once when the editor instance is created.** Parent remounts with `@if (createOpen)` / `@if (editSnapshot)` so create vs edit vs another task id cannot share dirty state (React `key={`${mode}-${id}`}`).
2. **`expectedVersion` / `baselineVersion` is captured in `ngOnInit` from that snapshot**, not from a later `tasks.tasks()` emission.
3. **List/resource reload does not `patchValue` a dirty form.** Task edit snapshot is copied on Edit click and is not replaced when the list reloads. Project edit snapshot is captured when `?project=` changes to a **new id**, not when the same id is refetched.
4. After a **successful** project rename, `baselineVersion` is updated from the PATCH response so the next save in the same session is not a guaranteed 409. Task editor closes on success, so it does not need this.

---

## Task create

`tf-task-editor` mode `create`. Uses current workspace id. Payload matches React POST. Extra assignees after create. Success closes the dialog and opens `?task=<id>`. Then `tasks.reload()` + `activity.reload()`.

---

## Task edit

Read-only `?task=` modal remains. **Edit** opens a wide dialog on the snapshot. Read-only fields stay in the detail modal (comments/attachments still deferred). Editable fields match `TaskEditorModal`.

---

## expectedVersion

Edit PATCH always sends `expectedVersion: baselineVersion` from the editing session. Board status PATCH sends the **card’s displayed** `task.version` (there is no long-lived status draft). Archive uses the selected task’s version at confirm time.

Never substitute a freshly reloaded list version into an open task editor.

---

## 409 `STALE_VERSION`

Recognized via `status === 409` or `code === "STALE_VERSION"` (`isStaleVersionError`).

- Not reported as a generic server error
- **Not auto-retried** (intentional divergence from React status-only reconcile)
- Does **not** overwrite the form
- Retains `latest` from `data.latest` (mapped with `mapTask` / `mapProject`)
- Stores workflow conflict: entity type, id, expected/base version, latest entity, local draft
- Accessible notice: *“This task/project changed since you opened it. Your edits have been preserved. Conflict resolution will be available in a later migration phase.”* (Phase 8 replaces this with the real resolver; see [16-phase8-conflict-resolution.md](./16-phase8-conflict-resolution.md).)
- **Keep editing** (dismiss banner, draft stays) / **Cancel** (close). No “Save anyway”. No unlabeled Reload that would clobber the draft.

### Conflict state boundary

**Not** in `UiStateService`. Lives on the editor (`TaskEditor.conflict` / `ProjectEditor.conflict`) or the board status action (`TasksPage.statusConflict`). Enough for Phase 8; not a global conflict engine.

---

## Mutation reload strategy

After **successful** writes only:

| Write | Reload |
| --- | --- |
| Task create/update/status/archive/delete | `tasks.reload()`, `activity.reload()` |
| Extra assignee sync | included in the same task-write reload |
| Project create/rename/archive | `projects.reload()`, `activity.reload()` |

Dashboard derived values update because they `computed()` from the same root task/project resources. Members are **not** reloaded on assign (GET `/api/members` is workspace membership, not task assignees). Workspaces are not reloaded. No full-app reload. No generic invalidation.

Failed 409 does **not** reload (would not help the draft and must not remount the editor).

---

## Permissions

UX only. Viewer: no Create task, no board status select, no Edit/Archive/Delete. Member: task writes, no New project / rename / archive. Admin/owner: project writes.

`WorkspacePermissionsService` uses existing member rows (`member.id === auth.currentUser().id`) and the same `roleAtLeast` ranking as the server.

---

## Accessibility

Existing CDK focus trap + Escape on `tf-read-dialog`. Dialogs: labelled title, field `aria-invalid` / `aria-describedby`, error `role="alert"`, submit buttons, `aria-busy` on the form, `aria-pressed` on assignee chips, status select labelled. Close disabled while a confirm submit is in flight. Loading “Saving…” on the submit control.

---

## HTTP contract handling

Asserted in unit tests: method, route, body keys, `expectedVersion`, workspace/project ids, no invented `assigneeIds` on POST, no `expectedVersion` on create.

401 still Phase 2 interceptor. Mutations classify 400 / 403 / 404 / 409 / 500 distinctly (`userFacingMutationError`).

---

## Manual React/Angular write parity

TASK A–D require a human Google session on `localhost:4200` plus React `/demos/taskflow`. **Pending this session** (same auth gate as Phases 2–3). Cases:

- A: Create task in Angular; React sees it after refresh
- B: Edit task in Angular; React matches
- C: Dual-edit 409; Angular preserves draft, keeps `latest`, no overwrite
- D: Create/rename project; React matches

---

## Tests

Angular `ng test --watch=false`: **89 passed** (Phase 3 was 65). Coverage includes form init/validation, payload shape, double-submit, reload after success, 403/404, 409 draft + latest + no retry, project create/rename `expectedVersion`.

---

## Deferred conflict UI / other deferrals

Full ConflictDialog merge, “use latest” / field-level merge, React status auto-reconcile, optimistic board moves, DnD, comments, attachments, history, presence, offline queue. Team-role mutations and invitations are in [13-phase5-team-permissions.md](./13-phase5-team-permissions.md).

---

## REACT → ANGULAR MUTATION LESSONS

Written after implementation, not invented first.

1. **React controlled `useState` draft → Angular Reactive Forms.** One `FormGroup` is the draft. Do not mirror every field with a signal.
2. **`useMutation` → typed mutation service + per-editor `phase`.** Pending/error live next to the form, not on `UiStateService`.
3. **`invalidateQueries` (workspace prefix) → domain `.reload()` only for resources that actually went stale.** Task writes reload tasks + activity; project writes reload projects + activity. Dashboard follows because it is derived.
4. **`initial.version` on mount → `baselineVersion` on the editor instance.** Remount (`@if` snapshot) replaces React `key`. Never `patchValue` from `httpResource` while the dialog is open.
5. **409 Zustand `conflictDraft` → editor-local `VersionConflict`.** Same fields (type, id, expectedVersion, latest, draft). Not a chrome store. Phase 8 can promote this without a rewrite.
6. **React status-only 409 auto-retry → Angular reports conflict.** Phase 4 prioritizes concurrency honesty over copying `allowStatusAutoReconcile`.
7. **React `type="button"` save → Angular `type="submit"`.** Accessibility requirement; behavior (disable while pending, no double submit) is preserved.
8. **Client `taskDraftSchema` is stricter than `createTaskSchema`.** Angular reproduces the **product** client rules (required assignee + due date), not a newly invented stricter set.
9. **Assignees are core editor behavior**, not Milestone 5. Members already loaded in Phase 3. Extra assignees still use the existing assignees API after POST, matching React rather than inventing `assigneeIds` on create.
10. **Optimistic updates stay off.** Submit → server → reload → UI. React optimistic assignee/status snapshots are not copied.
11. **Permission buttons are UX.** Hide misleading controls using existing roles; 403 remains the security boundary.
12. **No request fires because the user types.** Form updates are local. HTTP starts on submit or on an explicit status/archive/delete action.

---

## Phase 4 acceptance

Task create/edit, project create/edit (rename/archive), status select, assignees, Reactive Forms, `expectedVersion`, 409 detection with draft + latest preserved, targeted reloads, no generic cache / realtime / offline / full conflict UI, 401/403/404/409 distinct, a11y dialogs, Angular tests and production build pass, React unchanged.
