# TaskFlow Authentication

TaskFlow uses **Supabase Auth** (Google OAuth), not the portfolio’s Auth.js/Prisma Event Horizon session.

## Why Supabase Auth

One identity provider tied to the same Postgres project that holds TaskFlow data. Session cookies work with `@supabase/ssr` in Next.js middleware and Route Handlers. Profiles are created via trigger + upsert when the user first hits the API.

## ELI15

Google says “this person is real.” Supabase gives them a badge (session). Middleware checks the badge before opening TaskFlow rooms. APIs call `requireTaskflowUser()` so mutations never run as a ghost. The secret key is a master key kept only on the server—normal requests use the user’s badge so RLS still applies.

## Flows

### Sign in

1. `/demos/taskflow/signin` → `signInWithOAuth({ provider: "google" })`  
2. Redirect to Google → back to `/auth/callback`  
3. Exchange `code` for session cookies  
4. Redirect to `next` or `/demos/taskflow/dashboard`

### Session restoration

Middleware refreshes the session on TaskFlow and TaskFlow API paths. Authenticated cookies are sent automatically on same-origin `/api/*` fetches.

### Sign out

Browser client `signOut()` then navigate to sign-in.

### Current user

`GET /api/me` + `useTaskflowMe()` for TopNav. Protected pages rely on middleware redirect when unauthenticated.

## Clients

| Client | Where | Key |
| --- | --- | --- |
| Browser | `lib/demos/taskflow/supabase/browser.ts` | Publishable |
| Server (user) | `server/taskflow/supabase/server.ts` | Publishable + cookies |
| Admin | `createTaskflowAdminClient()` | **Secret** (server-only) |

Application data paths use the **user-scoped server client** so RLS is never bypassed for normal CRUD.

## Env vars

See [TASKFLOW_INTEGRATION_SETUP.md](./TASKFLOW_INTEGRATION_SETUP.md).

Required:

- `NEXT_PUBLIC_SUPABASE_URL` (project URL, **not** `/rest/v1`)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL` (OAuth redirect origin)

## Supabase dashboard checklist

1. Authentication → Providers → **Google enabled**
2. Paste Google **Client ID** and **Client Secret** into that Supabase provider form  
   (you can reuse the same Google Cloud OAuth client as Event Horizon, but Supabase must have its own copy of the credentials)
3. Authentication → URL Configuration:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** include `http://localhost:3000/auth/callback`
4. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your OAuth client → **Authorized redirect URIs**, add:

   `https://wcmlsjhpgzgiadtqzggi.supabase.co/auth/v1/callback`

   (replace with your project ref if different). Keep the Event Horizon URI  
   `http://localhost:3000/api/auth/callback/google` if you still use that demo.

### Common “stuck on Google login” causes

| Symptom | Likely cause |
| --- | --- |
| Returns to sign-in with no error | Session cookies not set on callback (fixed in `/auth/callback`) or Google provider disabled |
| `redirect_uri_mismatch` from Google | Missing `https://<project>.supabase.co/auth/v1/callback` in Google Cloud |
| Provider error / unsupported | Google not enabled or Client ID/Secret blank in Supabase |
| Works then bounces to sign-in | Middleware sees no user — callback exchange failed |

TaskFlow does **not** use `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` from Auth.js. Those only power Event Horizon.
## What this is not

- Not Auth.js for TaskFlow  
- Not fake seed users in Local Storage  
- Not invitation emails (later phase)
