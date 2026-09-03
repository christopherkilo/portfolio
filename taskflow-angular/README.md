# TaskFlow Angular

Independent Angular client for the TaskFlow migration. The React/Next.js app remains the known-good product.

Phase 9 adds task comments, attachments (signed-URL upload), task history, notifications, and a real workspace audit page. Architecture: `docs/angular-migration/17-phase9-product-surfaces.md`.

## Requirements

- Node.js `^22.22.3` (Angular 22 CLI will refuse older 22.x, including 22.17)
- npm
- The portfolio Next app running on `http://127.0.0.1:3000` for auth/API (`npm run dev` at the repo root)

The repo root `.nvmrc` is `22.22.3`.

## Scripts

```bash
npm start          # http://localhost:4200 (proxies /api and /auth → :3000)
npm test           # Vitest (Angular unit-test builder)
npm run test:ci    # watch=false
npm run build      # production build
```

## Local Google OAuth

The SPA starts Google sign-in via `GET /api/taskflow/auth/google` (proxied). The callback is the existing Next handler at `/auth/callback` on the **Angular origin**.

If Supabase rejects the redirect, add:

`http://localhost:4200/auth/callback`

under Authentication → URL Configuration. Do not put secrets in this repo.

React TaskFlow continues to use `http://localhost:3000/auth/callback`.
