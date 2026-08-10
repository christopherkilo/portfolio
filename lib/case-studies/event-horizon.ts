import type { CaseStudy } from "./types";

export const eventHorizonStudy: Omit<CaseStudy, "projectId"> = {
    overview:
      "Event Horizon is a full-stack event discovery demo I built with Next.js, TypeScript, Auth.js, Prisma, and PostgreSQL. I started with a calm discovery UI, then kept going once favorites and ticket holds needed a real source of truth. The interesting part is not the catalog itself—it is the layered API, transactional inventory, and authenticated reservation flow behind it.",
    problem:
      "Event sites often bury the event under chrome, then fall apart the moment you need accounts, shared favorites, or ticket inventory that cannot go negative. I wanted a discovery experience that stays readable, while still proving I can protect inventory and ownership on the server.",
    approach:
      "I kept event pages fast with static generation for the seeded catalog, then moved browse filtering onto a public API while favorites and reservations use authenticated routes. Meaningful filters live in the URL so a browse state is shareable after refresh. Business rules sit in services; Prisma repositories talk to PostgreSQL. That split keeps route handlers thin and gives inventory logic one place to live.",
    howItWorks:
      "When someone reserves tickets, the client posts to a Next.js route with an idempotency key. Zod validates the body, the session is required, and the reservation service opens a Prisma transaction that decrements remaining inventory only if enough tickets still exist. Soft cancel restores inventory once and checks ownership first.",
    architecture: [
      "React UI",
      "Next.js API route",
      "Zod validation",
      "Service",
      "Repository",
      "Prisma",
      "PostgreSQL",
    ],
    outcome:
      "Event Horizon is a working Auth.js + Postgres reservation demo: Google sign-in, URL-filtered browse, server favorites, and transactional ticket holds with idempotent creates. It is still a demo marketplace—no Stripe, and detail pages can lag live inventory because they ship from the static catalog—but the core backend path is real.",
    learned:
      "I learned to put money and inventory rules on the server early. Client-side estimates are fine for display; the database transaction is what prevents double-booking.",
    currentState: {
      implemented: [
        "Auth.js Google OAuth with database sessions",
        "Browse API with URL-synced filters",
        "Server favorites with optimistic UI + rollback",
        "Reservations with ownership checks and soft cancel",
        "Idempotent reservation creates and transactional inventory",
        "Focus-trapped modals and account tickets/favorites views",
      ],
      demo: [
        "16 fictional seeded events",
        "Confirmed status means held, not paid",
        "Attendee name/email collected in UI but not stored by the API",
      ],
      planned: [
        "Payments and receipts",
        "Live inventory on detail/home",
        "Browse pagination UI",
      ],
    },
    decisions: [
      {
        title: "Services and repositories over fat routes",
        explanation:
          "I separated reservation logic from the API handlers so routes stay thin and inventory rules have one home. The tradeoff is more files up front, but it made ownership checks and transaction behavior easier to test and reason about.",
      },
      {
        title: "URL state for browse filters",
        explanation:
          "I needed filters to survive refresh and remain shareable, so category, city, date, sort, and search live in the query string while React updates the UI immediately. It costs a bit of sync code, but deep links behave like a real product.",
      },
      {
        title: "Idempotent reservations + conditional inventory",
        explanation:
          "Retries happen. I key creates on an idempotency token and only decrement quantity when enough tickets remain inside a transaction. Replays return the existing reservation instead of inventing a second hold.",
      },
      {
        title: "Auth.js with database sessions",
        explanation:
          "Once favorites and reservations were personal, localStorage stopped being honest. Google OAuth through Auth.js plus Prisma sessions gave me a real user id to authorize against—without pretending guest saves were cross-device.",
      },
      {
        title: "Hybrid static catalog + live mutations",
        explanation:
          "Home and detail still use the seeded catalog for fast SSG pages. Browse and writes hit the API. That keeps marketing pages snappy, with the honest caveat that detail inventory is not always live until I wire the detail route to the API.",
      },
      {
        title: "Integer cents on the server",
        explanation:
          "Fees are calculated in cents in domain code so floating-point display math cannot invent money. The UI can show dollars; the server owns the authoritative fee math.",
      },
    ],
    nextStepsIntro:
      "Genuine next steps from the current demo—not work I have already shipped.",
    nextSteps: [
      "Add Stripe (or similar) so confirmed stops meaning pre-payment hold",
      "Serve detail/home inventory from the API so remaining tickets match Postgres",
      "Persist or remove attendee fields the UI currently validates but never sends",
      "Expose browse pagination controls the API already supports",
      "Add database integration tests for reservation race conditions",
    ],
    highlights: [
      "Auth.js + Prisma + PostgreSQL reservation path",
      "URL-synced discovery filters",
      "Transactional inventory with idempotent creates",
      "Optimistic favorites against a server API",
      "Ownership-checked soft cancel",
    ],
    metrics: [
      {
        label: "Domain APIs",
        value: "6",
        detail: "Events, favorites, and reservations route modules",
      },
      {
        label: "Prisma models",
        value: "8",
        detail: "Auth tables plus events, tickets, favorites, reservations",
      },
      {
        label: "Seeded events",
        value: "16",
        detail: "Typed catalog used for seed and SSG detail routes",
      },
    ],
    charts: [],
  };
