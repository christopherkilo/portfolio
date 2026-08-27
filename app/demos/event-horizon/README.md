# Event Horizon — developer guide

Demo at `/demos/event-horizon`. Full-stack event discovery + reservations inside the portfolio app, with optional real Ticketmaster discovery listings.

## Purpose

Browse/filter events, favorite listings, and reserve demo tickets with **Auth.js sessions**, **PostgreSQL**, and **REST Route Handlers**. Local Storage is no longer authoritative for favorites or tickets.

External Ticketmaster cards are discovery links. They do not use Event Horizon inventory or reservation APIs.

## Local backend setup

1. Copy `.env.example` to `.env.local`
2. Set at least (Google-only is enough):
   - `DATABASE_URL` / `DIRECT_DATABASE_URL`
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (or `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
3. Optional: set **both** `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` to enable GitHub. If either is missing, GitHub is not registered and does not appear in Sign-In.
4. Configure OAuth redirect URIs for providers you enable:
   - Google: `{APP_URL}/api/auth/callback/google`
   - GitHub (only if enabled): `{APP_URL}/api/auth/callback/github`
5. Install and prepare the database:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Without a database, the Next.js **build** still succeeds, but Browse/API features need PostgreSQL at runtime.

## External events (optional)

Set `NEXT_PUBLIC_EVENT_HORIZON_EXTERNAL_EVENTS_API` to the public reader Function URL if you want live Ticketmaster cards. Leave it empty and the curated catalog still works. The browser never uses AWS keys.

Vercel Production and Preview must define the same variable for those environments to show external listings. Do not commit the deployed URL into components.

AWS CDK sources live in `/infrastructure`. The scheduled Fargate worker refreshes DynamoDB twice daily; this app only reads the public JSON API.

## Folder structure

```
app/demos/event-horizon/     # UI routes + sign-in
app/api/                     # REST + Auth.js handlers
server/                      # db, schemas, services, repositories
prisma/                      # schema, migrations, seed
components/demos/event-horizon/
contexts/demos/event-horizon/
lib/demos/event-horizon/     # seed catalog + URL helpers + client API
auth.ts                      # Auth.js config
```

## Routing

| Path | Role |
|------|------|
| `/demos/event-horizon` | Home |
| `/demos/event-horizon/browse` | URL-synced filters → `GET /api/events` |
| `/demos/event-horizon/events/[id]` | Detail + reservation modal |
| `/demos/event-horizon/tickets` | Account reservations |
| `/demos/event-horizon/favorites` | Account favorites |
| `/demos/event-horizon/signin` | OAuth sign-in entry (configured providers only) |
| `/api/events` | Public event list |
| `/api/favorites` | Authenticated favorites |
| `/api/reservations` | Authenticated reservations |

## State management

- **URL filters** — browse search params (unchanged contract)
- **Session** — Auth.js cookie + Prisma `Session`
- **Favorites / Reservations contexts** — fetch/mutate via REST when authenticated
- **Theme / Toast** — local UI only

## Money and fees

Server stores **integer cents**. Fee rule: `round(subtotalCents * 0.08) + 250`. Client estimates are display-only; confirmation uses server totals.

## Reservation product decision

- Status `confirmed` = demo pre-payment confirmation (no Stripe yet)
- Cancel is soft and restores inventory once
- Hard delete of reservation history is **not** offered in the UI

## Docs

- `EVENT_HORIZON_BACKEND_ARCHITECTURE.md`
- `EVENT_HORIZON_BACKEND_INTERVIEW_GUIDE.md`
- `EVENT_HORIZON_TECHNICAL_OVERVIEW.md`
