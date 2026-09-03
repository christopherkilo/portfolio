# 09 — Phase 1 foundation

Phase 1 created an independent Angular application. React/Next.js TaskFlow was not rewritten.

## Versions (installed)

| Package | Version |
| --- | --- |
| Angular (`@angular/core`) | **22.1.4** |
| Angular CLI (`@angular/cli`) | **22.1.6** |
| `@angular/build` | 22.1.6 |
| `@angular/cdk` | 22.1.4 |
| TypeScript | **6.0.3** |
| RxJS | 7.8.x |
| Vitest (CLI default runner) | 4.1.11 |
| Node required by Angular 22 CLI | `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` |

Recorded from `taskflow-angular/package-lock.json` after `ng new` + `npm install @angular/cdk`.

## Location

`taskflow-angular/` at the portfolio repository root.

Not a second Git repository. Not a replacement of the root `package.json`. No SSR.

## How to run

Requires Node **22.22.3+**. Angular 22.1.x refuses Node 22.17 (the previous local default).

```bash
cd taskflow-angular
npm start          # http://localhost:4200
npm run test:ci
npm run build
```

## Styling decision

**Scoped component SCSS + a small global token sheet (`src/styles.scss`).**

TaskFlow React is Tailwind-heavy, but Phase 1 is a shell, not a port of every utility class. Adding Tailwind solely because React used it would not teach Angular styling and would pull PostCSS into a project that already has component encapsulation.

Tokens were **copied from** `[data-demo="taskflow"]` in `app/demos/demos.css` (dark/light surfaces, accent greens, `--sidebar: 15.5rem`, overlay). Event Horizon and other demo scopes were not imported.

Later feature pages can keep growing component SCSS against the same tokens. If a later milestone needs utility-class throughput, Tailwind can be added **without** replacing the token layer.

Fonts: Outfit + Source Sans 3 (same families as the portfolio TaskFlow chrome).

Theme: `html[data-theme]` + `localStorage` key **`taskflow-angular-theme`** (not `taskflow-theme`, so React and Angular do not fight — HOST-001).

## Route architecture

Layout groups, not pathname conditionals:

- `TaskflowShell` (`tf-shell`) — Sidebar + TopNav + `router-outlet`
  - `''` → redirect `dashboard`
  - `dashboard` `projects` `tasks` `calendar` `team` `audit` `settings`
- `ChromelessShell` (`tf-chromeless-shell`) — `signin`, `invite`
- `**` — Angular `NotFoundPage` (does not touch the portfolio 404)

Each feature route uses `title` + `data.title` (same string). The shell `h1` is derived from the deepest activated route’s `data.title` via `Router` `NavigationEnd` events (`core/route-title.ts`). That is Angular Router, not `pathname.startsWith`.

## Standalone-component strategy

No NgModules. Root `App` is a `router-outlet` only. Shell/layout and chromeless shells are eager. Feature pages use `loadComponent`.

## Lazy-loading approach

Every feature page (including dashboard) is lazy-loaded. Shell chrome stays in the initial bundle. Production build emits separate chunks (`dashboard-page`, `sign-in-page`, …).

Phase 0 suggested eager dashboard/tasks; Phase 1 followed the implementation brief: do not eager-load everything just because the app is small.

## UiStateService responsibilities

`core/state/ui-state.ts` (`providedIn: 'root'`):

- `mobileSidebarOpen` — drawer
- `theme` — light/dark, persisted under `taskflow-angular-theme`

**Not present:** projects, tasks, users, workspace records, notifications, connection, presence, conflict drafts, queues.

## Signals introduced

| Signal | Why |
| --- | --- |
| `UiStateService.mobileSidebarOpen` | Drawer open/closed is local UI; template binds it |
| `UiStateService.theme` | Theme toggle is local UI; applied to `documentElement` |
| `TaskflowShell.pageTitle` (`toSignal` of router events) | Title must update after navigation |
| `TaskflowMark.sizeClass` (`computed`) | Maps size input → CSS class |

No signal maps of server entities. No NgRx.

RxJS is used only for `Router.events` (a real event stream) plus `takeUntilDestroyed` / `toSignal`.

## Accessibility approach

- Skip link to `#main`
- Sidebar `<nav aria-label="Sidebar">` with `routerLinkActive` + `ariaCurrentWhenActive="page"`
- Mobile drawer: `role="dialog"` `aria-modal` `aria-label="Navigation menu"`
- `@angular/cdk/a11y` `CdkTrapFocus` + `cdkTrapFocusAutoCapture` (initial focus)
- Escape closes drawer (`HostListener document:keydown.escape`)
- Backdrop button labelled “Close sidebar”
- Body scroll lock while open
- Focus returns to the menu trigger on close
- Icon-only theme control has a live `aria-label`
- Search control is **disabled** and labelled as unavailable (not a silent no-op)
- Account “TF” is a **non-button** placeholder, labelled as Phase 2
- Visible `:focus-visible` rings
- `prefers-reduced-motion: reduce` disables drawer animation and short-circuits transitions globally

## Test approach

Angular CLI default: **Vitest** via `@angular/build:unit-test` (jsdom). Not Playwright (Milestone 10). Not the React Vitest suite.

`src/app/app.spec.ts` covers redirects, every required route, chromeless signin/invite, wildcard 404, sidebar hrefs, active class, route-data title, drawer open/close, Escape.

`src/app/core/state/ui-state.spec.ts` asserts the service has no server-entity fields.

## Known Phase 1 placeholders

- Feature pages: “Angular migration — … foundation” copy only
- Workspace label is static **TaskFlow Demo** (no switching)
- Search/command palette control is disabled
- No notifications, presence, connection indicator, sign-out
- Sign-in and invite explain that auth/accept are later
- No HTTP calls, no HttpClient provider, no Supabase

Phase 2 replaced the auth/signin/sign-out/HttpClient placeholders. See [10-phase2-auth.md](./10-phase2-auth.md). Root `.nvmrc` is `22.22.3`.

## Intentionally deferred (Phase 2+)

~~Authentication (Option A cookies), guards, API~~ (Phase 2). ~~Read-only workspace/projects/tasks/dashboard~~ (Phase 3). Still deferred: mutations (Milestone 4), query-cache-vs-realtime invalidation if resources prove insufficient, CRUD, Reactive Forms, realtime, presence, offline IDB, conflict dialog, attachments, notifications, invitations behavior, audit data, production reverse proxy, command palette, density settings.

## Coexistence config (portfolio root)

The Angular tree lives inside the same Git repo. Root `tsconfig.json`, `vitest.config.ts`, and `eslint.config.mjs` **exclude** `taskflow-angular/**` so Next.js typecheck/test/lint do not compile Angular specs. No TaskFlow runtime files were changed.

## REACT → ANGULAR OBSERVATIONS

1. **Next `Link` → `routerLink`.** Active state is `routerLinkActive` / `ariaCurrentWhenActive`, not `usePathname().startsWith`.
2. **`AppShell` children → nested `router-outlet`.** Chromeless routes are a **sibling layout route group**, not `if (pathname includes signin)`.
3. **`useState` for mobile nav → `signal()` on `UiStateService`.** One owner; TopNav and Shell both `inject()` it.
4. **Framer `AnimatePresence` drawer → CSS + CDK focus trap.** Reduced motion is CSS, not `useReducedMotion()`.
5. **Zustand persist theme → service + `localStorage` with an Angular-specific key.**
6. **Lucide icons → small inline SVG components.** No React icon package.
7. **`loadComponent` lazy routes replace per-file Next `page.tsx`.** The shell stays eager; pages become chunks.
8. **`inject()` + constructors replace hooks.** There are no `useXxx()` wrappers.
