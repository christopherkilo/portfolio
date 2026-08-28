# NovaTech Integration Setup

Local and production setup for the public inquiry path. Real values belong only in `.env.local` (gitignored) or the hosting platform. `.env.example` keeps empty placeholders.

## 1. Copy environment file

```bash
cp .env.example .env.local
```

## 2. Public ingress (Next.js)

| Variable | Purpose | Source |
|----------|---------|--------|
| `NEXT_PUBLIC_APP_URL` | Public origin | Local `http://localhost:3000` or deployed URL |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Browser widget (public) | Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | Siteverify (server-only) | Cloudflare Turnstile |
| `NOVATECH_ALLOW_TURNSTILE_DEV_BYPASS` | Dev-only mock acceptance | Set `true` only in local non-production |
| `NOVATECH_STATE_MACHINE_ARN` | Step Functions StartExecution | AWS (`portfolio-dev-novatech-inquiry-workflow`) |
| `NOVATECH_AWS_REGION` | SFN client region | `us-east-2` |
| `AWS_ROLE_ARN` | Vercel OIDC role | `portfolio-dev-novatech-vercel-ingress` (Production/Preview only) |

Never use `NEXT_PUBLIC_` for AWS ARNs or role ARNs. Never put AWS access keys in `.env.local`, GitHub, or Vercel.

### Local AWS identity

Use the existing AWS CLI profile — not long-lived keys in the app:

```bash
export AWS_PROFILE=portfolio
export AWS_REGION=us-east-2
```

### Local Turnstile

1. Cloudflare test keys (always-pass / always-fail pairs from Cloudflare docs), or
2. `NOVATECH_ALLOW_TURNSTILE_DEV_BYPASS=true`. The contact UI emits `dev-mock-token` when no site key is set.

Production never accepts the bypass.

## 3. HubSpot and Resend (AWS, not Next.js)

The live form does not read `HUBSPOT_ACCESS_TOKEN` or `RESEND_API_KEY` from Next.js.

| Secret | Where |
|--------|--------|
| HubSpot Private App token | SSM SecureString `/portfolio/dev/novatech/hubspot-access-token` |
| Resend API key | SSM SecureString `/portfolio/dev/novatech/resend-api-key` |

Those parameters already exist. Recreate them only if missing — in an interactive terminal, never by pasting the value into chat:

```bash
export AWS_PROFILE=portfolio AWS_REGION=us-east-2
read -s "HUBSPOT_TOKEN?Paste HubSpot Private App token, then press Enter: "
aws ssm put-parameter \
  --name /portfolio/dev/novatech/hubspot-access-token \
  --type SecureString \
  --value "$HUBSPOT_TOKEN"
unset HUBSPOT_TOKEN
```

```bash
export AWS_PROFILE=portfolio AWS_REGION=us-east-2
read -s "RESEND_API_KEY?Paste Resend API key, then press Enter: "
aws ssm put-parameter \
  --name /portfolio/dev/novatech/resend-api-key \
  --type SecureString \
  --value "$RESEND_API_KEY"
unset RESEND_API_KEY
```

Suggested HubSpot Private App scopes: contacts, deals, notes/engagements, plus deal schema read/write.

Lambda From/staff addresses currently use Resend’s documented test sender `onboarding@resend.dev`. Unverified custom domains will fail email; CRM records are still kept.

`HUBSPOT_*` / `RESEND_*` in `.env.local` are only for local unit tests of the shared clients.

## 4. Vercel Production / Preview (OIDC)

Do this **before** deploying Next.js that calls StartExecution.

1. Enable OIDC on the Vercel project (Settings → Security / OIDC).
2. Confirm CDK deployed:
   - OIDC provider `https://oidc.vercel.com/christopherkilos-projects`
   - Role `portfolio-dev-novatech-vercel-ingress`
3. Set server-only environment variables on Production and Preview:

| Key | Value |
|-----|--------|
| `NOVATECH_STATE_MACHINE_ARN` | CloudFormation output `InquiryWorkflowStateMachineArn` |
| `NOVATECH_AWS_REGION` | `us-east-2` |
| `AWS_ROLE_ARN` | CloudFormation output `VercelIngressRoleArn` |
| `TURNSTILE_SECRET_KEY` | Existing Cloudflare secret |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Existing site key |

Trust policy (already in `NovaTechDevStack`): `sts:AssumeRoleWithWebIdentity` from that OIDC provider, `aud` = `https://vercel.com/christopherkilos-projects`, `sub` = Production or Preview for project `portfolio`.

Permission policy: `states:StartExecution` on the NovaTech state machine ARN only.

Do not grant `states:*`, DynamoDB, SQS, Lambda invoke, SSM, or Event Horizon.

Local `next dev` should **not** use this role (`VERCEL_ENV=development` is excluded). It uses `AWS_PROFILE`.

## 5. Run the app

```bash
export AWS_PROFILE=portfolio AWS_REGION=us-east-2
npm install
npm run dev
```

Open `/demos/novatech-solutions/contact`.

## 6. Tests

```bash
npm test
```

The default suite **mocks** Turnstile, Step Functions, HubSpot, and Resend. It does not call live AWS.

## 7. Debugging with a request ID

1. Copy `x-request-id` from the inquiry response (or Network tab).
2. Search Next.js logs for that UUID (`inquiry.accepted` / Turnstile events).
3. Search Step Functions / Lambda logs for the same `requestId` and `submissionId`.

You should never see visitor message text, emails, phones, tokens, or secrets in those logs.

## 8. Manual smoke checklist

1. Valid inquiry succeeds in the UI (202, “request has been received”)
2. Response includes `x-request-id` and no AWS/provider details
3. Step Functions: AcquireSubmission → HubSpotCRM → QueueNotifications → MarkCompleted → CompletedSuccess
4. DynamoDB row `COMPLETED` / `CRM_COMPLETED`
5. One HubSpot contact upsert, one deal for `submissionId`, one note
6. SQS jobs process; visitor + staff email attempt
7. Same `submissionId` again: 202 already-received; no second deal/note/email job
8. Bad Turnstile never starts an execution
9. Network panel shows no AWS keys, SSM values, HubSpot token, Resend key, or Turnstile secret

See `infrastructure/README.md` for stack internals.
