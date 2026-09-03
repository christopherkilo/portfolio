# 13 — Phase 5 team, invitations, and permissions

Phase 5 ports TaskFlow’s existing multi-user workflows to Angular. React/Next TaskFlow under `/demos/taskflow` remains the known-good product. Product UI there was **not** redesigned.

Shared auth allowlist (`lib/demos/taskflow/auth/safeNextPath.ts`) was extended **narrowly** so Angular `/invite?token=` can survive Google OAuth. React invite URLs and other Angular paths are unchanged. See [OAuth return preservation](#oauth-return-preservation).

No realtime, presence, offline queue, optimistic team writes, audit page, attachments, comments, notifications, NgRx, or TanStack Angular Query.

---

## Current team model (inspected from React source)

Not inferred from role names. Sources: `components/demos/taskflow/team/TeamView.tsx`, `InviteMemberModal.tsx`, `AcceptInviteView.tsx`, `lib/demos/taskflow/queries/memberQueries.ts`, `invitationQueries.ts`, `server/taskflow/auth/permissions.ts`, `authorization.ts`, `services/invitationService.ts`, `services/memberService.ts`, `repositories/invitationRepository.ts`, `schemas/index.ts` (`createInvitationSchema`, `acceptInvitationSchema`, `updateMemberRoleSchema`).

### Roles (taxonomy unchanged)

| Role | Product label | Hierarchy (`roleAtLeast`) |
| --- | --- | --- |
| `viewer` | viewer (CSS capitalize) | 1 |
| `member` | member | 2 |
| `admin` | admin | 3 |
| `owner` | owner | 4 |

React presents the enum string with `capitalize`. There is no friendlier copy such as “Workspace owner.” Angular does the same.

There is **no** ownership transfer. `assertCanChangeMemberRole` rejects `nextRole === "owner"` (`ROLE_ESCALATION_FORBIDDEN`: “Ownership transfer is not supported yet.”). Owner role cannot be changed at all.

### Who sees what (TeamView)

Current user role = member whose `id === me.data.id`, else `"viewer"`.

| Capability | viewer | member | admin | owner |
| --- | --- | --- | --- | --- |
| See member list / workload / activity | yes | yes | yes | yes |
| Invite member | no | no | yes | yes |
| Pending invitations GET / revoke | no | no | yes | yes |
| Change another member’s role | no | no | member/viewer only; **not** other admins or owner | admin/member/viewer; **not** owner |
| Remove a member | no | no | not self, not owner, not other admins | not self, not owner |

`canChangeRole` / `canRemoveMember` in `TeamView` match `assertCanChangeMemberRole` / `assertCanRemoveMember` for the UI cases. Additional **server-only** rules still apply: cannot promote to owner; admin cannot promote to admin (`roleSelectOptions` already hides `admin` for admin actors).

Self-role: there is **no** explicit “cannot change own role” check. Owners cannot change themselves because the target is owner. Admins cannot change themselves because they cannot change admins. Members/viewers have no role controls.

Self-remove: **forbidden** (`"You cannot remove yourself from the workspace."`). There is no leave-workspace flow.

React **Remove** is one-click (no confirm). Phase 5 Step 15 requires an accessible confirmation dialog in Angular. Same DELETE API; extra confirm is UX only.

React role `<select>` PATCHes immediately on change. React uses optimistic TanStack snapshots then invalidate. **Angular does not copy optimism:** PATCH → server → `members.reload()` / `activity.reload()`.

### Invite Member (InviteMemberModal)

Fields: **email**, **role** (`admin | member | viewer`, default `member`). No owner invite. No name/message/expiry fields.

Client: empty email → `"Enter an email address."` Backend: `createInvitationSchema` trim + email + max 320; role default `member`. Server lowercases email.

`POST /api/taskflow/workspaces/:id/invitations` `{ email, role }`. Min role **admin**.

Success: close modal, except **development** when the API includes `acceptUrl` (`NODE_ENV !== "production"`). That URL is always the **React** path `${appUrl}/demos/taskflow/invite?token=…`. Angular displays it when present and does not rewrite it.

React save is `type="button"`. Angular uses `type="submit"`.

### Invitation URL

Query param **`token`** only: `/invite?token=` (Angular) or `/demos/taskflow/invite?token=` (React). Not an invitation id route.

There is **no GET preview API**. Accept UI does not show workspace name or invited role. Angular does not invent those fields.

Token schema: `acceptInvitationSchema` min 20 max 200. Server tokens are base64url (`randomBytes(32).toString("base64url")`).

### Accept flow (AcceptInviteView)

- Missing token → “Invalid invite” + Go to sign in.
- Session loading → “Checking your session…”
- Unauthenticated (`GET /api/me` 401) → Sign in with `next` = invite URL (not auto-Google).
- Authenticated → “Join this workspace”, signed-in as display name/email, **Accept invitation** (not auto-accept), Cancel → dashboard.
- `POST /api/taskflow/invitations/accept` `{ token }`.
- Success: invalidate workspaces / members / invitations / activity; `router.replace` dashboard. **Does not** `setActiveWorkspace` to the joined workspace.

Accept errors (`invitationRepository.acceptByTokenHash`):

| Code / mapping | HTTP | Message (typical) |
| --- | --- | --- |
| `NOT_FOUND` | 404 | Invitation not found. |
| `INVITATION_EXPIRED` | 409 | This invitation has expired. |
| `INVITATION_ALREADY_ACCEPTED` | 409 | This invitation was already accepted. |
| `INVITATION_REVOKED` | 409 | This invitation was revoked. (mapped to `InvitationExpiredError`) |
| `INVITATION_EMAIL_MISMATCH` | 403 | Sign in with the email address this invitation was sent to. |
| `UNAUTHORIZED` | 401 | Sign in |

Create conflicts: `ACTIVE_INVITATION_EXISTS` / already member `CONFLICT` (“That person is already a workspace member.”).

### Routes

React `/team`, `/settings`, `/audit` are **not** role-gated. Audit API may 403 in-page (`AUDIT_ACCESS_DENIED`). Angular does **not** add `permissionGuard`. `/invite` stays unguarded (chromeless).

### Presence

React member `status: "online"` is hardcoded in `mapMember`. Angular does **not** render presence dots.

### Offline

React disables invite/role/remove via `isConnectionOffline()` and may enqueue other mutation types. Team/invite operations are **unsafe** (not queued). Angular: no offline queue; optional `navigator.onLine === false` message; otherwise fail on the HTTP error.

---

## Permission architecture

`WorkspacePermissionsService` (root). Capabilities are **computed from** `AuthService.currentUser().id` + `MembersDataService` rows (via `WorkspaceReadsService`). Not localStorage, not email, not a second permission store.

| Method | Source rule |
| --- | --- |
| `currentRole` | member row for current user, else `viewer` |
| `canEditTask` | member+ (Phase 4) |
| `canManageProjects` | admin+ (Phase 4) |
| `canManageMembers` / `canInviteMembers` / `canViewAudit` | admin+ (`canInvite`, `canManageMembers`). `canViewAudit` is for future audit UX; **no route guard** |
| `canChangeMemberRole(target)` | admin+; not owner target; admin cannot change admins |
| `canRemoveMember(target)` | admin+; not self; not owner; admin cannot remove admin+ |
| `roleSelectOptions()` | owner → admin/member/viewer; admin → member/viewer |
| `inviteRoleOptions()` | admin/member/viewer |

Templates call these methods/signals. They do **not** scatter `role === 'admin'`.

Hidden buttons are UX. Authoritative enforcement remains Next API → `server/taskflow` → RLS / RPCs.

When membership reloads, signals recompute. No hard refresh required for button visibility.

---

## Member data ownership

Phase 3 `MembersDataService` (`GET /api/members?workspaceId=`) remains the member list. **No** `TeamMembersStore` / member cache.

`InvitationsDataService` (root) `GET /api/taskflow/workspaces/:id/invitations` only when `workspaceId && canInviteMembers()`. Skips otherwise so viewers do not 403-loop. Strips `token_hash` in parse.

---

## Team page

`/team` replaces the Phase 1 placeholder.

Real members: name, initials avatar (`mapMember`), email mailto, role, workload (Assigned/Done/Active/Overdue, completion bar, Light/Normal/Busy/Overloaded) from `memberWorkloadStats` (same thresholds as React selectors).

Loading / error+retry / empty members / no-workspace copy. Pending invitations + revoke for admin+. Activity feed (12 items). Invite dialog (Reactive Form). Role `<select>` and Remove per capabilities. Remove uses `tf-read-dialog` confirmation.

---

## Invite Member form

Typed `FormGroup`: email (trimmed required, trimmed email, max 320), role (invite-role validator, default `member`).

Submit: `POST` existing body. Duplicate-submit guard. Field errors + `role="alert"` for API errors. 403 / pending-invite / already-member messages from the envelope, not “Unable to invite.” Success reloads invitations + activity; **does not** `members.reload()` (invite is not membership). Dev `acceptUrl` shown when the API returns it.

---

## Invitation / member mutation services

`InvitationMutationsService`: `invite`, `revoke`, `accept` only.

`MemberMutationsService`: `updateRole`, `remove` only.

Not mixed into `UiStateService`. Not queued offline.

### Reload after success

| Action | Reload |
| --- | --- |
| invite / revoke | invitations, activity |
| accept | workspaces, members, invitations, activity (same as React `useAcceptInvitation`; no `setActiveWorkspace`) |
| role PATCH / member DELETE | members, activity |

Failed writes do not reload (client list stays the last server truth).

---

## Invite route and unauthenticated continuation

`/invite` is chromeless and unguarded.

1. Angular `/invite?token=<base64url>`
2. If not authenticated → “Sign in to continue” → `/signin?next=/invite?token=…`
3. Google via existing `AuthService.signInWithGoogle(next)` → `/api/taskflow/auth/google?next=`
4. Existing `/auth/callback` + `safeNextPath`
5. Return to **same** `/invite?token=`
6. Explicit Accept → `POST /api/taskflow/invitations/accept` `{ token }` → `/dashboard`

Token must match `/^[A-Za-z0-9_-]{20,200}$/` for `next` allowlisting. Missing/malformed token → Invalid invite (no accept POST). Expired/revoked/already-accepted/email-mismatch after POST, with dashboard / sign-in next actions. No auth loop: `/invite` is not behind `authGuard`; 401 on accept uses `handleUnauthorized(router.url)` which keeps a safe invite `next`.

---

## OAuth return preservation

**Why shared `safeNextPath` had to change**

Angular app paths previously returned **pathname only**. `/invite` was not in `ANGULAR_APP_PATHS`, so `/invite?token=` fell through to the React dashboard fallback. Invitation context could not survive OAuth without an allowlist change.

**What changed (narrow)**

`safeAngularInvitePath` in both:

- `lib/demos/taskflow/auth/safeNextPath.ts` (callback + Google start)
- `taskflow-angular/src/app/core/auth/safe-next-path.ts`

Rules: pathname exactly `/invite`; no username/password/hash; **only** query key `token`; token matches `INVITE_TOKEN_PATTERN`; result `/invite?token=` + encoded token. Protocol-relative and external hosts still rejected.

React `/demos/taskflow/invite?token=` still allows **any** search (unchanged). Other Angular paths still drop query strings.

`signInPathForNext`: pathname `/invite` → Angular `/signin`.

`guestGuard`: authenticated `/signin?next=` now `parseUrl(safeAngularNextPath(next))` instead of always `/dashboard`, so invite continuation is not dropped.

**Backward compatibility:** React TaskFlow invite + dashboard `next` values still pass the existing tests. New tests cover valid Angular invite `next`, short token, extra params, missing token, protocol-relative, `signInPathForNext`.

React Team / Invite **UI was not modified**.

---

## 403 authority

UI capabilities hide controls. Illegal PATCH/DELETE/POST still 403 from the server. Angular shows the envelope message and does **not** mutate member lists locally.

Manually opening `/team` or `/audit` as a viewer: same as React (page loads; privileged APIs 403). Not a fake 404. No `permissionGuard`.

---

## Offline-unsafe enforcement

Invite, accept, revoke, role change, remove are **not** in any outbox. `isBrowserOffline()` may disable controls; otherwise the request fails with a user-facing error. Preserves the Phase 0 safe/unsafe split.

---

## Resource reload strategy

Explicit `.reload()` on the domain `httpResource` that the write affects (table above). Capabilities recompute from reloaded members. No full application reload. Opening a role `<select>` does not hit the network. Capability `computed` does not fetch.

**Realtime is Phase 6.** Member list changes from another browser now reload via `workspace_members` → `members.reload()`. See [14-phase6-realtime-presence.md](./14-phase6-realtime-presence.md).

---

## Accessibility

Semantic member cards + invitation list; labelled role `<select>`; invite form labels + `aria-invalid` / `aria-describedby`; `role="alert"` errors (not color-only); CDK focus trap on invite/remove dialogs; Escape; Remove confirm copy; visible focus via existing TaskFlow tokens; `aria-busy` on invite submit.

---

## Testing

Angular `ng test --watch=false`: **132 passed** (Phase 4 was 89).

Invite/OAuth: unauthenticated invite render; invite context on sign-in; Google `next` preserved; malicious/external `next` rejected; authenticated invite loads without auto-accept; accept POST `{ token }`; success reloads workspace/members; invalid/expired invitation copy.

Team: real members, loading, empty, error/retry, role labels, viewer/member/admin/owner capabilities from source rules.

Invite form: init, invalid email/role, payload, duplicate submit, 403, pending-invite 409, success reloads invitations and does not fabricate members.

Role/remove: authorized controls, PATCH contract, 403 does not mutate, confirm before DELETE, failed remove preserves list.

Shared: `lib/demos/taskflow/auth/safeNextPath.test.ts` (valid Angular invite `next`, rejections, `signInPathForNext`).

---

## Manual multi-user validation

Requires two real Google accounts (owner/admin vs member/viewer) on Angular + React. **Not available in this session.** Marked **PARTIAL**. No fake production identities.

---

## React / Angular team parity

Same APIs, same role rules, same invite token query, same accept POST. Interactive same-session comparison of Team pages **PARTIAL** (auth smoke still needs a human Google session, same as Phases 2–4).

Known intentional differences:

- Angular Remove confirms; React does not.
- Angular does not optimistic-update members.
- Angular does not show hardcoded online dots.
- Server `acceptUrl` (dev) still points at React `/demos/taskflow/invite`.

---

## Style budget warning

Phase 4: `tasks-page.scss` ~281 bytes over the 4 kB `anyComponentStyle` warning. No harmless shared-class extract was obvious without visual risk. **DEFERRED.** Budget was not raised. Production build still **passes** (warning only; error budget 8 kB).

---

## Authentication live smoke

Google interactive consent is still unavailable unattended. **PARTIAL** (login / `/api/me` / refresh / logout not human-validated on `localhost:4200` in this session).

---

## REACT → ANGULAR TEAM/PERMISSION LESSONS

Written after implementation.

1. **Conditional React rendering → computed capabilities.** `TeamView` inlined `isManager` / `canChangeRole` / `canRemoveMember`. Angular keeps one `WorkspacePermissionsService` derived from members + auth so templates do not re-encode the matrix.
2. **Auth-only guard stays.** React does not role-gate `/team` or `/audit`. A `permissionGuard` would be a new product rule. 403 on APIs remains the boundary.
3. **Invite modal state → Reactive Form + `InvitationMutationsService`.** Email/role validation and submit locking live on the form; HTTP lives on the service.
4. **React query invalidation → explicit resource reload.** Invite does not reload members. Accept reloads workspaces + members + invitations + activity, matching `useAcceptInvitation`, without inventing `setActiveWorkspace`.
5. **`enabled: manage ? workspaceId : null` → `httpResource` returns `undefined` unless `canInviteMembers()`.** Same 403 avoidance without a second members store.
6. **OAuth `next` cannot carry invite context unless the allowlist includes a tightly shaped query.** Pathname-only Angular routes were correct; `/invite` is the exception, constrained to one token key and a charset/length check. Do not “just allow search strings.”
7. **`guestGuard` must honor safe `next`.** Always sending authenticated users to `/dashboard` dropped invite continuation.
8. **No invitation preview API means no invented workspace title.** Match AcceptInviteView: identity of the signed-in user + explicit Accept.
9. **React optimism on role/remove is not security.** Angular waits for the server then reloads so 403 cannot leave a lying UI.
10. **Confirmation for Remove is a Phase 5 a11y requirement, not a new collaboration feature.** Who may remove is unchanged.
11. **Capabilities must not become writable booleans.** `canInviteMembers` is a `computed` from membership. Reloading members is enough to update buttons.
12. **Team mutations stay offline-unsafe.** Queuing invite/role/remove would violate the Phase 0 list and INVITE/PERM risks.

---

## Phase 5 acceptance

`/team` real data; roles viewer/member/admin/owner; capability layer; Reactive invite form; existing invitation API; `/invite?token=`; unauthenticated invite survives OAuth `next` without weakening redirects; explicit accept; role PATCH and member DELETE; owner/self rules from `permissions.ts`; 403 authoritative; no offline queue; explicit reloads; no realtime; no optimistic team writes; a11y dialogs/forms; Angular tests + production build; React product UI unchanged; shared allowlist documented + tested.
