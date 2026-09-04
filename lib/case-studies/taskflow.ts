import type { CaseStudy } from "./types";

export const taskflowStudy: Omit<CaseStudy, "projectId"> = {
  overview:
    "TaskFlow is a collaborative workspace for projects, tasks, and teammates. The public demo is an authenticated React app. A second Angular client was rebuilt against the same APIs to learn the framework.",
  snapshot: {
    role: "Full-Stack Developer",
    type: "Collaborative workspace",
    frontend: "Next.js 16 · React 19 · Angular 22 (learning client)",
    backend: "Next.js Route Handlers · Postgres · Supabase RLS",
    testing: "React and Angular unit tests · Playwright QA",
    architecture:
      "Versioned writes, realtime as cache invalidation, and an IndexedDB outbox for safe mutations only.",
    status: "Live demo",
  },
  verification: {
    items: [
      {
        category: "tested",
        detail:
          "React and Angular suites cover authentication, realtime behavior, and offline policy; Playwright covers the public demo surface.",
      },
      {
        category: "secure",
        detail:
          "Authentication uses Google OAuth with httpOnly cookies, while RLS and server authorization enforce workspace access.",
      },
      {
        category: "realtime",
        detail:
          "Task updates and workspace presence were verified across concurrent sessions.",
      },
      {
        category: "offline",
        detail:
          "Safe mutations queue in IndexedDB and replay after reconnect; unsafe mutations remain online-only by design.",
      },
      {
        category: "accessible",
        detail:
          "Dialog focus handling, named controls, keyboard behavior, and axe checks are covered across the tested surfaces.",
      },
    ],
    limitations: [
      "The public demo is the React client. Angular TaskFlow is a local learning rebuild, not production-deployed.",
      "Invitation email delivery is still deferred.",
    ],
  },
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
    "Signed-in visitors can run a seeded workspace: projects, tasks, comments, and teammates with roles. Conflicting edits surface a dialog instead of silent overwrites. Safe changes can queue offline and replay.",
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
    ],
  },
  decisions: [
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
        "I send expectedVersion on updates and let Postgres reject stale writes. The UI can offer the latest row instead of last-write-wins.",
    },
    {
      title: "Offline outbox for safe mutations only",
      explanation:
        "Status edits and comments can queue while offline; membership and deletes cannot. That keeps collaboration usable on flaky networks without letting dangerous ops replay blindly.",
    },
  ],
  nextSteps: [
    "Send production invitation emails for the existing token accept flow",
    "Support ownership transfer between workspace members",
    "Publish every table the client already subscribes to on supabase_realtime",
    "Improve kanban accessibility beyond native HTML drag and drop",
  ],
  metrics: [],
  charts: [],
};
