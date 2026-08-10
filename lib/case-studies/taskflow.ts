import type { CaseStudy } from "./types";

export const taskflowStudy: Omit<CaseStudy, "projectId"> = {
    overview:
      "TaskFlow is a collaborative workspace I built with Next.js, TypeScript, Supabase, and TanStack Query. It started as a dense project-management UI; it is now an authenticated SaaS-style demo with Postgres persistence, Row Level Security, versioned conflicts, realtime cache invalidation, and an offline mutation outbox.",
    problem:
      "Project tools have to show status, ownership, and deadlines without becoming noise—and the moment two people edit the same task, a fixture prototype stops being honest. I needed hierarchy in the UI and a backend that could survive refresh, roles, and conflicting writes.",
    approach:
      "I kept a shared app shell for navigation and command search, then moved entities onto Supabase with Google OAuth. TanStack Query owns server data; Zustand only keeps UI chrome. Mutations go through Next.js route handlers into services and repositories, with RLS enforcing workspace isolation on the user-scoped client.",
    howItWorks:
      "Edits send an expectedVersion. A Postgres RPC updates the row only when the version still matches; otherwise the API returns 409 with the latest record and the UI opens a conflict dialog. Realtime postgres_changes invalidate Query keys for the workspace. Safe offline mutations queue in IndexedDB and replay on reconnect.",
    architecture: [
      "React + TanStack Query",
      "Next.js API route",
      "Zod + session/RBAC",
      "Service",
      "Supabase client (RLS)",
      "Postgres / RPCs",
      "Realtime → cache invalidate",
    ],
    outcome:
      "TaskFlow is a Phase‑3 collaborative demo: Google sign-in, workspaces with roles, projects and tasks, comments, invitations, notifications, attachments, audit history, conflict detection, realtime invalidation, and offline-aware safe mutations. Seed data powers the portfolio demo workspace; invitation email delivery is still deferred.",
    learned:
      "I learned to treat realtime as a cache signal, not a second source of truth. Version checks on write are what keep two editors from silently overwriting each other.",
    currentState: {
      implemented: [
        "Supabase Auth with Google OAuth and proxy session refresh",
        "Workspaces, projects, tasks, assignees, comments",
        "RBAC roles with RLS policies",
        "Versioned updates and conflict UI",
        "Realtime invalidation + presence",
        "Offline outbox for safe mutations",
        "Invitations, notifications, attachments, audit views",
      ],
      demo: [
        "Seeded Portfolio Demo Workspace (projects, tasks, comments, attachments)",
        "Legacy fixture file retained for types/tests—not the live UI source",
      ],
      planned: [
        "Production invitation email delivery",
        "Workspace ownership transfer",
        "Align realtime publication with every subscribed table",
        "More accessible kanban keyboard/touch flows",
      ],
    },
    decisions: [
      {
        title: "Supabase Auth for TaskFlow",
        explanation:
          "I used Supabase Google OAuth here instead of Auth.js so auth, Postgres, RLS, storage, and realtime lived in one platform. Event Horizon still uses Auth.js—that split is intentional per product, not accidental duplication.",
      },
      {
        title: "TanStack Query for entities, Zustand for chrome",
        explanation:
          "Server state and UI chrome have different lifetimes. Query caches tasks and projects; Zustand keeps sidebar, density, presence, and conflict dialogs. Realtime invalidates Query keys instead of inventing a parallel store.",
      },
      {
        title: "Row Level Security on the user client",
        explanation:
          "Normal CRUD uses the cookie-scoped Supabase client so policies actually run. A secret admin client exists for seed/ops, not for everyday writes. That keeps authorization honest even if a route forgets a check.",
      },
      {
        title: "Optimistic concurrency with versioned RPCs",
        explanation:
          "I send expectedVersion on updates and let Postgres reject stale writes. The UI can offer the latest row instead of pretending last-write-wins is fine for collaboration.",
      },
      {
        title: "Offline outbox for safe mutations only",
        explanation:
          "Status edits and comments can queue while offline; membership and deletes cannot. That keeps collaboration usable on flaky networks without letting dangerous ops replay blindly.",
      },
      {
        title: "Presence without live cursors",
        explanation:
          "I show who is in the workspace and skip shared cursors. TaskFlow is not a canvas editor, and cursor theater would have cost more than it taught.",
      },
    ],
    nextStepsIntro:
      "Remaining gaps after auth, RLS, realtime, and conflict handling shipped.",
    nextSteps: [
      "Send production invitation emails for the existing token accept flow",
      "Support ownership transfer between workspace members",
      "Publish every table the client already subscribes to on supabase_realtime",
      "Improve kanban accessibility beyond native HTML drag and drop",
      "Add end-to-end tests against a real Supabase project",
    ],
    highlights: [
      "Google-authenticated collaborative workspaces",
      "RLS-backed projects, tasks, comments, and attachments",
      "Conflict detection with versioned updates",
      "Realtime cache invalidation and presence",
      "Offline-aware safe mutation outbox",
    ],
    metrics: [
      {
        label: "API handlers",
        value: "29",
        detail: "TaskFlow route modules across workspaces, tasks, and collab APIs",
      },
      {
        label: "Workspace views",
        value: "9",
        detail: "Dashboard through audit, plus sign-in and invite",
      },
      {
        label: "Seed tasks",
        value: "16",
        detail: "Demo workspace records after taskflow:seed",
      },
    ],
    charts: [],
  };
