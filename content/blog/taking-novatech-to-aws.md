---
title: "Taking NovaTech to AWS"
description: "How a same-origin contact form grew from a synchronous HubSpot-and-Resend handler into a durable inquiry workflow—without treating retries as a single-delivery guarantee or ingress rate limiting as global."
date: 2026-08-29
project: NovaTech
featured: false
tags:
  - NovaTech
  - AWS
  - Next.js
  - Step Functions
  - HubSpot
coverImage: "generated:novatech"
---

## Starting as a form, not a cloud diagram

NovaTech began as a marketing site that needed to collect a lead. The first version was honest about that: a visitor filled in the contact form, Next.js validated the payload in a Route Handler, HubSpot got the CRM write, and Resend sent mail before the HTTP response came back.

That path is easy to explain. It is also easy to outgrow. One process owns every side effect. A HubSpot timeout looks like a failed submit. A duplicate click can create a second deal. Email and CRM succeed or fail as a pair even when they should not.

Event Horizon already taught me not to invent a throwaway AWS lab. NovaTech already had a real product constraint: an MSP inquiry has to land in HubSpot even if the thank-you email is late, retried, or never delivered. That is the reason the architecture moved.

## Why the synchronous handler stopped being enough

The original handler was instance-local in more ways than one. Duplicate protection lived next to the request. Rate limiting lived next to the request. If two submissions arrived on different instances, “I already saw this id” was a hope, not a record.

I also did not want the browser waiting on HubSpot and Resend. The visitor should hear that the inquiry was accepted. The CRM write and the notifications are someone else’s clock.

So the shape changed:

Visitor → NovaTech form → Next.js Route Handler → Cloudflare Turnstile → Vercel OIDC → AWS Step Functions → DynamoDB → HubSpot Lambda → HubSpot CRM → SQS → Notification Lambda → Resend.

The interesting part is not the length of that list. It is which failures are allowed to be independent.

## Workflow as coordinator, not as a second app

I used Standard Step Functions as the coordinator. The state machine claims the submission, calls HubSpot, then enqueues notification work. It is not a second product. It does not replace Next.js. The Route Handler still owns public ingress.

Standard workflows are the right default here because the work is durable and retryable, not a sub-second Express pipeline. StartExecution uses a deterministic name derived from the submission id. A second start with the same name becomes `ExecutionAlreadyExists`. The API still answers 202. That is how a refresh or a double click stays boring.

This is not infinite scale. It is a portfolio inquiry path with a coordinator that survives a retry.

## DynamoDB as the claim, not as a CRM

DynamoDB holds durable submission state and the idempotency claim. The business guard is “this submission id has already been accepted,” not “HubSpot might have a contact with a similar email.”

That distinction matters. HubSpot remains the CRM system of record. DynamoDB is not a shadow CRM. It is the workflow’s memory: claimed, CRM completed, notifications in flight, failed in a way that is allowed to stay failed.

If I had kept duplicate protection only in the Next.js process, a second instance could still start a second HubSpot write. The durable claim has to live where every retry can see it.

## Lambdas at the edges

HubSpot code and Resend code sit in Lambdas because those are vendor integrations, not marketing-page concerns. The state machine decides when they run. Scoped IAM decides what they may touch. Secrets stay in SSM as SecureStrings, not in the repo and not in the browser.

The Route Handler does not call HubSpot. It does not send mail. After Turnstile succeeds, Vercel assumes an IAM role through OIDC and is allowed to start the workflow. That is the whole AWS identity the frontend deploy gets. There are no long-lived AWS access keys on the Vercel project for this path.

OIDC is a narrower credential than a static key sitting in environment variables for months.

## HubSpot first, mail second

The CRM write is the product outcome. Notifications are a consequence.

SQS sits between HubSpot success and Resend so a mail provider timeout cannot rewind a deal. Standard queues are at-least-once. The notification Lambda is written for that: it may see a job more than once. Resend idempotency keys are used where they apply so a retry is less likely to become a second email. That is still at-least-once delivery, not a single-delivery guarantee.

If visitor mail fails permanently—wrong destination on a test sender, provider rejection, whatever the reason—the lead stays in HubSpot. Staff notification can succeed on its own path. That isolation was the point of leaving the synchronous handler.

Retries belong on the queue. A DLQ exists so poison payloads stop cycling the happy path. I would rather inspect a dead letter than pretend every notification will eventually succeed.

## What stays on Next.js

Public ingress is still the Next.js Route Handler. Cloudflare Turnstile is verified there, then discarded. The token does not enter Step Functions input, DynamoDB, SQS, or logs. Spam control has to sit in front of paid and third-party side effects.

Rate limiting on that handler is instance-local and best-effort. It is an extra speed bump, not a distributed quota. I am not going to call it perfect.

The HTTP contract is 202 accepted. The UI says the request was received. It does not say the email already sent.

## What I actually verified

I ran the production path: form, Turnstile, OIDC session, StartExecution, workflow success, DynamoDB completion, HubSpot contact/deal/note, then both notification jobs. I repeated the same submission id and still had one execution and one CRM write. A fake Turnstile token never reached AWS.

That is enough to trust the split. It is not a claim of zero downtime, and it is not a claim that every inbox on earth will accept the visitor message.

## What I would not do next

Not more AWS. NovaTech’s cloud path is complete on purpose, the same way Event Horizon’s ingestion path is complete on purpose.

The useful lesson was the one I kept repeating to myself while the handler was still synchronous: coordinate the work, persist the claim, keep HubSpot as HubSpot, and let email fail without lying about the lead.
