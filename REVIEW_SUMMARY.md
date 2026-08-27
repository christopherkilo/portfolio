# Portfolio Review Summary

Date: August 26, 2026

This file is the current review snapshot. It replaces older August 10 / August 24 figures and should be regenerated after material verification passes.

## Decisions

Location:  
**DeSoto, TX — CONFIRMED**

Contact:  
**mailto workflow — CONFIRMED / INTENTIONAL**

## Framework

Next.js App Router — **VERIFIED**

## Embedded demos

Event Horizon, NovaTech Solutions, and TaskFlow are served from this app at:

- `/demos/event-horizon`
- `/demos/novatech-solutions`
- `/demos/taskflow`

They do not require separate localhost ports.

## Case studies

Event Horizon — **VERIFIED** (AWS discovery pipeline documented; dual persistence)  
NovaTech Solutions — **VERIFIED**  
TaskFlow — **VERIFIED**  
Voltline / NightShift / Signal Magazine — **VERIFIED**

## Resume

Canonical resume (`/Christopher_Kilo_Resume.pdf`) — **VERIFIED**  
Location consistency (DeSoto, TX) — **VERIFIED**  
Cloud / AWS skill group + Event Horizon ingestion bullet — **VERIFIED**

## Navigation

Internal links (nav, footer, case studies, demos, toolkit) — **VERIFIED**  
External GitHub / LinkedIn use configured profile URLs — **VERIFIED**

## Contact / mailto

Button label: **Send via email**  
Recipient: `christopherkilo.pro@gmail.com`  
No false “email sent by website” claim — **VERIFIED**

## Event Horizon AWS (complete)

Ticketmaster Discovery → EventBridge Scheduler (8 AM / 8 PM America/Chicago) → ECS/Fargate one-off task → SQS → ingestion Lambda → DynamoDB → read-only Lambda Function URL → UI.

- PostgreSQL / Prisma remains transactional source of truth (native events, reservations, inventory, users, favorites).
- DynamoDB stores external discovery listings only (`provider` + `externalId`).
- Ticketmaster cards are outbound discovery links; they cannot enter Event Horizon reservations.
- Ticketmaster Consumer Key lives in SSM SecureString; not in git or the browser.
- UI degrades to the curated catalog when `NEXT_PUBLIC_EVENT_HORIZON_EXTERNAL_EVENTS_API` is absent.
- No NAT Gateway, no always-running ECS Service.
- Do **not** expand Event Horizon AWS further. Step Functions belongs to NovaTech later.

## Automated checks (August 26, 2026)

| Check | Result |
|-------|--------|
| `npm run lint` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm test` | **PASS** — 321 tests / 52 files |
| `npm run build` | **PASS** |
| `npm run verify` | **PASS** (lint → tsc → test → build) |
| `infrastructure` `npm test` | **PASS** — 60 tests / 4 suites |
| `infrastructure` `npm run build` | **PASS** |
| `infrastructure` `npm run synth` | **PASS** |

## Stabilization / Event Horizon notes

- Event Horizon seeded catalog lives in a deterministic September–November 2026 window.
- Discovery rails, browse filtering, and reservation validation share `isUpcomingEvent()`.
- Homepage carousel translation is clamped to `trackWidth - viewportWidth`.
- Visible carousel slides remain in the accessibility tree; off-screen slides use `inert` / `aria-hidden`.
- Homepage featured apps are an explicit ordered list: Event Horizon, NovaTech, TaskFlow, Kilo Toolkit.
- Root layout no longer assigns a sitewide canonical of `/`.
- `sitemap.ts`, `robots.ts`, and Open Graph / Twitter image routes were added. `/demos/*` stay noindex and off the sitemap.
- Pointer glow / custom cursor use motion values instead of per-move React state.
- CHRISTOPHER KILO signature animation was not modified.
- Event Horizon case study, résumé, project cards, and blog post (`/blog/taking-event-horizon-to-aws`) reflect the completed AWS architecture.
- Infrastructure lives under `/infrastructure` (CDK). Reviewers do not need AWS credentials to run the portfolio UI.

## Deployment status

**READY.** Event Horizon AWS ingestion is complete and should not be expanded. Next cloud phase is NovaTech (Step Functions), not more Event Horizon services.
