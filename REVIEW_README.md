# Christopher Kilo Portfolio — Review Package

## 1. Project name
Christopher Kilo Portfolio (`portfolio`)

## 2. Portfolio purpose
A personal professional portfolio showcasing work across three disciplines:
- Web applications (Event Horizon, NovaTech Solutions, TaskFlow, Kilo Toolkit)
- Graphic design (Voltline, NightShift, Signal Magazine)
- IT diagnostics suite (Kilo Toolkit modules: SystemScope, MemoryMedic, NetCheck)

## 3. Technology stack
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4 (`@tailwindcss/postcss`)
- Framer Motion
- Lucide React
- Recharts (toolkit + Signal Magazine charts)
- Zod (toolkit validation)
- Vitest (toolkit unit tests)

No Pages Router. No separate `src/` directory (app-rooted).

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

## 7. Production build command
```bash
npm run build
npm start
```

## 8. Main folder structure
```
app/                 # App Router pages, layouts, globals.css
components/
  home/              # Hero, FeaturedProjects carousel, previews
  layout/            # Navbar, Footer, SiteShell
  projects/          # Case studies (voltline, nightshift, signal) + shared chrome
  toolkit/           # Kilo Toolkit UI + providers context
  ui/                # Card, Button, Shimmer, Carousel, Badge, etc.
  shared/            # Reveal, CommandPalette, cursor, scroll progress
contexts/            # Theme context
lib/
  projectData.ts     # Central project metadata for cards
  caseStudies.ts     # Web project case-study content + charts
  constants.ts       # Site identity, nav, tech badges
  voltline|nightshift|signal/  # Design case-study content
  toolkit/           # Mock diagnostics providers + tests
public/              # SVG covers, logos, mock assets
```

## 9. Important routes
| Route | Purpose |
|-------|---------|
| `/` | Homepage (hero + featured carousel) |
| `/projects` | Full projects index by category |
| `/projects/event-horizon` | Web case study (dynamic `[id]`) |
| `/projects/novatech-solutions` | Web case study |
| `/projects/taskflow` | Web case study |
| `/projects/voltline` | Brand identity case study |
| `/projects/nightshift` | Campaign case study |
| `/projects/signal-magazine` | Editorial case study |
| `/toolkit/*` | Kilo Toolkit modules |
| `/about`, `/contact` | Supporting pages |
| `/lab` | Redirects permanently to `/projects` |

## 10. Where project-card data is stored
`lib/projectData.ts` — `projects` array, categories, `getProjectHref()`, `getHomepageFeaturedProjects()`.

Web long-form case studies: `lib/caseStudies.ts` consumed by `app/projects/[id]/page.tsx`.

## 11. Where the homepage carousel is implemented
- `components/home/FeaturedProject.tsx` — four featured web applications
- `components/ui/Carousel.tsx` — motion carousel
- `components/ui/Card.tsx` — shared `ProjectCard` (`carousel` + `grid` variants)

Homepage wiring: `app/page.tsx`
Projects page grid: `app/projects/page.tsx` (same `ProjectCard`)

## 12. Where the hero code panels and floating labels are implemented
`components/home/Hero.tsx`
- Code panels: terminal, editor.tsx, diagnostics, status chip
- Floating labels: typed `floatingLabels` slot map with collision-safe gutters

## 13. Where the shimmer effect is implemented
- Component: `components/ui/Shimmer.tsx`
- Styles: `app/globals.css` (`.shimmer-host`, `.shimmer-beam`, `.shimmer-beam--active`)
- Used on GitHub card buttons and primary GitHub CTAs via `Button` / card wrappers

## 14. Known issues / review focus
Please verify (do not assume fixed without checking the running app):

1. Web project cards previously failed to open (Turbopack root / module resolution was implicated)
2. Project routes and slugs should match `projectData` + `caseStudies` / static design routes
3. Homepage should contain **one** featured carousel with **one** project from each category
4. Homepage cards should be fully clickable
5. Small GitHub buttons should appear when `project.github` exists
6. GitHub buttons should retain electric-yellow hover shimmer
7. Floating labels around hero code panels must never cover code text
8. Responsive behavior across desktop / tablet / mobile
9. TypeScript, hydration, and console errors
10. Lint currently reports React hooks/`setState`-in-effect issues (see `REVIEW_STATUS.md`)

## 15. Simulated or placeholder content
- Design case studies (Voltline, NightShift, Signal) use composed SVG/CSS mockups; many image paths are replaceable assets under `public/projects/*/images|mockups`
- Kilo Toolkit uses mock providers (`lib/toolkit/providers/mock-providers.ts`) — Demo Mode diagnostics, not live hardware
- Web demos (Event Horizon / NovaTech / TaskFlow) are separate local apps; portfolio links to `localhost:3001–3003` when those demos run
- Contact form is UI-only (no backend mailer)
- About portrait uses a placeholder asset when present under `public/about/`

## 16. Environment variables
No `.env` files are required to run the portfolio as packaged.

Optional (documented in `.env.example`):
```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_CONTACT_EMAIL=
```
Site metadata currently uses a hardcoded `metadataBase` in `app/layout.tsx`. Public contact email / social URLs live in `lib/constants.ts`.

## 17. Intentionally excluded from this review ZIP
- `node_modules/`
- `.next/`
- `.git/`
- `.vercel/`, `.turbo/`, coverage, dist/build/out
- `.env*` (none present in source; secrets pattern excluded)
- `.DS_Store`, logs, `*.tsbuildinfo`
- `.vscode/`
- Nested review/output folders
- External sibling demo apps (`event-horizon`, `novatech-solutions`, `taskflow` on Desktop) — not part of this repo

## Upload instruction
Upload `christopher-kilo-portfolio-review.zip` to ChatGPT and ask it to review the codebase, routing, responsiveness, accessibility, and visual consistency.
