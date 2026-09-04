import type { CaseStudy } from "./types";

export const novatechSolutionsStudy: Omit<CaseStudy, "projectId"> = {
  overview:
    "NovaTech Solutions is a fictional MSP marketing site with a real inquiry workflow behind the contact form. Submit the form and the lead is accepted immediately; CRM and email continue in the background.",
  snapshot: {
    role: "Full-Stack / Cloud Developer",
    type: "MSP marketing site with a durable inquiry workflow",
    frontend: "Next.js 16 · React 19 · TypeScript · Tailwind CSS",
    backend: "Next.js Route Handler · Zod",
    cloud: "AWS CDK · Step Functions · Lambda · DynamoDB · SQS",
    testing: "Inquiry-path unit tests · Playwright QA",
    architecture:
      "Turnstile and OIDC at ingress, then Step Functions → DynamoDB claim → HubSpot → SQS → Resend.",
    status: "Production-verified inquiry path · architecture demo",
  },
  verification: {
    items: [
      {
        category: "deployed",
        detail:
          "The inquiry workflow was deployed through AWS CDK and successfully executed from the public Vercel application.",
      },
      {
        category: "tested",
        detail:
          "A production submission completed end-to-end, and repeating the same submission ID did not create a second workflow execution.",
      },
      {
        category: "secure",
        detail:
          "Vercel authenticates to AWS through a scoped OIDC role; no long-lived AWS credentials are stored in the deployment.",
      },
      {
        category: "observable",
        detail:
          "CloudTrail recorded the web-identity role assumption, and Step Functions exposed the completed execution path.",
      },
      {
        category: "integrated",
        detail:
          "The verified workflow completed its HubSpot CRM write and notification path.",
      },
    ],
    limitations: [
      "Company identity and marketing statistics are fictional.",
      "Email is at-least-once; an unverified sending domain can fail for some inboxes.",
    ],
  },
  problem:
    "MSP sites often explain services well and then drop the inquiry into a void: no validation, no CRM, no spam control. I wanted the services → proof → contact journey to end in a durable lead, even with a fictional company identity.",
  approach:
    "Marketing content lives in typed constants so routes stay consistent. The form validates on the client, then a same-origin handler re-validates, checks Turnstile, and starts the workflow. The HTTP response does not wait for HubSpot or email.",
  howItWorks:
    "A visitor submits an inquiry with a Turnstile token and a submission id. The Route Handler verifies the token, discards it, and calls states:StartExecution with a deterministic execution name. Step Functions claims the submission in DynamoDB, the HubSpot Lambda upserts a contact and creates a deal plus note, then SQS carries customer and staff jobs to a Lambda that sends Resend. If that name already exists, StartExecution returns ExecutionAlreadyExists and the API still answers 202. Email can fail after CRM success without rolling the lead back.",
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
  architectureLanesTitle: "Ingress and workflow",
  architectureLanesDescription:
    "The browser stays on Next.js. AWS starts after the request is accepted.",
  architectureLanes: [
    {
      title: "Public ingress",
      caption:
        "Same-origin HTTP. Secrets, ARNs, and provider tokens never go to the browser.",
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
        "DynamoDB claims the submission. HubSpot is the CRM record. Email is isolated from that write.",
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
    "Production inquiries on christopherkilo.com return 202 and continue asynchronously. HubSpot still receives the lead when visitor email cannot be delivered.",
  learned:
    "I learned to keep spam control and AWS identity on the HTTP edge, then let DynamoDB own idempotency. That split made retries, duplicate submissions, and email failure easy to explain: the visitor hears that the request was received, HubSpot keeps the lead, and Resend is allowed to fail without pretending the message already sent.",
  currentState: {
    implemented: [
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
        "Production and Preview assume the ingress role through the Vercel team issuer. The role can call only states:StartExecution on the NovaTech state machine. Local next dev keeps using the AWS CLI profile.",
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
  ],
  nextSteps: [
    "Move rate limiting to shared storage so multiple instances agree",
    "Add alertable monitoring beyond allowlisted console logs",
    "Finish mobile-menu background inertness",
    "Use a verified Resend sending domain if visitor mail must reach arbitrary inboxes",
  ],
  metrics: [],
  charts: [],
};
