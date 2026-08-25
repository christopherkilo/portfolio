# Christopher Kilo Portfolio — Review Package

> **Current quality status:** see [`REVIEW_SUMMARY.md`](./REVIEW_SUMMARY.md). That file is regenerated from the current source, not copied from an older pass.

## 1. Project name
Christopher Kilo Portfolio (`portfolio`)

## 2. Portfolio purpose
A personal professional portfolio showcasing work across three disciplines:

- Web applications (Event Horizon, NovaTech Solutions, TaskFlow, Kilo Toolkit)
- Graphic design (Voltline, NightShift, Signal Magazine)
- IT diagnostics suite (Kilo Toolkit modules)

## 3. Technology stack
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React
- Prisma + PostgreSQL (Event Horizon)
- Auth.js (Event Horizon)
- Supabase (TaskFlow)
- Vitest

No Pages Router. No separate `src/` directory.

## 4. Package manager
npm (`package-lock.json`)

## 5. Install command
```bash
npm install
```

## 6. Development command
```bash
npm run dev
```
Then open http://localhost:3000

## 7. Production build / verify
```bash
npm run build
npm start

# lint → tsc → tests → production build (fails on first error)
npm run verify
```

## 8. Main folder structure
```
app/                 # App Router pages, layouts, globals.css, sitemap, robots
components/
  home/              # Hero, featured carousel, previews
  layout/            # Navbar, Footer, SiteShell
  projects/          # Case studies
  toolkit/           # Kilo Toolkit UI
  demos/             # Embedded Event Horizon / NovaTech / TaskFlow UI
  ui/                # Card, Button, Carousel, etc.
  shared/            # Blueprint background, cursor, command palette
lib/
  projectData.ts     # Project metadata + homepageFeaturedProjectIds
  caseStudies.ts     # Web case-study content
  constants.ts       # Site identity
  seo.ts             # Canonical / Open Graph helpers
  demos/             # Demo catalogs, discovery, TaskFlow/NovaTech clients
server/              # Event Horizon Prisma repositories + services
prisma/              # Schema, migrations, seed
public/              # SVG covers, logos, resume PDF
```

## 9. Important routes
| Route | Purpose |
|-------|---------|
| `/` | Homepage (hero + featured carousel) |
| `/projects` | Full projects index by category |
| `/projects/event-horizon` | Web case study |
| `/projects/novatech-solutions` | Web case study |
| `/projects/taskflow` | Web case study |
| `/projects/voltline` | Brand identity case study |
| `/projects/nightshift` | Campaign case study |
| `/projects/signal-magazine` | Editorial case study |
| `/demos/event-horizon` | Embedded Event Horizon app (noindex) |
| `/demos/novatech-solutions` | Embedded NovaTech app (noindex) |
| `/demos/taskflow` | Embedded TaskFlow app (noindex) |
| `/toolkit/*` | Kilo Toolkit modules |
| `/blog`, `/about`, `/resume`, `/contact` | Supporting pages |
| `/lab` | Redirects permanently to `/projects` |

## 10. Where project-card data is stored
`lib/projectData.ts` — `projects` array, categories, `homepageFeaturedProjectIds`, `getHomepageFeaturedProjects()`.

Web long-form case studies: `lib/caseStudies.ts` consumed by `app/projects/[id]/page.tsx`.

## 11. Homepage carousel
- `components/home/FeaturedProject.tsx` — four featured software applications
- `components/ui/Carousel.tsx` — motion carousel with clamped end-of-track translation
- `components/ui/Card.tsx` — shared `ProjectCard`

Graphic design remains on `/projects` and dedicated case-study routes. It is not required on the homepage carousel.

## 12. Hero name animation
`components/home/Hero.tsx` / `components/home/SignatureName.tsx`

The traveling yellow shimmer and KILO’s permanent electric-yellow end state are intentional. Do not treat that as a defect.

## 13. Environment variables
See `.env.example`. Copy to `.env.local` and fill real values there only.

Demos are embedded in this Next.js app. They do not require `localhost:3001`, `localhost:3002`, or `localhost:3003`.

## 14. Intentionally excluded from review ZIPs
- `node_modules/`, `.next/`, `.git/`
- `.env*` secrets (keep `.env.example`)
- caches, logs, coverage, OS junk files

## Upload instruction
Upload the latest `christopher-kilo-portfolio-gpt-review-*.zip` and ask for a review of routing, responsiveness, accessibility, demo correctness, and visual consistency.
