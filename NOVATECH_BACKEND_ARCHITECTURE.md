# NovaTech Backend Architecture

Interview-oriented notes for the inquiry backend behind `/demos/novatech-solutions`.

## ELI15

The form asks, Next.js receives, Zod checks, Turnstile guards, then AWS takes the lead: Step Functions claims the submission, HubSpot stores the CRM record, and email goes out later through a queue.

## Final public request path

```
Visitor
   ↓
NovaTech form
   ↓
Next.js Route Handler  (POST /api/novatech/inquiries)
   ↓
parse + Zod validation
   ↓
Cloudflare Turnstile
   ↓
requestId + submissionId
   ↓
AWS Step Functions StartExecution
   ↓
DynamoDB
   ↓
HubSpot CRM Lambda
   ↓
HubSpot
   ↓
SQS
   ↓
Notification Lambda
   ↓
Resend
```

The browser does not talk to AWS and does not receive AWS credentials.

## Why the Route Handler remains

NovaTech already lives in the App Router portfolio. The Route Handler is the **thin public ingress**:

1. Accept the HTTP request
2. Validate the body
3. Validate/normalize `requestId`
4. Validate/normalize `submissionId`
5. Verify Cloudflare Turnstile
6. Start the Step Functions execution
7. Return a safe HTTP response (202 Accepted)

It does **not** create HubSpot contacts, deals, or notes, and it does not send Resend email. Those run in AWS after the HTTP response.

Keeping Next.js at the edge means Turnstile’s secret and AWS identity stay server-side, the form stays same-origin, and visitors never see ARNs or provider errors.

## Why Turnstile is before AWS execution

The widget in the browser is not a security control. A bot that posts JSON directly would otherwise create Step Functions executions, DynamoDB rows, HubSpot records, and email jobs.

Order:

```
HTTP request → body validation → Turnstile verification → StartExecution
```

The Turnstile token is verified and then discarded. It is not sent to Step Functions, DynamoDB, SQS, or logs.

## Why DynamoDB owns durable idempotency

`requestId` is one HTTP request / log trace. `submissionId` is the logical form submit and the idempotency key.

The workflow table (`portfolio-dev-novatech-inquiry-workflows`) claims `submissionId` with `attribute_not_exists`. A second execution for the same id skips HubSpot and SQS.

StartExecution also uses a deterministic name `nt-<submissionId>`. `ExecutionAlreadyExists` is mapped to a safe “already received” HTTP 202. That is a convenience, not the business lock. DynamoDB remains canonical.

The old in-memory duplicate map was instance-local and is gone. Do not describe it as durable protection.

## Why Step Functions orchestrates

A Standard Workflow can claim the row, call HubSpot, enqueue notifications, and record failure without a long-running Next.js request. The visitor is not held open while CRM and email run.

HubSpot failure fails the workflow. SQS enqueue failure after HubSpot success is a partial success: CRM stays completed, email can be retried independently.

## Why HubSpot is the CRM system of record

The product goal is a CRM-shaped lead, not a custom inquiry database. Contacts and deals match an MSP sales process. Postgres would duplicate Event Horizon’s data layer without teaching CRM integration.

- **Contact** = the person (upserted by email).
- **Deal** = this consultation opportunity, tagged with `novatech_submission_id`.
- **Note** = inquiry details that are not standard deal properties.

Company objects are not created. The submitted company name is stored on the contact.

## Why SQS isolates email

HubSpot success is the business capture. Resend is a side effect. A flaky mailbox must not recreate a contact, deal, or note, and must not require the visitor to resubmit.

Step Functions finishes after SQS **accepts** the two jobs. The notification Lambda calls Resend later. SQS retries and the DLQ cannot re-run HubSpot.

## Why notifications are at-least-once

SQS may deliver a job more than once. The notification Lambda sends Resend with `Idempotency-Key` = `{submissionId}:customer` or `{submissionId}:staff` (Resend stores keys for 24 hours). That reduces duplicate mail. It is **not** exactly-once delivery. Do not claim exactly-once.

## Why CRM success is authoritative

If HubSpot succeeds and email later fails, the lead still exists. The public API does not wait for Resend and does not pretend the email already went out. The UI says the consultation request was **received**.

## Why no long-running server is needed

There is no ECS service, API Gateway, or always-on worker for NovaTech inquiries. Next.js accepts the HTTP request. Step Functions and Lambda run the work. SQS buffers email. Fargate is Event Horizon’s concern, not NovaTech’s.

## AWS authentication from hosting

- **Local:** AWS SDK default credential chain (`AWS_PROFILE=portfolio`). No access keys in git.
- **Vercel Production/Preview:** OIDC assume-role. Role `portfolio-dev-novatech-vercel-ingress` may call only `states:StartExecution` on the NovaTech state machine.
- No `states:*`, DynamoDB, SQS, Lambda invoke, SSM, HubSpot, or Event Horizon on that role.
- No long-lived AWS keys in source, GitHub, `NEXT_PUBLIC_*`, or committed `.env` files.

## HTTP contract

| Status | Meaning |
|--------|---------|
| 202 | Valid body, Turnstile passed, workflow accepted (including deterministic-name duplicates) |
| 400 | Invalid JSON / content type |
| 403 | Turnstile failed |
| 422 | Inquiry / `submissionId` validation |
| 429 | Best-effort instance-local IP limiter |
| 503 | Workflow could not be accepted, or server AWS config/identity is missing |
| 500 | Unexpected failure |

Responses never include ARNs, stack traces, HubSpot/Resend bodies, secret names, or Turnstile tokens. Success body: `{ inquiryId, accepted, selectedService }` where `inquiryId` is the `submissionId`.

## Rate-limit decision

The in-memory IP limiter (5 / 15 minutes / instance) stays as a cheap extra guard. It is **not** distributed protection. Turnstile plus DynamoDB idempotency are the real controls. Phase 4 does not add Redis, ElastiCache, WAF, or API Gateway for this.

## Privacy and secrets

**Next.js server-only:** `TURNSTILE_SECRET_KEY`, `NOVATECH_STATE_MACHINE_ARN`, `NOVATECH_AWS_REGION`, `AWS_ROLE_ARN`.

**AWS workloads:** HubSpot and Resend live in SSM SecureStrings. Lambdas read only their own parameter.

**Client-visible:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_APP_URL`.

Logs allowlist `requestId`, `submissionId`, event, result, duration, validation category, Turnstile result category, workflow-start result. Never log business email, phone, message, Turnstile token, cookies, Authorization, raw bodies, AWS credentials, or provider secrets.

Incoming `x-request-id` is accepted only as a strict UUID; otherwise the server generates one.

## Structure

```
app/api/novatech/inquiries/route.ts
server/novatech/
  env.ts
  errors.ts
  http.ts
  logger.ts
  requestId.ts
  rateLimit.ts
  aws/startInquiryWorkflow.ts
  services/inquiryService.ts
  integrations/{turnstile,hubspot,hubspotClient,resend,resendClient,resendTemplates}.ts
  mappers/inquiryMapper.ts
lib/demos/novatech/inquiry/   # shared schema + client adapter
infrastructure/lambda/novatech-hubspot-crm/
infrastructure/lambda/novatech-notification-handler/
```

Shared HubSpot/Resend modules remain because Lambdas import them. Next.js wrappers around those clients are not on the public request path.

See also: `NOVATECH_INTEGRATION_SETUP.md`, `NOVATECH_TECHNICAL_OVERVIEW.md`, `infrastructure/README.md`.
