# Event Horizon — Backend Interview Guide

Use this to explain the full-stack demo clearly.

## ELI15 topics

1. **API** — A menu of URLs the browser calls to ask for data or make changes.
2. **Authentication** — Proving who you are (Google primary, optional GitHub when configured, + cookie session).
3. **Authorization** — Checking what you’re allowed to do (only your tickets).
4. **Service layer** — The “manager” that applies product rules.
5. **Repository layer** — The “warehouse clerk” that talks to the database.
6. **PostgreSQL** — The durable store for events, users, favorites, reservations.
7. **Prisma** — Typed toolkit that turns schema + queries into safe SQL.
8. **Zod** — Runtime bouncer that rejects bad request data.
9. **Transactions** — Multiple DB steps that succeed or fail together.
10. **Concurrency** — Two people buying the last ticket at once; DB conditions prevent oversell.
11. **Idempotency** — Clicking Reserve twice with the same key creates one order.
12. **Server-side pricing** — Browser estimates; server calculates the real total.
13. **Error handling** — Safe messages to users; secrets never leaked.

## Story: Browse events

URL filters → `GET /api/events?...` → Zod query schema → `eventService.listEvents` → Prisma filtered query → JSON page of events → Browse UI.

## Story: Favorite an event

Heart click → if unsigned-in, open Sign In modal (Google emphasized) → OAuth → session cookie → resume favorite via stored intent → toast success.

## Story: Create a reservation

Ticket modal → client estimate → `POST /api/reservations` with quantity + idempotency key → service loads ticket price from DB → fee math in cents → transactional inventory decrement + insert → confirmation number → My Tickets.

## Story: Cancel a reservation

My Tickets → Cancel → `PATCH /api/reservations/[id]/cancel` → ownership check → transaction sets cancelled + restores inventory once.

## Technical talking points

- Why money is cents: floating point money is risky; integers are exact for USD demos.
- Why snapshots: past purchases must remain readable after catalog edits.
- Why not trust `userId` / prices from the client: attackers can forge those; the session and DB are the source of truth.
- Why hard delete was removed: reservation history is audit data; cancel is soft.
