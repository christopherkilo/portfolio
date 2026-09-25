---
title: "AI Engineering: Designing Reliable Human–AI Development Workflows"
description: "How I evolved from conversational prompting into a specification-driven workflow for planning, implementing, validating, and debugging software with AI."
date: 2026-09-25
project: AI Engineering
featured: false
tags:
  - AI Engineering
  - Prompt Engineering
  - Cursor
  - QA
coverImage: "generated:ai-engineering"
---

## Generating code is the easy part

AI can generate code quickly. Getting that code to belong inside an existing system is a different problem.

Early on, I could ask a model for a feature and get something that compiled, looked plausible, and still did not fit. As the projects got larger, the same failure modes kept showing up: lost context, invented architecture, silent rewrites of working code, scope that drifted mid-pass, regressions in things I had already proven, and completion claims for work that had never been run.

The issue was not that I needed longer prompts. It was that conversational prompting left too many engineering decisions unmade. The model filled the gaps. Sometimes it filled them well. Often it filled them with a different product than the one I was building.

This case study is about the workflow that replaced that habit. Prompt wording is part of it. So are context, specifications, locks, sequenced execution, stop rules, validation, and the report that becomes the next session's state. I use it in Cursor against real software: [TaskFlow](/projects/taskflow), ResolveOps, [Event Horizon](/projects/event-horizon), and [NovaTech](/projects/novatech-solutions).

The thesis is simple. The better the specification, the less the model has to guess.

## Learning with it, not outsourcing the work

I did not come into this through a four-year computer science degree. I have formal career and technical education, and a lot of the software engineering I use now was learned by building the projects that demanded it. AI is part of that process. It is not the source of the knowledge.

I use it to get a first explanation of an unfamiliar idea, to pressure-test an architecture, to compare two approaches, and to turn a messy requirement into a sequence of tasks. Then I check the answer. Documentation, tests, a failing build, a browser pass, a CloudWatch log — those are what decide whether the explanation was useful.

The [About](/about) page is the longer education story. The point here is narrower: I treat AI as a learning accelerator and a collaborator. I do not treat it as an authority. If I cannot tell whether the implementation makes sense, I am not done, regardless of how confident the model sounded.

## A vague request is not a specification

A request like "add offline support" sounds like a task. It is actually a pile of unanswered decisions:

- What should work offline?
- Which writes may be queued?
- Where does pending state live?
- How are failures replayed?
- What happens on version conflict?
- What must stay online-only?
- Which architecture is already closed?
- What evidence proves the implementation works?

If those answers are missing, the model has to invent them. That is how a narrow outbox becomes a local database, how a cookie session grows a second token store, and how a working reservation path gets "simplified" because the model did not know it was sacred.

Important decisions should not be left to model guesswork by accident. If I have not made the decision, I should not pretend the prompt contained it.

## From conversation to a work order

The prompts got more structured because the failures were structured.

```text
CONVERSATIONAL REQUEST
        ↓
DETAILED PROMPT
        ↓
IMPLEMENTATION SPECIFICATION
        ↓
STATE-AWARE WORK ORDER
```

A conversational request is "add offline support." A detailed prompt adds a few constraints and still leaves the architecture open. An implementation specification names the mechanism, the allowlist, and the tests. A state-aware work order also tells the model what is already done, what must not be touched, how to stop if the environment is the problem, and how to report the result.

That last shape is what I use in Cursor now. It reads less like a chat message and more like an engineering ticket with an execution contract.

```text
CONTEXT
+ CONSTRAINTS
+ EXECUTION
+ VALIDATION
= RELIABLE AI-ASSISTED WORKFLOW
```

Prompt engineering still matters. A sloppy sentence still produces sloppy work. It is just not the whole practice. The model also needs the project as it actually is.

## A work order, not a chat message

Here is an abbreviated version of the format I actually use. This one is based on the [TaskFlow Angular](/blog/rebuilding-taskflow-in-angular) offline pass — not a generic template I would paste into any repo.

```text
TASKFLOW ANGULAR — OFFLINE MUTATION OUTBOX

Second client against the existing Next.js TaskFlow APIs.
React demo at /demos/taskflow remains the known-good product.

==================================================
CURRENT STATUS
==================================================

Shell / routing:
PASS

Cookie authentication:
PASS

Reads / mutations / expectedVersion:
PASS

Team / roles:
PASS

Realtime invalidation:
PASS

Offline outbox:
NOT LOCKED

Reason:
Safe mutations still fail when the browser is offline.
There is no durable queue, no replay, and no user-bound store.

==================================================
ALREADY LOCKED — DO NOT REOPEN
==================================================

Do NOT:

- replace the React client or take it offline
- change Next.js route handlers, cookies, or RLS
- store an API JWT in the Angular app
- treat Realtime as a second database
- queue task creation, deletion, role changes,
  comments, or attachments
- auto-retry 409s by bumping expectedVersion

==================================================
1 — INSPECT CURRENT IMPLEMENTATION
==================================================

Read the mutation path, the 409 contract, and the React
outbox allowlist before editing. Do not start from a
greenfield offline design.

==================================================
2 — IMPLEMENT TARGET BEHAVIOR
==================================================

IndexedDB outbox for task_update and task_status only.
Bind the queue to the signed-in user.
Replay oldest-first under a Web Lock.
Keep expectedVersion intact through replay.

==================================================
3 — REGRESSION GUARDRAILS
==================================================

Cookie auth, viewer 403s, versioned PATCH, and realtime
invalidation must keep working. Unsafe actions still
need a live connection.

==================================================
4 — VALIDATION
==================================================

Unit tests for enqueue, replay, cross-user isolation,
and 409-as-conflict. Production build. Do not claim
browser PASS unless the offline path was actually run.

==================================================
FINAL RESPONSE
==================================================

Respond:

Feature: PASS / FAIL / PARTIAL
Tests: [command + count]
Build: PASS / FAIL / NOT RUN
Remaining issues: [list]

Then STOP.
```

The structure is useful because it shrinks the space of acceptable answers. CURRENT STATUS keeps the model from rebuilding finished work. The lock list keeps it from "improving" architecture that is not up for discussion. Numbered steps set an order. Validation names the evidence. The final-response contract makes it harder to hide a skip behind a confident summary.

I still write these by hand. The quality of the work order is the quality of the engineering thinking that went into it. The model does not invent the allowlist. I do.

## CURRENT STATUS is state, not a recap

CURRENT STATUS is the part I underestimated at first.

Without it, every new Cursor session behaves like the project started this morning. The model rediscovers the stack, reopens closed questions, and treats a finished authentication path as optional context instead of a constraint.

With it, the model is told:

- what already works
- what remains incomplete
- what has already been validated
- what this pass is responsible for

That is project-state management. Previous decisions are carried forward as state, not reconstructed from a file tree and a guess. PASS means this pass does not own that feature. NOT LOCKED means this pass does. The difference is the difference between an implementation and a rewrite.

On ResolveOps this became the spine of the work. Completed shell, authorization, and AWS topology stayed marked PASS. Unresolved publication, live proof, or a specific role screenshot stayed NOT LOCKED. The prompt did not ask the model to "continue the project." It asked the model to continue from a known state.

## ALREADY LOCKED — DO NOT REOPEN

AI coding tools are good at noticing other ways to build the same thing. That is useful in a design conversation. It is expensive in an implementation pass.

Left alone, the model will "improve" a working authentication model, restyle a finished UI, rename a route, or replace a database choice because a blog post it remembers prefers something else. None of that was requested. All of it creates regressions that look like progress.

ALREADY LOCKED — DO NOT REOPEN exists to name the decisions that are no longer under discussion. Architecture. Auth. Visual system. Routes. API contracts. Database. Completed screens. Previously validated behavior.

The lesson is not "never change your mind." It is that a good instruction defines what must not change as clearly as what should. If a lock has to move, that is a separate decision, made by me, in a prompt that says so. It is not a side effect of asking for a queue.

## Numbered steps are an execution sequence

Numbering is not formatting. It is an order of operations.

Inspect before edit. Implement after inspect. Protect regressions after the change. Validate after the protection is in place. Report after the validation has a result.

That order has practical effects. Dependencies stay visible. Review is easier because I can see which step actually drifted. The model's reasoning scope stays smaller. When something fails, I can tell whether the failure was in inspection, implementation, or verification. Completion reporting gets more honest because "step 4 was not run" is a clearer sentence than "it should work."

A single undifferentiated blob of requirements invites the model to start in the middle and declare the rest implied.

## Stop when the environment is the problem

Some failures are not in the application.

If AWS authentication expires, the correct move is to stop. It is not to retarget the stack, weaken IAM, or stub the call so the build goes green. If a production screenshot requires a live CloudFront session and Cognito will not sign in, the report is that authentication failed. It is not a redesign of the sign-in page.

I write that as an explicit rule:

If authentication fails: STOP.

Do not modify application source because AWS authentication expired.

The same pattern applies to missing secrets, an unreachable database, a provider quota, and a local toolchain that is not the product. Stop rules distinguish implementation failures from environment failures from authentication failures from missing external dependencies.

Without them, an agentic session will try to "solve" the blockage by changing the only thing it can still edit: the code. That is how a credential problem becomes a logic bug.

## Done is evidence, not confidence

Code written is not the same as work completed.

I started asking for observable evidence because model confidence is a bad completion signal. Depending on the task, done has meant unit tests, integration tests, lint, typecheck, a production build, a browser pass, a responsive matrix, Playwright, axe, a database inspection, CloudWatch, a live request against production infrastructure, or a screenshot of an authenticated screen.

Acceptance criteria turn "I believe this works" into "this command ran, and this is what it produced." If the criterion is a 320px authenticated shell, the evidence is that viewport, signed in, on the live URL — not a local mock and a claim that the CSS should hold.

### No fake PASS

The reporting rule is rigid on purpose.

Do not report PASS for something that was not actually verified.

If it was not run: NOT RUN.

If only some of it ran: PARTIAL.

AI summaries lean optimistic. A rigid contract separates implemented from verified from assumed. PARTIAL is a legitimate result. Pretending PARTIAL is PASS is how a later session inherits a lie and builds on it.

### Completion reports are the next prompt's context

A substantial Cursor pass ends with a structured report: what changed, which files, tests run, results, build, browser, accessibility, unresolved items, manual actions I still have to take, and any deviation from the requested architecture.

That report does two jobs. It verifies the current task. It becomes state for the next one. CURRENT STATUS in the following work order is largely a compression of the last completion report. If the report is vague, the next pass starts from fog again.

## TaskFlow: offline was not "add offline mode"

[TaskFlow](/projects/taskflow) was already a collaborative workspace in React when I [rebuilt a second client in Angular](/blog/rebuilding-taskflow-in-angular). The React app stayed up. The APIs stayed the APIs. The Angular work was a learning rebuild against a backend I already trusted, in phases: shell and routing, authentication, reads, mutations, team and roles, realtime as invalidation, offline, conflict resolution, then product surfaces like calendar and settings.

Offline was the cleanest example of why the work order matters.

The requirement was not "add offline mode." The design was an IndexedDB mutation outbox. Safe queued types were `task_update` and `task_status`. Creates, deletes, role changes, comments, and attachments stayed online-only. Optimistic concurrency stayed in place: replay still sent `expectedVersion`. A 409 was a conflict, not a hint to bump the version and try again. The queue was bound to the signed-in user so one person's pending writes could not replay as someone else.

Later conflict work compared base, local, and latest, and auto-merged only where the fields did not actually collide. That was a separate pass, with its own locks. The offline prompt was not allowed to invent a merge UI to look more complete.

Those constraints are why the model did not build a local replica, did not queue comment POSTs, and did not treat Realtime disconnect as browser offline. A broader architecture would have been easier to generate. It would have been the wrong product.

## ResolveOps: the work order as the project

ResolveOps is where the same format got strictest. It is an Angular and Spring ITSM I built as its own product — not a page on this site — and the later passes were less "write this feature" than "operate from this state."

Completed work was marked PASS. Unresolved work was marked NOT LOCKED. ALREADY LOCKED — DO NOT REOPEN covered the modular monolith, Cognito-plus-application authorization, the visual system, and the AWS topology. Some passes were publication-only: republish the branded SPA, do not reopen ticket logic. AWS authentication had to be checked before anyone pretended the live demo had been proven. If that check failed, STOP.

Validation was specific. Live CloudFront. Authenticated screenshots, including employee-role proof, not just an administrator session. axe on sign-in and ticket detail. An explicit test policy for what unit tests owed versus what only the live system could show. An exact final-response contract so PARTIAL could not be smuggled in as PASS.

The useful part is not that the prompts were long. It is that they told the model the project's state, which decisions were final, which actions were allowed, which were prohibited, how to verify the live system, and how to report uncertainty. That is a work order. It is also context engineering with the locks written down.

## The same workflow on AWS

The workflow is not a frontend habit.

[Event Horizon](/blog/taking-event-horizon-to-aws) already had PostgreSQL bookings when Ticketmaster ingestion showed up. The work order equivalent was the split: DynamoDB could cache provider listings; it could not become the reservation ledger. SQS and a write-only Lambda came before Fargate. The Consumer Key stayed in SSM. If the Function URL was missing locally, the curated catalog still had to render. EventBridge was allowed to start the task. It was not allowed to own DynamoDB.

[NovaTech](/blog/taking-novatech-to-aws) had a similar shape. The contact form could not keep HubSpot and Resend on the same synchronous clock. Step Functions coordinated. DynamoDB claimed the submission id. HubSpot remained the CRM. Mail failures were not allowed to rewind a deal. Vercel got OIDC, not a long-lived access key. Turnstile tokens were not allowed into workflow input.

Those constraints are the lock list in infrastructure form. They also force the debugging distinction the stop rules are about. A HubSpot timeout is not a reason to rewrite the form. An expired AWS session is not a reason to loosen IAM. A provider rejection is not a missing `if` in the UI. The same CURRENT STATUS / lock / validate / report loop applies when the artifact is a queue, a Lambda, or a state machine.

I still have to know what the system is supposed to do. The model can draft the CDK or the handler. It cannot decide that bookings may leave Postgres because DynamoDB was more convenient that afternoon.

## Trace before regenerating

When something that previously worked disappears, the temptation is to generate a replacement.

That is usually how a one-line regression becomes three new files.

The rule I ended up writing down is: trace before regenerating. Inspect the current state. Identify what changed. Compare it to the last valid state. Find the broken path. Repair that path.

I have watched a working query "fixed" into a new data layer because a later pass did not see the original contract. I have watched a CSS regression get a new layout system. I have done this myself when I was tired and the model was ready to be helpful. The helpful version is almost never cheaper than reading the diff.

Regenerate when the implementation is actually wrong. Trace when it used to be right.

## Context engineering

A good prompt with bad context still produces a bad implementation.

The model needs more than the task. It needs an architecture summary, phase-completion records, known constraints, known failures, accepted limitations, current test counts, locked decisions, and a honest picture of what is next. Handoff packets — the completion report plus CURRENT STATUS plus the lock list — are how a later session inherits that picture.

Task specification plus project context. If either side is missing, the model fills it in. That is the same guesswork problem as "add offline support," just one layer up.

This is why I keep written state for the larger projects instead of relying on the chat transcript. Transcripts decay. A status block can be reused.

## Using AI to learn

The same loop is how I learn unfamiliar systems.

I ask for a conceptual explanation, then I go read the docs. I ask why a recommendation was made, then I try the alternative that it dismissed. I use a failing implementation as a lesson: what assumption was wrong, and how would I have caught it without the stack trace? I test the remaining guesses in actual code.

None of that works if I take the first answer as true. Understanding still has to be earned, because I am the one who has to decide whether the result belongs in the system. AI can shorten the distance to a hypothesis. It cannot sign off on it.

## The human still owns the system

I keep the engineering decisions.

Product intent, architecture, scope, constraints, review, tradeoffs, validation, and the call that work is complete — those stay with me. The model assists execution and reasoning. It does not own the system.

That is not a slogan. It is the only arrangement that makes the rest of this workflow make sense. Locks only work if someone has the authority to lock. PASS only works if someone refuses the fake version. A stop rule only works if someone is willing to stop.

## What changed

Earlier, I asked AI for an answer.

Now I define the system state, define the desired change, protect working behavior, constrain the implementation, execute in stages, validate observable behavior, record the exact results, and carry that state into the next pass.

It is slower to write the work order than to type "add offline support." It is faster than rebuilding the same feature three times because the first two were guesses. It also happens to be how I would want to brief another engineer. The model is not a special case. It is a collaborator that needs more explicit context than a person who was in the room for the last six months.

## Principles

**The better the specification, the less the model has to guess.** Unmade decisions will still be made. I would rather be the one who makes them.

**Define what must not change as clearly as what should.** ALREADY LOCKED is not hostility. It is how working software stays working.

**Code written is not work verified.** PASS requires evidence. NOT RUN is an honest status. PARTIAL is allowed. Fiction is not.

**Preserve project state between passes.** CURRENT STATUS exists so the next session does not start at zero.

**Distinguish environmental failures from code failures.** Expired credentials are not a refactor opportunity.

**Trace regressions before regenerating solutions.** The last valid path is usually still nearby.

**AI can accelerate learning, but understanding still has to be earned.** I remain responsible for knowing why the implementation is right.

**The engineer remains responsible for the system.** The workflow is a way to collaborate. It is not a way to hand over ownership.
