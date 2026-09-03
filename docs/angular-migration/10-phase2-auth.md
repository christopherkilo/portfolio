# 10 — Phase 2 authentication

Phase 2 implements **Option A: same-origin cookie authentication**. Angular is not an authentication or authorization authority. Supabase Auth, httpOnly (and supabase-ssr) cookies, Next server auth, `server/taskflow`, and RLS remain authoritative. Angular guards are UX only.

The React/Next.js TaskFlow under `/demos/taskflow` remains the known-good product.

This document is based on **source inspection and empirical runs**, not Phase 0 inference alone.

---

## Node version decision

| Constraint | Requirement |
| --- | --- |
| Angular 22.1 CLI (`@angular/cli` 22.1.6) | `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` (refuses Node 22.17) |
| Next.js 16.2.x (portfolio) | `node >= 20.9.0` |
| Smallest version that runs **both** | **22.22.3** |

**Choice:** repository floor is **Node 22.22.3**. No Volta/asdf (the repo did not already use them).

**Declarations:**

- Root `.nvmrc` → `22.22.3`
- Root `package.json` `"engines": { "node": "^22.22.3 || ^24.15.0 || >=26.0.0" }`
- `taskflow-angular/package.json` already had the same engines range

**Validation machine:** Node **22.23.2** (`$HOME/.local/node-v22.23.2`). That version satisfies Angular’s `^22.22.3` range.

**Next on 22.23.2:** `npx tsc --noEmit` PASS, `npm test` **361** PASS, `npm run build` PASS (Phase 2 session). Node 22.22.3+ did **not** break the existing Next application, so work continued.

---

## Actual previous (React) auth flow

Inspected: `components/demos/taskflow/auth/SignInView.tsx`, `app/auth/callback/route.ts`, `proxy.ts`, `server/taskflow/auth/session.ts`, `lib/demos/taskflow/supabase/browser.ts`, `server/taskflow/supabase/server.ts`, `app/api/me/route.ts`, `components/demos/taskflow/layout/TopNav.tsx`, `lib/demos/taskflow/auth/safeNextPath.ts`.

### 1. How does React begin Google OAuth?

In the **browser**. `TaskflowSignInView` calls `createTaskflowBrowserClient()` then `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/callback?next=…` } })`. There is **no** Next “start OAuth” endpoint for React. The browser supabase client sets PKCE cookies and navigates to Google/Supabase authorize.

### 2. What URL receives the callback?

`GET /auth/callback` (`app/auth/callback/route.ts`). Local React origin is `http://localhost:3000/auth/callback`.

### 3. Which component/server code exchanges the OAuth code?

The Route Handler. It creates a `@supabase/ssr` server client and calls `exchangeCodeForSession(code)`. Not a React component.

### 4. Which cookies are written/refreshed?

- **OAuth start (React):** supabase-ssr PKCE `code-verifier` cookies (`sb-<project-ref>-auth-token-code-verifier` and related flow cookies), `Path=/`, `SameSite=lax`. Observed on the Angular start route as well (same supabase-ssr cookie API). These Set-Cookie headers **did not include HttpOnly** in the live 307 — that is existing supabase-ssr PKCE cookie design, not an Angular store.
- **Callback:** session cookies written onto the **redirect response** (`setAll` → `redirectResponse.cookies.set`).
- **Ongoing:** `proxy.ts` calls `getUser()` and rewrites refreshed cookies onto the response for TaskFlow pages and APIs.

Angular does **not** copy these into `localStorage` / `sessionStorage` / signals / IndexedDB. The only Angular `localStorage` key remains `taskflow-angular-theme`.

### 5. How does `proxy.ts` participate?

Matcher includes `/demos/taskflow/:path*`, TaskFlow APIs including `/api/me` and `/api/taskflow/:path*`, and `/auth/callback`. It refreshes the session. Unauthenticated **pages** under `/demos/taskflow` (except signin/invite/callback) redirect to `/demos/taskflow/signin?next=`. **APIs are not redirected**; they return 401. Angular routes such as `/dashboard` are **not** in the proxy matcher — Angular `authGuard` performs that UX redirect.

### 6. What does `/api/me` return unauthenticated?

HTTP **401** envelope:

```json
{"success":false,"error":{"code":"UNAUTHORIZED","message":"Please sign in to continue.","fieldErrors":{}}}
```

Authenticated success is `{ success: true, data: { id, email, profile } }` where `profile` includes `display_name` and `avatar_url` (`TaskflowSessionUser` in `server/taskflow/auth/session.ts`).

### 7. How does current React signout work?

`TopNav` calls `supabase.auth.signOut()` in the **browser**. Angular cannot rely on that without shipping a supabase-js login client, so Phase 2 added `POST /api/taskflow/auth/signout` for the SPA only. React still uses the browser client.

### 8. Can `next` validation safely accept Angular routes?

**Not originally.** The previous allowlist was `/demos/taskflow…` only. `/dashboard` would have been rejected and replaced with `/demos/taskflow/dashboard`. Phase 2 extended `safeNextPath` with an **exact** Angular path allowlist (see below). Open redirects remain rejected.

### 9. Does the callback produce relative or absolute redirects?

**Absolute**, using `new URL(path, origin)`. `origin` is `request.url` unless loopback `X-Forwarded-Host` is present (`requestPublicOrigin`). Without that, a proxied callback on `:3000` would 307 the browser to Next (`:3000`) instead of Angular (`:4200`).

### 10. Which paths must the Angular dev proxy forward?

Only what auth actually uses:

- `/api` — `/api/me`, `/api/taskflow/auth/google`, `/api/taskflow/auth/signout` (and later TaskFlow APIs on the same prefix)
- `/auth` — `/auth/callback`

Not `/demos/taskflow`, not unrelated portfolio routes.

---

## Why backend compatibility changes were required

Documented **before** the edits:

1. **`safeNextPath` rejected Angular routes.** Without an allowlist extension, OAuth `next=/dashboard` or `next=/projects` could not return to Angular. Change: exact path allowlist, dummy-base URL parse, reject `https:`, `//`, `javascript:`, lookalikes, and `..` normalization that would escape the allowlist.
2. **Callback origin is absolute.** Dev proxy makes Next see `:3000` while the browser is on `:4200`. Change: trust `X-Forwarded-Host` **only** when the hostname is `localhost` or `127.0.0.1`. Production spoofed hosts are ignored.
3. **Angular must not become a second OAuth client.** Preferred: reuse existing PKCE + `/auth/callback`. The React start path uses supabase-js in the browser (Set-Cookie on the authorize navigation). Angular instead **top-level navigates** to `GET /api/taskflow/auth/google?next=` so the **Next server** runs `signInWithOAuth` + `skipBrowserRedirect` and writes PKCE cookies on the 307 to Google. Same callback, same cookies, no publishable-key OAuth client in the Angular bundle.
4. **Angular cannot call `supabase.auth.signOut()` without that client.** Added `POST /api/taskflow/auth/signout` which calls `signOut()` on the server and sets cookies on the JSON response. React unchanged.

React OAuth start, React sign-out, and React `next=/demos/taskflow/…` remain intact.

---

## Angular auth architecture

```
Browser (http://localhost:4200)
  → Angular AuthService.initialize() → GET /api/me (credentials)
  → dev proxy → Next :3000
  → requireTaskflowUser() / 401

Sign-in:
  Angular /signin → location.assign(/api/taskflow/auth/google?next=)
  → Next signInWithOAuth (PKCE cookies on 307)
  → Google / Supabase authorize
  → GET /auth/callback (proxied; X-Forwarded-Host: localhost:4200)
  → exchangeCodeForSession
  → 307 to http://localhost:4200/dashboard (or safe next)
  → AuthService sees /api/me 200
```

No Bearer interceptor. No token in Angular storage. Guards never authorize API access.

---

## Dev proxy

`taskflow-angular/proxy.conf.json` (wired in `angular.json` `serve.options.proxyConfig`):

- Target: `http://127.0.0.1:3000`
- `changeOrigin: false` (preserve Host for cookie semantics where possible)
- Forwards `X-Forwarded-Host: localhost:4200` and `X-Forwarded-Proto: http` so callback redirects use the Angular origin

**Empirical (curl + Playwright, 2026-09-01):**

- `GET http://127.0.0.1:4200/api/me` → 401 UNAUTHORIZED (same envelope as Next `:3000`)
- Playwright: that request is made from the Angular origin during `/dashboard` load
- `GET /api/taskflow/auth/google?next=/projects` via `:4200` → 307 to `*.supabase.co/auth/v1/authorize` with `redirect_to=http://localhost:4200/auth/callback?next=%2Fprojects`
- PKCE `Set-Cookie` on that 307
- `GET :4200/auth/callback?next=/projects` (no code) → 307 `http://localhost:4200/signin?…&next=/projects`
- Open redirect: `next=https://evil.example` → 307 to Angular origin **signin**, never `evil.example`

How to run:

```bash
# Node 22.22.3+ (e.g. 22.23.2)
npm run dev                              # Next :3000
cd taskflow-angular && npm start         # Angular :4200 with proxy
```

### Dev OAuth configuration (no secrets in source)

Reuse the **proxied** callback: `http://localhost:4200/auth/callback`.

If Google/Supabase rejects the redirect, add that URL under Supabase → Authentication → URL Configuration (Redirect URLs). Do not change production redirect allowlists silently. React local callback remains `http://localhost:3000/auth/callback`.

---

## HttpClient infrastructure

- `provideHttpClient(withInterceptors([credentialsInterceptor, authErrorInterceptor]))`
- `core/api/envelope.ts` — existing `{ success, data | error }` + `TaskflowApiError`
- `core/api/taskflow-api.ts` — `getMe()`, `signOut()` only (no entity cache)
- `credentialsInterceptor` — `withCredentials: true` only (no `Authorization`)
- `authErrorInterceptor` — **401 only**; 403 / 409 / 5xx pass through; `/api/me` uses `SKIP_AUTH_REDIRECT` so init 401 does not loop

No TanStack Angular Query. No `httpResource`. No workspace/project/task stores.

---

## AuthService

`core/auth/auth.ts` (`providedIn: 'root'`).

| Member | Role |
| --- | --- |
| `status` | `'checking' \| 'authenticated' \| 'unauthenticated'` |
| `currentUser` | `/api/me` payload or `null` |
| `isAuthenticated` | computed: status === `'authenticated'` |
| `logoutError` | user-visible logout failure |
| `initialize()` | shared promise; one `/api/me` |
| `ensureInitialized()` | guards wait on the same promise |
| `refreshUser()` | GET `/api/me` |
| `signInWithGoogle(next)` | `location.assign` to Next start route |
| `signOut()` | POST signout; **does not** clear UI state unless the server succeeds |
| `handleUnauthorized(url)` | clear UI state; `/signin?next=` |

Signals for state. RxJS/`firstValueFrom` for HTTP. No React-like hooks.

`provideAppInitializer` calls `initialize()` so startup and guards share one check.

---

## Guards

Functional standalone guards.

- **`authGuard`** on `TaskflowShell` (covers `/dashboard`, `/projects`, `/tasks`, `/calendar`, `/team`, `/audit`, `/settings`). Unauthenticated → `/signin?next=<safe local path>`. Waits while `checking`.
- **`guestGuard`** on `/signin` only. Authenticated → safe `next` (default `/dashboard`; `/invite?token=` when allowlisted). Avoids signin ↔ dashboard loops.

### Invite route (Milestone 5)

**`/invite` is not wrapped in `authGuard` or `guestGuard`.** Phase 5 implements acceptance (`?token=`). The route stays public (chromeless) so guests can reach it and signed-in users are not bounced away. OAuth `next` for `/invite?token=` is documented in [13-phase5-team-permissions.md](./13-phase5-team-permissions.md).

---

## Google OAuth (Angular)

1. Sign-in button → `AuthService.signInWithGoogle(query.next)`
2. `GET /api/taskflow/auth/google?next=` (allowlisted)
3. Server `signInWithOAuth` + PKCE cookies on 307
4. Existing `/auth/callback` exchanges code
5. Absolute redirect to Angular origin + safe path

React still starts OAuth in `SignInView` via supabase-js.

Failed exchange/start messages shown in the query string are **generic** (`Could not complete Google sign-in.` / `Could not start Google sign-in.`). Details stay in server logs.

---

## Logout

`POST /api/taskflow/auth/signout` → `supabase.auth.signOut()` → cookies on the JSON response.

- Success: Angular `status` → `unauthenticated`, navigate `/signin`
- Failure: keep `authenticated`, `logoutError` + `role="alert"` in TopNav; do not claim server logout succeeded

Unauthenticated POST through the proxy returns 200 `{ signedOut: true }` (idempotent supabase signOut).

---

## Safe return path

Implemented, strict:

- Angular: `safeAngularNextPath` — exact `/dashboard|/projects|/tasks|/calendar|/team|/audit|/settings`
- Shared Next: `safeNextPath` — those Angular paths **or** `/demos/taskflow…`
- Rejects `https://evil.example`, `//evil.example`, `javascript:`, encoded externals, lookalike prefixes

Playwright: unauthenticated `/projects` → `http://127.0.0.1:4200/signin?next=%2Fprojects`.

Live “login then land on `/projects`” requires completing Google (not done in this unattended session). The `next` query is preserved through the start URL (`?next=%2Fprojects` on the authorize `redirect_to`).

---

## Sign-in page and shell

- `/signin`: Google-only, disabled while `busy` or `checking`, `role="alert"` for errors, local-only callback hint
- TopNav: initials from `profile.display_name` or `email`; Sign out; no fake workspace picker / Jordan Blake / team lists

---

## 401 handling

Interceptor clears Angular session state and redirects to `/signin?next=` **only** on HTTP 401 (except `/api/me` init). 403 is not 401. 409 is not 401. 500 is not 401.

---

## Manual / browser validation

Both servers running: Next `localhost:3000`, Angular `127.0.0.1:4200` (proxy). Playwright Chromium + curl.

| Case | Result |
| --- | --- |
| **A** Unauthenticated `/dashboard` | **PASS.** Playwright URL `…/signin?next=%2Fdashboard`. `GET /api/me` 401 on Angular origin. Heading “Welcome to TaskFlow”. |
| **B** Google sign-in | **PASS (start + callback wiring).** Curl: 307 to Supabase authorize, `redirect_to` Angular `/auth/callback`, PKCE cookies. Playwright: Google button navigates to `/api/taskflow/auth/google?next=…`. **Interactive Google consent / session cookies after exchange were not completed** (no human Google account in this session). |
| **C** Refresh authenticated `/dashboard` | **Not live-exercised** (no established session). Covered by AuthService init + guard wait-for-checking tests. |
| **D** Navigate protected routes | Guard unit tests PASS. Live session persistence not exercised. |
| **E** Sign out | Endpoint reachable via proxy; unit tests for success vs honest failure. Live session end not exercised. |
| **F** Refresh after signout | Not live-exercised. |
| **G** Safe return path | **PASS (pre-login).** `/projects` → `/signin?next=%2Fprojects`. Post-OAuth landing on `/projects` needs CASE B completion. |
| **H** React TaskFlow sign-in | **PASS.** `http://localhost:3000/demos/taskflow/signin` 200, “Continue with Google” visible. Callback without forwarded host still redirects to `:3000` React sign-in. |

### React regression (automated + HTTP)

- Sign-in page loads
- `safeNextPath` still defaults React `next` to `/demos/taskflow/dashboard`
- Callback without `X-Forwarded-Host` uses Next origin
- Shared allowlist tests: 361 Next tests PASS including `safeNextPath.test.ts`

A full Google round-trip on React was not clicked in this session (same human-account limit). The React start path was not replaced.

---

## Security checks

| Check | Result |
| --- | --- |
| No `SUPABASE_SECRET_KEY` in Angular source or `dist/` | PASS |
| No server secret in Angular environment files | PASS (no auth env files) |
| No auth token persisted in localStorage/sessionStorage/signals | PASS (theme key only) |
| No token logged to console in Angular | PASS |
| No open redirect | PASS (curl + unit tests) |
| Guards are UX only | PASS (documented; APIs still `requireTaskflowUser`) |
| Backend/RLS remains authoritative | PASS |
| 401 and 403 not conflated | PASS (interceptor) |
| Session cookies not mirrored into JS storage | PASS |
| PKCE cookies HttpOnly | **Existing supabase-ssr:** start-route Set-Cookie lacked HttpOnly. Not changed (would risk React). |

---

## Tests

**Angular:** 39 passed / 6 files (`ng test --watch=false`).

Coverage includes AuthService checking/authenticated/unauthenticated, duplicate init, logout success/failure, 401 clear, Google start URL, unsafe `next`; guards allow/deny/`next`/guest/checking; sign-in button/disabled/`role=alert`; shell identity from `/api/me` fields only; no fake Jordan Blake workspace data.

**Angular production build:** PASS.

**Portfolio:** `tsc --noEmit` PASS, **361** tests PASS, production `npm run build` PASS (this Node version).

---

## Files modified outside `taskflow-angular/`

- `.nvmrc` (new)
- `package.json` (`engines`)
- `lib/demos/taskflow/auth/safeNextPath.ts` (shared allowlist + origin helper)
- `lib/demos/taskflow/auth/safeNextPath.test.ts`
- `app/auth/callback/route.ts` (`requestPublicOrigin`, `signInPathForNext`, generic exchange error)
- `app/api/taskflow/auth/google/route.ts` (new; Angular OAuth start)
- `app/api/taskflow/auth/signout/route.ts` (new; Angular logout)
- `components/demos/taskflow/auth/SignInView.tsx` (imports shared `safeNextPath`; Google flow unchanged)
- `docs/angular-migration/*` (this file + README / pointers)

`proxy.ts` matcher already included `/api/taskflow/:path*` and `/auth/callback` — **no matcher change**.

---

## Backend / auth compatibility changes

1. `safeNextPath` accepts exact Angular app paths in addition to `/demos/taskflow…`
2. `signInPathForNext` chooses `/signin` vs `/demos/taskflow/signin`
3. `requestPublicOrigin` honors loopback `X-Forwarded-*` only
4. `GET /api/taskflow/auth/google` (Angular-only start)
5. `POST /api/taskflow/auth/signout` (Angular-only logout)
6. Callback user-facing exchange errors are generic (details logged server-side)

---

## Problems discovered

1. Angular 22 CLI **requires Node ^22.22.3**; Node 22.17 cannot build/serve the SPA. Standardized via `.nvmrc`.
2. Host-based cookies are not enough: **absolute callback redirects** follow Next’s origin unless loopback forwarded host is trusted.
3. React OAuth start is **browser supabase-js**, not a Next route. Angular uses a small server start route so PKCE cookies attach to the Google 307 without duplicating supabase-js login in the SPA.
4. supabase-ssr PKCE cookies on OAuth start were **not HttpOnly** in observed Set-Cookie headers.
5. **Interactive Google consent was not completed** in this unattended session. Session-cookie refresh after login, live logout-of-a-real-session, and post-login `/projects` landing remain for a human pass once `http://localhost:4200/auth/callback` is allowed in Supabase.
6. Playwright following the authorize URL hit `ERR_NAME_NOT_RESOLVED` for `supabase.co` in one run; curl to the same authorize Location succeeded. Validation of CASE B therefore used curl headers + Playwright click-to-start, not the Google account picker.
7. A callback with a fake `code` previously reflected a long PKCE error string in `?error=`. User-facing text is now generic.

Same-origin cookie auth **did not** require switching to Bearer/JWT Option B.

---

## REACT → ANGULAR AUTH LESSONS

1. **Next protected page → Angular `authGuard` + still-secure backend.** `proxy.ts` still does not treat `/dashboard` as a Next page. The guard is UX; `/api/me` and later APIs still throw `UNAUTHORIZED`.
2. **httpOnly (and supabase-ssr) cookie session → AuthService observes identity through `/api/me`, not by reading the token.** Signals store user **state**, never the credential.
3. **React `signInWithOAuth` in the browser → Angular top-level navigation to a Next start route.** PKCE Set-Cookie must happen on a document navigation, not a CORS `HttpClient` call, or the callback cannot exchange the code.
4. **React `supabase.auth.signOut()` in TopNav → `POST /api/taskflow/auth/signout`.** Clearing a signal is not logout. Failed server logout must leave the UI authenticated.
5. **`safeNextPath` was React-prefix-only.** Exact Angular prefixes are a compatible extension; “accept any URL” is not.
6. **Relative vs absolute callback redirects matter across ports.** Cookies are host-based; OAuth `Location` is origin-based. Dev proxy must send `X-Forwarded-Host` for loopback only.
7. **`checking` vs `unauthenticated` prevents flicker.** Guards must `await initialize()` or `/dashboard` will bounce to `/signin` before `/api/me` returns.
8. **401 ≠ 403 ≠ 409.** An interceptor that treats every error as auth failure would hide authorization and conflict bugs.
9. **`/invite` must stay unguarded** so guests and signed-in users can both reach the accept UI. Phase 5 owns token + OAuth `next` — [13-phase5-team-permissions.md](./13-phase5-team-permissions.md).
10. **Do not ship a second auth authority** (no Angular supabase secret, no JWT store) just because the SPA cannot call `signInWithOAuth` the same way React does.

---

## Phase 3 readiness

Option A is implemented and proven at proxy, cookie-start, `/api/me`, guards, and React coexistence layers. Phase 3 (read-only server entities + query cache decision) may proceed. Do not treat this document as a live Google-account session recording.

**Still deferred (from Phase 2 view):** realtime, offline, attachments, production reverse proxy, Option B Bearer. Invitations accept is Phase 5.
