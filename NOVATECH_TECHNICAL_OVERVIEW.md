# NovaTech Solutions — Technical Overview

Interview-oriented notes for the fictional MSP marketing demo at `/demos/novatech-solutions`.

## Project purpose

NovaTech Solutions is a **frontend-complete** managed IT marketing-site demo embedded in the portfolio. It shows how a B2B technology provider site can present services, illustrative work, FAQs, and a production-shaped consultation inquiry—without claiming to be a real operating company.

## Next.js routing

App Router routes under `app/demos/novatech-solutions`:

| Route | Role |
|------|------|
| `/` | Homepage hierarchy |
| `/about` | Operating principles |
| `/services` | Service overview + comparison |
| `/services/[serviceId]` | Static service detail pages |
| `/portfolio` | Filtered illustrative case studies |
| `/faq` | Accordion FAQ |
| `/contact` | Consultation inquiry form |
| `loading.tsx` / `error.tsx` / `not-found.tsx` | Branded recovery UX |

All demo pages set `robots: noindex, nofollow` via layout inheritance or page metadata. Dynamic service `generateMetadata` also sets `robots: { index: false, follow: false }` explicitly for valid unique titles and the invalid-service fallback.

## Server and Client Component decisions

**Server Components (default):** route pages, `SiteShell`, `Footer`, `Breadcrumbs`, `CtaBand`, `ContactSidebar`.

**Client Components:** interaction and motion islands only—`Navbar`, `MobileMenu`, `ThemeToggle`, `Hero`, `ServiceCards`, `Testimonials`, `SectionHeader`, `Reveal`, `Button`, `Accordion`, `PortfolioExplorer`, `ContactForm` / inquiry fields / status.

## TypeScript models

- `SERVICES` — rich service content for cards + detail pages
- `PORTFOLIO_ITEMS` — illustrative engagements with `serviceId`
- Inquiry unions — service, company size, urgency, contact method (`lib/demos/novatech/inquiry`)

## Tailwind design system

Scoped tokens under `[data-demo="novatech"]` in `app/demos/demos.css` (light/dark). Utility classes: `.gradient-hero`, `.gradient-band`, `.map-grid`. Focus-visible and reduced-motion rules mirror Event Horizon for keyboard and motion comfort.

## Framer Motion

Used for entrance stagger, hover lift, accordion expand, and mobile menu. `MotionProvider` sets `reducedMotion="user"`. Components that animate also check `useReducedMotion` explicitly where hover/stagger would otherwise persist.

## Service-route generation

`generateStaticParams` + `generateMetadata` for six service IDs. Invalid IDs call `notFound()`. Metadata never claims a real operating business and does not invent Open Graph images.

## Portfolio filtering

URL-synced category filters (`?category=`), result counts, accessible `aria-pressed` controls, restrained transitions. Invalid categories (and literal `?category=all`) canonicalize to `/portfolio` with `router.replace({ scroll: false })` so Back/Forward stay sensible and no replace loop occurs. Matching is case-sensitive.

## URL-based service selection

`contactHref(serviceId)` → `/contact?service=…` → `resolveInquiryServiceParam()` (invalid/missing → `not-sure`). Optional `preserveParams` keeps unrelated keys such as `demoResult` when the service changes. Back/Forward keep selection in sync because the URL is the source of truth.

## Form architecture

`ContactForm` orchestrates `InquiryFields`, status banners, and `ContactSidebar`. Values stay controlled so failure preserves input. Suspense uses `ContactFormSkeleton` to approximate final layout dimensions (`aria-busy`, screen-reader loading text, `motion-safe` pulse).

## Zod validation

`inquirySchema` validates on the client and is shaped for later server reuse. TypeScript types alone do not protect runtime FormData.

## Inquiry submission boundary

`submitInquiry()` posts to `POST /api/novatech/inquiries` with a Turnstile token and client `submissionId`. The server returns safe success/error payloads; personal data is not logged.

### Observability

- Every response includes `x-request-id` (generated or accepted UUID).
- `requestId` traces one HTTP request across Turnstile → HubSpot → Resend logs.
- `submissionId` remains separate for duplicate protection.
- Structured JSON logs live in `server/novatech/logger.ts` (console only — not a full monitoring platform).

### Development-only failure path

- `/contact?demoResult=failure` (development; ignored in production unless env is set)
- `NEXT_PUBLIC_NOVATECH_DEMO_RESULT=failure` (intentional configuration)
- Coexists with `?service=…`; no visible toggle; off by default

## Mobile menu accessibility

Backdrop is a non-focusable overlay (`aria-hidden` + click handler). Focus trap, Escape, focus restoration, body scroll lock, and dialog labelling remain on the panel.

## Future backend plan

1. Keep `inquirySchema` / `inquiryApiRequestSchema` as the shared contract  
2. Route Handler: `POST /api/novatech/inquiries`  
3. Service layer: Turnstile → HubSpot → Resend  
4. Preserve fictional-company disclosures in the UI  

**Implemented:** HubSpot + Resend + Turnstile inquiry backend. See `NOVATECH_BACKEND_ARCHITECTURE.md` and `NOVATECH_INTEGRATION_SETUP.md`.

## Environment configuration

Copy `.env.example` → `.env.local` and set real values **only** in `.env.local` (gitignored). Do not commit secrets.

| Variable | Used for | Where it comes from |
|----------|----------|---------------------|
| `NEXT_PUBLIC_APP_URL` | Canonical public app URL (email links) | Local or deployed origin |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot Private App CRM writes | HubSpot Private Apps |
| `HUBSPOT_PIPELINE_ID` / `HUBSPOT_DEAL_STAGE_ID` | Deal placement | HubSpot deal pipelines |
| `RESEND_API_KEY` | Transactional email | Resend dashboard |
| `NOVATECH_FROM_EMAIL` | From address | Verified Resend sender/domain |
| `NOVATECH_STAFF_EMAIL` | Staff notification recipient | Your inbox |
| `TURNSTILE_SECRET_KEY` | Server-side Turnstile verification | Cloudflare Turnstile |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Client Turnstile widget | Cloudflare Turnstile (public) |
| `NOVATECH_ALLOW_TURNSTILE_DEV_BYPASS` | Local mock token acceptance | Dev only — never in production |

See also: `NOVATECH_FRONTEND_ARCHITECTURE.md`, `NOVATECH_BACKEND_ARCHITECTURE.md`, `NOVATECH_INTEGRATION_SETUP.md`, `NOVATECH_INTERVIEW_GUIDE.md`, `NOVATECH_FRONTEND_REVIEW.md`.
