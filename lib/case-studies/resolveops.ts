import type { CaseStudy } from "./types";

export const resolveopsStudy: Omit<CaseStudy, "projectId"> = {
  overview:
    "ResolveOps is a lightweight IT service and incident-management platform. The AWS-deployed application uses Cognito, Spring Boot, and PostgreSQL. The public Interactive Demo is a separate read-only Angular surface with local fixture data so recruiters can explore without accounts.",
  snapshot: {
    role: "Full-Stack Developer",
    type: "ITSM / incident management",
    frontend: "Angular 22 · TypeScript",
    backend: "Java 21 · Spring Boot · PostgreSQL 17 · pgvector",
    cloud: "CloudFront · Cognito · ECS Fargate · RDS · private S3",
    testing: "Angular unit tests · Playwright / axe smoke · responsive QA",
    architecture:
      "Cognito proves identity; PostgreSQL system_role is authoritative for RBAC. Public demo never calls protected APIs.",
    status: "Live demo + deployed V1",
  },
  verification: {
    items: [
      {
        category: "deployed",
        detail:
          "ResolveOps V1 is deployed on AWS with CloudFront, Cognito, ECS Fargate, RDS PostgreSQL, and private S3. The public Interactive Demo is published on the same CloudFront origin at /demo.",
      },
      {
        category: "secure",
        detail:
          "Production routes stay behind Cognito → Spring Security → PostgreSQL RBAC. The Interactive Demo uses local fixtures only and does not call protected /api/v1 endpoints or weaken production auth.",
      },
      {
        category: "tested",
        detail:
          "Angular suites cover demo isolation, role projections, and API-safety regressions. Responsive and automated accessibility checks cover representative production and demo surfaces.",
      },
      {
        category: "accessible",
        detail:
          "Validated with automated accessibility checks plus keyboard, responsive, and cross-browser QA; a complete manual WCAG audit was not performed.",
      },
      {
        category: "integrated",
        detail:
          "Ticket lifecycle, assets, SLA clocks, audit/history separation, and human-reviewed AI triage architecture are implemented in the modular monolith.",
      },
    ],
    limitations: [
      "Bedrock providers are implemented but disabled in the live AWS environment.",
      "The Interactive Demo shows fixture-backed sample AI output and does not invoke a live model.",
      "A complete manual WCAG audit was not performed.",
    ],
  },
  problem:
    "Small technical teams need real tickets, assets, SLAs, and audit without jumping to enterprise ITSM—and AI must stay advisory, not become the workflow engine.",
  approach:
    "I built an Angular SPA and a Spring Boot modular monolith on PostgreSQL. Cognito handles identity with Authorization Code + PKCE. Authorization lives in PostgreSQL system_role. For portfolio visitors, a public /demo surface reuses the product UI with local fixtures so exploration never requires Cognito or protected APIs.",
  howItWorks:
    "Authenticated traffic hits CloudFront → Cognito-protected SPA → Spring on ECS → RDS. Ticket mutations use expectedVersion with JPA @Version (409 on conflict). SLA clocks are server state. AI triage and similarity search are human-reviewed. The Interactive Demo loads the same SPA routes under /demo with DemoModeService fixtures—no Spring calls, no Bedrock.",
  architecture: [
    "Angular SPA (CloudFront)",
    "Cognito PKCE (production only)",
    "Spring Boot on ECS Fargate",
    "PostgreSQL RBAC + SLA + audit",
    "pgvector similarity (Bedrock disabled live)",
    "Public /demo fixtures (no auth)",
  ],
  outcome:
    "Recruiters can open the Interactive Demo without an account, switch Employee / Technician / Administrator previews, and inspect INC-1042 end to end. Production /dashboard, /tickets, and /admin remain authentication-required.",
  learned:
    "Separating a fixture-backed public demo from Cognito production auth is an engineering decision: visitors get a real workflow tour without weakening the authorization path.",
  currentState: {
    implemented: [
      "Ticket lifecycle with optimistic concurrency",
      "Asset context and requester-safe projections",
      "SLA engine with policy snapshots",
      "Audit / history separation",
      "Human-reviewed AI triage architecture",
      "Incident intelligence candidates (human promotion)",
      "AWS CDK topology (CloudFront, Cognito, ECS, RDS, S3)",
      "Public Interactive Demo at /demo",
    ],
    demo: [
      "Anonymous Interactive Demo with Technician default, Employee and Administrator previews, and fixture AI review",
    ],
  },
  decisions: [
    {
      title: "Public demo isolated from production auth",
      explanation:
        "For portfolio visitors, ResolveOps provides a read-only interactive demo using local fixture data. It never calls protected production APIs and does not weaken the Cognito → Spring Security → PostgreSQL authorization path used by the deployed application.",
    },
    {
      title: "Identity in Cognito; authorization in PostgreSQL",
      explanation:
        "Cognito proves who signed in. PostgreSQL system_role answers what they may do. Frontend guards are UX only.",
    },
    {
      title: "AI is advisory",
      explanation:
        "Triage suggestions and similarity search require human ACCEPT / MODIFY / REJECT. The live environment has Bedrock disabled; the Interactive Demo shows sample AI output labeled as demo-only.",
    },
    {
      title: "Optimistic concurrency on writes",
      explanation:
        "expectedVersion plus JPA @Version returns 409 instead of last-write-wins on tickets, assets, incidents, and knowledge.",
    },
  ],
  nextSteps: [
    "Optional lightweight guided tour only if user testing shows the UI alone is not enough",
    "Enable Bedrock models in a controlled environment when ready—without changing the human-review contract",
  ],
  metrics: [
    {
      label: "Public surface",
      value: "/demo",
      detail: "No sign-in · sample data · read-only",
    },
    {
      label: "Default role",
      value: "Technician",
      detail: "Richest core workflow for recruiters",
    },
    {
      label: "Live AI",
      value: "Off",
      detail: "Fixture sample shown; Bedrock disabled",
    },
  ],
  charts: [],
  techGroups: [
    {
      label: "Product",
      items: ["Angular", "Spring Boot", "PostgreSQL", "pgvector"],
    },
    {
      label: "AWS",
      items: ["CloudFront", "Cognito", "ECS Fargate", "RDS", "S3"],
    },
  ],
};
