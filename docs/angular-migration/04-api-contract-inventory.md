# 04 — API contract inventory

Preserve this contract. Angular must speak the same envelope and paths. **Do not modify APIs in Phase 0.**

Transport today: same-origin `fetch` + cookies (`lib/demos/taskflow/api/client.ts`). Angular (Option A) uses `HttpClient` with `withCredentials: true` against the same origin (or a dev proxy that forwards `Cookie` / `Set-Cookie`).

## Envelope

Success (200 or 201 `jsonCreated`):

```json
{ "success": true, "data": <T> }
```

Failure (`server/taskflow/errors/http.ts`):

```json
{
  "success": false,
  "error": { "code": "<TaskflowErrorCode>", "message": "...", "fieldErrors": {} },
  "data": { "latest": <entity> }
}
```

`data.latest` is present only for `StaleVersionError` (`STALE_VERSION`, HTTP 409).

Client unwraps `data` or throws `TaskflowApiError` (status, code, fieldErrors, data).

Common codes: `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `VALIDATION_ERROR` 400, `STALE_VERSION` 409, `OFFLINE_UNSAFE_ACTION` 503 (also thrown **client-side** before the network), `SCHEMA_NOT_READY`, `AUDIT_ACCESS_DENIED`, invitation/attachment codes in `server/taskflow/errors/index.ts`.

Authentication: **session cookie** required except where noted. `proxy.ts` refreshes cookies on these paths but **does not redirect** `/api/*`; APIs use `requireTaskflowUser()`.

Minimum roles are enforced in services via `requireWorkspaceMember` / `requireTaskAccess` / `requireProjectAccess` (`server/taskflow/auth/authorization.ts`) plus `permissions.ts`. Frontend must not treat missing buttons as security.

Realtime-related entity: Postgres changes on that table are subscribed in `WORKSPACE_TABLES` (`workspaceChannel.ts`).

Schemas: `server/taskflow/schemas/index.ts`.

---

## `/api/me`

| | |
| --- | --- |
| **Method / path** | `GET /api/me` |
| **Auth** | Required |
| **Role** | Any signed-in user |
| **Request** | none |
| **Response** | Current user + profile (`getCurrentUser`) |
| **Errors** | 401 |
| **Offline-safe** | Read; not queued |
| **Versioned** | no |
| **Realtime** | no (profile not in workspace channel tables) |
| **Angular** | `MeApi` / `AuthSessionService` |

---

## `/api/workspaces`

| Method | Path | Role | Request | Response | Offline | Versioned | Realtime | Angular |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/workspaces` | signed-in | none | workspace list; **creates default workspace if empty** (`ensureDefaultWorkspace`) | read | no | members/invites later | `WorkspacesApi` |
| POST | `/api/workspaces` | signed-in (becomes owner) | `{ name, description? }` | 201 workspace | unsafe (not queued) | no | yes (membership) | `WorkspacesApi` |

`renameWorkspaceSchema` exists in Zod; **no** `PATCH /api/workspaces/:id` Route Handler was found. Document only; do not add in Phase 0.

---

## `/api/projects`

| Method | Path | Min role | Request | Offline | Versioned | Realtime | Angular |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/projects?workspaceId=` | viewer | query UUID | read | no | `projects` | `ProjectsApi` |
| POST | `/api/projects` | admin (`canManageProjects`) | `createProjectSchema` | **unsafe** (not in IDB types) | no | yes | `ProjectsApi` |
| PATCH | `/api/projects/:id` | admin | `updateProjectSchema` **requires `expectedVersion`** | **unsafe** — client 503 `OFFLINE_UNSAFE_ACTION` (`patchProjectWithVersion`) | **yes** | yes | `ProjectsApi` |

409 `STALE_VERSION` + `latest` project row.

No DELETE project route.

---

## `/api/tasks`

| Method | Path | Min role | Request | Offline | Versioned | Realtime | Angular |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/tasks?workspaceId=&projectId?` | viewer | query | read | no | `tasks` | `TasksApi` |
| POST | `/api/tasks` | member | `createTaskSchema` (`assigneeIds` max 20) | not queued | no | yes | `TasksApi` |
| PATCH | `/api/tasks/:id` | member | `updateTaskSchema` **requires `expectedVersion`** | **safe** — enqueue `task_update` / `task_status` | **yes** | yes | `TasksApi` + queue |
| DELETE | `/api/tasks/:id` | member (destructive) | none | **unsafe** | no | yes | `TasksApi` |

Status-only PATCH may auto-reconcile once on 409 (`allowStatusAutoReconcile`).

---

## `/api/members` and nested members

| Method | Path | Min role | Notes | Offline | Realtime | Angular |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/members?workspaceId=` | viewer | 400 if missing workspaceId | read | `workspace_members` | `MembersApi` |
| GET | `/api/taskflow/workspaces/:id/members` | viewer | nested equivalent | read | yes | `MembersApi` |
| PATCH | `/api/taskflow/workspaces/:id/members/:userId` | admin+ with `assertCanChangeMemberRole` | `{ role: admin\|member\|viewer }` | **unsafe** | yes | `MembersApi` |
| DELETE | same | admin+ `assertCanRemoveMember` | cannot remove self/owner; admin cannot remove admin | **unsafe** | yes | `MembersApi` |

---

## `/api/activity`

| | |
| --- | --- |
| **GET** | `/api/activity?workspaceId=` |
| **Role** | viewer |
| **Response** | activity list; **if `workspaceId` missing, returns `[]` success** (unlike members) |
| **Offline** | read |
| **Realtime** | `activity_events` |
| **Angular** | `ActivityApi` |

---

## Invitations

| Method | Path | Min role | Request | Offline | Realtime | Angular |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/taskflow/workspaces/:id/invitations` | admin | none; client strips `token_hash` | read | `workspace_invitations` | `InvitationsApi` |
| POST | same | admin | `{ email, role?: admin\|member\|viewer }` default member | **unsafe** | yes | `InvitationsApi` |
| DELETE | `.../invitations/:invitationId` | admin | revoke | **unsafe** | yes | `InvitationsApi` |
| POST | `/api/taskflow/invitations/accept` | **signed-in** (any user matching invite) | `{ token }` min 20 max 200 | **unsafe** | yes | `InvitationsApi` |

Errors include `INVITATION_EXPIRED`, `INVITATION_ALREADY_ACCEPTED`, `ACTIVE_INVITATION_EXISTS`, `INVITATION_ALREADY_PENDING`.

Create response may include `acceptUrl` (client type `CreateInvitationResult`). Raw tokens are not listed back.

---

## Comments

| Method | Path | Min role | Request | Offline | Versioned | Realtime | Angular |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/taskflow/tasks/:id/comments` | viewer + task access | none | read | no | `comments` | `CommentsApi` |
| POST | same | member | `{ body }` 1–4000 | **safe** `comment_create` | no | yes | + queue |
| PATCH | `/api/taskflow/comments/:id` | author rules in service | `{ body }` | not in safe queue types | no | yes | `CommentsApi` |
| DELETE | same | author / elevated | none | not queued as safe type | no | yes | `CommentsApi` |

---

## Assignees

Assignee **truth** is `task_assignees`. `tasks.assignee_id` is denormalized display (`TASKFLOW_DATABASE.md`).

| Method | Path | Min role | Request | Offline | Realtime | Angular |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/taskflow/tasks/:id/assignees` | member | `{ userId }` UUID | not in IDB safe types (online optimistic in Query) | `task_assignees` | `AssigneesApi` |
| DELETE | `.../assignees/:userId` | member | none | same | yes | `AssigneesApi` |

Errors: `INVALID_ASSIGNEE`, `DUPLICATE_ASSIGNMENT`.

---

## Attachments

Lifecycle: initiate (pending row + signed upload) → client PUT to Storage → complete (ready). Delete is a lifecycle transition. Stale pending cleaned at 24h RPC.

| Method | Path | Min role | Request | Offline | Realtime | Angular |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/taskflow/tasks/:id/attachments` | viewer | none | read | `task_attachments` | `AttachmentsApi` |
| POST | `.../attachments/initiate` | member | `initiateAttachmentSchema` (MIME enum, max 10MB) | **unsafe** (multi-step) | yes | `AttachmentsApi` |
| PUT | **Storage signed URL** (not Next) | token | file body, `Content-Type`, `x-upsert: false` | **unsafe** | n/a | same |
| POST | `.../attachments/complete` | member | `{ attachmentId }` | **unsafe** | yes | same |
| DELETE | `/api/taskflow/attachments/:id` | member | none | **unsafe** (`attachment_delete` in queue UNSAFE set) | yes | same |
| GET | `/api/taskflow/attachments/:id/download` | viewer | none | read | no | same |

Errors: `ATTACHMENT_TOO_LARGE`, `ATTACHMENT_TYPE_NOT_ALLOWED`, `ATTACHMENT_NOT_UPLOADED`, `ATTACHMENT_STATE_CONFLICT`, `STORAGE_*`.

Client pre-checks: `lib/demos/taskflow/attachments/limits.ts`.

---

## Notifications

| Method | Path | Auth | Request | Offline | Realtime | Angular |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/taskflow/notifications` | current user | none | read | `notifications` (filter user_id) | `NotificationsApi` |
| PATCH | `/api/taskflow/notifications/:id/read` | owner of row | none | **safe** `notification_read` | yes | + queue |
| POST | `/api/taskflow/notifications/read-all` | current user | none | not in safe type list | yes | `NotificationsApi` |
| GET | `/api/taskflow/notification-preferences` | current user | none | read | no | `NotificationPreferencesApi` |
| PATCH | same | current user | `notificationPreferencesSchema` (assignments, comments, mentions, dueDates, projectChanges) | not queued | no | same |

Clients cannot INSERT notifications (RPC only).

---

## History / audit / nudges

| Method | Path | Min role | Offline | Realtime | Angular |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/taskflow/tasks/:id/history` | viewer + task access | read | no (history derived) | `TaskHistoryApi` |
| GET | `/api/taskflow/workspaces/:id/audit` | **admin+** else `AUDIT_ACCESS_DENIED` 403 | read | no | `AuditApi` |
| POST | `/api/taskflow/workspaces/:id/due-nudges` | member/service as implemented | online only (bridge fires when `online`) | may create notifications | `DueNudgesApi` |

---

## `/api/taskflow/public-config`

Browser-safe Realtime bootstrap for Angular. **Not** a data API.

| | |
| --- | --- |
| **Method / path** | `GET /api/taskflow/public-config` |
| **Auth** | None (same publicity as `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) |
| **Request** | none |
| **Response** | `{ supabaseUrl, publishableKey }` only |
| **Must never include** | `SUPABASE_SECRET_KEY`, service-role keys, access/refresh tokens, cookies, session JSON |
| **Offline-safe** | n/a |
| **Realtime** | Used to construct the publishable-key browser client for channels + presence only |
| **Angular** | `TaskflowRealtimeClientFactory` — then `RealtimeService`. Ordinary CRUD still `HttpClient` → existing TaskFlow APIs |

Added in Phase 6 as a small Next adapter (same class as signout / Google start). React TaskFlow does not need it (`NEXT_PUBLIC_*` is inlined at build time).

---

## Auth callback (not JSON API)

`GET /auth/callback?code=&next=` — PKCE exchange; `next` must start with `/demos/taskflow` (`app/auth/callback/route.ts`). Sets cookies on redirect. Angular must not invent a second callback unless Option B is adopted later.

Portfolio Auth.js: `GET /api/auth/[...nextauth]` — **not** TaskFlow.

---

## Offline-safe vs unsafe (client)

Safe queue types (`mutationQueue.ts`): `task_update`, `task_status`, `comment_create`, `notification_read`.

Unsafe (do not enqueue): project PATCH, task DELETE, member role/remove, invitations, attachment initiate/complete/delete, workspace create, etc.

**Observed:** `safeMutations.ts` lists `role_change`; `mutationQueue.ts` lists `member_role` and `attachment_delete`. Same intent, different strings. Angular should use **one** canonical set.

---

## Angular consumer map (summary)

`TaskflowApiClient` + resource services: `MeApi`, `WorkspacesApi`, `ProjectsApi`, `TasksApi`, `MembersApi`, `ActivityApi`, `CommentsApi`, `AssigneesApi`, `AttachmentsApi`, `InvitationsApi`, `NotificationsApi`, `NotificationPreferencesApi`, `AuditApi`, `TaskHistoryApi`, `DueNudgesApi`.

All share envelope parsing and 409 `latest` handling. No service talks to `createTaskflowAdminClient` or `SUPABASE_SECRET_KEY`.
