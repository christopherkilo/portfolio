---
title: "Rebuilding TaskFlow in Angular"
description: "How I rebuilt TaskFlow as a second Angular client against the same Next.js APIs—as a way to learn the framework before a full application, not as a replacement for the React product."
date: 2026-09-02
project: TaskFlow
featured: false
tags:
  - TaskFlow
  - Angular
  - Next.js
  - Supabase
  - TypeScript
coverImage: "generated:taskflow"
---

## Starting as a product, not a framework tutorial

TaskFlow was already a real collaborative workspace before Angular entered the picture. Google sign-in, workspaces with roles, projects and tasks, comments, invitations, notifications, attachments, audit history. Postgres behind Row Level Security. Versioned writes that open a conflict dialog instead of last-write-wins. Realtime as a cache signal. An offline outbox for mutations that are safe to replay.

That product still lives at `/demos/taskflow`. It is the known-good client. I did not freeze it, replace it, or take it offline to make room for a rewrite.

What I wanted next was not another greenfield todo app. I wanted to learn Angular against a backend I already trusted, with constraints that a tutorial never has: cookies, 409s, presence, signed uploads, and an outbox that must not leak work across users.

## Why a second client at all

The honest reason is smaller than a migration pitch. I rebuilt a version of TaskFlow in Angular as a way to learn the framework before building a full application.

A throwaway lab would have taught me standalone components and a router. It would not have taught me what happens when a guard, an interceptor, and a cookie session have to agree. It would not have forced a decision about whether a comment POST belongs in IndexedDB. Those questions only show up when the APIs are already real.

So the Angular app sits beside the portfolio, not instead of it. Same Next.js route handlers. Same Supabase project. Same RLS. The React UI remains the live demo. The Angular UI is a second client I can run locally, aimed at the same contracts.

I am not going to call that production parity. It was never deployed as the public TaskFlow. It was rehearsal for a later Angular product, using a product I already understood.

## Keep the backend, change the client

The Next.js layer still owns auth and data. Google OAuth completes on `/auth/callback`. Session cookies are httpOnly. Browser calls go to `/api/taskflow/*` and `/api/me` with credentials. Angular never holds a user JWT for API work.

That was a deliberate constraint. If the learning client had grown its own token store, I would have been practicing a different product. The point was to see whether Angular could speak the existing cookie contract through a proxy, a guard, and an interceptor that treats 401 as “go sign in,” not as a chance to invent a second auth system.

Workspace isolation stays in Postgres. Roles on the client are UX. A viewer can open `/audit` in the shell; the API still denies it. I kept that split on purpose. Rebuilding the UI is not a license to move authorization into the framework of the week.

## What had to stay true

Versioned updates still send `expectedVersion`. Postgres still rejects a stale write. The Angular client opens a conflict session instead of silently retrying status and hoping the last PATCH wins.

Realtime still invalidates. It does not become a second store. Presence still means who is in the workspace, not live cursors.

Offline still has a narrow allowlist. Creates, membership changes, and deletes do not queue. Comment create does not queue either: a POST is not idempotent, and I would rather fail online than replay a duplicate thread. The outbox is bound to the signed-in user. Replay takes a Web Lock so two tabs do not drain the same queue.

Account settings read `/api/me`. They do not pretend a local Zustand write is a saved profile. That is an intentional difference from the React client, not a missing screen.

None of this required Angular. It required not using the rewrite as an excuse to get sloppy.

## What Angular was actually for

The framework work was the reason I did this, and I tried to keep it honest.

Standalone components, the router, `providedIn` services, signals for session and chrome, reactive forms for versioned edits, `httpResource` for reads. Guards for signed-in and guest routes. Interceptors for cookies and 401. No NgRx. TaskFlow did not need a global action log to teach me the primitives I would want in a later app.

Calendar and Settings had to become real surfaces, not placeholders with the right route names. A learning rebuild that leaves those as “FoundationPage” is a tour of the sidebar. I wanted the month grid, week start, notification preferences, and the awkward parts of a settings page that has to tell the truth about what the server will persist.

I also let some product choices diverge where React had a shortcut I did not want to copy. Status-only 409 does not auto-retry. The board does not pretend HTML drag-and-drop is the write path. History events are formatted instead of dumped as raw JSON. Those are not Angular flexes. They are the kind of product calls you only make when you are looking at the same API twice.

## What I am not claiming

The public demo is still React. If you open TaskFlow on this site, you are in the Next.js client.

I did not ship Angular TaskFlow to Vercel as the live product. I did not complete unattended Google OAuth against `localhost:4200` as a substitute for sitting through the consent screen. Two-browser realtime and a dedicated Angular Playwright grid were never the acceptance bar for “I learned the framework.”

Unit tests and a production build are evidence that the client hangs together. They are not a claim that every responsive breakpoint was visually signed off, or that invitation email delivery suddenly exists. That last gap is still on the backend, in both clients.

If I had presented this as “TaskFlow is now Angular,” I would have been lying about the demo and about the goal. The goal was a second implementation I could throw away or keep, before I bet a full application on the stack.

## What I would do next

Not a Phase 11 of TaskFlow. The React product still has its own list: invitation email, ownership transfer, publishing every table the client already subscribes to, kanban that is actually usable from the keyboard.

The Angular work is finished as a learning rebuild. The useful output is the scar tissue: cookie auth across two origins, an outbox that cannot cross users, conflicts that do not auto-overwrite, and a settings page that refuses to fake a save.

The next Angular application can start from those habits instead of from a tutorial that never had to share a backend with a product I already shipped.
