# AWS infrastructure

CDK TypeScript app for the Christopher Kilo portfolio. This is a small **dev / learning** AWS account, not a production environment.

Event Horizon Phase 3 adds **Ticketmaster Discovery ingestion** through the existing short-lived Fargate worker. The SQS → Lambda → DynamoDB pipeline is unchanged. NovaTech still has no workload resources.

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
- `portfolio-dev-novatech-inquiry-workflow` (not created yet)

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
ECS/Fargate worker  (manual run, not a service)
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

This phase uses a small VPC because **Fargate tasks require VPC networking**. It uses public subnets only and `natGateways: 0`. The task can receive a public IP to reach Ticketmaster and AWS APIs. There is **no ECS Service**, so Fargate compute is not running continuously.

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

### NovaTech

Will later demonstrate Lambda, Step Functions, DynamoDB, and SQS:

```
Inquiry
   ↓
Lambda
   ↓
Step Functions
   ├── validate request
   ├── check idempotency
   ├── HubSpot integration
   ├── create CRM note
   └── queue notification
                    ↓
                   SQS
                    ↓
                  Lambda
                    ↓
                  Resend
```

DynamoDB will later provide durable idempotency / deduplication instead of an in-memory guard. Do not implement this workflow until the next approved phase.
