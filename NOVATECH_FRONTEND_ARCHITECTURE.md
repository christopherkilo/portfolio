# NovaTech Solutions — Frontend Architecture

Interview-oriented notes for the fictional MSP marketing demo at `/demos/novatech-solutions`.

## Current site architecture

```
App Router pages (novatech-solutions/*)
        ↓
Reusable demo components (components/demos/novatech/*)
        ↓
Typed content + inquiry helpers (lib/demos/novatech/*)
```

- Next.js App Router, React, TypeScript, Tailwind, Framer Motion, Lucide
- Scoped theme tokens under `[data-demo="novatech"]` in `app/demos/demos.css`
- No NovaTech backend, CRM, email, auth, analytics, or database in this phase

## Service routing

- Overview: `/demos/novatech-solutions/services`
- Detail pages: `/demos/novatech-solutions/services/[serviceId]`
- Static generation via `generateStaticParams` for:
  - `managed-it`
  - `computer-repair`
  - `networking`
  - `cybersecurity`
  - `website-development`
  - `cloud-solutions`
- Invalid IDs call `notFound()` and render the branded NovaTech not-found page
- Service content lives in the typed `SERVICES` model (`lib/demos/novatech/constants.ts`)

## Portfolio filtering

- `/demos/novatech-solutions/portfolio`
- Client filter UI with URL sync: `?category=Networking`
- Result count, active filter state, and “All projects” reset
- Portfolio items link to related service detail pages through `serviceId`
- Unsupported or literal `all` category values display every project and `router.replace` to the canonical `/portfolio` URL (`scroll: false`, no replace loop). Category matching is case-sensitive.

## Contact / consultation path

```
Service / CTA / Portfolio
   ↓  contactHref(serviceId)
/contact?service=cybersecurity
   ↓  resolveInquiryServiceParam()
Preselected inquiry form
   ↓  Zod validateInquiry()
Demo submitInquiry() adapter
   ↓
Success confirmation (nothing sent/stored)
```

Supported entry points reuse the same CTA vocabulary (`Request a consultation`) and `contactHref()` helper from homepage, services overview, service detail, portfolio, FAQ, and CTA band.

`contactHref(service, { preserveParams })` keeps unrelated query keys (such as `demoResult`) when the selected service changes.

## Contact Suspense skeleton

`ContactFormSkeleton` mirrors header, consultation-context, fields, action row, sidebar cards, and map placeholder dimensions (single-column mobile / two-column desktop). It sets `aria-busy`, includes screen-reader loading text, and uses `motion-safe:animate-pulse` only when reduced motion is not requested.

## Development-only failure testing

To exercise the existing failure UI without editing source:

- URL: `/demos/novatech-solutions/contact?demoResult=failure`
- Combined: `?service=cybersecurity&demoResult=failure`
- Env: `NEXT_PUBLIC_NOVATECH_DEMO_RESULT=failure`

Production builds ignore the URL param unless the env var is intentionally set. There is no visible test toggle. Forced failure is off by default. Inquiry payloads are still never sent, logged, or stored.

## Mobile menu backdrop

The full-screen backdrop is a non-focusable `div` (`aria-hidden`) with click-to-close. Focus stays trapped inside the labelled dialog; Escape, restoration to the menu button, and body-scroll locking are unchanged.

## Metadata indexing policy

Layout and key routes set `robots: { index: false, follow: false }`. Dynamic service `generateMetadata` repeats that policy for both valid unique titles/descriptions and the invalid “Service not found” fallback so deep routes never imply a real operating business.

## Contact data model

Typed inquiry fields (`lib/demos/novatech/inquiry/types.ts`):

- `name`, `businessEmail`, `phone`, `company`, `jobTitle`
- `selectedService` (`managed-it` … `cloud-solutions` | `not-sure`)
- `companySize`, `currentEnvironment`, `urgency`
- `preferredContactMethod`, `message`, `consent`

Controlled unions keep later API contracts explicit. The form never asks for passwords, financial details, medical data, or security secrets.

## Zod frontend validation

- Schema: `lib/demos/novatech/inquiry/schema.ts` → `inquirySchema`
- `validateInquiry()` returns field errors + a form-level summary
- Same schema is intended for future server-side reuse (Route Handler / server action)
- URL service resolution: valid service IDs preselect; missing/invalid values fall back to `not-sure`

## Submission adapter

`lib/demos/novatech/inquiry/submitInquiry.ts` is the integration boundary.

Current demo adapter guarantees:

- no network requests
- no personal-data storage
- no payload logging
- typed success / retryable failure results
- optional `forceFailure` via development helpers (`?demoResult=failure` / `NEXT_PUBLIC_NOVATECH_DEMO_RESULT`) — not a visible production UI control

Later, replace the adapter body with a real API call without rewriting the Contact form UX.

## Why no personal data is sent or stored

NovaTech is a portfolio demonstration. The inquiry UI is intentionally production-shaped so backend work can plug in cleanly, but the demo adapter validates locally and discards the payload. Success copy states clearly that nothing was sent, stored, or ticketed.

## Future backend integration points

1. Keep `inquirySchema` as the shared contract
2. Swap `submitInquiry` to `POST /api/novatech/inquiry` (or a server action)
3. Add rate limiting, spam controls, and secure storage only in that backend phase
4. Optionally add email/CRM delivery after the API exists
5. Preserve fictional-company disclosures in the UI even after real wiring

### Environment placeholders (inquiry backend)

`.env.example` documents placeholders for NovaTech integrations. Put real values only in `.env.local`. See `NOVATECH_INTEGRATION_SETUP.md`.

| Variable | Purpose | Source |
|----------|---------|--------|
| `NEXT_PUBLIC_APP_URL` | Public app origin | Local or deployed site URL |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot Private App token | HubSpot Private Apps |
| `HUBSPOT_PIPELINE_ID` / `HUBSPOT_DEAL_STAGE_ID` | Deal placement | HubSpot pipelines |
| `RESEND_API_KEY` | Resend email API | Resend dashboard |
| `NOVATECH_FROM_EMAIL` / `NOVATECH_STAFF_EMAIL` | From + staff inbox | Resend + your email |
| `TURNSTILE_SECRET_KEY` | Turnstile server verify | Cloudflare Turnstile |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile client widget | Cloudflare Turnstile (public) |

API: `POST /api/novatech/inquiries`. Architecture: `NOVATECH_BACKEND_ARCHITECTURE.md`.

## Related UI modules

- `components/demos/novatech/home/ContactForm.tsx` — orchestrator
- `components/demos/novatech/contact/InquiryFields.tsx` — field groups
- `components/demos/novatech/contact/FormStatus.tsx` — pending / error / success
- `components/demos/novatech/contact/ContactSidebar.tsx` — fictional contact/process/FAQ context
