# Portfolio QA Report

Permanent QA record for [christopherkilo.com](https://www.christopherkilo.com). This is **not a redesign log**. Visual identity, structure, motion, branding, and project facts stay unless something is broken, inaccessible, inconsistent, or actively harming the visitor experience.

**Status:** PORTFOLIO QA — FINAL HARDENING COMPLETE  
**Audit date:** 2026-08-31  
**Repair Batch 1:** 2026-08-31  
**Final Hardening:** 2026-08-31  
**Auditor:** Cursor Grok 4.6  
**Branch / workspace:** `/Users/ckilo/Desktop/portfolio`  
**Primary git branch:** `main`

---

## FINAL STATUS

| Bucket | Count | Notes |
| --- | ---: | --- |
| **Critical** | 0 | — |
| **High** | 0 | All High items closed in Repair Batch 1 |
| **Medium** | 0 open | M06 fixed; M09/M11 no-fix; M16/M18 closed with automation/validation; M10 deferred |
| **Low** | 0 open in this phase | L01/L07/L12 fixed; L11 no-fix; L05 accepted |
| **Deferred** | 6 | M10 grid, L05 SVG, L06 Prisma, L09 analytics, L10 prev/next, real contact API / mobile Search |
| **Enhancements** | shipped | Playwright, axe, visual snapshots, GitHub Actions |

### Issues fixed (this phase)

- **QA-L12** — Short desktop hero: targeted `@media (min-width: 1024px) and (max-height: 700px)` spacing + illustration height. CTA in-view at 1024×600, 1280×600, 1440×600. Normal heights unchanged.
- **QA-L01** — Native cursor hidden only after custom cursor arms (`html.has-custom-cursor`), gated on `pointer: fine`, `hover: hover`, `min-width: 768px`, and not reduced-motion.
- **QA-M06** — Event Horizon and Kilo Toolkit GitHub URLs point at stable `portfolio` subdirectories (`tree/main/app/demos/event-horizon`, `tree/main/app/toolkit`) with “Source: portfolio monorepo” copy. No invented repos.
- **QA-M18** — DemoShell already returns to each case study + portfolio home; ToolkitShell already has “Back to portfolio”. Validated with unit + E2E. No chrome redesign.
- **QA-L07** — Deleted unused `public/about/portrait-placeholder.svg`.
- **QA-M16 / E01–E03** — Playwright (Chromium, Firefox, WebKit), axe, visual snapshots, `verify` workflow on `main` + pull requests.
- Light-theme small architecture labels: `.label-accent` uses `--secondary` in light theme so 10px/12px accents meet AA. Dark gold accents unchanged.

### Issues closed as no-fix-required

- **QA-M09** — Keep `overflow-x: clip`. With clip disabled for measurement, `scrollWidth` never exceeded `clientWidth` across 216 Chromium samples. Decorative overflow is the carousel/hero, not page scroll.
- **QA-M11** — Full `CHRISTOPHER KILO.` at 320px. Not reproduced. Wordmark unchanged.
- **QA-L11** — Light theme sufficiently differentiated in Chromium live QA. Not restyled.

### Deferred

- **QA-M10** — 2+1 tablet writing grid is acceptable. Do not force three narrow columns at 768px unless content growth requires it.
- **QA-L05** — `dangerouslyAllowSVG` accepted with CSP sandbox.
- **QA-L06** — Prisma `package.json#prisma` deprecation; wait for Prisma 7 upgrade.
- **QA-L09** — Analytics, optional.
- **QA-L10** — Project prev/next, optional.
- Real contact API, mobile command palette, ResolveOps, Event Horizon redesign — out of scope.

### Browser / viewport / automation

| Item | Result |
| --- | --- |
| Browser coverage | Playwright-managed Chromium, Firefox, WebKit |
| Viewport coverage | 390×844, 768×1024, 1440×900, 1440×600 (+ short-hero 1024/1280/1440×600) |
| Unit tests | **351** passed |
| Playwright | **69** passed (Chromium + Firefox + WebKit + visual) |
| Accessibility | Chromium axe: 0 serious/critical on `/`, `/about`, `/projects`, `/blog`, `/contact`, Event Horizon case study, EH AWS article. Firefox/WebKit run the same pages; `color-contrast` disabled there only (glass/backdrop-filter sampling). |
| Screenshot baselines | 11 Chromium viewport snapshots in `e2e/__screenshots__/` (macOS). Linux CI skips visual until Linux baselines exist. |
| CI | `.github/workflows/verify.yml` on `pull_request` and push to `main` |

### Commands used

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
npx playwright install chromium firefox webkit
npx playwright test
npx playwright test --update-snapshots   # visual baselines, once
```

### Files added

- `playwright.config.ts`
- `e2e/smoke.spec.ts`, `e2e/core.spec.ts`, `e2e/a11y.spec.ts`, `e2e/responsive.spec.ts`, `e2e/visual.spec.ts`
- `e2e/helpers/{console,visual,overflow,focus}.ts`
- `e2e/__screenshots__/*.png` (11)
- `.github/workflows/verify.yml`

### Files modified

- `components/home/Hero.tsx`, `app/globals.css`
- `components/shared/CustomCursor.tsx`
- `lib/projectData.ts`, `components/ui/Card.tsx`, `app/projects/[id]/page.tsx`
- `components/projects/ArchitectureDiagram.tsx`
- `lib/projectRouting.test.ts`, `lib/case-studies/event-horizon.presentation.test.ts`, `lib/demoRoutes.test.ts`
- `package.json`, `package-lock.json`, `vitest.config.ts`, `eslint.config.mjs`, `.gitignore`
- `README.md`

### Files deleted

- `public/about/portrait-placeholder.svg`

---

## Executive summary (after Repair Batch 1)

Authorized accessibility, metadata, contact, StarLenz listing, and performance fixes are in. Quality gates are clean: **0 ESLint errors/warnings**, TypeScript pass, **349 tests**, production build pass.

Homepage title is now `Christopher Kilo — Full-Stack Developer` (no `· Christopher Kilo` suffix).

Live Chromium matrix (216 page×viewport samples) found **no document-level horizontal overflow** (`scrollWidth === viewport`) when `overflow-x: clip` was temporarily disabled for measurement. The wordmark does **not** truncate at 320px. Short viewports (1024×600, 1440×600) push homepage hero CTAs below the fold. The three-card `md` grid leftover is confirmed.

| Severity | Open | Notes |
| --- | ---: | --- |
| Critical | 0 | — |
| High | 0 | All 7 High items from the initial audit are fixed |
| Medium | 5 | M06, M10 (held), M16, M18; M09 not hiding page overflow |
| Low | 8 | L01, L05–L07, L09–L12; L11/L12 held |
| Enhancement | 8 | Playwright/CI still deferred |
| Fixed this batch | 22 | See Repair Batch 1 |
| Cannot reproduce | 3 | LinkedIn curl 999; M11 wordmark truncation |

---

## Repair Batch 1 — implementation log

### Quality gates after the batch

| Check | Result |
| --- | --- |
| `npm run lint` | **Pass — 0 errors, 0 warnings** |
| `npx tsc --noEmit` | **Pass** |
| `npm test` | **Pass** — 54 files, **349 tests** |
| `npm run build` | **Pass** — Next.js 16.2.10, 91 pages |

### QA-H01 / QA-M12 — Contact mailto behavior — FIXED

- **Root cause:** Success checkmark + `form.reset()` ran immediately after assigning `mailto:`.
- **Implementation:** Status is now `handoff`, not delivery. Copy: “Your email app should now be open. Review and send the message from there.” Mail icon instead of checkmark. Form values retained. `maxLength`: name 100, email 254, message 2000. Validation unchanged. No backend.
- **Validation:** Code review of `ContactCTA.tsx`. Lint/tsc/test/build.

### QA-H02 — Page `h1` structure — FIXED

- **Root cause:** `SectionHeader` hardcoded `<h2>`.
- **Implementation:** `as?: "h1" | "h2"` (default `h2`). `h1` on `/about`, `/projects`, `/blog`, `/contact` (`ContactCTA headingAs`). Homepage contact stays `h2`. Project section titles remain `h2`; blog “Articles” `h2`; blog/project cards `h3`.
- **Validation:** Heading outline in Chromium: `/` → `CHRISTOPHER KILO`; `/blog` → `Notes from the work in progress`; 404 → `Page not found.`

### QA-H03 / QA-L02 — Mobile menu accessibility — FIXED

- **Root cause:** Overlay without focus move/trap/`aria-controls`.
- **Implementation:** Shared `lib/focusTrap.ts` + `lib/useDialogFocus.ts`. Menu is `role="dialog"` `aria-modal`. Hamburger `aria-controls="mobile-navigation"` + `aria-expanded`. Focus to close button; Tab cycles in the panel; Escape closes; focus restored; body scroll lock. Visual design unchanged.
- **Validation:** Code review. Lint/tsc.

### QA-H04 — StarLenz article placeholders — FIXED

- **Root cause:** Seven `placeholder:` figures in published markdown.
- **Implementation:** Removed those image lines only. Surrounding copy kept. No invented screenshots.
- **Validation:** `content` no longer matches `placeholder:starlenz` (unit test).

### QA-H05 — Reduced-motion headers — FIXED

- **Root cause:** `SectionHeader` and About stagger used `opacity: 0` initial without `useReducedMotion`.
- **Implementation:** Same fail-open pattern as `Reveal`: static markup when reduced motion is requested. Default motion unchanged.
- **Validation:** Code review vs `Reveal`.

### QA-H06 — Portrait optimization — FIXED

- **Root cause:** 1024×1024 PNG with alpha, 778,591 bytes.
- **Implementation:** Same raster, same crop, same alpha, no AI. Generated WebP + AVIF via `sharp`. About page `Image` src is `/about/portrait.webp`. Original PNG kept.

| Asset | Size | Alpha | Dimensions |
| --- | ---: | --- | --- |
| `portrait.png` (source) | 760.3 KB (778,591 B) | yes | 1024×1024 |
| `portrait.webp` (**in use**) | 65.6 KB (67,188 B) | yes | 1024×1024 |
| `portrait.avif` (available) | 18.8 KB (19,251 B) | yes | 1024×1024 |

WebP is **91.4% smaller**. AVIF is 97.5% smaller (not wired, kept for a later `<picture>` if wanted).

- **Validation:** `sharp` metadata (width/height/hasAlpha). About page points at WebP.

### QA-H07 — Homepage title — FIXED

- **Root cause:** String `title` under layout `title.template`.
- **Implementation:** `pageMetadata({ absoluteTitle: true })` → `{ absolute: "Christopher Kilo — Full-Stack Developer" }`. Other pages still use the template.
- **Validation:** Chromium `document.title` on `/` is `Christopher Kilo — Full-Stack Developer`. Unit test added.

### QA-M01 — Project card interactive semantics — FIXED

- **Root cause:** Full-card overlay `<Link>` plus sibling GitHub `<a>` (valid HTML, confusing dual hit target).
- **Implementation:** Primary navigation is a wrapping `<Link>` around cover + body (not an overlay). GitHub remains a **sibling** control, higher z-index, keyboard-accessible. Blog cards wrap in a single link. No visual redesign.
- **Validation:** Code review of `Card.tsx` / `BlogCard.tsx`. Build pass.

### QA-M02 — Command palette accessibility — FIXED

- **Root cause:** `listbox`/`option` wrapping buttons; no trap/scroll lock.
- **Implementation:** Dialog on the panel; menu of buttons; `aria-current` for the highlighted row; `useDialogFocus` trap/Escape/restore/scroll lock. Desktop Search unchanged. No mobile Search entry (deferred).
- **Validation:** Code review. (Also closes QA-L08.)

### QA-M03 — Lightbox accessibility — FIXED

- **Root cause:** Escape + initial focus only.
- **Implementation:** Same `useDialogFocus` as the mobile menu. Dialog semantics on the panel. Visual lightbox unchanged.
- **Validation:** Code review.

### QA-M04 — Branded 404 — FIXED

- **Root cause:** Missing `app/not-found.tsx`.
- **Implementation:** Minimal page using existing `Button`, display type, and `SiteShell` chrome: “404 / Page not found. / Back Home / View Projects”.
- **Validation:** Chromium `/not-a-real-page` → title `Page not found · Christopher Kilo`, h1 `Page not found.`, home link present.

### QA-M05 — StarLenz on `/projects` — FIXED

- **Root cause:** In sitemap and reachable, omitted from `getPortfolioProjects()`.
- **Implementation:** Portfolio-visible web project using existing StarLenz copy/tech from the in-dev page, existing `StarLenzBlogCover`, `inDevelopment` + existing `InDevBadge`. Not added to the homepage featured carousel. Facts not invented.
- **Validation:** `projectRouting.test.ts` updated. Build lists `/projects/starlenz`.

### QA-M07 — Footer GitHub / LinkedIn — FIXED

- **Root cause:** Footer only exposed email.
- **Implementation:** Same `SITE.github` / `SITE.linkedin` URLs as Contact, footer text style, `rel="noopener noreferrer"`.
- **Validation:** Code review.

### QA-M08 — Button reduced motion — FIXED

- **Root cause:** Unconditional `whileHover` / `whileTap`.
- **Implementation:** Disabled when `useReducedMotion()`. Default users unchanged.
- **Validation:** Code review.

### QA-M13 — Blog OG metadata — FIXED

- **Root cause:** `generateMetadata` replaced `openGraph`/`twitter` and dropped inherited fields.
- **Implementation:** Spread `pageMetadata()` results, then add article fields.
- **Validation:** Code review.

### QA-M14 — Meta description — FIXED

- **Root cause:** Description omitted AWS despite shipped case studies.
- **Implementation:** Added AWS to `SITE.description` (and keywords). No extra claims.
- **Validation:** Constants + layout keywords.

### QA-M15 — ESLint warnings — FIXED

- **Root cause:** Unused `dealCreates` and unused parsed `body`.
- **Implementation:** Removed unused bindings. Rules left on.
- **Validation:** `npm run lint` — 0 problems.

### QA-M17 — Offscreen hero animation — FIXED

- **Root cause:** Infinite Framer loops while the hero stayed mounted.
- **Implementation:** `useInView` on the hero section (`amount: 0.2`). Panels, labels, and status chip rest at `y: 0` when off-screen and resume when back. Animation not removed.
- **Validation:** Code review.

### QA-L03 — Invalid blog tag — FIXED

- **Root cause:** Unknown `?tag=` fell through to all posts.
- **Implementation:** Unknown tags show an empty state that names the query and links to All posts. Tag chips keep the invalid query (All is not selected).
- **Validation:** Code review of `app/blog/page.tsx`.

### QA-L04 — Theme toggle — FIXED

- **Root cause:** No pressed state.
- **Implementation:** `aria-pressed={theme === "dark"}`. Visual unchanged.
- **Validation:** Code review.

---

## Live viewport matrix (Chromium, production `next start`)

**Method:** Headless Google Chrome + Puppeteer. For each sample, `overflow-x` on `html`/`body` was set to `visible` **only inside the measurement**, then `documentElement.scrollWidth` vs `innerWidth` was recorded. Off-canvas carousel cards and decorative absolutely positioned blobs were listed separately via `getBoundingClientRect` and **do not** count as page overflow when `scrollWidth` matches the viewport.

**Routes (12):** `/`, `/projects`, `/projects/event-horizon`, `/projects/novatech-solutions`, `/projects/taskflow`, `/projects/starlenz`, `/projects/voltline`, `/blog`, `/blog/building-starlenz`, `/about`, `/resume`, `/contact`

**Viewports (18):** 320×568, 360×640, 375×667, 390×844, 414×896, 430×932, 540×720, 768×1024, 820×1180, 900×700, 1024×768, 1280×720, 1440×900, 1728×1117, 1920×1080, plus short 1440×600, 1024×600, 768×600.

**Samples:** 216. **Navigation errors:** 0. **Document horizontal overflow (`scrollWidth > innerWidth + 2`):** 0.

| Viewport | Page overflow | Wordmark truncated | Notes |
| --- | --- | --- | --- |
| 320×568 | none | no (`CHRISTOPHER KILO.` 147px) | Hero CTAs in view |
| 360×640 … 540×720 | none | no | — |
| 768×1024 | none | no | Latest Writing / blog = **2 columns, 3 cards** (leftover) |
| 820×1180 | none | no | — |
| 900×700 | none | no | Same 2-col leftover (`414px 414px`) |
| 1024×768 | none | no | Writing becomes 3 columns |
| 1280×720+ | none | no | Title correct; writing 3-col |
| 1440×600 | none | no | **Hero “View Projects” below the fold** |
| 1024×600 | none | no | **Hero CTAs below the fold** |
| 768×600 | none | no | Hero CTAs in view |

Carousel cards extending past the right edge (e.g. 340px `shrink-0` track items) and a decorative `absolute -right-14` blob are **in-track / decorative**, not page scroll.

### Held visual items — conclusions

**QA-M09 — `body { overflow-x: clip }`:** Do **not** remove. Across 216 samples, `scrollWidth` never exceeded the viewport with clip disabled. Clip is not masking a real page scrollbar. Apparent “overflowing” children are the featured carousel’s off-screen slides and decorative absolute fills.

**QA-M10 — three-card grid at `md`:** **Confirmed.** At 768 and 900, `#writing` / blog grids compute two columns (`348px 348px` / `414px 414px`) with 3 children. The third card sits alone. At `lg` (1024+) it is three equal columns. StarLenz as a fourth web card on `/projects` will similarly leave one card on the last row at `xl:grid-cols-3`. Still held — needs a layout decision.

**QA-M11 — small-screen wordmark:** **Not reproduced.** At 320×568 the brand link is 147px, `scrollWidth === clientWidth`, full `CHRISTOPHER KILO.` visible. No change.

**QA-L11 — light-theme borders:** Tokens switch (`--bg #eef0f3`, `--text #17191d`, `--primary #1677ff`). Nav/footer/project `.glass-panel` in a dedicated probe used light surfaces (`rgba(255,255,255,0.72)` / dark border). Hero `.glass` still uses white-alpha intended for dark illustration plates. No crash. Still held if you want a dedicated light-theme polish pass; not a Chromium blocker.

**QA-L12 — short-height hero:** **Confirmed** at 1024×600 and 1440×600: the homepage “View Projects” control is below the fold (`heroCtaInView: false`) because of `min-h-[100svh]` plus stacked copy/illustration. At 768×600 the CTA stayed in view. Still held — changing this would alter the hero.

---

## Browser coverage

| Engine | Result |
| --- | --- |
| Chromium (Google Chrome, headless) | Full 216-sample matrix above |
| Firefox | **Not installed** on this machine — no live pass |
| WebKit / Safari | Safari.app is present; no headless WebKit driver was used. CSS still includes `-webkit-backdrop-filter`, `100svh`, sticky nav. Live Safari still recommended on a device. |

---

## Executive summary (initial)

**Status:** Repair Batch 1 complete. Initial findings retained below for history.

The marketing site is structurally sound: Next.js 16 production build succeeds, TypeScript is clean, 349 unit tests pass after Batch 1, ESLint is clean, routes are coherent, demos are noindexed, and the three flagship case studies answer recruiter questions well.

The highest-risk visitor problems are **misleading contact success**, **missing page-level headings**, **keyboard traps / missing focus management in overlays**, **placeholder screenshots in a published StarLenz article**, **reduced-motion still hiding section titles until Framer animates them**, **a 760KB About portrait**, and **a duplicated homepage document title**.

Live pixel-level overflow was **not** fully exercised in a browser at every listed viewport in this pass. Body uses `overflow-x: clip`, which can hide horizontal overflow rather than surface it. A device pass remains required before calling Phase 2 complete.

| Severity | Count (open) |
| --- | ---: |
| Critical | 0 |
| High | 7 |
| Medium | 18 |
| Low | 12 |
| Enhancement | 10 |
| Fixed | 0 |
| Cannot reproduce | 2 |

---

## Method and limitations

### What was inspected

- Repository layout, `package.json`, `next.config.ts`, `app/`, `components/`, `lib/`, `content/blog/`, `public/`, Prisma, ESLint, Vitest
- Route table from `next build`
- Navigation, footer, command palette, mobile menu, contact form, project cards, blog cards, case-study chrome, StarLenz placeholder, About portrait
- SEO: `layout.tsx` metadata, `lib/seo.ts`, `robots.ts`, `sitemap.ts`, Open Graph / Twitter image routes, JSON-LD
- Quality gates: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`

### What was not completed in this pass (by design)

- Playwright install / e2e / visual snapshots (Phase 12–13 — after approval)
- CI pipeline (Phase 16 — after approval)
- Live browser matrix (Chrome / Firefox / Safari) at all 14 widths
- Submitting the NovaTech demo inquiry form against production (forbidden)
- Changing design-sensitive components without approval

### Baseline quality gates (2026-08-31)

| Check | Result |
| --- | --- |
| `npm run lint` | **Pass with warnings** — 0 errors, 2 unused-variable warnings in NovaTech integration tests |
| `npx tsc --noEmit` | **Pass** |
| `npm test` | **Pass** — 54 files, **348 tests** |
| `npm run build` | **Pass** — Next.js 16.2.10 Turbopack, 91 static pages generated |
| Playwright | **Not installed** |
| GitHub Actions / `.github/` | **None** |
| `vercel.json` | **None** (Vercel project settings assumed) |

Lint warnings recorded before any fix:

- `server/novatech/integrations/hubspot.test.ts` — `'dealCreates' is assigned a value but never used`
- `server/novatech/integrations/resend.test.ts` — `'body' is assigned a value but never used`

Build also prints a Prisma 7 deprecation: `package.json#prisma` should migrate to `prisma.config.ts`. Non-blocking.

---

## Repository baseline

| Area | Finding |
| --- | --- |
| Framework | Next.js **16.2.10**, React **19.2.4**, Tailwind **4**, TypeScript **5** |
| Motion | Framer Motion **12** |
| Data | Prisma **6.19.3**, Auth.js, Supabase (TaskFlow proxy in `proxy.ts`) |
| Tests | Vitest **4.1.10** only — no Playwright, no axe |
| Fonts | `Source_Sans_3`, `Outfit`, `JetBrains_Mono` via `next/font/google` (`display: swap`) |
| Images | `next/image`; `dangerouslyAllowSVG: true`; About portrait is a **760KB PNG** |
| Forms | Portfolio contact is **mailto handoff** (`ContactCTA`). NovaTech demo has a real inquiry API (`/api/novatech/inquiries`) — **do not spam in QA** |
| Analytics | **None** |
| Deployment | No `vercel.json`. Production URL in constants: `https://www.christopherkilo.com` |
| CI/CD | **None** |
| Global styles | `app/globals.css` — dark default, light via `data-theme`, reduced-motion CSS overrides, `body { overflow-x: clip }` |
| Shared chrome | `SiteShell` → skip link, navbar, command palette, custom cursor, blueprint background, page transition, footer. **Skipped** on `/toolkit` and `/demos` |
| Animation systems | Framer variants in `lib/animation.ts`; CSS shimmer; infinite hero panel float; card tilt; carousel autoplay (disabled when `prefers-reduced-motion`) |

### Route inventory

**Primary (indexed unless noted)**

| Route | Notes |
| --- | --- |
| `/` | Hero, featured carousel, latest writing, about preview, contact |
| `/projects` | Web / IT / design grids. **StarLenz is not listed** |
| `/projects/event-horizon` | Case study + live demo `/demos/event-horizon` |
| `/projects/novatech-solutions` | Case study + live demo `/demos/novatech-solutions` |
| `/projects/taskflow` | Case study + live demo `/demos/taskflow` |
| `/projects/voltline` `/projects/nightshift` `/projects/signal-magazine` | Design case studies |
| `/projects/starlenz` | In-development placeholder; **in sitemap** |
| `/blog` | Index + `?tag=` filter |
| `/blog/[slug]` | 3 articles (NovaTech AWS, Event Horizon AWS, StarLenz) |
| `/about` `/resume` `/contact` | Standard |
| `/toolkit` and nested | Live suite; **in sitemap**; no portfolio chrome |
| `/demos/*` | **robots `disallow` + page `noindex` where set** |
| `/Christopher_Kilo_Resume.pdf` | Public PDF; `/resume.pdf` **301** → same |
| `/lab`, `/lab/:path*` | **301** → `/projects` |

**Unknown / unfinished states**

- Invalid `/projects/[id]` and `/blog/[slug]` call `notFound()`. There is **no branded** `app/not-found.tsx` (Next default `/_not-found`).
- StarLenz is reachable by URL, sitemap, and blog related-project link, but **not** from the Projects grid.
- Toolkit modules (`systemscope`, `memorymedic`, `netcheck`) are `portfolioVisible: false` — deep-link only.

**External links (HTTP check 2026-08-31)**

| URL | Result |
| --- | --- |
| `https://github.com/christopherkilo/novatech-solutions` | 200 |
| `https://github.com/christopherkilo/taskflow` | 200 |
| `https://github.com/christopherkilo/portfolio` | 200 |
| LinkedIn profile | `curl` returned **999** (LinkedIn bot protection). Treat as **cannot reproduce as broken** without a real browser session. |

Event Horizon and Kilo Toolkit both use `https://github.com/christopherkilo/portfolio` (intentional in unit tests). Recruiters may think they are two repos.

---

## Phase 6 — First-time visitor notes (no copy rewrite this phase)

**Within five seconds (homepage, code + copy review)**

| Question | Verdict |
| --- | --- |
| Whose portfolio? | **Yes** — `CHRISTOPHER KILO` wordmark + `h1` name |
| What kind of work? | **Yes** — “Full-Stack Developer” + tagline |
| Find projects? | **Yes** — Featured Applications + nav |
| What each project does? | **Mostly** — cards are one-liners; case studies are the real answer |
| Source code? | **Partial** — GitHub on cards; EH + Toolkit share one repo |
| Live demo? | **Yes, after opening a case study** — cards go to case studies, not demos (intentional) |
| Contact? | **Yes** — nav, homepage CTA, mailto + form |

**Per project (clarity, not redesign)**

| Project | Gap |
| --- | --- |
| Event Horizon / NovaTech / TaskFlow | Case studies cover problem, build, stack, decisions, demo, GitHub |
| Kilo Toolkit | Live product; GitHub is the portfolio monorepo |
| Design trio | No GitHub/live (expected); case studies exist |
| StarLenz | Status is labeled in-dev, but the **blog article shows seven “Screenshot to be added” blocks**, and the project is **absent from `/projects`** |

Do not invent accomplishments to fill these gaps. Content work needs approval.

---

# Critical

_None found in this pass._ No uncaught production-build failure, no public localhost demo URLs in project metadata, no evidence of a broken primary conversion path that completely prevents contact (email is still visible as a raw `mailto:`).

---

# High

### QA-H01 — Contact form reports success after opening mailto

- **ID:** QA-H01
- **Page/route:** `/` `#contact`, `/contact`
- **Viewport:** All
- **Reproduction:** Fill name, valid email, message ≥ 10 characters. Submit. Dismiss or cancel the OS mail client (or use a device with no mail handler). Optionally paste a very long message.
- **Expected:** Either a real send with verified success/failure, or honest “this will open your email app” **before** claiming success; failures (no handler, truncated `mailto:`) must not look like a sent message.
- **Actual:** `window.location.href = mailto:…` then `setStatus("sent")` and `form.reset()` immediately. Button copy is “Send via email” but success copy assumes the app opened. Cancelled compose still shows the checkmark. `submitting` is effectively instantaneous, so double-submit is not guarded. Very long bodies can exceed practical `mailto` URL limits; the UI still shows success.
- **Severity:** High
- **Root cause:** Intentional mailto handoff in `components/home/ContactCTA.tsx` with success tied to navigation attempt, not delivery.
- **Recommended fix (needs approval if copy/layout changes):** Keep mailto (no backend required). Do **not** show a success checkmark until the user confirms, **or** change copy to a persistent instruction (“Continue in your email app”) without a checkmark. Add `maxlength`. Disable the button until the mail client returns is not reliable — prefer not resetting the form until the user chooses “Start over”. Optional later: real API (design-neutral).
- **Validation performed:** Code review of `handleSubmit`. No live mail sent.

### QA-H02 — Key pages have no document `h1`

- **ID:** QA-H02
- **Page/route:** `/about`, `/projects`, `/blog`, `/contact` (homepage Contact section also)
- **Viewport:** All
- **Reproduction:** Open those routes. Inspect heading outline. `SectionHeader` always renders `<h2>`.
- **Expected:** One logical `h1` per page matching the page title.
- **Actual:** Page titles are `h2`. About role cards also use `h2`. Blog index then adds another `h2` (“Articles”). Homepage is fine (`h1` in Hero). Resume and case studies are fine.
- **Severity:** High (WCAG 1.3.1 / 2.4.6; screen reader / SEO outline)
- **Root cause:** `components/ui/SectionHeader.tsx` hardcodes `<h2>`.
- **Recommended fix:** Add an `as?: "h1" | "h2"` (default `h2` for homepage sections). Use `h1` on standalone pages. **Do not restyle.** About role headings can stay `h2` once the page title is `h1`.
- **Validation performed:** Code review of `SectionHeader`, `app/about/page.tsx`, `app/projects/page.tsx`, `app/blog/page.tsx`, `app/contact/page.tsx`.

### QA-H03 — Mobile menu is not a proper dialog for keyboard users

- **ID:** QA-H03
- **Page/route:** All `SiteShell` pages, `< md` (~767px)
- **Viewport:** 320–767
- **Reproduction:** Keyboard-only. Tab to hamburger, Enter. Tab / Shift+Tab. Escape works. Background content remains in the tab order behind a visual overlay.
- **Expected:** Focus moves into the panel; focus is trapped until close; `aria-controls` / `role="dialog"` (or disclosure pattern) matches behavior; hamburger label reflects open state.
- **Actual:** Overlay + Escape + body scroll lock. No focus move, no focus trap, no `aria-controls`. Hamburger `aria-label` stays “Open menu”. Overlay is `z-[60]` over header `z-50`, so pointer users are fine.
- **Severity:** High
- **Root cause:** `MobileMenu.tsx` is a visual overlay, not a dialog.
- **Recommended fix:** Standard focus trap + initial focus on close or first link; restore focus to hamburger; `aria-controls` pointing at the panel id; optionally `role="dialog"` + `aria-modal="true"`. **Do not redesign the panel.**
- **Validation performed:** Code review. Live keyboard pass still required.

### QA-H04 — Published StarLenz article is full of screenshot placeholders

- **ID:** QA-H04
- **Page/route:** `/blog/building-starlenz`
- **Viewport:** All
- **Reproduction:** Open the article. Seven markdown images use `placeholder:starlenz/…`. `ScreenshotFrame` renders “Screenshot to be added”.
- **Expected:** A published development update either includes the screenshots it describes or omits the figure blocks until assets exist.
- **Actual:** Repeated empty states in the only StarLenz long-form page. Undermines “can I see the result?”
- **Severity:** High (first-time / recruiter trust)
- **Root cause:** Frontmatter/content placeholders in `content/blog/building-starlenz.md`.
- **Recommended fix:** Add real images **or** temporarily remove those figure blocks (content decision — **approval required**). Do not fake screenshots.
- **Validation performed:** Grep of `placeholder:` in content + `ScreenshotFrame` behavior.

### QA-H05 — Section titles start at opacity 0 and ignore `prefers-reduced-motion`

- **ID:** QA-H05
- **Page/route:** Any page using `SectionHeader` or `AboutPreview` stagger (`/`, `/projects`, `/blog`, `/about`, `/contact`)
- **Viewport:** All
- **Reproduction:** Enable `prefers-reduced-motion: reduce`. Reload. Section titles still use Framer `initial="hidden"` (`opacity: 0`, `y: 24`). CSS reduced-motion rules do **not** cancel Framer JS. If `whileInView` is delayed or JS is blocked, headings can remain invisible (historically seen when `/_next` failed on `127.0.0.1`).
- **Expected:** Reduced-motion users get immediate, visible titles. Fail-open if motion libraries do not run.
- **Actual:** `Reveal` **does** skip motion. `SectionHeader` and AboutPreview stagger **do not**.
- **Severity:** High
- **Root cause:** `SectionHeader` has no `useReducedMotion`. `fadeUp.hidden` is opacity 0.
- **Recommended fix:** Mirror `Reveal`: if reduced motion, render a static `<header>`. Same for AboutPreview stagger. **Keep the visual design for everyone else.**
- **Validation performed:** Code comparison `SectionHeader` vs `Reveal` vs `lib/animation.ts`.

### QA-H06 — About portrait is a 760KB PNG

- **ID:** QA-H06
- **Page/route:** `/about`
- **Viewport:** All; worst on mobile LCP
- **Reproduction:** Network panel on `/about`. `public/about/portrait.png` is ~760KB. Used with `next/image` `priority` `fill`.
- **Expected:** Compressed WebP/AVIF (or optimized PNG) in the tens of KB for a square portrait, with dimensions that match the frame.
- **Actual:** Large source; extra payload and decode cost. `portrait-placeholder.svg` (1.2KB) sits unused beside it.
- **Severity:** High (performance / LCP on a primary recruiter page)
- **Root cause:** Unoptimized raster in `/public`.
- **Recommended fix:** Export a compressed WebP (and keep PNG fallback if alpha is required). Do **not** change crop/framing without approval. Confirm alpha still reveals the page background.
- **Validation performed:** `ls` file size; `about/page.tsx` `Image` usage.

### QA-H07 — Homepage document title duplicates the name

- **ID:** QA-H07
- **Page/route:** `/`
- **Viewport:** n/a (tab / OG / SEO)
- **Reproduction:** Open `/` and read `<title>`. Root `metadata.title.template` is `%s · Christopher Kilo`. Homepage `pageMetadata` sets `title` to `Christopher Kilo — Full-Stack Developer`, so Next applies the template.
- **Expected:** `Christopher Kilo — Full-Stack Developer` (matches `title.default`).
- **Actual:** Likely `Christopher Kilo — Full-Stack Developer · Christopher Kilo`.
- **Severity:** High (SEO / shared-tab professionalism)
- **Root cause:** `app/page.tsx` uses a string title under a layout template.
- **Recommended fix:** `title: { absolute: \`${SITE.name} — ${SITE.title}\` }` on the homepage only. Confirm in a production HTML dump.
- **Validation performed:** Code review of `app/layout.tsx` + `app/page.tsx` + `lib/seo.ts`. Live `<title>` dump still needed.

---

# Medium

### QA-M01 — Nested interactive elements on project and blog cards

- **ID:** QA-M01
- **Page/route:** `/`, `/projects`, `/blog`
- **Viewport:** All
- **Reproduction:** Inspect `ProjectCard`: full-card `Link` overlay (`z-[1]`) plus GitHub `<a>` (`z-[4]`). `BlogCard` uses the same overlay-link pattern.
- **Expected:** One primary hit target, or a card whose inner links are the only interactive children (no overlapping `<a>`).
- **Actual:** Valid HTML nested-interactive risk (overlay is a sibling, not a parent — **not invalid nesting**, but two overlapping controls). Screen readers get a card-sized link plus GitHub. Hit-testing depends on z-index.
- **Severity:** Medium
- **Root cause:** Full-card click affordance + GitHub shortcut.
- **Recommended fix:** Keep both actions. Prefer `article` + visible “View case study” / GitHub links (layout change — **approval if it alters the card**). Smaller fix: ensure GitHub is the only inner control and the overlay `aria-label` stays unique. Do not remove GitHub.
- **Validation performed:** Code review `components/ui/Card.tsx`, `components/blog/BlogCard.tsx`.

### QA-M02 — Command palette: no focus trap, no mobile control

- **ID:** QA-M02
- **Page/route:** Global on `SiteShell` pages
- **Viewport:** Desktop has Search; mobile has **no** Search button. ⌘/Ctrl+K still works.
- **Reproduction:** Open palette. Tab can leave the dialog. Background still scrollable (no `overflow` lock).
- **Expected:** Focus trap, `aria-modal` honored, body scroll lock, mobile-discoverable search if the feature is first-class.
- **Actual:** `role="dialog"` `aria-modal="true"` without trap. Listbox contains `<button>` inside `role="option"` (invalid ARIA combo).
- **Severity:** Medium
- **Root cause:** `CommandPalette.tsx` keyboard handling is arrows/enter/esc only.
- **Recommended fix:** Focus trap + scroll lock; combobox pattern **or** simple menu (don’t bolt ARIA). Add a mobile icon button **or** document that search is desktop-only (product choice).
- **Validation performed:** Code review.

### QA-M03 — Blog screenshot lightbox has no focus trap

- **ID:** QA-M03
- **Page/route:** Blog articles with real images (not placeholders)
- **Viewport:** All
- **Reproduction:** Expand a screenshot. Escape and backdrop click work; initial focus goes to Close. Tab can exit to the page behind.
- **Expected:** Focus cycle inside the dialog until close; restore trigger focus (partially done).
- **Actual:** No trap. Same class of issue as QA-H03.
- **Severity:** Medium
- **Root cause:** `ScreenshotFrame.tsx` dialog is visual-only beyond Escape.
- **Recommended fix:** Shared focus-trap helper (also used by mobile menu and command palette).
- **Validation performed:** Code review.

### QA-M04 — No branded 404

- **ID:** QA-M04
- **Page/route:** Unknown paths; invalid `/blog/nope`; invalid `/projects/nope` (after `notFound()`)
- **Viewport:** All
- **Reproduction:** Visit `/this-does-not-exist`.
- **Expected:** On-brand 404 with links to Home / Projects / Contact.
- **Actual:** Next.js default `/_not-found`. Demo apps have their own `not-found.tsx`.
- **Severity:** Medium
- **Root cause:** Missing `app/not-found.tsx`.
- **Recommended fix:** Small branded page using existing `Button` / typography. **Approval** if it introduces a new composition.
- **Validation performed:** Glob for `not-found.tsx`; build output shows `○ /_not-found`.

### QA-M05 — StarLenz is in the sitemap but not on Projects

- **ID:** QA-M05
- **Page/route:** `/projects`, `/projects/starlenz`, `/sitemap.xml`
- **Viewport:** All
- **Reproduction:** Open `/projects` — no StarLenz card. Open `/projects/starlenz` — “Back to Projects” returns to a grid that does not contain StarLenz.
- **Expected:** Either list it (with In Development) **or** omit from sitemap and don’t imply it’s in the index.
- **Actual:** Discoverable via blog, sitemap, and direct URL only.
- **Severity:** Medium
- **Root cause:** `getPortfolioProjects()` omits StarLenz; `sitemap.ts` includes `/projects/starlenz`.
- **Recommended fix:** Product choice. Recommend adding a clearly badged card **or** removing sitemap entry. Do not invent a full case study.
- **Validation performed:** `projectRouting.test.ts`, `sitemap.ts`, `starlenz/page.tsx`.

### QA-M06 — Event Horizon and Kilo Toolkit share one GitHub URL

- **ID:** QA-M06
- **Page/route:** Project cards, case study GitHub buttons
- **Viewport:** All
- **Reproduction:** Click GitHub on Event Horizon and on Kilo Toolkit.
- **Expected:** Distinct repos **or** copy that this is a monorepo (`portfolio`).
- **Actual:** Both `https://github.com/christopherkilo/portfolio`. NovaTech and TaskFlow are separate (verified 200).
- **Severity:** Medium
- **Root cause:** Accurate monorepo layout; labels say “GitHub” only.
- **Recommended fix:** Keep URLs. Optional: `aria-label` / button text “GitHub (monorepo)” — **copy approval**. Do not invent a fake EH repo.
- **Validation performed:** `lib/projectData.ts` + `curl` 200.

### QA-M07 — Footer has no GitHub or LinkedIn

- **ID:** QA-M07
- **Page/route:** Global footer
- **Viewport:** All
- **Reproduction:** Scroll to footer. Only email + internal nav. Contact panel **does** include LinkedIn/GitHub.
- **Expected:** Recruiter scanning the footer can leave the site to LinkedIn/GitHub.
- **Actual:** Email only in the footer cluster.
- **Severity:** Medium
- **Root cause:** `components/layout/Footer.tsx` omits `SITE.github` / `SITE.linkedin`.
- **Recommended fix:** Add the same two links used in `ContactCTA`, matching existing text styles. Low visual risk.
- **Validation performed:** Code review.

### QA-M08 — `Button` hover motion ignores reduced motion

- **ID:** QA-M08
- **Page/route:** All buttons/links using `components/ui/Button.tsx`
- **Viewport:** All
- **Reproduction:** `prefers-reduced-motion: reduce`. Hover/tap still `whileHover` / `whileTap` scale.
- **Expected:** No translate/scale for reduced motion (demo buttons already use `useReducedMotion`).
- **Actual:** Portfolio `Button` always animates.
- **Severity:** Medium
- **Root cause:** Missing hook in shared Button.
- **Recommended fix:** Disable `whileHover`/`whileTap` when reduced. **No visual change** for default users.
- **Validation performed:** Code review vs NovaTech/EH demo buttons.

### QA-M09 — Global `overflow-x: clip` can hide overflow bugs

- **ID:** QA-M09
- **Page/route:** Site-wide (`body` in `globals.css`); Hero also `overflow-x-clip`
- **Viewport:** Especially 320–430 and in-between breakpoints (850, 900, etc.)
- **Reproduction:** A child wider than the viewport will not produce a page scrollbar.
- **Expected:** Overflow is visible during QA, or clipping is clearly decorative (hero illustration).
- **Actual:** Body clip can mask transformed cards, carousels, and absolute hero labels.
- **Severity:** Medium (process + possible hidden UX)
- **Root cause:** `body { overflow-x: clip }`.
- **Recommended fix:** **Do not globally remove clip without checking hero/carousel.** Prefer fixing overflowing children. For QA, temporarily disable clip in a local preview. Live overflow measurements still required.
- **Validation performed:** CSS inspection only.

### QA-M10 — Latest Writing / blog grid leaves a leftover card at `md`

- **ID:** QA-M10
- **Page/route:** `/` Latest Writing, `/blog`
- **Viewport:** 768–1023 (`md:grid-cols-2` / `lg:grid-cols-3`)
- **Reproduction:** Three posts in a 2-column grid. Third card sits alone on row two at half width.
- **Expected:** Equal visual rhythm, or a defined featured span.
- **Actual:** Intentional equal cards at `lg`; awkward leftover at `md`.
- **Severity:** Medium
- **Root cause:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` with exactly 3 items.
- **Recommended fix:** `md:grid-cols-3` with wrapping, or keep 1-col until `lg`. **Visual — approval.** Do not restyle cards.
- **Validation performed:** Code review `LatestWriting.tsx`, `app/blog/page.tsx`.

### QA-M11 — Navbar wordmark truncates on the narrowest phones

- **ID:** QA-M11
- **Page/route:** All `SiteShell` pages
- **Viewport:** ~320px
- **Reproduction:** `CHRISTOPHER KILO.` uses `truncate` and `max-w-[calc(100%-4.5rem)]`.
- **Expected:** Full name readable (stacked wordmark already exists in the hero).
- **Actual:** Possible ellipsis hiding `KILO`.
- **Severity:** Medium
- **Root cause:** Space reserved for hamburger.
- **Recommended fix:** Slightly smaller tracking, `CK.` lockup, or allow wrap to two lines **without** changing the desktop wordmark. **Approval** for any lockup change.
- **Validation performed:** Class inspection; live 320px screenshot still required.

### QA-M12 — Contact fields: no max length; success resets the form

- **ID:** QA-M12
- **Page/route:** `/contact`, homepage contact
- **Viewport:** All
- **Reproduction:** Paste a huge message; submit twice quickly.
- **Expected:** Reasonable `maxLength`; form remains if mailto fails; button disabled during handoff.
- **Actual:** No max length. Form clears on “success”. Submit button only disables while `submitting` (instant).
- **Severity:** Medium
- **Root cause:** Same mailto implementation as QA-H01.
- **Recommended fix:** Bundle with QA-H01.
- **Validation performed:** Code review.

### QA-M13 — Blog article metadata may drop default OG image

- **ID:** QA-M13
- **Page/route:** `/blog/[slug]`
- **Viewport:** n/a
- **Reproduction:** `generateMetadata` spreads `pageMetadata` then **replaces** entire `openGraph` / `twitter` objects without `images`.
- **Expected:** Shared article URLs still get the 1200×630 card (`app/opengraph-image.tsx`).
- **Actual:** May fall back to no image depending on Next merge rules.
- **Severity:** Medium
- **Root cause:** Object replacement in `app/blog/[slug]/page.tsx`.
- **Recommended fix:** Spread previous `openGraph` and add article fields; or set `images` explicitly. Verify with [opengraph.xyz](https://www.opengraph.xyz) after deploy.
- **Validation performed:** Code review only.

### QA-M14 — SITE description omits AWS (and current stack)

- **ID:** QA-M14
- **Page/route:** Global meta description, JSON-LD
- **Viewport:** n/a
- **Reproduction:** View source description. Mentions React, Next, TS, PostgreSQL, Supabase — not AWS / HubSpot / Step Functions that the blog and case studies emphasize.
- **Expected:** Description matches the work a recruiter just read.
- **Actual:** Slightly stale positioning.
- **Severity:** Medium (SEO / first impression)
- **Root cause:** `lib/constants.ts` `SITE.description`.
- **Recommended fix:** One-sentence update. **Copy approval.** Do not invent skills.
- **Validation performed:** Constants vs case-study tech lists.

### QA-M15 — No CI; lint warnings already in tree

- **ID:** QA-M15
- **Page/route:** n/a
- **Viewport:** n/a
- **Reproduction:** No `.github/workflows`. PRs do not run `verify`.
- **Expected:** Practical CI: install, lint, `tsc`, test, build, later Playwright smoke.
- **Actual:** Local `npm run verify` only. Two ESLint warnings.
- **Severity:** Medium (process)
- **Root cause:** No workflow file; unused test vars.
- **Recommended fix:** After this audit: fix the two unused vars; add a lean GitHub Action. Visual snapshots later with reviewable artifacts.
- **Validation performed:** Glob `.github`; lint output.

### QA-M16 — No automated e2e / a11y / visual regression

- **ID:** QA-M16
- **Page/route:** n/a
- **Viewport:** Listed in Phase 12–13
- **Reproduction:** `package.json` has no Playwright.
- **Expected:** High-value smoke tests once approved.
- **Actual:** Unit tests only.
- **Severity:** Medium (process)
- **Root cause:** Not installed.
- **Recommended fix:** Phase 12–13 after this report. Do not test every CSS rule.
- **Validation performed:** `package.json`.

### QA-M17 — Hero idle motion continues off-screen

- **ID:** QA-M17
- **Page/route:** `/`
- **Viewport:** All; CPU on low-end phones
- **Reproduction:** Scroll past the hero. Panel `y: [0, -6, 0]` infinite 7.5s loops and floating labels keep animating (`panelIdleMotion`). Reduced motion stops them.
- **Expected:** Pause when off-screen (`whileInView` / IntersectionObserver) without removing the effect on-screen.
- **Actual:** Always-on for non-reduced-motion users.
- **Severity:** Medium
- **Root cause:** Infinite Framer animate on mounted hero.
- **Recommended fix:** Pause when not intersecting. **Do not remove** the float — it is identity.
- **Validation performed:** `Hero.tsx` `panelIdleMotion`.

### QA-M18 — Toolkit / demos have no skip link or portfolio chrome

- **ID:** QA-M18
- **Page/route:** `/toolkit`, `/demos/*`
- **Viewport:** All
- **Reproduction:** `SiteShell` early-returns. Skip link, command palette, and footer disappear. TaskFlow unauthenticated users redirect to sign-in via `proxy.ts` (expected).
- **Expected:** Demos can have their own chrome; toolkit should still be keyboard-friendly. Recruiters entering `/toolkit` from a card should understand they left the portfolio frame.
- **Actual:** Intentional product shells. Mild orientation cost.
- **Severity:** Medium
- **Root cause:** `SiteShell` pathname check.
- **Recommended fix:** Optional small “Back to portfolio” already exists in some demos — verify toolkit. Do not force portfolio navbar onto demos (**design**).
- **Validation performed:** `SiteShell.tsx`, `proxy.ts`.

---

# Low

### QA-L01 — Custom cursor does not hide the native cursor

- **ID:** QA-L01
- **Page/route:** `SiteShell` pages, `md+`, `pointer: fine`, motion allowed
- **Viewport:** Desktop
- **Reproduction:** Move the mouse. Custom ring follows; system cursor remains.
- **Expected:** Either hide `cursor: none` on `body` while the custom cursor is active, or drop the custom cursor.
- **Actual:** Dual cursors. `pointer-events-none` on the custom layer (good). Disabled for reduced motion and coarse pointers (good).
- **Severity:** Low
- **Root cause:** `CustomCursor.tsx` never sets `document.body.style.cursor`.
- **Recommended fix:** `cursor: none` on `html` while enabled. **Visual — mild; confirm.**
- **Validation performed:** Code review.

### QA-L02 — Hamburger missing `aria-controls`

- **ID:** QA-L02
- **Page/route:** Mobile nav
- **Viewport:** `< md`
- **Reproduction:** Inspect the menu button.
- **Expected:** `aria-controls="mobile-nav"` matching the panel id.
- **Actual:** Only `aria-expanded`.
- **Severity:** Low (bundle with QA-H03)
- **Root cause:** Incomplete disclosure wiring.
- **Recommended fix:** With QA-H03.
- **Validation performed:** `Navbar.tsx`.

### QA-L03 — Invalid `?tag=` is silently ignored

- **ID:** QA-L03
- **Page/route:** `/blog?tag=not-a-tag`
- **Viewport:** All
- **Reproduction:** Open a bogus tag. Index shows all posts; “All” looks selected; URL still has the query.
- **Expected:** 404, empty state, or strip the query.
- **Actual:** Silent fallback.
- **Severity:** Low
- **Root cause:** `activeTag` only if `tags.includes(tag)`.
- **Recommended fix:** Empty state + “No posts with that tag”.
- **Validation performed:** `app/blog/page.tsx`.

### QA-L04 — Theme toggle lacks `aria-pressed` / current state in the accessible name

- **ID:** QA-L04
- **Page/route:** Navbar / mobile menu
- **Viewport:** All
- **Reproduction:** Toggle. Name is “Switch to light/dark mode” (good). No `aria-pressed`.
- **Expected:** Optional `aria-pressed` for toggle buttons.
- **Actual:** Relies on label of the *next* theme.
- **Severity:** Low
- **Root cause:** `ThemeToggle.tsx`.
- **Recommended fix:** Add `aria-pressed={theme === "dark"}` or similar.
- **Validation performed:** Code review.

### QA-L05 — `next/image` `dangerouslyAllowSVG`

- **ID:** QA-L05
- **Page/route:** Project SVG covers
- **Viewport:** n/a
- **Reproduction:** `next.config.ts` `images.dangerouslyAllowSVG: true` with CSP sandbox.
- **Expected:** Needed for local SVG covers; remote SVG should stay constrained.
- **Actual:** Documented tradeoff; CSP `script-src 'none'; sandbox`.
- **Severity:** Low (security note, not a visitor bug)
- **Root cause:** SVG portfolio covers.
- **Recommended fix:** Keep; do not silently disable (would break covers).
- **Validation performed:** `next.config.ts`.

### QA-L06 — Prisma `package.json#prisma` deprecation on build

- **ID:** QA-L06
- **Page/route:** n/a
- **Reproduction:** `npm run build` warns about Prisma 7 config file.
- **Expected:** No deprecation noise in CI.
- **Actual:** Warning only.
- **Severity:** Low
- **Root cause:** Prisma 6 + upcoming 7.
- **Recommended fix:** Migrate when upgrading Prisma — not part of visual QA.
- **Validation performed:** Build log.

### QA-L07 — Unused `portrait-placeholder.svg`

- **ID:** QA-L07
- **Page/route:** `/about`
- **Reproduction:** File exists; page uses `portrait.png`.
- **Expected:** No dead assets, or placeholder used as `onError`.
- **Actual:** Orphan SVG.
- **Severity:** Low
- **Root cause:** Leftover from portrait work.
- **Recommended fix:** Delete after confirming PNG is canonical, or use as fallback.
- **Validation performed:** Glob `public/about`.

### QA-L08 — Command palette listbox/option/button ARIA

- **ID:** QA-L08
- **Page/route:** Command palette
- **Viewport:** Desktop
- **Reproduction:** Inspect roles.
- **Expected:** Combobox + listbox with `aria-activedescendant`, **or** a simple menu without listbox.
- **Actual:** `listbox` / `option` wrapping `<button>`.
- **Severity:** Low (bundle with QA-M02)
- **Root cause:** Mixed patterns.
- **Recommended fix:** Prefer a menu of buttons; drop listbox.
- **Validation performed:** Code review.

### QA-L09 — No analytics

- **ID:** QA-L09
- **Page/route:** Site-wide
- **Expected:** Optional privacy-friendly analytics for production QA of real traffic.
- **Actual:** None.
- **Severity:** Low / enhancement-adjacent
- **Root cause:** Not implemented.
- **Recommended fix:** Only if you want it; not required to ship QA.
- **Validation performed:** Repo search.

### QA-L10 — Case studies have no prev/next project links

- **ID:** QA-L10
- **Page/route:** `/projects/[id]`
- **Viewport:** All
- **Reproduction:** Footer is Live Demo + Back to Projects. Blog articles **do** have prev/next.
- **Expected:** Optional project-to-project nav.
- **Actual:** Return to index only.
- **Severity:** Low
- **Root cause:** Case study footer design.
- **Recommended fix:** Optional “Next case study” using existing card chrome. **Approval.**
- **Validation performed:** `app/projects/[id]/page.tsx`.

### QA-L11 — Light-theme glass still uses `border-white/8` in many cards

- **ID:** QA-L11
- **Page/route:** Light theme
- **Viewport:** All
- **Reproduction:** Toggle light mode. Many components hardcode `border-white/8` rather than `border-border`.
- **Expected:** Borders visible on light surfaces.
- **Actual:** Possible washed-out edges. Hero/tokens do have light-specific variables.
- **Severity:** Low
- **Root cause:** Dark-first utility classes.
- **Recommended fix:** Audit only obvious unreadable borders. **Do not** restyle the dark theme.
- **Validation performed:** Spot check; live light-theme pass still required.

### QA-L12 — Short viewports + `min-h-[100svh]` hero

- **ID:** QA-L12
- **Page/route:** `/`
- **Viewport:** e.g. 390×500, landscape phones
- **Reproduction:** Hero is `min-h-[100svh]` plus a ~400px illustration stacked on small screens.
- **Expected:** CTAs reachable without excessive scroll; no clipped type.
- **Actual:** Likely a long first screen. May be acceptable.
- **Severity:** Low
- **Root cause:** Full-viewport hero + stacked illustration.
- **Recommended fix:** Live check only. Do not shrink the hero identity without approval.
- **Validation performed:** Class inspection.

---

# Enhancement

These are not defects. Implement only if they support QA goals without flattening the site.

| ID | Idea |
| --- | --- |
| QA-E01 | Playwright smoke + axe (Phase 12) |
| QA-E02 | Visual snapshots of stable regions with animation paused **in the test env only** (Phase 13) |
| QA-E03 | CI `verify` + Playwright smoke (Phase 16) |
| QA-E04 | Real contact API (Resend) if mailto remains too weak — **product** |
| QA-E05 | Compress About portrait (overlaps QA-H06) |
| QA-E06 | StarLenz screenshots or fewer figures (overlaps QA-H04) |
| QA-E07 | Footer social links (overlaps QA-M07) |
| QA-E08 | Pause off-screen hero motion (overlaps QA-M17) |
| QA-E09 | Branded 404 (overlaps QA-M04) |
| QA-E10 | `SectionHeader` `as` prop (overlaps QA-H02) — smallest heading fix |

---

# Fixed

Moved to [Repair Batch 1 — implementation log](#repair-batch-1--implementation-log). Historical issue write-ups remain in High/Medium/Low above for traceability; treat Batch 1 as the source of truth for status.

Batch 1 IDs: QA-H01, QA-H02, QA-H03, QA-H04, QA-H05, QA-H06, QA-H07, QA-M01, QA-M02, QA-M03, QA-M04, QA-M05, QA-M07, QA-M08, QA-M12, QA-M13, QA-M14, QA-M15, QA-M17, QA-L02, QA-L03, QA-L04, QA-L08.

---

# Cannot reproduce

### QA-X01 — LinkedIn URL hard-down

- **ID:** QA-X01
- **Page/route:** Contact, resume, JSON-LD `sameAs`
- **Reproduction:** `curl -I` returned **999**. LinkedIn commonly blocks non-browser clients.
- **Expected:** Profile opens in a real browser.
- **Actual:** Not verified in-browser this pass.
- **Severity:** n/a
- **Root cause:** Bot protection vs possible bad URL.
- **Recommended fix:** Open the URL once in Safari/Chrome. If it 404s for a logged-out user, update `SITE.linkedin`.
- **Validation performed:** `curl` only.

### QA-X02 — Pixel overflow at every listed width

- **ID:** QA-X02
- **Page/route:** All major pages
- **Viewports requested:** 320, 360, 375, 390, 414, 430, 540, 768, 820, 1024, 1280, 1440, 1728, 1920, plus short heights and between-breakpoint widths (e.g. 850)
- **Reproduction:** Full live pass not run in this session (no browser MCP; Playwright not installed yet).
- **Expected:** No horizontal page scroll; no clipped CTAs; cards readable.
- **Actual:** Code-level constraints look mostly sane (`px-4`/`sm:px-6`/`lg:px-8`, carousel `min(100%, calc(100vw-2.5rem))`). Body `overflow-x: clip` may hide failures (QA-M09).
- **Severity:** n/a until device pass
- **Recommended fix:** After approval, run Playwright overflow asserts at representative widths **or** a manual DevTools pass before calling Phase 2 done.
- **Validation performed:** CSS/layout review only.

---

## Accessibility (Phase 5) — snapshot

| Check | Status |
| --- | --- |
| Skip link `#main` | Present on portfolio chrome; absent on toolkit/demos |
| Focus styles | Global `:focus-visible` + component rings |
| One `h1` | Homepage, resume, case studies, StarLenz, blog articles **yes**; several index pages **no** (QA-H02) |
| Form labels | Contact fields wrapped in `<label>` with `aria-invalid` / `aria-describedby` |
| Icon buttons | Generally labeled; GitHub icons `aria-hidden` in `BrandIcons` |
| Reduced motion | Partial — Reveal, carousel autoplay, custom cursor, hero **yes**; SectionHeader, Button, About stagger **no** |
| Contrast | Dark tokens look AA-oriented in comments; light theme hardcoded `white/` borders need a live check |
| Automated axe | Not run |

---

## Performance (Phase 9) — snapshot

| Check | Status |
| --- | --- |
| Production build | Succeeds |
| LCP concern | About portrait **760KB** (QA-H06); homepage LCP likely the hero/name (font + client Hero) |
| CLS | Cards reserve aspect-ratio boxes; generated blog covers are CSS/SVG |
| Client islands | Hero, cards, carousel, contact, cursor, command palette are client components (expected for motion) |
| Fonts | `display: swap` |
| Hero CPU | Infinite float (QA-M17) |
| Demo image payload | Event Horizon placeholders in `public/placeholders/events/` are ~150–350KB each (demo-only, noindex) |
| Lighthouse | Not run this pass |

---

## SEO / social (Phase 10) — snapshot

| Item | Status |
| --- | --- |
| Titles | Template + possible homepage duplication (QA-H07) |
| Descriptions | Present; AWS under-mentioned (QA-M14) |
| Canonical | `alternates.canonical` via `pageMetadata` + `metadataBase` |
| Favicon | `app/favicon.ico` |
| robots.txt | Allow `/`; disallow `/demos/`, `/api/`, `/auth/` |
| sitemap | Static + case studies + posts + StarLenz + toolkit |
| Open Graph / Twitter | `app/opengraph-image.tsx`, `twitter-image.tsx`; blog override risk (QA-M13) |
| JSON-LD | Person on root; BlogPosting on articles |

---

## Browser QA (Phase 11)

Not executed live. Watch list from CSS: `backdrop-filter` / `glass`, sticky nav + `env(safe-area-inset-top)`, `100svh` hero, `overflow-x: clip`, Framer transforms (Safari blurry text), light/dark `color-scheme`.

---

## Console / network (Phase 14)

Not executed on a running production server this pass. Known historical issue: opening **`127.0.0.1`** while Next advertises **`localhost`** blocked `/_next` until `allowedDevOrigins` — **use `http://localhost` for local QA**.

---

## Files that will likely change after approval

Not modified in this audit except this report.

Probable fix set (pending your go-ahead):

- `components/ui/SectionHeader.tsx`, index pages (`h1`)
- `components/home/ContactCTA.tsx`
- `components/layout/MobileMenu.tsx`, `Navbar.tsx`
- `components/shared/CommandPalette.tsx`
- `components/ui/Button.tsx`
- `components/home/AboutPreview.tsx`
- `app/page.tsx` (title absolute)
- `app/about` portrait asset
- `content/blog/building-starlenz.md` (content decision)
- `components/layout/Footer.tsx`
- Later: Playwright, CI, `app/not-found.tsx`

---

## Recommended execution after you review this report

1. Confirm which High items you want fixed now (especially QA-H01, QA-H02, QA-H03, QA-H05, QA-H07 — small and design-safe).
2. Decide StarLenz screenshots vs. fewer figures (QA-H04) and whether StarLenz belongs on `/projects` (QA-M05).
3. Approve or defer portrait recompression (QA-H06) and leftover `md` grid (QA-M10) — mild visual.
4. Then: implement approved fixes → production smoke → Playwright/CI as Phase 12–16.

---

### QA-X03 — Navbar wordmark truncation at 320px (was QA-M11)

- **ID:** QA-X03
- **Page/route:** Global header
- **Reproduction:** Chromium 320×568, production server. Brand `scrollWidth === clientWidth` (147px). Full `CHRISTOPHER KILO.`
- **Expected / actual:** No ellipsis.
- **Severity:** n/a
- **Recommended fix:** None. Held item, not reproduced.
- **Validation performed:** Live viewport matrix 2026-08-31.

---

## Changelog

| Date | Note |
| --- | --- |
| 2026-08-31 | Initial audit. No product code changes. |
| 2026-08-31 | Repair Batch 1 + Chromium viewport matrix. Playwright/CI still deferred. |
| 2026-08-31 | Final Hardening: L12/L01/M06/M18/L07, Playwright+axe+visual, GitHub Actions. |
