# Event Horizon — Technical Overview

Interview-oriented notes for the full-stack Event Horizon demo.

## Project purpose

Event Horizon is a **production-shaped** event discovery and reservation product embedded at `/demos/event-horizon`. It demonstrates App Router UI plus a real backend: Auth.js sessions, Prisma/PostgreSQL, Zod validation, transactional inventory, and REST APIs.

## Architecture

```
App Router UI + contexts
        ↓ HTTP
Route Handlers (/api/*)
        ↓
Zod → auth session → services → repositories → PostgreSQL
```

External discovery is a separate path:

```
Ticketmaster → EventBridge → Fargate → SQS → Lambda → DynamoDB
                                                      ↓
                                      Read-only Function URL → UI
```

- UI keeps accessible browse/detail/tickets flows.
- PostgreSQL is authoritative for prices, inventory, ownership, and confirmation numbers.
- DynamoDB caches provider listings for discovery only. Ticketmaster cards cannot be reserved in Event Horizon.
- `eventData.ts` remains seed input / SSG catalog for native events — not a second production booking store.
- `NEXT_PUBLIC_EVENT_HORIZON_EXTERNAL_EVENTS_API` is optional. Missing or failed AWS reads leave the native catalog intact.

## Major components

| Area | Notes |
|------|------|
| Browse | URL filters → `GET /api/events` with server pagination |
| Detail | Reservation modal posts idempotent `POST /api/reservations` |
| Favorites / Tickets | Authenticated REST; sign-in prompts when needed |
| Navbar | Sign in / out + counts from server-backed contexts |
| `server/services/*` | Business rules |
| `server/repositories/*` | Prisma + transactions |

## Routing strategy

Static generation remains for known event detail paths. Browse is a client island (search params). API routes are dynamic. Custom loading/error/not-found pages are unchanged.

## State management

1. URL state for browse filters  
2. Auth.js database sessions  
3. Server-persisted favorites and reservations  
4. Ephemeral modal/toast UI state  

## Why Next.js

Colocated Route Handlers, Server Components for shells, and Client Components for interaction — one deployable portfolio app that still teaches real full-stack seams.

## Authentication UX

Google is the primary sign-in method. GitHub is optional and appears only when both GitHub OAuth env vars are set. The navbar opens an accessible sign-in modal that lists only configured providers. After OAuth, secure cookie sessions identify the user for favorites and reservations. The profile menu shows avatar, name, email, and a provider badge. Dangerous automatic email account linking is disabled.

## Favorite engineering decisions

1. Integer cents + server fee math  
2. Conditional inventory updates inside transactions  
3. Idempotency keys for reservation POSTs  
4. Reservation snapshots for historical display  
5. Soft cancel only (no hard-delete of reservation history)  
6. Zod runtime validation with a documented 400/422 split  

## Tradeoffs

| Choice | Cost |
|--------|------|
| Embedded in portfolio | Shared deploy/config complexity |
| Google primary + optional GitHub | No password/email login yet |
| No Redis rate limit | Need distributed limiter before multi-instance prod abuse defense |
| No Stripe yet | `confirmed` is pre-payment demo status |

## Future improvements

Stripe + webhooks, refunds, Redis rate limits, email receipts, organizer admin, deeper DB integration tests under `TEST_DATABASE_URL`.

## 30-second pitch

> “Event Horizon is a Next.js event marketplace demo with Auth.js, Prisma/Postgres, and an AWS discovery pipeline. Native browse stays public and URL-synced; favorites and tickets require sign-in. The server owns pricing and inventory. Ticketmaster listings are ingested twice daily into DynamoDB and shown as outbound cards—they never share the reservation path.”
