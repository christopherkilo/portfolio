# TaskFlow Conflict Handling

Phase 3 optimistic concurrency for tasks and projects.

## Architecture

Every task and project row carries a monotonic `version` (bigint, starts at 1). Updates go through `update_task_versioned` / `update_project_versioned` SECURITY DEFINER RPCs that:

1. Lock the row (`FOR UPDATE`)
2. Compare `p_expected_version` to the stored version
3. On mismatch → raise `STALE_VERSION` (mapped to HTTP **409** + `StaleVersionError` with `latest` payload)
4. On match → apply jsonb `p_patch`, bump `version` only if meaningful, insert audit, return the new row

Clients send `expectedVersion` on PATCH. The API never silently overwrites a newer row. Conflict responses **retain the latest entity** in `data.latest` for the dialog.

### JSONB patch semantics

- **Omitted key** → leave the column alone
- **Explicit `null`** → clear a nullable field (e.g. `dueDate`, `estimate`)
- **Empty patch** → `EMPTY_PATCH`
- **Identical values** → no-op: return current row, **no** version increment, **no** audit row

Update + audit are atomic inside the RPC; notifications remain best-effort afterward.

### Client flow

`patchTaskWithVersion` / `patchProjectWithVersion` (`lib/demos/taskflow/offline/safeMutations.ts`):

- Online success → map row into UI via TanStack Query invalidation/update
- `STALE_VERSION` → Zustand `conflictDraft` + `ConflictDialog` (keep draft / reload latest)
- Status-only task moves may auto-reconcile once using the latest version when the remote status still differs

Realtime is **not** the conflict authority. It only invalidates Query so the user sees fresher data; the version check on write is the source of truth.

### Intentionally omitted

**Live cursors** are not part of TaskFlow. There is no shared canvas or collaborative editing surface where peer pointer positions would help. Presence is limited to who is online and which view/entity they are looking at (see [TASKFLOW_PRESENCE.md](./TASKFLOW_PRESENCE.md)).

## ELI15

Imagine two people editing the same sticky note. Each note has a revision number. When you save, you say “I’m updating revision 3.” If the server already has revision 4, it rejects your save and shows you the newer note so you can choose: keep your draft or take theirs. Nobody’s write quietly erases the other person’s work.

Omitted means “leave it alone.” Null means “clear it.” The backend must understand the difference.

## Related

[TASKFLOW_OFFLINE_BEHAVIOR.md](./TASKFLOW_OFFLINE_BEHAVIOR.md) · [TASKFLOW_REALTIME.md](./TASKFLOW_REALTIME.md) · [TASKFLOW_DATABASE.md](./TASKFLOW_DATABASE.md)
