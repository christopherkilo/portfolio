# 07 — Risk register

Likelihood / impact: **L** low, **M** medium, **H** high.

Phases refer to `08-migration-milestones.md`.

---

### AUTH-001 — Cross-framework authentication / session compatibility

| | |
| --- | --- |
| **Likelihood** | H |
| **Impact** | H |
| **Mitigation** | Option A (same-origin cookies). Do not ship Bearer in Phase 1. Keep `/auth/callback` on Next. Angular uses publishable supabase-js only for OAuth start, realtime, sign-out. Never ship `SUPABASE_SECRET_KEY`. |
| **Phase** | M2 (and hosting setup in M1) |
| **Validation** | Sign-in → callback → `/api/me` 200; React sign-in still works; expired session → 401 on API, Angular guard → sign-in |

---

### DATA-001 — Replacing TanStack Query without duplicating stale server state

| | |
| --- | --- |
| **Likelihood** | H |
| **Impact** | H |
| **Mitigation** | One query-key cache. Realtime only invalidates. No NgRx entity store. Same key tuples as `workspaceKeys.ts` + `attachmentKeys`. |
| **Phase** | M3 onward |
| **Validation** | Mutation + second tab/realtime refresh shows one consistent list; optimistic rollback tests ported |

---

### RT-001 — Realtime event duplication or subscription leaks

| | |
| --- | --- |
| **Likelihood** | M |
| **Impact** | H (duplicate invalidations, extra sockets, billed connections) |
| **Mitigation** | Single `RealtimeService`. Start/stop only from shell. `DestroyRef` unsubscribe. Preserve no-op duplicate `start`. |
| **Phase** | M6 |
| **Validation** | Port `RealtimeManager.test.ts`; navigate workspace A→B leaves one channel; destroy shell removes channel |

---

### RT-002 — Workspace channel switching

| | |
| --- | --- |
| **Likelihood** | M |
| **Impact** | H (wrong workspace data / leaked presence) |
| **Mitigation** | `stop()` previous channel before `start()` next; invalidate old keys; presence list cleared. |
| **Phase** | M6 |
| **Validation** | Switch workspace in TopNav; events from old id do not invalidate new cache |

---

### OFF-001 — IndexedDB queue behavioral regression

| | |
| --- | --- |
| **Likelihood** | M |
| **Impact** | H |
| **Mitigation** | Port `mutationQueue.ts` + tests; same types/statuses; distinct DB name if sharing origin with React (`taskflow-angular-offline-v1`). |
| **Phase** | M7 |
| **Validation** | Port `mutationQueue.test.ts`; kill tab mid-queue; reopen Angular; records remain |

---

### OFF-002 — Reconnect replay ordering

| | |
| --- | --- |
| **Likelihood** | M |
| **Impact** | H (lost comments, wrong task order) |
| **Mitigation** | Sort `createdAt`; stop on failure; do not parallelize replay. |
| **Phase** | M7 |
| **Validation** | Port replay tests; two queued patches + one 500 leaves later items pending |

---

### CONFLICT-001 — Lost `expectedVersion` / 409 semantics

| | |
| --- | --- |
| **Likelihood** | M |
| **Impact** | H (silent overwrite) |
| **Mitigation** | Always send `expectedVersion` on task/project PATCH; interceptor preserves `data.latest`; ConflictDialog; status auto-reconcile only when allowed. |
| **Phase** | M4 (send version), M8 (dialog + replay 409) |
| **Validation** | Two clients edit same task; second gets 409 + latest; keep/reload works; SQL RPC still authoritative |

---

### PERM-001 — Frontend guards mistaken for backend security

| | |
| --- | --- |
| **Likelihood** | H (cultural) |
| **Impact** | H |
| **Mitigation** | Guard comments: UX only. Hide Invite for viewers but still test 403. Never add a “dev bypass” API. |
| **Phase** | M2, M5 |
| **Validation** | Viewer token calling admin routes still 403; audit page handles `AUDIT_ACCESS_DENIED` |

---

### UPLOAD-001 — Attachment lifecycle regression

| | |
| --- | --- |
| **Likelihood** | M |
| **Impact** | H (orphan pending rows, failed complete) |
| **Mitigation** | Same initiate → PUT signed URL → complete; MIME/size client checks; do not queue uploads offline. |
| **Phase** | M9 |
| **Validation** | Port attachment limit tests conceptually; fail PUT then complete must error; delete unsafe offline |

---

### INVITE-001 — OAuth / invitation redirect behavior

| | |
| --- | --- |
| **Likelihood** | M |
| **Impact** | H |
| **Mitigation** | Keep accept `POST` + token query. Sign-in `next` must survive OAuth. Phase 5 added a **narrow** Angular `/invite?token=` allowlist (token charset/length, single query key). Do not generalize to arbitrary search strings. See [13-phase5-team-permissions.md](./13-phase5-team-permissions.md). |
| **Phase** | M2, M5 |
| **Validation** | Logged-out invite → sign-in → back to invite → accept; logged-in accept; expired token copy |

---

### UI-001 — Visual drift from existing TaskFlow

| | |
| --- | --- |
| **Likelihood** | H |
| **Impact** | M (portfolio demo credibility) |
| **Mitigation** | Copy layout/tokens; no redesign. Screenshot parity in M10. |
| **Phase** | M1, M10 |
| **Validation** | Side-by-side dashboard/tasks/team; reduced motion |

---

### A11Y-001 — Dialog / focus regression

| | |
| --- | --- |
| **Likelihood** | M |
| **Impact** | H |
| **Mitigation** | Port `Modal.tsx` trap, Escape, restore focus, `role="dialog"`. Command palette: one open flag. |
| **Phase** | M1 shell, M4 editor, M8 conflict, M10 axe |
| **Validation** | Keyboard-only editor + invite + conflict; axe on dialogs |

---

### TEST-001 — Loss of behavioral coverage

| | |
| --- | --- |
| **Likelihood** | H |
| **Impact** | H |
| **Mitigation** | Map each `lib/demos/taskflow/**/*.test.ts` and `server/taskflow/**/*.test.ts`. Server tests stay. Client tests re-implemented against Angular services. Do not delete React tests. |
| **Phase** | every milestone + M10 |
| **Validation** | Checklist in M10; React tests still green |

---

## Additional risks from source

### HOST-001 — Shared origin storage clash with React

| | |
| --- | --- |
| **Likelihood** | H if Option A same origin |
| **Impact** | H (double replay, fighting `activeWorkspaceId`) |
| **Mitigation** | Angular persist key `taskflow-angular-ui-v1`; IDB `taskflow-angular-offline-v1`. |
| **Phase** | M1 / M7 |
| **Validation** | Use React offline queue; open Angular; React queue unchanged |

### AUTH-002 — `proxy.ts` / `safeNextPath` ignore Angular routes

| | |
| --- | --- |
| **Likelihood** | H until matcher updated |
| **Impact** | M (deep links bounce or `next` stripped) |
| **Mitigation** | Until allowlisted, complete OAuth `next` to React dashboard or only use Angular behind proxy without relying on Next page redirects. Document before changing proxy. |
| **Phase** | M2 |
| **Validation** | Unauthenticated Angular URL behavior is explicit |

### KEY-001 — Attachment query keys not on `taskflowKeys`

| | |
| --- | --- |
| **Likelihood** | M |
| **Impact** | M (missed invalidation) |
| **Mitigation** | Put attachments in the Angular key catalog from day one. |
| **Phase** | M3, M6, M9 |
| **Validation** | Attachment realtime invalidates the open task’s list |

### PREF-001 — Duplicate notification preference surfaces

| | |
| --- | --- |
| **Likelihood** | M |
| **Impact** | L |
| **Mitigation** | Settings: Zustand-like chrome vs `notification-preferences` API documented in M5/M9; do not merge silently. |
| **Phase** | M5, M9 |
| **Validation** | Toggling API preferences persists after reload; density still local |

### STATE-001 — Dual command palette open flags

| | |
| --- | --- |
| **Likelihood** | (already in React) |
| **Impact** | L |
| **Mitigation** | Angular: single `commandOpen` signal. Do not “port both.” |
| **Phase** | M1 |
| **Validation** | Shortcut and button toggle the same overlay |

### OFF-003 — Divergent unsafe-action string lists

| | |
| --- | --- |
| **Likelihood** | M if copied blindly |
| **Impact** | M |
| **Mitigation** | One canonical `UNSAFE_OFFLINE_ACTIONS` in Angular (`member_role` vs `role_change`). |
| **Phase** | M7 |
| **Validation** | Role change while offline → 503, not queued |

### RT-003 — Realtime auth vs API cookies

| | |
| --- | --- |
| **Likelihood** | M |
| **Impact** | H (channel fails, UI looks “offline” while REST works or vice versa) |
| **Mitigation** | Initialize the publishable-key browser client on the Angular origin after the Option A cookie session exists (`createBrowserClient` from `@supabase/ssr`). Do not create a second anonymous client. Do not put `SUPABASE_SECRET_KEY` in the SPA. Public config exposes URL + publishable key only. See [14-phase6-realtime-presence.md](./14-phase6-realtime-presence.md). |
| **Phase** | M2, M6 |
| **Validation** | After login, REST (`HttpClient` + cookies) and the Realtime WebSocket (user JWT from the same cookie-backed browser client) are both authenticated. Proven at the Phase 6 auth gate; wired in Phase 6. |

### FORM-001 — Mechanical hook translation

| | |
| --- | --- |
| **Likelihood** | H |
| **Impact** | M |
| **Mitigation** | Facades + Reactive Forms + inject(), not `useXxx` clones. |
| **Phase** | all |
| **Validation** | Code review against principle 11 |

### SEED-001 — `data.ts` seed arrays mistaken for API

| | |
| --- | --- |
| **Likelihood** | M |
| **Impact** | M (fake team on Team page) |
| **Mitigation** | Live data from `/api/members` only. Seed types may be reused as view models via mappers. |
| **Phase** | M3 |
| **Validation** | Team page empty for empty workspace |
