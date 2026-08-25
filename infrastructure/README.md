# AWS infrastructure

CDK TypeScript app for the Christopher Kilo portfolio. This is a small **dev / learning** AWS account, not a production environment.

This phase is foundation only. No Lambda, DynamoDB, SQS, Step Functions, ECS, ECR, API Gateway, VPC, NAT Gateway, load balancer, database, Secrets Manager, or CloudWatch alarm resources are defined yet.

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

Do not run `cdk bootstrap` or `cdk deploy` until that phase is explicitly approved.

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

Examples (not created in this phase):

- `portfolio-dev-event-horizon-ingestion-queue`
- `portfolio-dev-event-horizon-external-events`
- `portfolio-dev-novatech-inquiry-workflow`

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

## Architecture plan (not implemented yet)

### Event Horizon

Will later demonstrate ECS/Fargate, Docker, SQS, Lambda, and DynamoDB:

```
External event providers
        ↓
Dockerized ingestion worker
        ↓
ECS/Fargate task
        ↓
SQS
        ↓
Lambda
        ↓
DynamoDB external-event store/cache
        ↓
Event Horizon discovery layer
```

PostgreSQL / Prisma remains the transactional source of truth for reservations, ticket inventory, and other relational data. Do **not** migrate those responsibilities to DynamoDB. DynamoDB is for externally ingested event records, cache, and deduplication where that access model fits.

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
