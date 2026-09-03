# 05 — Authentication migration decision

**Status:** decision memo only. No implementation.

## Current model (must keep working)

```
React browser
  → Supabase Auth (Google OAuth, PKCE)
  → GET /auth/callback (Next Route Handler sets httpOnly cookies)
  → proxy.ts refreshes session on TaskFlow pages + APIs
  → fetch /api/* credentials: same-origin
  → createTaskflowServerClient() (publishable key + cookies)
  → RLS as that user
```

Sources: `SignInView.tsx`, `app/auth/callback/route.ts`, `proxy.ts`, `server/taskflow/supabase/server.ts`, `lib/demos/taskflow/supabase/browser.ts`.

The **admin** client (`createTaskflowAdminClient` + `SUPABASE_SECRET_KEY`) is server-only (seed, privileged ops). **Angular must never receive it.**

`safeNextPath` only allows `next` under `/demos/taskflow`. Angular URLs are not valid callback targets today.

`proxy.ts` page-redirects unauthenticated users only for `/demos/taskflow/*` (not `/api/*`). An Angular path such as `/tf/*` would **not** get that redirect until a later, explicit matcher change.

Localhost ports are **different origins**. Cookies for `localhost:3000` are not sent to `localhost:4200`.

---

## OPTION A — Same-origin cookies (dev proxy / reverse proxy)

Angular never holds a user JWT for API calls. The browser talks to **one site origin**. `/api/*` and `/auth/callback` remain Next.js. Session cookies stay httpOnly as today.

**Development:** `ng serve` `proxy.conf.json` forwards `/api`, `/auth`, and (if needed) `/demos/taskflow` to Next (`localhost:3000`). OAuth `redirectTo` stays `{nextOrigin}/auth/callback?next=/demos/taskflow/...` **or**, once an Angular public path exists, callback still hits **Next** `/auth/callback` on the origin the user sees (the Angular origin if proxied).

**Production coexistence:** reverse proxy or Next rewrite serves Angular static assets under a prefix on the **same registrable domain** as the APIs. React stays at `/demos/taskflow`.

### Evaluation

| Axis | Assessment |
| --- | --- |
| Security | Best of the three for XSS: refresh tokens stay in httpOnly cookies. No SPA token store. |
| RLS | Unchanged. User-scoped server client already proven. |
| Dev experience | Requires proxy discipline (Cookie forwarding, WebSocket realtime may still go **direct** to Supabase URL — that already uses the **publishable** key + user JWT from supabase-js in the browser today). |
| Production | Need same-origin hosting. Standard for this repo (portfolio already hosts Next). |
| Impact on React | **None** if cookies and callback stay as-is. |
| Backend changes | **None** for auth adapters. Later: optional `proxy` matcher + `safeNextPath` if Angular routes should be first-class `next` targets. |
| Cookie / CORS | No CORS if same origin. If proxy is misconfigured, `Set-Cookie` on the wrong host breaks sign-in (already documented for the callback). |
| OAuth callback | Keep `app/auth/callback/route.ts`. Do not duplicate PKCE in Angular. |
| Token refresh | Continues in `proxy.ts` on API/page hits. Angular must hit a proxied path so refresh runs, or call `/api/me` periodically. |
| Testability | E2E against one origin (Playwright already used in the repo). |

**Realtime caveat:** `RealtimeManager` uses `createTaskflowBrowserClient()` (publishable key) in the **browser**. That client uses the **Supabase Auth session in the browser**, which `@supabase/ssr` also mirrors into cookies. Angular must initialize the same browser client (publishable only) so the Realtime socket is authenticated. That is not Option B; it is how React already works. Do not pass the secret key.

---

## OPTION B — Bearer access token to existing API

Angular calls `supabase.auth.getSession()`, sends `Authorization: Bearer <access_token>` to Next APIs. Server grows an adapter: if Bearer present, create a Supabase client **as that JWT**; else keep cookies.

### Evaluation

| Axis | Assessment |
| --- | --- |
| Security | Access token in Angular memory (OK) or localStorage (XSS). Dual auth paths increase bug surface. Refresh must be implemented in the SPA. |
| RLS | Works **if** the server uses the user JWT, not the secret key. Easy to get wrong. |
| Dev experience | Angular on `:4200` can call Next on `:3000` with CORS + Bearer. No cookie proxy. |
| Production | Allows CDN-hosted Angular + API on another origin. |
| Impact on React | Cookie path can remain. **Must not** break cookie client. |
| Backend changes | **Required:** parse Bearer, CORS allowlist, maybe skip cookie refresh for those requests. Dual tests. |
| Cookie / CORS | CORS preflight, `Authorization` header, no credentials cookies needed for API (but OAuth still needs a callback origin). |
| OAuth callback | Still needs a place to complete PKCE. Could stay Next or move to Angular + `detectSessionInUrl`. Two OAuth completions = INVITE-001 risk. |
| Token refresh | `supabase.auth.onAuthStateChange` in Angular; interceptor attaches new token. |
| Testability | Must mock two auth modes forever. |

Reject any design that uses `SUPABASE_SECRET_KEY` in Angular or that makes Route Handlers run as admin “because SPA.”

---

## OPTION C — Separate BFF / new auth product

e.g. Auth.js for Angular, or a new token service. **Rejected:** would fork identity from TaskFlow RLS, duplicate Google OAuth, and threaten React. Not superior.

---

## Recommendation

**Choose OPTION A** for the entire coexistence period (Milestones 1–10) and for production while React remains the known-good app.

### Why

1. **Zero auth backend rewrite** — React keeps working; RLS path unchanged.
2. **httpOnly cookies** remain the session store; Angular does not become a token wallet.
3. **OAuth stays** on the already-correct callback that writes cookies onto the **redirect response** (comment in `app/auth/callback/route.ts`).
4. Learning Angular does not require learning a second security model at the same time.
5. Option B remains a **later** adapter if Angular is hosted on a **different origin** (CDN). That is a hosting decision, not a Phase 1 requirement.

### What Angular still uses supabase-js for

Only the **publishable** browser client, same as React:

- OAuth start (`signInWithOAuth`) if the sign-in page is Angular-hosted on the proxied origin
- Realtime + presence channel
- `signOut()`

API CRUD stays on `HttpClient` → Next Route Handlers → cookie server client.

### Required later (not Phase 0)

Only if Angular routes should be legal post-login destinations:

- Extend `safeNextPath` to allow the Angular base path
- Extend `proxy.ts` matcher for that path (UX redirect, not API security)

If Angular and React share an origin, **split IndexedDB / persist keys** (`taskflow-angular-offline-v1`) so two UIs do not double-replay the same outbox (see `07-risk-register.md` HOST-001).

### Explicitly not recommended now

Option B as the default. It is the right **escape hatch** for split-origin production, with a written adapter and tests, after React is no longer the only client that must stay frozen.
