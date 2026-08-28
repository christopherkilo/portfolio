# AWS infrastructure

CDK TypeScript app for the Christopher Kilo portfolio. This is a small **dev / learning** AWS account, not a production environment.

Event Horizon Phase 5 schedules the existing Fargate Ticketmaster worker twice daily with EventBridge Scheduler. NovaTech Phase 4 connects the public contact form to the existing Step Functions workflow. The browser talks only to Next.js. Turnstile stays on that ingress. AWS identity for Vercel is a StartExecution-only OIDC role.

## Local setup

- Default region: **us-east-2**
- AWS CLI profile: **`portfolio`**
- Tooling: AWS CDK (`aws-cdk-lib`)
- App entry: `bin/infrastructure.ts`

```bash
export AWS_PROFILE=portfolio
export AWS_REGION=us-east-2
cd infrastructure
npm install
```

Do not store AWS credentials or application secrets in this repository. Local authentication uses the AWS CLI `portfolio` profile already configured outside git. Future GitHub Actions authentication will use **AWS OIDC**, not long-lived access keys.

## Commands

```bash
npm test          # unit tests
npm run build     # TypeScript check
npm run synth     # synthesize all stacks
npm run diff      # diff stacks against the current AWS/template state
npx cdk synth     # same as npm run synth; writes templates to cdk.out
```

This CDK CLI synthesizes every stack in the app with `cdk synth`. There is no `npm run deploy`. Deployment stays explicit and named.

Deployment is **deliberate**. There is no `npm run deploy` that deploys every stack. When a later phase is approved, deploy a named stack explicitly, for example:

```bash
npx cdk deploy EventHorizonDevStack
npx cdk deploy NovaTechDevStack
```

The CDK environment in `us-east-2` is already bootstrapped. Deploy named stacks only when that step is explicitly approved.

## Stacks

| Stack | File | Application tag |
| --- | --- | --- |
| `EventHorizonDevStack` | `lib/event-horizon-dev-stack.ts` | `event-horizon` |
| `NovaTechDevStack` | `lib/novatech-dev-stack.ts` | `novatech` |

Account IDs are never hardcoded. Region and account come from the CDK CLI environment (`CDK_DEFAULT_ACCOUNT`, `CDK_DEFAULT_REGION`), with **us-east-2** as the development fallback region.

## Naming

Use `resourceName(app, resource)` from `lib/naming.ts`:

```
{prefix}-{environment}-{app}-{resource}
```

Examples:

- `portfolio-dev-event-horizon-ingestion-queue`
- `portfolio-dev-event-horizon-ingestion-dlq`
- `portfolio-dev-event-horizon-external-events`
- `portfolio-dev-event-horizon-ingestion-worker-task`
- `portfolio-dev-event-horizon-cluster`
- `portfolio-dev-event-horizon-ingestion-refresh`
- `portfolio-dev-novatech-inquiry-workflows`
- `portfolio-dev-novatech-inquiry-workflow`
- `portfolio-dev-novatech-hubspot-crm`

## Tags

`applyStandardTags(scope, application)` in `lib/tags.ts` applies:

| Tag | Value |
| --- | --- |
| Environment | `dev` |
| ManagedBy | `aws-cdk` |
| Purpose | `portfolio-learning` |
| Application | `event-horizon` or `novatech` |

Do not tag resources with emails, account IDs, usernames, machine names, or secrets.

## Cost-conscious development rules

- Create resources through CDK rather than the AWS Console whenever practical.
- Avoid NAT Gateways unless explicitly required.
- Avoid always-running compute when event-driven or scheduled execution is sufficient.
- Avoid oversized provisioned capacity.
- Prefer serverless / on-demand options for development workloads where appropriate.
- ECS workloads should not run continuously unless the architecture genuinely requires it.
- Every resource must have a clear reason for existing.
- Destructive resources must use development-appropriate cleanup behavior where safe (for example, destroy policies for throwaway dev data). Do not copy production retention blindly into this learning environment.
- Never commit AWS credentials or application secrets.

## Architecture

### Event Horizon Phase 3

Ticketmaster Discovery API v2 is the first real external event provider.

```
Ticketmaster Discovery API v2
        ↓
ECS/Fargate worker  (scheduled twice daily; not a service)
        ↓
SQS ingestion queue  →  DLQ after 3 failures
        ↓
Lambda (Node.js 22)
        ↓
DynamoDB external-events (on-demand, TTL)
```

The worker talks to **Ticketmaster and SQS only**. It does not write to DynamoDB, query DynamoDB, or touch Prisma/PostgreSQL. Reservations, users, favorites, and ticket inventory stay in PostgreSQL.

**Data stores**

- **PostgreSQL / Prisma** remains the source of truth for reservations and ticket inventory.
- **DynamoDB** is the external event ingestion / discovery store. Ticketmaster records cached there are discovery data, not transactional inventory.

**Provider request (this phase)**

- Endpoint: `https://app.ticketmaster.com/discovery/v2/events.json`
- Scope: Dallas, TX, United States
- One page per task (`size=20`), no further pagination
- Future events only (`startDateTime` = worker UTC now)
- Conservative usage: at most one normal request per task, well below Ticketmaster's 2 requests/second ceiling

**Secret**

The Ticketmaster Consumer Key is stored outside source control as an SSM Parameter Store SecureString:

```
/portfolio/dev/event-horizon/ticketmaster-api-key
```

CDK imports that existing parameter by name. The stack does not create a second parameter, does not own the SecureString, and does not put the value in source, `cdk.json`, `.env`, CloudFormation outputs, or logs. ECS injects it at runtime as `TICKETMASTER_API_KEY` using the task **execution** role (`ssm:GetParameters` on that parameter only). Deleting the stack does not delete the manually created secret.

Worker image path (CDK asset workflow — no dedicated application ECR repository in this phase):

1. CDK builds the worker Docker image from `workers/event-horizon-provider`.
2. CDK publishes that asset to the **CDK-managed ECR asset repository** created by `cdk bootstrap`.
3. The Fargate task definition references that asset image.

This phase uses a small VPC because **Fargate tasks require VPC networking**. It uses public subnets only and `natGateways: 0`. The task can receive a public IP to reach Ticketmaster and AWS APIs. There is **no ECS Service**, so Fargate compute is not running continuously. EventBridge Scheduler later starts that same task; it does not keep a container running.

Normalized SQS message body (optional fields omitted when absent):

```json
{
  "provider": "ticketmaster",
  "externalId": "Z7r9jZ1Ad8eP8",
  "title": "Dallas Symphony at the Meyerson",
  "city": "Dallas",
  "state": "TX",
  "startsAt": "2026-09-16T00:30:00.000Z",
  "sourceUrl": "https://www.ticketmaster.com/event/Z7r9jZ1Ad8eP8",
  "venueName": "Morton H. Meyerson Symphony Center",
  "imageUrl": "https://s1.ticketm.net/dam/a/event/hero-2048.jpg",
  "category": "Music",
  "genre": "Classical",
  "latitude": 32.7767,
  "longitude": -96.797
}
```

Required fields: `provider`, `externalId`, `title`, `startsAt`. Optional Ticketmaster fields: `venueName`, `imageUrl`, `category`, `genre`, `latitude`, `longitude`. The same `provider` + `externalId` updates the existing DynamoDB item. `ingestedAt` is set on first write (`if_not_exists`) and preserved on later ingestions; `updatedAt` always moves forward.

Phase 2 left deterministic `ecs-demo-provider` records in DynamoDB. Those keys remain valid; this phase does not replace the table.

The existing table key is `provider` + `externalId`. Chronological listing therefore queries the Ticketmaster partition and sorts `startsAt` in the reader Lambda. That is acceptable at portfolio scale; a startsAt GSI is not added in this phase.

### Event Horizon Phase 4

A second Lambda exposes sanitized Ticketmaster records to the Event Horizon UI. The browser never talks to DynamoDB and never receives AWS credentials.

```
Event Horizon UI
        ↓
public HTTPS Lambda Function URL  (GET only)
        ↓
reader Lambda  (Query provider=ticketmaster)
        ↓
DynamoDB external-events
```

The reader is **Query-only**. The ingestion Lambda remains **UpdateItem-only**. SQS, ECS, and the Fargate worker are unchanged. There is still no ECS Service and no NAT Gateway.

CORS allows local Next.js (`http://localhost:3000`, `http://127.0.0.1:3000`) and the live site (`https://www.christopherkilo.com`, `https://christopherkilo.com`).

The Function URL is an output (`ExternalEventsReaderUrl`). Event Horizon reads it from `NEXT_PUBLIC_EVENT_HORIZON_EXTERNAL_EVENTS_API`, not from hardcoded component URLs.

PostgreSQL / Prisma remains the transactional source of truth for reservations, users, favorites, and ticket inventory. DynamoDB remains the external discovery store. Ticketmaster rows are outbound discovery links, not Event Horizon inventory.

### Event Horizon Phase 5

EventBridge Scheduler starts the **existing** Fargate worker on a timezone-aware cron. No ECS Service, no NAT Gateway, and no extra Lambda just to call `ecs:RunTask`.

```
EventBridge Scheduler  (America/Chicago)
        ↓  ecs:RunTask
existing Fargate worker  (public subnet + public IP, then exits)
        ↓
existing SQS → Lambda UpdateItem → DynamoDB
        ↓
existing read-only Function URL → Event Horizon UI
```

**Schedule**

- `cron(0 8,20 * * ? *)` in `America/Chicago`
- 8:00 AM and 8:00 PM Central
- Two Ticketmaster Discovery requests per day in the normal case (~60/month)
- Flexible time window off
- Retry a failed `RunTask` twice, with a 1-hour max event age
- No scheduler SQS DLQ: launch failures are visible in Scheduler `NextInvocationTime` / invocation history and existing Fargate logs. The ingestion queue already has a DLQ for message processing.

**Scheduler IAM**

The scheduler role can `ecs:RunTask` on the Event Horizon worker task definition and `iam:PassRole` only for that task's task role and execution role. It has no DynamoDB, SQS, or `ecs:*` access. The worker task role still sends to SQS.

**Manual run (same worker, not a schedule change)**

```bash
export AWS_PROFILE=portfolio
export AWS_REGION=us-east-2

CLUSTER=portfolio-dev-event-horizon-cluster
TASK_FAMILY=portfolio-dev-event-horizon-ingestion-worker-task
SG=$(aws cloudformation describe-stacks --stack-name EventHorizonDevStack \
  --query "Stacks[0].Outputs[?OutputKey=='IngestionWorkerSecurityGroupId'].OutputValue" --output text)
VPC=$(aws ec2 describe-vpcs --filters Name=tag:Name,Values=portfolio-dev-event-horizon-vpc \
  --query 'Vpcs[0].VpcId' --output text)
SUBNET=$(aws ec2 describe-subnets --filters Name=vpc-id,Values="$VPC" Name=map-public-ip-on-launch,Values=true \
  --query 'Subnets[0].SubnetId' --output text)

aws ecs run-task \
  --cluster "$CLUSTER" \
  --task-definition "$TASK_FAMILY" \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET],securityGroups=[$SG],assignPublicIp=ENABLED}"
```

**Inspect scheduled runs**

```bash
aws scheduler get-schedule \
  --name portfolio-dev-event-horizon-ingestion-refresh \
  --query '{State:State,Expression:ScheduleExpression,Timezone:ScheduleExpressionTimezone,Next:NextInvocationTime}' \
  --output json

# Recent Fargate tasks in the cluster
aws ecs list-tasks --cluster portfolio-dev-event-horizon-cluster --desired-status STOPPED

# Worker logs (same log group as a manual run)
aws logs tail /ecs/portfolio-dev-event-horizon-ingestion-worker --since 12h --format short
```

Fargate remains short-lived. There is still no continuously running ECS service.

### NovaTech Phase 4

The public contact form starts the existing workflow. It does not call HubSpot or Resend from Next.js.

```
Visitor
   ↓
NovaTech form
   ↓
POST /api/novatech/inquiries  (Next.js Route Handler)
   ↓
Zod validation
   ↓
Cloudflare Turnstile
   ↓
states:StartExecution
   ↓
Step Functions → DynamoDB → HubSpot Lambda → HubSpot → SQS → Notification Lambda → Resend
```

The browser never receives AWS credentials. Turnstile tokens are verified at ingress and are not sent to Step Functions, DynamoDB, SQS, or logs.

**AWS identity**

- Local Next.js: default credential chain (`AWS_PROFILE=portfolio`). No access keys in the repo.
- Vercel Production and Preview: OIDC assume-role. Role `portfolio-dev-novatech-vercel-ingress` may call **only** `states:StartExecution` on `portfolio-dev-novatech-inquiry-workflow`.
- The role trust is limited to `owner:christopherkilos-projects:project:portfolio:environment:production` and `...:preview`.
- Do not add DynamoDB, SQS, Lambda invoke, SSM, or Event Horizon permissions to that role.

Vercel project settings still need (server-only, no `NEXT_PUBLIC_`):

| Variable | Purpose |
| --- | --- |
| `NOVATECH_STATE_MACHINE_ARN` | Inquiry state machine ARN |
| `NOVATECH_AWS_REGION` | `us-east-2` |
| `AWS_ROLE_ARN` | `portfolio-dev-novatech-vercel-ingress` role ARN |
| `TURNSTILE_SECRET_KEY` | Existing Cloudflare secret |

Enable Vercel OIDC on the project. Do not store long-lived AWS access keys in Vercel.

**Duplicate submits**

`StartExecution` uses a deterministic name `nt-<submissionId>`. `ExecutionAlreadyExists` is treated as “already received” (HTTP 202). DynamoDB `attribute_not_exists(submissionId)` remains the canonical business idempotency lock inside the workflow.

**Rate limit**

The Next.js IP limiter is still instance-local and best-effort only. Turnstile plus DynamoDB are the real controls. This stack does not add Redis, WAF, or API Gateway for that.

The workflow internals below are unchanged from Phase 3.

### NovaTech workflow (Phases 1–3)

Public form **and** synthetic/manual StartExecution share this path after execution starts:

```
Step Functions  (Standard: portfolio-dev-novatech-inquiry-workflow)
        ↓
AcquireSubmission  (native DynamoDB PutItem, attribute_not_exists(submissionId))
        ↓
new submission?
   ├─ yes → HubSpotCRM Lambda → QueueNotifications (native SQS SendMessage × 2)
   │         → MarkCompleted → Succeed
   │         SQS enqueue failure after bounded retry → MarkQueueFailed (CRM still COMPLETED) → PartialSuccess
   └─ no  → DuplicateResult → Succeed  (HubSpot and SQS do not run)
```

Notifications (asynchronous; Step Functions does not wait for Resend):

```
SQS portfolio-dev-novatech-notifications
        ↓
Notification Lambda  (portfolio-dev-novatech-notification-handler)
        ↓
Resend
   ├─ customer confirmation
   └─ staff notification
```

**Why email is asynchronous:** HubSpot success is the business capture. Resend is a side effect. A flaky mailbox must not recreate a contact, deal, or note, and must not require the visitor to resubmit.

**Turnstile** is not part of manual AWS executions. There is no browser challenge. Do not fake a Turnstile token. Turnstile stays on the public Next.js ingress.

**Workflow table** (`portfolio-dev-novatech-inquiry-workflows`)

PK `submissionId`. On-demand, AWS-managed encryption, 14-day TTL on `expiresAt`.

Safe operational fields:

- `status`: `IN_PROGRESS` | `COMPLETED` | `FAILED`
- `crmStatus`: `PENDING` | `CRM_COMPLETED` | `FAILED`
- `contactId`, `dealId` (HubSpot object IDs only)
- `notificationStatus`: `QUEUED` | `SENT` | `FAILED` | `QUEUE_FAILED`
- `customerEmailStatus` / `staffEmailStatus`: `SENT` | `FAILED` | `FAILED_PERMANENT`

Do not store inquiry messages, email, phone, secrets, or email bodies. DynamoDB is workflow metadata. **HubSpot remains the CRM system of record.**

**Durable idempotency**

1. Step Functions: the same `submissionId` cannot claim a new execution. Duplicates return `DuplicateResult` and never invoke HubSpot or enqueue SQS jobs.
2. HubSpot: deals are tagged with `novatech_submission_id`. Lambda retries search before creating a deal.
3. Email: SQS is at-least-once. The notification Lambda sends Resend with `Idempotency-Key` = `{submissionId}:customer` or `{submissionId}:staff` (Resend stores keys for 24 hours). This is not exactly-once delivery.

**HubSpot Lambda** (`portfolio-dev-novatech-hubspot-crm`) — unchanged from Phase 2.

**Notification queues**

- `portfolio-dev-novatech-notifications` — standard queue, SQS-managed encryption, 4-day retention, visibility 45s (Lambda timeout 15s), `maxReceiveCount` 3
- `portfolio-dev-novatech-notifications-dlq` — 14-day retention

Two jobs per new submission: customer confirmation and staff notification. Messages include the minimum fields needed to render that email. They omit Turnstile tokens, secrets, the full inquiry message, and raw provider payloads.

**Notification Lambda** (`portfolio-dev-novatech-notification-handler`)

- Reuses shared NovaTech Resend templates and HTTP client
- Reads `/portfolio/dev/novatech/resend-api-key` (SSM SecureString, created manually)
- From/staff addresses and app URL are ordinary Lambda environment values (`onboarding@resend.dev` / `https://www.christopherkilo.com`), matching the Next.js non-secret local defaults. They are not credentials.
- Partial batch failure reporting. Batch size 5.
- Timeout 15s. UpdateItem only on the NovaTech workflow table. No HubSpot SSM or invoke.

**Retry categories (notifications)**

| Failure | Behavior |
| --- | --- |
| HTTP 429 / 5xx / timeout / network | Fail the SQS record so the queue retries. After 3 receives → DLQ |
| HTTP 400 / 401 / 403 | Mark `FAILED_PERMANENT` on that email field and **acknowledge** (do not burn retries on a known-bad provider/config) |
| Malformed / unsupported SQS body | Fail the record (no Resend call) so it retries and then lands on the DLQ |

**HubSpot retry categories** are unchanged:

| Failure | Behavior |
| --- | --- |
| HTTP 429 / 5xx / timeout / network | `TransientFailure`; Step Functions retries twice (1s, backoff 2), then `MarkFailed` |
| HTTP 400 / 401 / 403 / invalid workflow input | `PermanentFailure`; no TransientFailure retry; `MarkFailed` |

In-Lambda HubSpot retries stay disabled (`maxRetries: 0`).

**Secrets**

Do not put HubSpot or Resend credentials in source, `.env` for AWS, CDK context, CloudFormation outputs, or Lambda plaintext environment variables. Each Lambda calls `ssm:GetParameter` on **its** parameter only.

**Observability / PII**

Notification logs allowlist `submissionId`, `requestId`, `notificationId`, `notificationType`, provider status, duration, SQS receive count. No recipient address, email HTML, or API key.

Standard Step Functions **execution history** stores the `StartExecution` input (synthetic inquiry). CloudWatch execution-data logging is **not** enabled. Use synthetic data only.

**Manual start (synthetic payload only)**

```bash
export AWS_PROFILE=portfolio
export AWS_REGION=us-east-2

ARN=$(aws stepfunctions list-state-machines \
  --query "stateMachines[?name=='portfolio-dev-novatech-inquiry-workflow'].stateMachineArn" \
  --output text)

aws stepfunctions start-execution \
  --state-machine-arn "$ARN" \
  --input "$(jq -nc \
    --arg s "$(uuidgen | tr '[:upper:]' '[:lower:]')" \
    --arg r "$(uuidgen | tr '[:upper:]' '[:lower:]')" \
    '{submissionId:$s,requestId:$r,inquiry:{
      name:"Phase Three",
      businessEmail:"onboarding@resend.dev",
      phone:"",
      company:"NovaTech Phase Three Test",
      jobTitle:"",
      selectedService:"managed-it",
      companySize:"1-10",
      currentEnvironment:"Synthetic AWS verification",
      urgency:"planning",
      preferredContactMethod:"email",
      message:"Synthetic Phase 3 notification verification.",
      consent:true
    }}')"
```

`onboarding@resend.dev` is Resend’s documented test sender/recipient, not a customer address. Do not start executions with a real customer’s information.

**Out of scope**

Event Horizon changes, Redis/WAF/API Gateway for rate limits, long-lived AWS access keys, another Lambda in front of StartExecution.
