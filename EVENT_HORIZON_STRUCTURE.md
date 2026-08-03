# Event Horizon — Project Structure

High-level map for reviewers. Paths are relative to the portfolio root.

## `app/`

App Router pages and API. `app/demos/event-horizon/` is the UI shell. `app/api/` hosts Auth.js and Event Horizon REST handlers.

## `components/`

React UI for the demo (browse, cards, detail, tickets, nav, modal, sign-in).

## `contexts/`

Client providers for Theme, Toast, Favorites, and Reservations. Favorites/Reservations now call authenticated APIs instead of Local Storage.

## `server/`

Backend-only code: Prisma client, Zod schemas, errors, HTTP helpers, mappers, repositories, and services. Marked with `server-only`.

## `prisma/`

PostgreSQL schema, SQL migrations, and seed script (seeded from `lib/demos/event-horizon/eventData.ts`).

## `lib/`

Shared frontend helpers and the seed/fallback event catalog. URL filter helpers and the browser `apiClient` live here.

## `hooks/`

No dedicated EH hooks package; use context hooks (`useFavorites`, `useReservations`, `useSession`).

## `types/`

Auth.js session typing under `types/next-auth.d.ts`. Domain types also live beside Prisma models / mappers.

## `tests/`

Vitest suites colocated under `lib/demos/event-horizon/` and `server/**`. `test/server-only-stub.ts` lets Vitest import server modules.

## Also relevant

| Path | Purpose |
|------|---------|
| `auth.ts` | Auth.js configuration |
| `public/demos/event-horizon/` | Event imagery |
| `EVENT_HORIZON_*.md` | Review / interview / backend docs |
| `.env.example` | Required environment variables |

Start with `app/demos/event-horizon/README.md`, then `server/services/`, then `prisma/schema.prisma`.
