# NovaTech Integration Setup

Local setup for HubSpot, Resend, and Cloudflare Turnstile. Real values belong only in `.env.local` (gitignored). `.env.example` keeps empty placeholders.

## 1. Copy environment file

```bash
cp .env.example .env.local
```

## 2. Application

| Variable | Purpose | Source |
|----------|---------|--------|
| `NEXT_PUBLIC_APP_URL` | Absolute links in emails / origin | Local `http://localhost:3000` or deployed URL |

## 3. HubSpot CRM

| Variable | Purpose | Source |
|----------|---------|--------|
| `HUBSPOT_ACCESS_TOKEN` | Private App bearer token | HubSpot → Settings → Integrations → Private Apps |
| `HUBSPOT_PIPELINE_ID` | Deal pipeline id | Settings → Objects → Deals → Pipelines (or Pipelines API) |
| `HUBSPOT_DEAL_STAGE_ID` | Initial stage id inside that pipeline | Same Pipelines UI/API |

Suggested Private App scopes: contacts (read/write), deals (read/write), and notes/engagements as required for note create.

### Finding pipeline and stage IDs

1. HubSpot → Settings → Objects → Deals → Pipelines  
2. Open the target pipeline and stage  
3. Or call `GET /crm/v3/pipelines/deals` with the Private App token and copy `id` / `stages[].id`

Do not hardcode unverified IDs in source.

## 4. Resend email

| Variable | Purpose | Source |
|----------|---------|--------|
| `RESEND_API_KEY` | API authentication | Resend dashboard → API Keys |
| `NOVATECH_FROM_EMAIL` | From address | Verified domain/sender in Resend (or Resend’s documented test sender in development) |
| `NOVATECH_STAFF_EMAIL` | Staff notification recipient | Your inbox |

### Sender / domain requirements

Production senders must use a domain verified in Resend. Until then, use Resend’s permitted development/testing sender configuration. Unverified domains cause email failure; CRM records are still kept (`emailSent: false`).

## 5. Cloudflare Turnstile

| Variable | Purpose | Source |
|----------|---------|--------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Browser widget (public) | Cloudflare Turnstile → site key |
| `TURNSTILE_SECRET_KEY` | Siteverify (server-only) | Cloudflare Turnstile → secret key |
| `NOVATECH_ALLOW_TURNSTILE_DEV_BYPASS` | Dev-only mock acceptance | Set `true` only in local non-production |

### Local testing options

1. **Cloudflare test keys** (always-pass / always-fail pairs from Cloudflare docs)  
2. **Dev bypass:** set `NOVATECH_ALLOW_TURNSTILE_DEV_BYPASS=true`. The contact UI emits `dev-mock-token` when no site key is set. Production never accepts this bypass.

Never silently skip Turnstile in production.

## 6. Run the app

```bash
npm install
npm run dev
```

Open `/demos/novatech-solutions/contact`.

## 7. Tests

```bash
npm test
```

The default suite **mocks** HubSpot, Resend, and Turnstile. It does not make live provider calls.

## 8. Debugging with a request ID

1. Copy `x-request-id` from the inquiry response (or Network tab).
2. Search server logs for that UUID.
3. You should see matching events for Turnstile, HubSpot, and Resend without visitor message text or secrets.

Note: logging is structured console JSON for this portfolio — not Sentry/Datadog.

## 9. Manual smoke checklist (with real credentials)

1. Valid inquiry succeeds in the UI  
2. Response includes `x-request-id`  
3. Contact created/updated in HubSpot  
4. Deal created and associated  
5. Note contains inquiry details + submission id  
6. Visitor confirmation email arrives  
7. Staff notification arrives  
8. Bad Turnstile blocks CRM/email  
9. Invalid fields never reach HubSpot  
10. Double-submit while pending does not fire twice  

If credentials or verified sender/pipeline IDs are missing, leave the keys empty and rely on mocked tests — do not fake live success.
