# NovaTech Solutions — Interview Guide

Short answers for discussing the fictional MSP demo. Pair with `NOVATECH_TECHNICAL_OVERVIEW.md`.

## Why Next.js?

**ELI15:** One framework that can render pages on the server and still add interactive pieces in the browser.

**Technical:** App Router colocates marketing pages, static service params, metadata, and future API routes in one deployable portfolio app without a separate frontend repo.

## Why React?

**ELI15:** Reusable UI building blocks that update when state changes.

**Technical:** Component composition for Navbar, service cards, inquiry fields, and status panels; Client Components only where hooks or browser APIs are required.

## Why TypeScript?

**ELI15:** Catch mistakes before the site goes live.

**Technical:** Typed `Service`, portfolio items, and inquiry unions prevent invalid service IDs and inconsistent CTA payloads across routes.

## Why Tailwind?

**ELI15:** Utility classes keep spacing and color consistent without hunting through CSS files.

**Technical:** Demo-scoped CSS variables map into Tailwind theme tokens so light/dark themes stay coherent without a second CSS architecture.

## Why not Bootstrap?

**ELI15:** Bootstrap brings a whole look; this demo needed a custom MSP identity.

**Technical:** Avoiding Bootstrap’s component/CSS coupling keeps the design token system and Framer Motion interactions freer and lighter for an embedded portfolio demo.

## Why use service-detail routes?

**ELI15:** Visitors can open one service and learn deeply without scrolling a giant homepage.

**Technical:** Static `[serviceId]` routes improve information architecture, shareable URLs, and metadata while keeping content in one typed `SERVICES` model.

## Why put selected service in the URL?

**ELI15:** So the consultation page remembers what you clicked, even if you refresh or use Back.

**Technical:** `?service=` makes preselection bookmarkable, testable, and resilient across navigation without hidden client-only state.

## Why Zod if TypeScript already exists?

**ELI15:** TypeScript helps developers; Zod checks what users actually typed.

**Technical:** FormData and URL params are runtime values. Zod validates them and can be reused on a future server endpoint—types alone disappear at runtime.

## Why separate the form from its submission adapter?

**ELI15:** The form handles the experience; a small helper talks to the server.

**Technical:** `submitInquiry()` posts JSON to `POST /api/novatech/inquiries` with a Turnstile token and submission id. Validation UX stays in the client. Secrets stay on the server. AWS starts only after Turnstile.

## What happens on a real inquiry submission?

**ELI15:** The form asks, Next.js receives, Zod checks, Turnstile guards, then AWS takes the lead — HubSpot stores the CRM record and email goes out later through a queue.

**Technical:** Route Handler → Zod (`inquiryApiRequestSchema`) → Turnstile Siteverify → `states:StartExecution` → Step Functions (DynamoDB claim → HubSpot Lambda → SQS → notification Lambda → Resend) → `{ success, data: { inquiryId, accepted, selectedService } }` with HTTP 202. The HTTP request does not wait for HubSpot or Resend. `requestId` is one HTTP trace; `submissionId` is the durable idempotency key.

## What is a request correlation ID?

**ELI15:** A request ID is like a tracking number attached to one inquiry trip. Every backend service writes that same number in its notes, so a developer can follow what happened without exposing the visitor’s private information.

**Technical:** Accepted only as a strict UUID via `x-request-id`, otherwise generated. Used in logs and optional error JSON — never as a security token. Distinct from `submissionId`.

## Why is Turnstile in Next.js instead of inside Step Functions?

**ELI15:** Prove a human submitted the form before AWS spends any work.

**Technical:** A bot that skips the widget and POSTs JSON must not be able to StartExecution. The token is verified at ingress and never stored in DynamoDB, SQS, or execution input.

## Why doesn’t the API wait for HubSpot and email?

**ELI15:** The visitor should not sit on a spinner while CRM and mailboxes work.

**Technical:** After Turnstile and StartExecution, HTTP 202 means the workflow was accepted. HubSpot is still the CRM system of record; Resend is at-least-once via SQS. The UI says the request was received, not that email already sent.

## Why HubSpot instead of a database?

**ELI15:** This demo is about leads in a CRM, not inventing another spreadsheet in Postgres.

**Technical:** Contacts/deals match MSP sales workflows. Postgres would add ops without teaching CRM integration. Event Horizon already covers Prisma.

## How is NovaTech different from Event Horizon technically?

| | NovaTech | Event Horizon |
|--|----------|---------------|
| Domain | Fictional MSP marketing + inquiry | Event marketplace |
| Data authority | Static content + HubSpot CRM for inquiries | Prisma/Postgres + Auth.js REST |
| Auth | None | Google OAuth sessions |
| Persistence | HubSpot contacts/deals + DynamoDB workflow metadata | Favorites/reservations in DB |
| Primary teaching goal | B2B IA, lead-form + CRM/email integrations | Full-stack sessions, inventory, money-as-cents |

NovaTech includes a production-shaped inquiry backend: Next.js ingress, Turnstile, Step Functions, DynamoDB idempotency, HubSpot CRM, and asynchronous Resend via SQS. No end-user auth and no local inquiry database.
