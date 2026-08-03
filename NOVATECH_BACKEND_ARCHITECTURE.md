# NovaTech Backend Architecture

Interview-oriented notes for the inquiry backend behind `/demos/novatech-solutions`.

## ELI15

The form asks, Next.js receives, Zod checks, Turnstile guards, HubSpot remembers, Resend emails, and React confirms.

## Why Next.js Route Handlers

NovaTech already lives in the App Router portfolio. A Route Handler keeps the mutation on the same origin, hides provider secrets on the server, and reuses the shared TypeScript/Zod contract without introducing a separate backend service for this demo.

## Why HubSpot instead of PostgreSQL

The product goal is a **CRM-shaped lead workflow**, not a custom database. HubSpot stores contacts and deals the way an MSP sales process would. Adding Postgres/Prisma here would duplicate Event Horizon’s data layer without teaching CRM integration skills.

## Why Turnstile must be verified on the server

The browser widget alone is not a security control. Tokens must be checked with Cloudflare’s Siteverify endpoint using `TURNSTILE_SECRET_KEY`. Failed verification blocks HubSpot and Resend entirely.

## Why Zod even with TypeScript

TypeScript disappears at runtime. Zod validates JSON from the network, normalizes email casing, enforces enums/message limits, and rejects unknown authoritative CRM fields the browser must never set.

## Contact vs deal

- **Contact** = the person (upserted by email).
- **Deal** = this consultation opportunity (always created for a new submission).
- Associations link the deal to the contact.

## Company-handling decision

Company **objects are not created** in v1. The submitted company name is stored on the contact’s standard `company` property to avoid reckless duplicates from spelling variants.

## CRM notes

Inquiry details that are not standard deal properties are written into an associated HubSpot note (service, size, urgency, environment, message, submission id, timestamp). Turnstile tokens and internal request metadata are omitted.

## Why Resend is separate from HubSpot

HubSpot is the system of record for the lead. Resend owns transactional email delivery and templates. Separating them keeps CRM success authoritative when email delivery is flaky.

## Service-layer responsibilities

`server/novatech/services/inquiryService.ts` coordinates:

1. Duplicate-submission guard  
2. Turnstile verification  
3. Mapping / normalization  
4. HubSpot upsert + deal + note  
5. Resend emails  
6. Partial-success result  

The Route Handler stays thin: Content-Type, JSON parse, Zod, rate limit, HTTP mapping.

## Partial-success policy

- HubSpot failure → overall failure (no emails).  
- HubSpot success + email failure → HTTP 201 with `emailSent: false`.  
- Never create another CRM record just because email failed.

## Rate-limit limitation

In-memory limiter (5 submissions / 15 minutes / IP). **Instance-local only** — not sufficient as the sole control for multi-instance production. Designed to be replaced by Upstash Redis, Cloudflare, or another distributed limiter later.

## Duplicate-submission limitation

Client `crypto.randomUUID()` + server in-memory TTL map + CRM note tagging. This is **best-effort**, not exact-once across instances or restarts. Do not claim durable idempotency without shared storage.

## Privacy and secrets

Server-only: `HUBSPOT_ACCESS_TOKEN`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `NOVATECH_STAFF_EMAIL`, pipeline/stage IDs.  
Client-visible: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_APP_URL`.  
Logs never include tokens, API keys, full inquiry bodies, or visitor messages.

## Request correlation IDs

**ELI15:** A request ID is like a tracking number attached to one inquiry trip. Every backend service writes that same number in its notes, so a developer can follow what happened without exposing the visitor’s private information.

| ID | Purpose |
|----|---------|
| `requestId` | One HTTP request; returned as `x-request-id`; used to correlate logs |
| `submissionId` | One user submit attempt; prevents duplicate CRM writes |

Incoming `x-request-id` is accepted only if it is a strict UUID; otherwise the server generates a new one. It is **not** a security token.

Error JSON may include `requestId` for support. Responses always set `x-request-id` and `Cache-Control: no-store`.

## Structured logging

`server/novatech/logger.ts` emits JSON lines with allowlisted fields (`event`, `level`, `requestId`, `submissionId`, `integration`, `durationMs`, …).

Named events include `inquiry.request.received`, `turnstile.verification.*`, `hubspot.contact.upsert.*`, `hubspot.deal.create.succeeded`, `resend.*.succeeded`, `inquiry.completed`, `inquiry.partial_success`, `inquiry.failed`.

**Never logged:** tokens, API keys, Turnstile responses, full emails/phones, visitor messages, raw provider bodies, cookies, Authorization headers.

**Timing:** total workflow, Turnstile, HubSpot, and Resend durations via `durationMs`.

**Error logging strategy:** integrations/service log once and set `alreadyLogged` on typed errors; the Route Handler logs only unexpected failures that were not already recorded. Stack traces appear in development only.

**Limitation:** this is console JSON logging for a portfolio demo — not Sentry/Datadog/OpenTelemetry. Search logs by `requestId` when debugging.

## Structure

```
app/api/novatech/inquiries/route.ts
server/novatech/
  env.ts
  errors.ts
  http.ts
  logger.ts
  requestId.ts
  rateLimit.ts
  duplicateGuard.ts
  services/inquiryService.ts
  integrations/{turnstile,hubspot,resend}.ts
  mappers/inquiryMapper.ts
lib/demos/novatech/inquiry/   # shared schema + client adapter
```

See also: `NOVATECH_INTEGRATION_SETUP.md`, `NOVATECH_TECHNICAL_OVERVIEW.md`.
