import type { CaseStudy } from "./types";

export const eventHorizonStudy: Omit<CaseStudy, "projectId"> = {
  overview:
    "Event Horizon is a full-stack event discovery demo: a curated catalog with Auth.js reservations on PostgreSQL, plus real Ticketmaster listings ingested through an AWS pipeline and refreshed twice a day. Native events can be reserved. External events are discovery cards that open the provider’s ticket page.",
  problem:
    "Reservations and provider catalogs are not the same workload. Holds, inventory, users, and favorites need transactional consistency. External listings need ingestion, normalization, deduplication, retries, expiration, and a refresh schedule. Forcing both into one database would either weaken inventory guarantees or make a discovery cache pretend to be a booking system.",
  approach:
    "I kept PostgreSQL and Prisma as the source of truth for native events, ticket inventory, users, favorites, and reservations. Ticketmaster data lands in DynamoDB as a discovery cache, keyed by provider and externalId, and never enters the reservation APIs. A Docker worker collects events; SQS and Lambda persist them; a read-only Function URL feeds the UI. If that URL is missing or AWS is down, the curated catalog still renders.",
  howItWorks:
    "EventBridge starts the existing Fargate worker at 8:00 AM and 8:00 PM America/Chicago. The container calls Ticketmaster Discovery, posts normalized messages to SQS, and exits. An ingestion Lambda validates each message and upserts DynamoDB: first-seen ingestedAt stays put, updatedAt moves forward, and records expire about seven days after start. The UI never talks to DynamoDB. It calls a Query-only Lambda over HTTPS. Native browse and checkout still go through Next.js APIs and Prisma transactions.",
  architecture: [
    "Ticketmaster",
    "EventBridge",
    "Fargate",
    "SQS",
    "Lambda",
    "DynamoDB",
    "Read Lambda",
    "Event Horizon",
  ],
  architectureHighlight: {
    title: "Cloud event pipeline",
    description:
      "A short-lived importer, not a standing cluster. Write path and read path stay separate so the browser never needs AWS credentials.",
    paths: [
      {
        label: "Ingest",
        steps: ["Ticketmaster", "Fargate", "SQS", "Lambda", "DynamoDB"],
      },
      {
        label: "Read",
        steps: ["DynamoDB", "Read Lambda", "Event Horizon"],
      },
    ],
  },
  architectureLanes: [
    {
      title: "Native application",
      caption:
        "Transactional path. Reservations, inventory, users, and favorites stay on PostgreSQL via Prisma. Ticketmaster rows never use this path.",
      steps: [
        "Event Horizon UI",
        "Next.js APIs",
        "Prisma",
        "PostgreSQL",
      ],
    },
    {
      title: "External discovery",
      caption:
        "Provider cache. Ticketmaster listings are ingested asynchronously, stored by provider + externalId, and shown as outbound discovery cards.",
      steps: [
        "Ticketmaster",
        "EventBridge",
        "Fargate",
        "SQS",
        "Lambda",
        "DynamoDB",
        "Read Lambda",
        "UI",
      ],
    },
  ],
  architectureEntry: ["User", "Event Horizon / Next.js"],
  decisionsHeading: "Engineering decisions",
  techGroups: [
    {
      label: "Frontend",
      items: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    },
    {
      label: "Backend / data",
      items: ["PostgreSQL", "Prisma", "Auth.js"],
    },
    {
      label: "AWS cloud",
      items: [
        "ECS/Fargate",
        "Lambda",
        "SQS",
        "DynamoDB",
        "EventBridge",
        "SSM",
        "IAM",
        "CloudWatch",
        "CDK",
      ],
    },
    {
      label: "Integration",
      items: ["Docker", "Ticketmaster Discovery API"],
    },
  ],
  deepDives: [
    {
      title: "Why ECS / Fargate?",
      explanation:
        "The Ticketmaster importer is a Dockerized TypeScript worker. It only needs to run when the schedule fires, talk to Ticketmaster and SQS, then exit. Fargate fits that shape: no always-on ECS Service, no idle containers, and EventBridge can call RunTask on the existing task definition. Public subnets plus a public IP keep NAT Gateway cost out of a learning account.",
    },
    {
      title: "Why SQS?",
      explanation:
        "Collection and persistence should not share a process. The worker can finish even if DynamoDB is briefly unhappy; Lambda can retry a single bad payload without blocking the rest of the batch. Partial batch failure reporting and a DLQ after three receives were verified with a malformed message—the poison payload left the main queue instead of looping forever.",
    },
    {
      title: "Why two Lambdas?",
      explanation:
        "The ingestion function is UpdateItem-only: validate, normalize, upsert, preserve ingestedAt, bump updatedAt, set TTL. The reader is a separate Query-only Function URL for the UI. Mixing those permissions on one function would blur a write processor with a public read API. A Function URL is enough here; this is not a general-purpose API platform.",
    },
    {
      title: "Why DynamoDB?",
      explanation:
        "External events are looked up and refreshed by provider + externalId. That key makes a twice-daily Ticketmaster pull update the same logical rows instead of inserting duplicates. DynamoDB is a fit for that cache pattern. It is not a replacement for PostgreSQL, and it is not “better”—reservations still need relational transactions.",
    },
    {
      title: "Reliability that was actually verified",
      explanation:
        "SQS retries, DLQ after repeated malformed messages, partial batch failures, deterministic provider IDs, and idempotent refreshes are in the deployed path. Repeat ingestions keep ingestedAt stable and advance updatedAt. Records TTL about seven days after start. If the public reader is missing or fails, the UI keeps the native catalog and shows a quiet unavailable note—not an AWS stack trace.",
    },
    {
      title: "Security choices",
      explanation:
        "The Ticketmaster key lives in SSM as a SecureString and is injected into ECS at runtime. It is not in git, Vercel, or the browser. The browser never receives AWS credentials. IAM is split on purpose: scheduler RunTask plus PassRole for the two task roles, worker SendMessage only, ingestion UpdateItem only, reader Query only.",
    },
    {
      title: "Cost-conscious defaults",
      explanation:
        "No NAT Gateway, no always-running ECS Service, on-demand DynamoDB, short-lived Fargate, Lambda for processing, and seven-day log retention. The schedule is twice daily—about two normal Ticketmaster Discovery requests per day, not a polling loop.",
    },
  ],
  outcome:
    "The live demo shows real Dallas Ticketmaster events next to the seeded Event Horizon catalog. External cards badge the source, show venue, city, date, and imagery, and open Ticketmaster or Ticketweb. They cannot enter the reservation modal. Native events still use Auth.js, inventory, and transactional holds. This remains a portfolio demo—no Stripe, no production traffic claims.",
  learned:
    "The useful lesson was matching storage to workload instead of collecting AWS logos. Once reservations stayed on Postgres and discovery stayed on DynamoDB, IAM, retries, and the UI contract got simpler: one path books seats, the other only lists what a provider already sells.",
  currentState: {
    implemented: [
      "Auth.js Google OAuth with database sessions",
      "Browse API with URL-synced filters and source distinction",
      "Transactional reservations with idempotent creates",
      "Dockerized Ticketmaster worker on short-lived Fargate",
      "SQS ingestion with DLQ after three failures",
      "Idempotent DynamoDB upserts and Query-only public reader",
      "EventBridge schedule at 8 AM / 8 PM America/Chicago",
    ],
    demo: [
      "16 fictional seeded native events",
      "Up to 20 Ticketmaster events per current ingestion run",
      "Confirmed status means held, not paid",
      "External cards are discovery links, not Event Horizon inventory",
    ],
    planned: [
      "Payments and receipts",
      "Live inventory on native detail/home pages",
      "Browse pagination UI",
    ],
  },
  decisions: [
    {
      title: "PostgreSQL and DynamoDB instead of one database",
      explanation:
        "Reservations need transactions and inventory that cannot go negative. Provider catalogs need upsert-by-external-id and a TTL. I kept both stores rather than stretching one model to cover two jobs. DynamoDB does not replace PostgreSQL here.",
    },
    {
      title: "SQS instead of synchronous ingestion",
      explanation:
        "The worker should not write DynamoDB itself. A queue absorbs a page of events, lets Lambda fail a single record, and keeps provider collection decoupled from persistence.",
    },
    {
      title: "Fargate task instead of an ECS Service",
      explanation:
        "The importer runs twice a day and exits. An always-on service would idle for most of the day. EventBridge Scheduler starts the existing task definition; there is still no ECS Service.",
    },
    {
      title: "No NAT Gateway",
      explanation:
        "The task is outbound-only: Ticketmaster and AWS APIs. Public subnets with assignPublicIp enabled avoid a fixed NAT charge in a learning account. This is not a pattern for inbound application traffic.",
    },
    {
      title: "Lambda Function URL instead of a larger API platform",
      explanation:
        "The public reader is GET-only JSON for one provider. A Function URL with CORS for the real site and localhost is enough. API Gateway would be extra surface for this scope.",
    },
    {
      title: "Idempotent reservations + conditional inventory",
      explanation:
        "Retries happen. Native creates key on an idempotency token and only decrement quantity when enough tickets remain inside a Prisma transaction. Replays return the existing hold.",
    },
    {
      title: "URL state for browse filters",
      explanation:
        "Category, city, date, sort, search, and source live in the query string so a browse view is shareable after refresh. Ticketmaster vs Event Horizon is a filter, not a second app.",
    },
    {
      title: "Auth.js with database sessions",
      explanation:
        "Favorites and reservations are personal. Google OAuth plus Prisma sessions give a real user id to authorize against. External Ticketmaster cards never use that session for checkout.",
    },
  ],
  nextStepsIntro:
    "Product next steps from the current demo—not more AWS services. The Event Horizon cloud path is complete.",
  nextSteps: [
    "Add Stripe (or similar) so confirmed stops meaning a pre-payment hold",
    "Serve native detail/home inventory from the API so remaining tickets match Postgres",
    "Persist or remove attendee fields the UI currently validates but never sends",
    "Expose browse pagination controls the API already supports",
    "Add database integration tests for reservation race conditions",
  ],
  highlights: [
    "PostgreSQL for reservations; DynamoDB for discovery only",
    "Twice-daily Ticketmaster refresh without an ECS Service",
    "Idempotent provider upserts (stable ingestedAt, advancing updatedAt)",
    "Query-only public reader; UpdateItem-only ingestion Lambda",
    "Graceful UI fallback when external events are unavailable",
    "Transactional native inventory with idempotent creates",
  ],
  metrics: [
    {
      label: "Refresh cadence",
      value: "2×",
      detail: "Scheduled Fargate runs each day (8 AM / 8 PM Chicago)",
    },
    {
      label: "Provider page",
      value: "20",
      detail: "Ticketmaster events per current ingestion run",
    },
    {
      label: "Queue redrive",
      value: "3",
      detail: "Receives before a message lands on the ingestion DLQ",
    },
    {
      label: "Discovery TTL",
      value: "7d",
      detail: "External records expire about seven days after start",
    },
  ],
  charts: [],
};
