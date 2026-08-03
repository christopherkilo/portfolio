# TaskFlow Permissions

## Layers

1. UI convenience hiding  
2. Service authorization  
3. RLS row access  
4. Triggers / RPCs for immutable columns and controlled inserts  

ELI15: RLS decides which rows a user may touch, while database triggers stop them from changing protected identity fields inside a row.

## Notifications

Ordinary clients cannot INSERT notifications. Only SECURITY DEFINER RPCs may insert, with actor derived from `auth.uid()`. Preferences live in `notification_preferences` (self only).

## Attachments

| Action | Minimum |
| --- | --- |
| List / download | Viewer (workspace member with task access) |
| Initiate / complete upload | Member |
| Soft-delete | Uploader **or** admin/owner |

MIME allowlist + 10 MB cap enforced in `attachmentService` (and mirrored client-side). Storage bucket stays private; access via signed URLs after service checks.

## Audit / history visibility

| Surface | Who |
| --- | --- |
| Per-task history | Viewer+ with task access |
| Workspace audit log | **Admin+** only (`AuditAccessDeniedError` → **403**) |

Activity rows are append-only for ordinary clients.

## Role matrix

Unchanged from Phase 2: viewer read-only; member tasks/comments/attachments; admin projects/invites/roles*/workspace audit; owner full.  
\* Admins cannot modify owners/other admins. Owner removal forbidden.
