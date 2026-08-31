# Christopher Kilo — Portfolio

Production Next.js App Router portfolio with embedded software demos, case studies, graphic design work, and Kilo Toolkit.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

### Quality gates

```bash
npm run verify
```

Runs, in order, and stops on the first failure:

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm test`
4. `npm run build`
5. `npm run test:e2e` (Playwright Chromium, Firefox, WebKit, accessibility, and visual snapshots)

Individual commands remain available if you need a narrower check.

## Testing / Quality

| Command | What it covers |
| --- | --- |
| `npm test` | Vitest unit and integration tests |
| `npm run test:e2e` | Playwright against a production-like `next start` server |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run test:a11y` | axe-core on representative pages |
| `npm run test:visual` | Visual snapshot baselines (Chromium) |
| `npm run verify` | Lint, typecheck, unit tests, production build, then Playwright |

First-time Playwright setup:

```bash
npx playwright install
```

E2E tests start `next start` on port 4173. If `.next` is missing, the Playwright web server builds first.

### Visual snapshots

Baselines live in `e2e/__screenshots__/`. They are meant to catch missing content, broken layout, clipping, and responsive regressions—not animation frames.

Screenshot tests emulate reduced motion and inject test-only CSS. Production animations are unchanged.

Update approved snapshots **intentionally**:

```bash
npm run test:visual -- --update-snapshots
```

Do this on the same OS that captured the current baselines when possible. The committed snapshots were generated on macOS. Linux CI does **not** run the visual project yet — font rasterization would fail those baselines. Generate Linux snapshots with `npm run test:visual -- --update-snapshots` on Ubuntu, then add `--project=visual` to `.github/workflows/verify.yml`.

CI never passes `--update-snapshots`. When visual tests are enabled on Linux, a mismatch should fail the job and upload the Playwright HTML report plus failure screenshots/traces.

### CI

GitHub Actions (`.github/workflows/verify.yml`) runs on pull requests and pushes to `main`:

1. Checkout
2. Node 22 with npm cache
3. `npm ci`
4. Lint, typecheck, unit tests, production build
5. Playwright browsers
6. `npm run test:e2e:ci` — Chromium, Firefox, and WebKit (smoke, core E2E, accessibility). Visual snapshots stay local until Linux baselines exist.

Artifacts (HTML report, failure screenshots, traces on retry) upload only when Playwright fails.

## Embedded demos

All three software applications live in this repo under `/demos/*`. They do **not** require separate localhost ports.

| Application | Route | Persistence / services |
| --- | --- | --- |
| Event Horizon | `/demos/event-horizon` | PostgreSQL + Prisma + Auth.js; optional AWS Function URL for Ticketmaster discovery |
| NovaTech Solutions | `/demos/novatech-solutions` | Turnstile + AWS Step Functions (HubSpot, SQS, Resend) |
| TaskFlow | `/demos/taskflow` | Supabase (Auth, Postgres/RLS, Realtime, Storage) |
| Kilo Toolkit | `/toolkit` | Client-side simulated diagnostics |

Copy `.env.example` → `.env.local` and fill only the services you need locally. Never commit secrets.

### Event Horizon

Requires PostgreSQL for browse, favorites, and reservations:

- `DATABASE_URL` / `DIRECT_DATABASE_URL`
- `AUTH_SECRET`
- Google and/or GitHub OAuth credentials (`AUTH_GOOGLE_*`, optional `AUTH_GITHUB_*`)
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

Optional Ticketmaster discovery listings (public HTTPS reader only—no AWS keys in the app):

- `NEXT_PUBLIC_EVENT_HORIZON_EXTERNAL_EVENTS_API`

Leave that variable empty and the curated catalog still works. Set it in Vercel Production/Preview if the live site should show external events. Do not hardcode the Function URL in source.

Then:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

See `app/demos/event-horizon/README.md`.

AWS infrastructure (CDK, EventBridge, Fargate, SQS, Lambda, DynamoDB) lives under `/infrastructure`. It is **not** required to run the basic portfolio UI. The Ticketmaster Consumer Key is stored in SSM Parameter Store, not in this repository.

### NovaTech Solutions

Public form path: Next.js Route Handler → Turnstile → Step Functions. HubSpot and Resend run in AWS, not in the Route Handler.

| Variable | Purpose |
|----------|---------|
| `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Spam protection |
| `NOVATECH_STATE_MACHINE_ARN` | Server-only state machine ARN |
| `NOVATECH_AWS_REGION` | AWS region (`us-east-2`) |
| `AWS_ROLE_ARN` | Vercel OIDC role (Production/Preview) |

Local AWS auth uses `AWS_PROFILE=portfolio`. Do not put access keys in `.env.local`.

See `NOVATECH_INTEGRATION_SETUP.md`.

### TaskFlow

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser publishable key (RLS-protected) |
| `SUPABASE_SECRET_KEY` | Server-only secret (never expose to the client) |

Realtime presence, conflict handling, and attachments use this same Supabase project. OAuth callback:

`http://localhost:3000/auth/callback`

See `TASKFLOW_INTEGRATION_SETUP.md`.

## Customize

| What | Where |
| --- | --- |
| Name, links, tagline | `lib/constants.ts` |
| Projects + homepage featured IDs | `lib/projectData.ts` |
| Motion tokens | `lib/animation.ts` |
| Theme colors | `app/globals.css` |
| Project images | `public/projects/` |
| Resume PDF | `public/Christopher_Kilo_Resume.pdf` |

## Pages

- `/` — Home (hero, featured applications carousel, writing, about, contact)
- `/projects` — Featured applications, Kilo Toolkit, graphic design
- `/projects/[id]` — Web case studies (Event Horizon, NovaTech, TaskFlow)
- `/projects/voltline`, `/projects/nightshift`, `/projects/signal-magazine` — Design case studies
- `/blog`, `/blog/[slug]` — Writing
- `/toolkit` — Kilo Toolkit diagnostics suite
- `/about`, `/resume`, `/contact`
- `/demos/event-horizon`, `/demos/novatech-solutions`, `/demos/taskflow` — Embedded apps (noindex)

## Event Horizon AWS (optional)

Infrastructure lives in `/infrastructure` and is managed with AWS CDK (CloudFormation). The default CLI profile for this account is `portfolio` in `us-east-2`. Reviewers do **not** need AWS credentials to run the portfolio UI.

```
Ticketmaster Discovery
        ↓
EventBridge Scheduler  (8 AM / 8 PM America/Chicago)
        ↓
Fargate worker (Docker, short-lived, no ECS Service)
        ↓
SQS  →  Lambda (UpdateItem)  →  DynamoDB
        ↓
Read-only Lambda Function URL
        ↓
Event Horizon UI
```

- **PostgreSQL / Prisma** — native events, reservations, inventory, users, favorites
- **DynamoDB** — external discovery events only (`provider` + `externalId`)
- **SSM SecureString** — Ticketmaster Consumer Key, injected into ECS at runtime
- **Scheduler** — starts the existing Fargate task; it does not replace the worker

See `infrastructure/README.md` for schedule inspection, IAM, and manual `run-task` notes.

## Features

- Sticky nav, command palette (`⌘K` / `Ctrl+K`), theme toggle
- Homepage featured carousel with clamped translation and accessible slides
- Blueprint background + custom cursor (motion values, reduced-motion aware)
- Embedded full-stack demos with real auth and persistence where configured
- Sitemap, robots, and per-route canonical metadata
- Reduced-motion support, focus states, semantic HTML
