# TaskFlow Integration Setup

Environment and dashboard setup for the TaskFlow Supabase backend (Phase 1).

## Rules

1. Copy `.env.example` → `.env.local` if you do not already have a local file.
2. Put **real** values **only** in `.env.local`.
3. Keep `.env.example` as empty placeholders forever.
4. Never commit secrets. `.env.local` is gitignored.

## Application

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Base URL (OAuth redirects, absolute links). |

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Supabase (TaskFlow)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL only (e.g. `https://xxxx.supabase.co`). **Do not** append `/rest/v1`. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser + cookie session client. Safe with RLS. |
| `SUPABASE_SECRET_KEY` | Server-only admin client. **Never** expose to the browser. |

### Why two keys?

- **Publishable** — user session; RLS applies.
- **Secret** — server-only; bypasses RLS; reserved for admin/ops, not normal TaskFlow CRUD.

## Database

Apply TaskFlow migrations (or `supabase/APPLY_ALL_TASKFLOW.sql`) in the Supabase SQL editor before signing in. If you previously applied older migrations, also run `supabase/FIX_WORKSPACE_BOOTSTRAP_RLS.sql`.

### Demo seed

Populate a realistic Portfolio Demo Workspace (projects, tasks, comments, notifications, activity, attachment metadata):

```bash
npm run taskflow:seed
```

Uses the Supabase **secret** key from `.env.local`. Idempotent (fixed UUIDs + upserts). Optional: `TASKFLOW_SEED_OWNER_EMAIL` to pin Christopher to a specific Auth user. Does not seed presence or offline queue.

## Auth dashboard

### Local development

1. Enable Google provider in Supabase Authentication.
2. Site URL: `http://localhost:3000` (or your local `NEXT_PUBLIC_APP_URL`).
3. Redirect URL allowlist must include the **actual** app callback:

   `{NEXT_PUBLIC_APP_URL}/auth/callback`

   Example for default local: `http://localhost:3000/auth/callback`

### Production

1. Site URL: your deployed origin.
2. Redirect URL allowlist must include:

   `{deployed-origin}/auth/callback`

Do not ship with only localhost redirects configured if the app is deployed.

## Current integrations

TaskFlow already uses the configured Supabase project for:

- Authentication (Google OAuth + sessions)
- Postgres with Row Level Security
- Realtime / presence
- Storage attachments

Those features do not require extra environment variables beyond the Supabase keys above.

## Optional later providers

`.env.example` may include commented stubs for standalone email or push. Do not fill those until a later phase. They are not required for the current demo.

## Related docs

- [TASKFLOW_BACKEND_ARCHITECTURE.md](./TASKFLOW_BACKEND_ARCHITECTURE.md)
- [TASKFLOW_DATABASE.md](./TASKFLOW_DATABASE.md)
- [TASKFLOW_AUTHENTICATION.md](./TASKFLOW_AUTHENTICATION.md)
