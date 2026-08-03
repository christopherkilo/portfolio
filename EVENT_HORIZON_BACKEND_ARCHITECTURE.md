# Event Horizon — Backend Architecture

## Why Route Handlers + REST

Event Horizon is embedded in a Next.js portfolio. App Router Route Handlers keep the API colocated with the UI, avoid a separate deployable service for this phase, and map cleanly to resource URLs (`/api/events`, `/api/favorites`, `/api/reservations`). REST was chosen over GraphQL because the resource set is small, cacheable, and easier to test with standard HTTP status codes.

## Request flow

```
HTTP Route Handler
  → Zod validation
  → auth session (when required)
  → service (business rules)
  → repository (Prisma queries / transactions)
  → PostgreSQL
```

Handlers stay thin. Services own product decisions. Repositories own SQL/Prisma details.

## Authentication

**Google is the primary provider.** GitHub is an **optional** enhancement. Auth.js + the Prisma adapter persist `User` / `Account` / `Session` for whichever providers are registered.

### Why Google is primary

- Familiar consumer sign-in for event discovery demos
- Reliable profile photo + display name for the account menu
- Fast OAuth path with broad audience coverage
- Minimal env surface: the app runs with Google alone (plus DB + `AUTH_SECRET` + `NEXT_PUBLIC_APP_URL`)

### Why GitHub is optional

- Registered **only** when both `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` are non-empty
- If either is missing, GitHub is not registered, not shown in the Sign-In UI, and does not produce provider misconfiguration errors
- When credentials are present, GitHub appears as a second button beside Google

### Account linking (safer Auth.js defaults)

- OAuth creates an `Account` row (`provider` + `providerAccountId`) tied to a `User`
- `allowDangerousEmailAccountLinking` is **not** enabled
- Automatic merge of separate Google/GitHub identities by email alone is intentionally avoided (account-takeover risk when email verification assumptions differ across providers)
- Each provider identity stays distinct unless Auth.js’s safer linking rules apply
- Sessions are database-backed HTTP-only cookies (`Session` table)

### How the backend knows ownership

- Route Handlers call `auth()` / `requireSessionUser()`
- `userId` is taken only from the server session
- Favorites and reservations are filtered and mutated by that session user id

### Sign-in UX

- Navbar **Sign In** opens a modal; buttons mirror **actually configured** providers (Google only, or Google + GitHub)
- Protected actions (favorite, reserve, My Tickets, Favorites) open the same modal
- Intents are stored in `sessionStorage` so OAuth redirects can resume the action
- Signed-in users see avatar + name with a profile menu (tickets, favorites, sign out, provider badge)

### Adding another OAuth provider later

1. Add the Auth.js provider in `auth.ts` behind an env-credential gate (same pattern as GitHub)
2. Extend `resolveConfiguredAuthProviders` / Sign-In UI to surface it only when configured
3. Document callback URL + env vars in `.env.example` and this file
4. Keep Google as the emphasized primary CTA unless product requirements change


## PostgreSQL schema (summary)

- Auth.js: `User`, `Account`, `Session`, `VerificationToken`
- Domain: `Event`, `TicketType`, `Favorite`, `Reservation`

Favorites use a join table with `@@unique([userId, eventId])` so duplicates are impossible at the DB layer.

Reservations store **snapshots** (title, image, venue, date, ticket name) so history remains readable if catalog rows change. Event/ticket deletes are **Restrict** for reservations so financial history is not cascade-wiped.

## Money as integer cents

Ticket prices and reservation totals use `*InCents` integers. Fees:

- `fee = round(subtotalCents * 0.08) + 250`
- Backend totals are authoritative; the UI may show an estimate and then display confirmed server totals.

## Zod vs TypeScript

TypeScript types disappear at runtime. Zod schemas validate query strings, route params, and JSON bodies before services run. Strategy:

- **400** — malformed JSON body
- **422** — valid JSON that fails field rules

## Transactions, concurrency, idempotency

Reservation create:

1. Open Prisma `$transaction`
2. `updateMany` ticket where `quantityRemaining >= quantity` and availability allows sales
3. If `count !== 1`, conflict (inventory race lost)
4. Insert reservation in the same transaction
5. Commit

Idempotency:

- Client sends `idempotencyKey`
- Unique DB constraint
- Repeat POST returns the existing reservation without a second inventory decrement

Cancel:

- Soft-status to `cancelled`
- Restores inventory once inside a transaction
- Hard delete of reservation history is **not** exposed in the UI

## Rate limiting

No Redis in this phase. Documented future requirement for distributed limiting on sign-in / favorite / reservation mutations. Do not treat in-memory limits as multi-instance safe.

## Local setup

1. Copy `.env.example` → `.env` / `.env.local`
2. Set `DATABASE_URL` / `DIRECT_DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (or `GOOGLE_CLIENT_*`), `NEXT_PUBLIC_APP_URL`. Optionally set `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` to enable GitHub.
3. `npm install`
4. `npm run prisma:generate`
5. `npm run prisma:migrate` (or `prisma migrate deploy`)
6. `npm run prisma:seed`
7. `npm run dev`

## Tests

- Unit/service/API-contract tests always run (mocked repositories)
- Destructive DB integration tests require `TEST_DATABASE_URL` and were **not** executed in this environment (no local PostgreSQL)

## Before real payments

Reservations use status `confirmed` as a **pre-payment demo confirmation**. Stripe, webhooks, refunds, and paid inventory locks are deferred.
