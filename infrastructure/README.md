# AWS infrastructure

CDK TypeScript app for the Christopher Kilo portfolio. This is a small **dev / learning** AWS account, not a production environment.

Event Horizon Phase 5 schedules the existing Fargate Ticketmaster worker twice daily with EventBridge Scheduler. Phase 3–4 ingestion, DynamoDB, and the public reader Function URL are unchanged. NovaTech still has no workload resources.

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
