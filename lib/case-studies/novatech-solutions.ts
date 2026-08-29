import type { CaseStudy } from "./types";

export const novatechSolutionsStudy: Omit<CaseStudy, "projectId"> = {
  overview:
    "NovaTech Solutions is a fictional MSP marketing site with a real inquiry workflow behind the contact form. The browser talks only to Next.js. Cloudflare Turnstile sits on that ingress. Vercel assumes a StartExecution-only IAM role through OIDC. Step Functions then runs HubSpot CRM writes and asynchronous Resend notifications with DynamoDB as the durable idempotency authority.",
  problem:
    "MSP sites often explain services well and then drop the inquiry into a void: no validation story, no CRM, no spam control, and no honest failure modes. I wanted the services → proof → contact journey to end in a durable lead, even while the company identity stayed fictional.",
  approach:
    "I kept marketing content in typed constants so six routes and service detail pages stayed consistent. The contact form validates on the client for fast feedback, then posts to a same-origin Route Handler that re-validates with a strict Zod schema, verifies Turnstile, and starts the AWS workflow. The HTTP response does not wait for HubSpot or email.",
  howItWorks:
    "A visitor submits an inquiry with a Turnstile token and a submission id. The Route Handler rate-limits by IP as a best-effort extra, verifies the token, discards it, and calls states:StartExecution with a deterministic execution name. Step Functions claims the submission in DynamoDB, the HubSpot Lambda upserts a contact and creates a deal plus note, then SQS carries customer and staff notification jobs to a Lambda that sends Resend. If a name already exists, StartExecution returns ExecutionAlreadyExists and the API still answers 202. Email can fail after CRM success without rolling the lead back.",
  architecture: [
    "Visitor",
    "NovaTech form",
    "Next.js Route Handler",
    "Turnstile",
    "Step Functions",
    "DynamoDB",
    "HubSpot",
    "SQS",
    "Resend",
  ],
  architectureHighlight: {
    title: "Inquiry workflow",
    description:
      "The browser never talks to AWS. Turnstile stays on the Next.js edge. A StartExecution-only OIDC role is the only AWS identity Vercel receives.",
    paths: [
      {
        label: "Ingress",
        steps: ["Visitor", "Next.js", "Turnstile", "OIDC", "StartExecution"],
      },
      {
        label: "Workflow",
        steps: [
          "DynamoDB",
          "HubSpot Lambda",
          "HubSpot",
          "SQS",
          "Notification Lambda",
          "Resend",
        ],
      },
    ],
  },
  architectureLanes: [
    {
      title: "Public ingress",
      caption:
        "Same-origin HTTP. Zod, Turnstile, and StartExecution live here. Secrets, ARNs, and provider tokens never go to the browser.",
      steps: [
        "NovaTech form",
        "POST /api/novatech/inquiries",
        "Zod + Turnstile",
        "Vercel OIDC",
        "states:StartExecution",
      ],
    },
    {
      title: "Durable workflow",
      caption:
        "Asynchronous path. DynamoDB claims the submission id. HubSpot is the CRM system of record. Resend is at-least-once via SQS, isolated from the CRM write.",
      steps: [
        "Step Functions",
        "DynamoDB claim",
        "HubSpot contact + deal + note",
        "SQS notifications",
        "Resend",
      ],
    },
  ],
  architectureEntry: ["Visitor", "NovaTech / Next.js"],
  decisionsHeading: "Engineering decisions",
  techGroups: [
    {
      label: "Frontend",
      items: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    },
    {
      label: "Ingress",
      items: ["Zod", "Cloudflare Turnstile", "Vercel OIDC"],
    },
    {
      label: "AWS cloud",
      items: [
        "Step Functions",
        "Lambda",
        "DynamoDB",
        "SQS",
        "SSM",
        "IAM",
        "CloudWatch",
        "CDK",
      ],
    },
    {
      label: "Lead systems",
      items: ["HubSpot CRM", "Resend"],
    },
  ],
  outcome:
    "Production inquiries on christopherkilo.com follow that path with a 202 accepted contract. Vercel assumes the ingress role through OIDC; there are no long-lived AWS access keys on the project. HubSpot still receives the lead when visitor email cannot be delivered. Testimonials and stats stay illustrative on purpose.",
  learned:
    "I learned to keep spam control and AWS identity on the HTTP edge, then let DynamoDB own idempotency. That split made retries, duplicate submissions, and email failure easy to explain: the visitor hears that the request was received, HubSpot keeps the lead, and Resend is allowed to fail without pretending the message already sent.",
  currentState: {
    implemented: [
      "Six marketing routes plus per-service detail pages",
      "Shared Zod contract for client and API",
      "Cloudflare Turnstile at public ingress",
      "Vercel OIDC role limited to states:StartExecution",
      "Step Functions inquiry workflow with DynamoDB idempotency",
      "HubSpot contact upsert, deal, association, and note",
      "SQS notification jobs and asynchronous Resend",
      "Allowlisted structured logs without payload secrets",
    ],
    demo: [
      "Fictional company identity and illustrative testimonials/stats",
      "Dev Turnstile bypass token for local work",
      "Forced failure mode for UI QA",
      "Resend test sender — unverified visitor inboxes can fail permanently",
    ],
    planned: [
      "Distributed rate limiting so multiple instances agree",
      "Alertable monitoring beyond allowlisted console JSON",
      "Background inertness for the mobile menu",
    ],
  },
  decisions: [
    {
      title: "Same-origin Route Handler, not a public AWS API",
      explanation:
        "The browser posts to Next.js. That keeps Turnstile, Zod, and the 202 contract in one deployable app. Vercel is allowed to start the workflow, not to call HubSpot, SQS, or DynamoDB directly.",
    },
    {
      title: "OIDC instead of long-lived AWS keys",
      explanation:
        "Production and Preview assume portfolio-dev-novatech-vercel-ingress through the Vercel team issuer. The role can call only states:StartExecution on the NovaTech state machine. Local next dev keeps using the AWS CLI profile.",
    },
    {
      title: "DynamoDB as idempotency authority",
      explanation:
        "Deterministic execution names turn browser retries into ExecutionAlreadyExists. The table claim with attribute_not_exists is still the business duplicate guard, so a second execution does not create a second deal or a second note.",
    },
    {
      title: "HubSpot as system of record",
      explanation:
        "Sales needs a durable lead more than a pretty success toast. I upsert by email, open a deal, and attach a note with the message. Email can fail without undoing the CRM write.",
    },
    {
      title: "Turnstile before StartExecution",
      explanation:
        "Spam protection has to sit in front of AWS and paid/third-party side effects. The widget token is required client-side, verified server-side, then discarded — it never lands in Step Functions input, DynamoDB, SQS, or logs.",
    },
    {
      title: "Notifications are at-least-once",
      explanation:
        "SQS can deliver a job more than once. Resend Idempotency-Key reduces duplicate mail for 24 hours. Delivery is at-least-once.",
    },
  ],
  nextStepsIntro:
    "NovaTech AWS is closed. Remaining work is product polish, not another cloud phase.",
  nextSteps: [
    "Move rate limiting to shared storage so multiple instances agree",
    "Add alertable monitoring beyond allowlisted console logs",
    "Finish mobile-menu background inertness",
    "Use a verified Resend sending domain if visitor mail must reach arbitrary inboxes",
  ],
  highlights: [
    "Marketing site with service detail routes",
    "Turnstile at ingress, then Step Functions → HubSpot → SQS → Resend",
    "Vercel OIDC with a StartExecution-only IAM role",
    "Durable idempotency and email failure isolation",
  ],
  metrics: [
    {
      label: "HTTP success",
      value: "202",
      detail: "Accepted workflow; UI does not claim email already sent",
    },
    {
      label: "Ingress IAM",
      value: "1 action",
      detail: "states:StartExecution only on the NovaTech state machine",
    },
    {
      label: "Notification jobs",
      value: "2",
      detail: "Customer and staff SQS messages, isolated from the CRM write",
    },
  ],
  charts: [],
};
