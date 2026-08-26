# AWS infrastructure

CDK TypeScript app for the Christopher Kilo portfolio. This is a small **dev / learning** AWS account, not a production environment.

Event Horizon Phase 1 is implemented: **SQS → Lambda → DynamoDB** for externally ingested event records. NovaTech still has no workload resources. Do not deploy until that step is explicitly approved.

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

The CDK environment in `us-east-2` is already bootstrapped. Do not run `cdk deploy` until that step is explicitly approved.

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
- `portfolio-dev-event-horizon-ingestion-handler`
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

### Event Horizon Phase 1 (implemented, not deployed until approved)

```
Manual / future worker
        ↓
SQS ingestion queue  →  DLQ after 3 failures
        ↓
Lambda (Node.js 22)
        ↓
DynamoDB external-events (on-demand, TTL)
```

This Lambda only consumes SQS messages. It does not call provider APIs, Prisma, or PostgreSQL.

Expected SQS message body:

```json
{
  "provider": "ticketmaster",
  "externalId": "evt-123",
  "title": "Harbor Lights Festival",
  "city": "Cleveland",
  "state": "OH",
  "startsAt": "2026-09-15T23:00:00.000Z",
  "sourceUrl": "https://example.com/events/harbor-lights"
}
```

Required fields: `provider`, `externalId`, `title`, `startsAt`. The same `provider` + `externalId` overwrites the existing DynamoDB item.

Later phases may add:

```
Docker worker
    ↓
ECS/Fargate
    ↓
SQS
```

PostgreSQL / Prisma remains the transactional source of truth for reservations, ticket inventory, and other relational data. Do **not** migrate those responsibilities to DynamoDB. DynamoDB is for externally ingested event records, cache, and deduplication.

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
