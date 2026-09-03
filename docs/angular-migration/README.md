# TaskFlow Angular migration

Phase 0 design is complete. Phase 1 added an independent Angular app at `taskflow-angular/`. The React/Next.js TaskFlow under `/demos/taskflow` remains the known-good product.

## Why this migration exists

The existing React version is **not** being replaced because it is broken. It is a complete collaborative workspace: Supabase Auth, RLS, versioned writes, realtime, offline outbox, attachments, invitations, and audit.

The Angular version exists to:

- learn Angular idiomatically on a real product problem
- compare architecture using the same domain
- demonstrate framework breadth
- prepare for an Angular-first ResolveOps application later

## Golden rule

**Preserve behavior; translate architecture.**

Do not convert every `.tsx` file into an Angular file. Understand responsibilities, then represent them with Angular-native tools (standalone components, DI, signals, RxJS, Reactive Forms, Router, guards, interceptors, HttpClient).

## Documents

| File | Contents |
| --- | --- |
| [00-current-state.md](./00-current-state.md) | Inventory of the live React/Next implementation |
| [01-target-architecture.md](./01-target-architecture.md) | Target Angular frontend structure |
| [02-route-component-map.md](./02-route-component-map.md) | Page/component → Angular mapping |
| [03-state-management-map.md](./03-state-management-map.md) | Query / Zustand / Realtime / IDB translation |
| [04-api-contract-inventory.md](./04-api-contract-inventory.md) | HTTP contract to preserve |
| [05-auth-migration-decision.md](./05-auth-migration-decision.md) | Cookie vs Bearer decision |
| [06-realtime-offline-plan.md](./06-realtime-offline-plan.md) | Realtime + outbox mapping |
| [07-risk-register.md](./07-risk-register.md) | Risks and mitigations |
| [08-migration-milestones.md](./08-migration-milestones.md) | Ordered milestones |
| [09-phase1-foundation.md](./09-phase1-foundation.md) | Phase 1 app: versions, routes, how to run |
| [10-phase2-auth.md](./10-phase2-auth.md) | Phase 2: Option A cookies, proxy, AuthService, guards, OAuth |
| [11-phase3-read-data.md](./11-phase3-read-data.md) | Phase 3: native httpResource reads, dashboard/projects/tasks |
| [12-phase4-mutations.md](./12-phase4-mutations.md) | Phase 4: Reactive Forms, CRUD, expectedVersion, 409 |
| [13-phase5-team-permissions.md](./13-phase5-team-permissions.md) | Phase 5: Team, invitations, PermissionService, OAuth invite `next` |
| [14-phase6-realtime-presence.md](./14-phase6-realtime-presence.md) | Phase 6: Realtime invalidation, Presence, connection indicator |
| [15-phase7-offline-queue.md](./15-phase7-offline-queue.md) | Phase 7: IndexedDB outbox, safe mutations, replay |
| [16-phase8-conflict-resolution.md](./16-phase8-conflict-resolution.md) | Phase 8: three-way conflict resolver, no force overwrite |
| [17-phase9-product-surfaces.md](./17-phase9-product-surfaces.md) | Phase 9: comments, attachments, history, notifications, audit |
| [18-phase10-final-parity.md](./18-phase10-final-parity.md) | Phase 10 (final): parity matrix, hardening, portfolio copy. **COMPLETE WITH MANUAL QA GAPS** |

## Architectural principles (binding)

1. Existing React TaskFlow remains known-good.
2. Do not rewrite the database to accommodate Angular.
3. Do not bypass authorization for convenience.
4. Angular guards are UX protection, **not** authoritative security.
5. RLS and `server/taskflow` remain authoritative.
6. Never expose `SUPABASE_SECRET_KEY` to Angular.
7. Do not create duplicate server-entity stores.
8. Realtime is not a second state store.
9. The offline queue stays separate from UI state.
10. `expectedVersion` / `409 STALE_VERSION` must survive.
11. Do not mechanically translate React hooks into Angular-shaped hooks.
12. Prefer Angular-native concepts listed above.
13. Do not add NgRx solely because this is Angular.
14. Do not redesign the TaskFlow UI during migration.
15. Feature parity comes before new features.

## Safety

Phase 0 is documentation. Phase 1+ must not change React TaskFlow product behavior unless a documented, approved adapter is required (see auth Option A vs later Option B).

**Migration status (Phase 10):** COMPLETE WITH MANUAL QA GAPS. See [18-phase10-final-parity.md](./18-phase10-final-parity.md). There is no Phase 11.

Phase 2 implemented Option A (same-origin cookies). Compatibility changes are listed in [10-phase2-auth.md](./10-phase2-auth.md). Do not switch to Bearer/JWT Option B without an explicit architecture decision.
