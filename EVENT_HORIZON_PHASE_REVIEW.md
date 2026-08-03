# Event Horizon — Phase Review (Backend Migration)

## Project Status

**Backend systems phase complete (code + unit tests + build).**  
Live PostgreSQL migrate/seed was **not** executed in this environment (no local `psql`/Docker Postgres available).

Baseline before migration: lint ✓ · tsc ✓ · 67 tests ✓ · build ✓  
After migration: lint ✓ · tsc ✓ · **76 tests** ✓ · build ✓ · prisma validate ✓ · prisma generate ✓

## Completed objectives

- REST API for events, favorites, reservations  
- Auth.js Google OAuth (primary) + optional GitHub when credentials exist + Prisma adapter + secure cookie sessions  
- Service + repository layers  
- Prisma PostgreSQL schema + migration SQL + seed  
- Zod request validation + consistent error contract  
- Transactional inventory + idempotency  
- Frontend migration off Local Storage for favorites/reservations  
- Docs: architecture + interview guide + README updates  

## Architecture / data / routing / state

See `EVENT_HORIZON_BACKEND_ARCHITECTURE.md` and `EVENT_HORIZON_STRUCTURE.md`.

## Intentionally deferred

- Stripe / real payments  
- Redis distributed rate limiting  
- Password credentials auth  
- DB integration tests (need `TEST_DATABASE_URL`)  
- Email delivery / admin dashboards  

## Manual setup required

1. Provision PostgreSQL  
2. Fill `.env.local` from `.env.example`  
3. `npm run prisma:migrate && npm run prisma:seed`  
4. Configure Google OAuth callback to `/api/auth/callback/google` (and GitHub only if enabling it)  
5. `npm run dev` and verify the checklist in the backend architecture doc  
