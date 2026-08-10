import type { CaseStudy } from "./types";

export const novatechSolutionsStudy: Omit<CaseStudy, "projectId"> = {
    overview:
      "NovaTech Solutions is a fictional MSP marketing site with a real lead pipeline behind the contact form. I built the buyer-facing pages in Next.js and TypeScript, then wired inquiries through Zod, Cloudflare Turnstile, HubSpot, and Resend. The point was to prove a marketing site can hand a sales team something useful—not just look polished.",
    problem:
      "MSP sites often explain services well and then drop the inquiry into a void: no validation story, no CRM, no spam control. I wanted the services → proof → contact journey to end in a durable lead, even while the company identity stayed fictional.",
    approach:
      "I kept content in typed constants so six marketing routes and service detail pages stayed consistent. The contact form validates on the client for fast feedback, then posts to a same-origin API that re-validates with a strict Zod schema. Turnstile runs before HubSpot; email confirmation is best-effort after the CRM write succeeds.",
    howItWorks:
      "A visitor submits an inquiry with a Turnstile token and a submission id. The API rate-limits by IP, verifies the token, upserts a HubSpot contact, creates a deal with an associated note, then sends visitor and staff emails through Resend. If email fails after CRM success, the API still returns 201 with emailSent false so the UI can tell the truth.",
    architecture: [
      "Contact form",
      "POST /api/novatech/inquiries",
      "Zod + rate limit",
      "Turnstile verify",
      "HubSpot contact + deal",
      "Resend confirmation",
      "Success UI",
    ],
    outcome:
      "NovaTech is an env-configured lead demo on top of a complete marketing frontend. Testimonials and stats stay illustrative on purpose. The inquiry path is not illustrative: with the right secrets it creates CRM records and sends mail, with partial-success handling when email lags behind HubSpot.",
    learned:
      "I learned to decide the system of record first. HubSpot owns the lead; email is confirmation. That single choice made failure modes much easier to explain in the UI.",
    currentState: {
      implemented: [
        "Six marketing routes plus per-service detail pages",
        "Shared Zod contract for client and API",
        "Cloudflare Turnstile verification",
        "HubSpot contact upsert, deal, association, and note",
        "Resend visitor + staff emails",
        "In-memory rate limiting and duplicate submission guard",
      ],
      demo: [
        "Fictional company identity and illustrative testimonials/stats",
        "Dev Turnstile bypass token for local work",
        "Forced failure mode for UI QA",
      ],
      planned: [
        "Durable rate limiting / idempotency across instances",
        "Structured monitoring beyond console JSON",
        "Background inertness for the mobile menu",
      ],
    },
    decisions: [
      {
        title: "Same-origin Route Handler for leads",
        explanation:
          "I kept the inquiry API inside Next.js so the marketing site and lead pipeline ship together. It avoids a separate backend for this scope, with the tradeoff that rate limits are process-local until I add shared storage.",
      },
      {
        title: "HubSpot as system of record",
        explanation:
          "Sales needs a durable lead more than a pretty success toast. I upsert by email, open a deal, and attach a note with the message. Email can fail without undoing the CRM write.",
      },
      {
        title: "Turnstile before CRM writes",
        explanation:
          "Spam protection has to sit in front of paid/third-party side effects. The widget token is required client-side and verified server-side before HubSpot or Resend run.",
      },
      {
        title: "Strict shared Zod schema",
        explanation:
          "Client and server validate the same shape, and the API schema is strict so mystery fields cannot sneak through. That keeps consent, service selection, and message length honest at both edges.",
      },
      {
        title: "Typed content before a CMS",
        explanation:
          "Services, FAQs, and portfolio items live in TypeScript constants. It is enough for a portfolio MSP story and keeps copy consistent; a real marketing team would eventually want a CMS.",
      },
      {
        title: "Indigo enterprise visual system",
        explanation:
          "I used a single indigo primary on dark surfaces so the site feels closer to modern SaaS than a generic IT brochure. Emerald stays reserved for success states so status color means something.",
      },
    ],
    nextStepsIntro:
      "Next work from the live pipeline—not a return to a frontend-only form.",
    nextSteps: [
      "Move rate limiting and idempotency to shared storage so multiple instances agree",
      "Add alertable monitoring beyond allowlisted console logs",
      "Finish mobile-menu background inertness",
      "Add end-to-end smoke coverage for the inquiry API",
      "Only replace illustrative stats/testimonials if NovaTech is ever positioned as a real MSP",
    ],
    highlights: [
      "Marketing site with service detail routes",
      "Turnstile → HubSpot → Resend inquiry pipeline",
      "Partial-success handling when email fails after CRM",
      "Strict Zod validation and IP rate limiting",
    ],
    metrics: [
      {
        label: "Marketing routes",
        value: "6",
        detail: "Home, about, services, portfolio, FAQ, contact",
      },
      {
        label: "Service pages",
        value: "6",
        detail: "Static detail routes from the typed taxonomy",
      },
      {
        label: "Lead integrations",
        value: "3",
        detail: "Turnstile, HubSpot CRM, and Resend email",
      },
    ],
    charts: [],
  };
