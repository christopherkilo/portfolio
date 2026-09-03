# 16 — Phase 8 conflict resolution

Phase 8 turns the conflict state preserved by Phases 4 and 7 into an explicit, accessible Angular resolver. React/Next TaskFlow under `/demos/taskflow` remains the known-good product and was **not** changed.

**Golden rule:** a `409 STALE_VERSION` means the user’s draft was based on an older version. It does **not** mean retry the same write until it succeeds. Resolution is user-reviewed rebase onto the latest version, then `expectedVersion: N`. Automatically swapping 8→9 and resending the old payload is forbidden.

---

## React current conflict behavior (inspected)

Sources: `components/demos/taskflow/collaboration/ConflictDialog.tsx`, `lib/demos/taskflow/store/ui.ts` (`ConflictDraft`), `lib/demos/taskflow/offline/safeMutations.ts` (`handleConflict`, `allowStatusAutoReconcile`), `lib/demos/taskflow/offline/replay.ts`, `TASKFLOW_CONFLICT_HANDLING.md`, `AppShell.tsx`.

React behavior was **not** treated as automatically correct. Several Phase 8 behaviors are deliberate Angular improvements.

### 1. What the React conflict dialog shows

Title: **“Someone else changed this.”**

Body: `conflict.message` or “This item changed while you were editing. Your draft is still available below.”

**Latest on server:** title or name, optional description (`line-clamp-3`), version, and “your draft expected N”.

**Your unsaved draft:** `JSON.stringify(conflict.draft, null, 2)` inside a `<pre>`.

### 2. Field-level differences

**No.** React does not compute or display a field diff. The local side is raw JSON.

### 3. Keep local values

**Keep editing draft** only closes the Zustand `conflictDraft` (`setConflictDraft(null)`). It does **not** resubmit. The editor form (if still mounted) retains whatever the user typed. There is no “use mine and save against latest.”

### 4. Accept server values

**Discard draft** removes a matching queued mutation (by `queuedMutationId` or first `conflict` row for the entity) and calls `replayQueuedMutations()`. It does **not** PATCH.

**Reload latest** calls `window.location.reload()` after clearing the draft. Full-app reload.

### 5. Merge fields

**No.** No three-way merge, no per-field mine/latest, no auto-merge.

### 6. Force-write

**No force-overwrite API.** Keep/reload/discard never send `expectedVersion` from latest without a new user save. Exception: status-only auto-reconcile (below) retries **once** with `latest.version`.

### 7. New expectedVersion after resolution

React’s dialog does **not** produce a resolved mutation. The user must save again from the editor, still using the editor’s original `expectedVersion` unless they reloaded the page. That is a product gap: “Keep editing” can 409 again with the same stale version.

### 8. Status-only auto-reconcile

`patchTaskWithVersion({ allowStatusAutoReconcile: true })` (board status moves):

- Online only.
- Body is status-only (keys `status` and maybe `expectedVersion`).
- On `STALE_VERSION`: if `latest.status !== requested`, **PATCH once** with `{ status, expectedVersion: latest.version }`.
- If `latest.status === requested`, treat as success (`mapTask(latest)`), no second write.

This **can overwrite another user’s status change** without asking. It does not overwrite other columns (status-only jsonb patch), but status itself is a meaningful field. It is **not** a reviewed rebase.

### 9. Project conflicts

**Yes.** `patchProjectWithVersion` calls the same `handleConflict` with `entityType: "project"`. Dialog uses `latest.name` as the heading. Same keep/reload/discard. Projects are **not** queued offline.

### 10. Offline conflicts

Replay 409: queue row `status = "conflict"`, `expectedVersion` frozen, `latest` stored, `setConflictDraft` with `queuedMutationId`. Dialog **Discard draft** removes that row and resumes replay. There is no field merge of the queued payload vs `latest`.

Closing the dialog with **Keep editing** does **not** delete the queue row. The conflicted entry remains.

---

## Angular conflict model

Editor 409 (Phase 4) and outbox 409 (Phase 7) stay as **inputs**. Phase 8 normalizes them into one **session** for the resolver:

```text
ConflictSession
  source: editor | offlineQueue
  entityType / entityId
  baseVersion / latestVersion
  baseSnapshot?   (editor: form mount snapshot; queue: omitted)
  localDraft
  latestServer    (null if missing)
  queueMutationId?
  choices / overrides
  missing
```

`VersionConflict` on the editor is **not** replaced. The dialog session is the resolution lifecycle; the editor signal remains so the form is not remounted and tests can still assert draft/latest.

Queue conflicts **do not** get a second unrelated type. `QueuedMutation` stays the durable row. The session is derived from `payload` + `latest` + `expectedVersion`.

Queue rows have **no base snapshot**. Classification without base is conservative (see three-way rules).

---

## Editor conflict architecture

1. Dirty Reactive Form remains the local draft. Do not destroy/remount on 409.
2. `TaskEditor` / `ProjectEditor` / board status store the existing `VersionConflict` and call `ConflictResolutionService.open…`.
3. Shell hosts `tf-conflict-dialog` (CDK trap via `tf-read-dialog`).
4. Closing the dialog hides it; the session stays unresolved until discard or a successful resolved write.
5. Reopen via **Review changes** (notice, connection indicator, or session).
6. Successful save: `expectedVersion = latestVersion` reviewed in the dialog; then clear session, reload tasks/activity (or projects/activity), remove queue row if any, `tryReplay()`.

---

## Offline conflict architecture

Phase 7 already stops replay on the first conflicted row and does not rebase later entries.

Phase 8:

- Indicator **Review** opens the oldest conflicted row for the current user.
- Resolver maps `payload` onto a draft (status-only payloads overlay `status` only; other fields come from `latest`).
- Successful resolved PATCH **removes that queue id only**, reloads tasks/activity, then `OfflineReplayService.tryReplay()`.
- Later items keep their **original** `expectedVersion`. If they 409, they become a new conflict. No skip, no rewrite.
- Discard removes the conflicted row **only after explicit confirmation**, then `tryReplay()`.
- Resolver submit is **online-only**. It never enqueues a duplicate outbox row (including if the network drops mid-review).

---

## Three-way diff rules

Domain-aware. No generic diff library.

For each editable field, with equality `eq`:

| local vs base | server vs base | local vs server | kind |
| --- | --- | --- | --- |
| equal | equal | — | `UNCHANGED` |
| different | equal | — | `LOCAL_ONLY` |
| equal | different | — | `SERVER_ONLY` |
| different | different | equal | `BOTH_SAME` |
| different | different | different | `CONFLICTING` |

Without a base snapshot (queue):

- Field **not** in the queued payload → `UNCHANGED` (use server).
- Field in payload and `eq(local, server)` → `BOTH_SAME`.
- Field in payload and not equal → `CONFLICTING` (cannot prove `LOCAL_ONLY`).

---

## Field comparison semantics

| Field | Equality |
| --- | --- |
| title, name | trimmed string |
| description | string; `null`/`undefined` ↔ `""`; `\r\n` → `\n` |
| status, priority, projectId, color | exact |
| dueDate | first 10 chars if ISO; `YYYY-MM-DD`; empty/null equal |
| estimate | `null`/`undefined`/`""` equal; otherwise numeric |
| labels | set equality (order-independent, unique) |
| assigneeIds | set equality (order-independent). `assigneeId` in a queue payload maps to a one-element set |
| archived | boolean, only when the mutation included it |

**Assignees and labels are whole-field choices**, not automatic set-union. `base=[A], local=[A,B], server=[A,C]` is `CONFLICTING`. React has no merge here; union would silently drop someone’s removal or invent membership. Product JSONB treats the array as one column.

**Description** is mine / latest (or an editable override). No git-style line merge.

---

## Default merge rules

| kind | default resolved value |
| --- | --- |
| `UNCHANGED` | server (same as base) |
| `LOCAL_ONLY` | local |
| `SERVER_ONLY` | server |
| `BOTH_SAME` | that common value |
| `CONFLICTING` | none — user must choose |

Save is blocked until every `CONFLICTING` field has **Use mine**, **Use latest**, or an explicit edited override.

This is **not** silent overwrite. Auto-merged fields are shown as already preserved. The user still confirms **Save resolved version**, which submits against `latestVersion`.

---

## User-decision rules

- Copy is product language: “Someone else changed this.” Never “HTTP 409” / “optimistic concurrency” in the dialog.
- Work is not lost; server is newer; user must choose how to proceed.
- **Use mine** = take the selected local values, combined with auto-merged server-only fields, then PATCH `expectedVersion: latestVersion`. Not force overwrite.
- **Use latest** on a field takes the server value for that field only.
- **Use latest server version / Discard my changes** requires confirm. No PATCH. Queue row removed only after confirm.
- Closing the dialog keeps the original draft and any choices.

---

## Safe resubmission

After review, `latestVersion = N` → PATCH `expectedVersion: N`.

Forbidden: interceptor or mutation helper that sees 409 and retries with `latest.version` without this dialog.

`TaskMutationsService.updateResolved` / `ProjectMutationsService.updateResolved` **never enqueue**. Offline → user-facing error; session kept.

---

## Second-conflict behavior

Submit against v9 can 409 with v10. No retry loop.

On that 409:

- New `localDraft` = the **resolved draft** the user just tried to save (choices baked in).
- New `baseSnapshot` = previous latest (the version they rebased onto).
- New `latestServer` / `latestVersion` = v10.
- Choices reset; three-way runs again so only new conflicts need decisions.
- Dialog stays open.

---

## Discard behavior

Confirm copy warns that local edits will be discarded.

Then: clear session, optionally reset editor from latest, **no PATCH**, remove `queueMutationId` if present, refresh queue counts, `tryReplay()`.

---

## Queue continuation

Preserve Phase 7 order: oldest `createdAt`, stop-on-failure, conflicted rows are not replayable.

After resolving or discarding the blocker, `tryReplay()` continues remaining `pending`/`failed` for the same user if online, authenticated, and the replay lock is free. Do not rewrite later `expectedVersion` values.

---

## Status-only 409 decision

**React:** `allowStatusAutoReconcile` retries **once** with `latest.version` when the body is status-only, or accepts latest if status already matches. This can overwrite another user’s status without review.

**Angular Phase 8:** **explicit conflict.** No automatic 409 retry.

**Reason:** overwriting status is a meaningful change. Feature parity does not require copying unsafe convenience. Three-way merge still auto-fills `LOCAL_ONLY` status and `SERVER_ONLY` other fields; the user confirms Save. That is reviewed rebase, not a silent second PATCH.

---

## Permissions

403 remains authoritative. No bypass, no force-overwrite endpoint. On 403 during resolve: show permission copy, `members.reload()` so capabilities refresh, **keep the resolved draft**. Conflict UI cannot grant roles.

401: existing auth interceptor → sign-in. Session draft remains in memory for that page lifetime; it is not written to another user’s queue.

---

## Realtime interactions

Phase 6 still applies: realtime reloads lists, not a dirty form, not the open resolver’s `localDraft`.

If realtime learns v10 while the dialog still shows v9, the dialog is **not** silently rewritten. Submit with `expectedVersion: 9` may 409; then the second-conflict path updates latest to v10 and keeps the resolved draft. **Refresh latest** is an explicit GET of the workspace list (no new endpoint) that updates `latestServer` while keeping local draft and still-valid choices.

---

## Accessibility

`tf-read-dialog`: `role="dialog"`, `aria-modal`, labelled heading, CDK focus trap + auto-capture, Escape/backdrop close (dismissible except while submitting). Field change labels are text, not color-only (`Needs a decision` / `Kept your change` / `Kept the latest version`). Choice buttons use `aria-pressed`. Discard is a distinct confirm. Save shows a loading name. Errors use `role="alert"`. No raw JSON required.

---

## Security

- No force-overwrite endpoint
- No RLS bypass / no service key
- `latestVersion` used as `expectedVersion` only after explicit Save in the resolver
- 403 authoritative
- Conflict UI cannot grant permissions
- Offline queue remains `userId`-bound
- Discard requires confirm
- Other users’ server fields are not silently erased (`CONFLICTING` blocks save)

---

## Tests

See `taskflow-angular/src/app/core/conflict/*.spec.ts`, `shared/ui/conflict-dialog.spec.ts`, and extended editor / page / replay specs. Coverage includes three-way kinds, default merge, blocking unresolved conflicts, resubmission `expectedVersion`, second 409, discard without PATCH, queue cleanup + replay resume, later item keeps original version, editor 409 opens dialog, cancel keeps draft, 403 keeps draft + members reload.

Angular unit tests at Phase 8 close: **226 passed**.

---

## Manual parity results

Human two-client (React + Angular, authenticated) session was **not** available in this environment.

**Manual React/Angular parity: PARTIAL.**

Automated tests cover the resolver, expectedVersion, second conflict, discard, and queue resume.

---

## REACT → ANGULAR CONFLICT LESSONS

1. **React conflict draft → typed Angular conflict session.** Zustand `Record<string, unknown>` + JSON `<pre>` is not enough to merge safely. A typed session (base / local / latest / choices) is the resolver’s source of truth.

2. **Latest entity + local editor → three-way field resolution.** Version numbers alone cannot tell LOCAL_ONLY from CONFLICTING. The editor mount snapshot is the missing base. Queue rows lack that snapshot, so Angular is conservative.

3. **Automatic retry → explicit reviewed rebase.** React status-only 409 can overwrite another status. Angular never auto-retries. Auto-merge fills non-conflicting fields; Save still sends `expectedVersion: latestVersion` after the user looks.

4. **Offline conflict → same resolver, different completion.** Editor success closes/reloads the form workflow. Queue success deletes **that** outbox id and resumes replay without rebasing later rows.

5. **Keep editing is not resolution.** React’s Keep editing drops the global draft and leaves a stale `expectedVersion`. Angular keeps the session until discard or a successful reviewed write.

6. **Reload latest must not mean `location.reload()`.** Angular reloads tasks/activity (or projects/activity) only, or refreshes latest inside the dialog.

---

## Acceptance

Phase 8 acceptance is recorded in the completion report. Phase 9 (attachments / notifications / audit) was **not** started.
