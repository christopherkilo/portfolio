# Event Horizon Backend Migration — Implementation Plan

**Baseline (2026-07-30):** lint ✓ · tsc ✓ · tests 67 ✓ · build ✓  
**Node:** v22.17.0 · **Next:** 16.2.10 · **Zod:** 4.4.3

## Approach

1. Add Prisma 6 + `@prisma/client`, Auth.js (`next-auth` v5) + `@auth/prisma-adapter`, `server-only`.
2. Introduce `server/` (db, schemas, errors, api helpers, repositories, services) without touching unrelated demos.
3. Keep `eventData.ts` as seed source until DB-backed reads are verified; mark as seed-only.
4. Ship REST under `/api/events`, `/api/favorites`, `/api/reservations`, `/api/auth/[...nextauth]`.
5. Migrate FavoritesContext / ReservationsContext / Browse to API; public browse remains unauthenticated.
6. Money stored as integer cents; fees calculated server-side (shared formula with frontend estimate).
7. Reservation create/cancel use Prisma `$transaction` + conditional inventory update + idempotency key.
8. Hard-delete of reservations removed from product UI; cancel is soft; history retained.
9. Unit/service/API tests with mocks always run; DB integration tests only when `TEST_DATABASE_URL` is set.

## Non-goals (this phase)

Stripe, Redis, GraphQL, microservices, admin, email, password auth.
