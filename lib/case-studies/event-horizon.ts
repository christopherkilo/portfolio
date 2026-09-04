import type { CaseStudy } from "./types";

export const eventHorizonStudy: Omit<CaseStudy, "projectId"> = {
  overview:
    "Event Horizon is an event discovery app with a curated catalog you can reserve and real Ticketmaster listings you can browse. Native events hold tickets on the site. External events send you to the provider.",
  snapshot: {
    role: "Full-Stack / Cloud Developer",
    type: "Event discovery web application",
    frontend: "Next.js 16 · React 19 · TypeScript · Tailwind CSS",
    backend: "PostgreSQL · Prisma · Auth.js",
    cloud: "AWS CDK · Lambda · SQS · DynamoDB · ECS Fargate",
    testing: "Unit · integration · Playwright · accessibility",
    architecture:
      "Asynchronous provider ingestion with a DLQ and idempotent DynamoDB writes. Native reservations stay on PostgreSQL.",
    status: "Live demo",
  },
  verification: {
    items: [
      {
        category: "deployed",
        detail:
          "The CDK infrastructure has been deployed successfully, including the worker, ingestion path, discovery store, and reader API.",
      },
      {
        category: "tested",
        detail:
          "Unit, integration, and Playwright coverage validate browsing, reservations, external-event mapping, and the case-study route.",
      },
      {
        category: "secure",
        detail:
          "Provider credentials live in SSM, while IAM permissions are scoped separately for worker, ingestion, and reader responsibilities.",
      },
      {
        category: "resilient",
        detail:
          "A malformed message was verified to move to the DLQ after three receives; repeat ingestion preserves the original ingestion timestamp.",
      },
      {
        category: "accessible",
        detail:
          "Keyboard, semantic, and axe checks pass on the case-study surface.",
      },
    ],
    limitations: [
      "External listings are discovery-only and never enter Event Horizon checkout.",
      "If the public reader is missing or fails, the native catalog still renders.",
    ],
  },
  problem:
    "Reservations and provider catalogs are not the same workload. Holds, inventory, users, and favorites need transactional consistency. External listings need ingestion, normalization, deduplication, retries, expiration, and a refresh schedule. Forcing both into one database would either weaken inventory guarantees or make a discovery cache pretend to be a booking system.",
  approach:
    "I split booking from discovery. Native events, inventory, users, and reservations stay transactional. Provider listings land in a cache and never enter the reservation APIs. The native catalog still renders if the provider path is down.",
  howItWorks:
    "EventBridge starts the Fargate worker at 8:00 AM and 8:00 PM America/Chicago. The container calls Ticketmaster Discovery, posts normalized messages to SQS, and exits. An ingestion Lambda validates each message and upserts DynamoDB: first-seen ingestedAt stays put, updatedAt moves forward, and records expire about seven days after start. The UI never talks to DynamoDB. It calls a Query-only Lambda over HTTPS. Native browse and checkout still go through Next.js APIs and Prisma transactions.",
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
  architectureLanesTitle: "Two persistence paths",
  architectureLanesDescription:
    "One Next.js app. Booking and provider discovery do not share a database.",
  architectureLanes: [
    {
      title: "Native application",
      caption:
        "Transactional path. Reservations, inventory, users, and favorites stay on PostgreSQL via Prisma.",
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
        "Provider cache. Listings are stored by provider + externalId and shown as outbound cards.",
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
  outcome:
    "Visitors can browse seeded Event Horizon events and real Dallas Ticketmaster listings in one UI. Native events take authenticated holds against inventory. External cards show venue, city, and date, then open Ticketmaster or Ticketweb.",
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
    ],
  },
  decisions: [
    {
      title: "Why two stores?",
      explanation:
        "Reservations need transactions on PostgreSQL and inventory that cannot go negative. Provider catalogs need upsert-by-external-id and a TTL, which is the DynamoDB cache. I kept both stores rather than stretching one model across two jobs.",
    },
    {
      title: "Why SQS?",
      explanation:
        "Collection and persistence should not share a process. The worker can finish even if DynamoDB is briefly unhappy; Lambda can retry a single bad payload without blocking the rest of the batch. A DLQ after three receives keeps a poison message from looping forever.",
    },
    {
      title: "Why Fargate, not an ECS Service?",
      explanation:
        "The Ticketmaster importer is a Dockerized TypeScript worker. It only needs to run when the schedule fires, talk to Ticketmaster and SQS, then exit. Fargate fits that shape: no always-on ECS Service. Public subnets with a public IP keep NAT Gateway cost out of a learning account.",
    },
    {
      title: "Why two Lambdas?",
      explanation:
        "Ingestion is UpdateItem-only. The reader is a separate Query-only Function URL. Mixing those permissions would blur a write processor with a public read API. A Function URL is enough for GET JSON from one provider.",
    },
  ],
  nextSteps: [
    "Add Stripe (or similar) so confirmed stops meaning a pre-payment hold",
    "Serve native detail/home inventory from the API so remaining tickets match Postgres",
    "Expose browse pagination controls the API already supports",
    "Add database integration tests for reservation race conditions",
  ],
  metrics: [
    {
      label: "Refresh cadence",
      value: "2×",
      detail: "Scheduled Fargate runs each day (8 AM / 8 PM Chicago)",
    },
  ],
  charts: [],
};
