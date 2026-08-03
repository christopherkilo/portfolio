# TaskFlow Interview Guide

## Pitch

TaskFlow is a collaborative workspace on Next.js + Supabase with Auth, RLS, Query, and UI-only Zustand. Phase 2 adds members, multi-assignees, comments, hashed invitations, notifications, and Realtime. Stabilization locked notification inserts behind an RPC, made `task_assignees` authoritative, scoped Realtime by `workspace_id`, and defined atomic vs best-effort failure policy. **Phase 3** adds versioned conflict handling, an offline mutation outbox, private attachments, ephemeral presence (no live cursors), notification grouping/preferences, and durable audit/history. **Phase 3 final stabilization** hardens attachment lifecycle, jsonb patch/no-op semantics, atomic update+audit RPCs, workspace-scoped unread grouping, offline queue counts, and Realtime reconnect/presence identity.

## Talking points

- “RLS picks the row; triggers protect the identity columns.”
- “Core work shouldn’t look failed just because a notification failed.”
- “Assignees live in `task_assignees`; `assignee_id` is only a synced primary.”
- “Expired invites are revoked before a replacement; only live invites block.”
- “Writes carry `expectedVersion`; stale saves return 409 with the latest row.”
- “RealtimeManager invalidates Query and tracks presence — it isn’t a second store.”
- “We skipped live cursors on purpose: there’s no shared canvas.”
- “Creating an attachment record is like printing a luggage tag — not delivered until Storage has the bag.”
- “Omitted means leave it alone; null means clear it.”
- “The task update and its audit receipt are written together.”

## Phase 3 summary

| Capability | One-liner |
| --- | --- |
| Conflicts | CAS `version` + conflict dialog; retain `latest` |
| Offline | Safe queue in IndexedDB; counts: pending / failed / conflicted / totalNeedsAttention |
| Attachments | Private Storage; pending→ready after object verify; uploader-only complete |
| Presence | Avatars + view location; authoritative local `selfPayload`; no cursors |
| Audit | Append-only; versioned update+audit atomic in RPC |
| Notifications | Unread group unique on `(user_id, workspace_id, group_key)` + preferences |
| Realtime | Bounded exponential backoff reconnect (1s…30s) |

## Known product limits (still out of scope)

Rich-text collaborative editing, email delivery for invites, and live cursors remain out of scope by design.
