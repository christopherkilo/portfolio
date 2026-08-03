# Premium Developer Portfolio

Production-ready portfolio built with Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, and Lucide React.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

### Environment setup

1. Copy `.env.example` to `.env.local`
2. Fill real values in `.env.local` only (this file is gitignored)
3. Never commit secrets into `.env.example` or the repository

NovaTech upcoming / live integrations (values only in `.env.local`):

| Variable | Purpose | Source |
|----------|---------|--------|
| `NEXT_PUBLIC_APP_URL` | Public app URL | Local or deployed origin |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot Private App | HubSpot Private Apps |
| `HUBSPOT_PIPELINE_ID` / `HUBSPOT_DEAL_STAGE_ID` | Deal pipeline/stage | HubSpot deal settings |
| `RESEND_API_KEY` | Transactional email | Resend dashboard |
| `NOVATECH_FROM_EMAIL` / `NOVATECH_STAFF_EMAIL` | From + staff notify | Resend + your inbox |
| `TURNSTILE_SECRET_KEY` | Spam protection (server) | Cloudflare Turnstile |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Spam protection (client) | Cloudflare Turnstile |

See `NOVATECH_INTEGRATION_SETUP.md` and `NOVATECH_BACKEND_ARCHITECTURE.md`.

TaskFlow upcoming Supabase placeholders (empty until backend phase; values only in `.env.local`):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser publishable key (RLS-protected) |
| `SUPABASE_SECRET_KEY` | Server-only secret (never commit) |

See `TASKFLOW_INTEGRATION_SETUP.md`.

## Customize

| What | Where |
| --- | --- |
| Name, links, tagline | `lib/constants.ts` |
| Projects (web + design + toolkit modules) | `lib/projectData.ts` |
| Motion tokens | `lib/animation.ts` |
| Theme colors | `app/globals.css` |
| Project images | `public/projects/` |
| Resume PDF | `public/resume.pdf` |

## Pages

- `/` — Home (hero, featured web apps, about, contact)
- `/projects` — Web applications + graphic design grids (shared `ProjectCard`)
- `/toolkit/*` — Kilo Toolkit diagnostics suite
- `/about` — Roles and biography
- `/contact` — Links + contact form
- `/lab` — Permanent redirect → `/projects`

## Features

- Sticky nav + animated mobile menu
- Command palette (`⌘K` / `Ctrl+K`)
- Scroll progress bar
- Blueprint background with subtle motion
- Drag / snap / autoplay project carousels
- Shared 3D tilt `ProjectCard` (carousel + grid variants)
- Kilo Toolkit interactive diagnostics
- Reduced-motion support, focus states, semantic HTML
