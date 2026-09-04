---
title: "Taking Event Horizon to AWS"
description: "How I turned a reservation demo into a Ticketmaster ingestion pipeline without moving bookings off PostgreSQL."
date: 2026-08-26
project: Event Horizon
featured: false
tags:
  - Event Horizon
  - AWS
  - Next.js
  - DynamoDB
  - ECS
coverImage: "generated:event-horizon"
---

## Starting as a product, not a cloud tutorial

Event Horizon began as a frontend-heavy portfolio demo: browse events, pick a night, hold a seat. I added Auth.js, Prisma, and PostgreSQL because favorites and ticket inventory are not honest if they only live in the browser.

That version already had a job. Native events, URL-synced filters, transactional holds. What it did not have was any reason to open the AWS console.

I did not want to invent a fake “cloud demo” with a hello-world queue. I wanted the same product I already cared about to grow a second workload: real external events, refreshed on a schedule, without breaking the reservation path I had just made trustworthy.

## Why Event Horizon instead of a throwaway lab

The ingestion problem showed up on its own. A discovery app that only shows sixteen seeded concerts is a catalog. A discovery app that also lists what Ticketmaster is actually selling in Dallas has to ingest, normalize, dedupe, retry, expire, and refresh.

That is a different shape from “decrement quantity inside a transaction.” It was a better AWS candidate than a greenfield tutorial because the constraints were already real: the UI existed, PostgreSQL already owned bookings, and I could not pretend DynamoDB was now the whole product.

## Two stores on purpose

I kept PostgreSQL for native events, users, favorites, inventory, and reservations. DynamoDB became a cache of provider listings keyed by `provider` and `externalId`.

That split is the whole thesis. External rows are discovery cards. They never enter Event Horizon checkout. If someone wants tickets for a Ticketmaster show, they leave through the provider URL. Native events still reserve through Prisma.

If I had forced Ticketmaster into Postgres, I would have mixed a booking ledger with a feed that is allowed to vanish tomorrow. If I had moved reservations to DynamoDB, I would have given up the transactional inventory I already trusted.

## Building the write path first

The first AWS slice was deliberately boring: SQS, a Lambda that only upserts, DynamoDB with TTL. No containers yet. I wanted to prove a message could become a row, a poison payload could land on a DLQ after three failures, and a second copy of the same provider id would update rather than clone.

That last part matters more than the service names. Repeat the same event and `ingestedAt` stays still. `updatedAt` moves. The catalog does not accumulate ghosts.

The ingestion Lambda is UpdateItem-only. It does not query for the UI. It does not send mail. It writes discovery records and gets out of the way.

## Then the worker, then the key, then the UI

Once the queue path was honest, I packaged a TypeScript worker in Docker and ran it as a short-lived Fargate task. No ECS Service. The task talks to Ticketmaster and SQS, then exits. Public subnets and a public IP avoided a NAT Gateway I did not need for outbound-only work.

The Consumer Key never went in the repo. SSM Parameter Store holds a SecureString. ECS injects it at runtime. The browser never sees it. Vercel never gets an AWS access key for this.

The UI talks to a second Lambda—Query-only—over a Function URL. If that URL is missing locally, Event Horizon still shows the curated catalog. External events fail quietly. That was a product requirement, not an afterthought: the AWS work cannot make the demo fragile.

## Scheduling the last manual step

For a while I still started Fargate by hand. That was the only remaining ritual. EventBridge Scheduler now runs the same task at 8:00 AM and 8:00 PM America/Chicago. The scheduler may `RunTask` and pass the two task roles. It does not get DynamoDB. It does not get SQS. The worker still owns the queue send.

Normal volume is about two Ticketmaster Discovery requests a day. That is enough to keep Dallas listings fresh without turning the account into a polling hobby.

## What I would change next

Not more AWS. Event Horizon’s cloud path is complete on purpose. NovaTech is where Step Functions belongs later.

On the product side I would still add real payments, live native inventory on detail pages, and pagination the API already supports. On the ingestion side, a startsAt index would only earn its keep if the dataset stopped being small.

The useful lesson was not “I used a lot of AWS.” It was that a portfolio app got more interesting when I let two workloads keep two sources of truth, then automated the boring refresh so I could stop babysitting a run-task command.
