# TaskFlow Attachments

Phase 3 file attachments on tasks via private Supabase Storage + metadata rows.

## Architecture

1. **Metadata** in `task_attachments` (workspace, task, uploader, path, MIME, size, `status`, soft `deleted_at`)
2. **Bytes** in private bucket `taskflow-attachments` (never public; policies in `20260802200000_taskflow_phase3_stabilization.sql`)
3. **Flow:** `initiate` (`pending` row + signed upload URL) → client `PUT` → `complete` (verify Storage object → `ready` + activity) → `download` (signed GET after membership check)

### Lifecycle (`attachment_status`)

| Status | Meaning |
| --- | --- |
| `pending` | Metadata + upload slot reserved; not listable as ready |
| `ready` | Storage object verified; ordinary lists/downloads |
| `failed` | Verification/cleanup failed (or abandoned pending marked failed) |
| `deleted` | Soft-deleted |

**Complete** (`attachmentService.completeAttachment`):

- Only `uploaded_by` may complete (**403** otherwise)
- Verifies object exists, path matches metadata, size/MIME within limits, row still `pending`
- On failure → do not mark `ready`; mark `failed` where appropriate
- Idempotent if already `ready` (no duplicate audit)
- Activity recorded only after successful ready transition

**Immutable identity fields** (trigger): `id`, `workspace_id`, `task_id`, `uploaded_by`, `storage_path`, `file_name`, `mime_type`, `size_bytes`, `created_at`.

**Cleanup:** `cleanup_stale_pending_attachments` marks abandoned `pending` rows older than **24h** as `failed` (uploader or admin/owner).

### Limits

| Constraint | Value |
| --- | --- |
| Max size | 10 MB (`MAX_ATTACHMENT_BYTES`) |
| MIME allowlist | `image/png`, `image/jpeg`, `image/webp`, `application/pdf`, `text/plain` |

Server enforces limits in `attachmentService`; client mirrors them in `lib/demos/taskflow/attachments/limits.ts` for fast UX feedback. Do not trust browser-only size/MIME for completion.

Errors: **413** `ATTACHMENT_TOO_LARGE`, **415** `ATTACHMENT_TYPE_NOT_ALLOWED`, **403** completion ownership / permission, **404** missing, **409** bad lifecycle state, **422** not uploaded / integrity, **503** storage unavailable.

### Permissions

- List/download: workspace member; ordinary lists are **ready** only (uploader/admin may see own pending)
- Initiate upload: member+
- Complete: **uploader only**
- Soft-delete / abandoned cleanup: uploader or admin/owner

RLS + Storage policies enforce the above; bucket is private.

### Intentionally omitted

**Live cursors** — attachments are files on a task, not a collaborative whiteboard. No shared canvas means no peer cursors over attachment previews.

## ELI15

Files don’t live inside the task text. TaskFlow keeps a library card (who uploaded what, how big, what type) and stores the actual file in a locked locker. You ask the server for a short-lived key to put the file in or take it out. Only certain file types and sizes are allowed so the locker doesn’t fill with junk.

Creating an attachment record is like printing a luggage tag. TaskFlow does not call the luggage delivered until the actual bag is found in Storage.

## Related

[TASKFLOW_PERMISSIONS.md](./TASKFLOW_PERMISSIONS.md) · [TASKFLOW_DATABASE.md](./TASKFLOW_DATABASE.md)
