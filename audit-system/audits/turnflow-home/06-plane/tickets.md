# TurnFlow Home: Plane tickets (one per gap, in `topGaps` order)

Suggested Plane setup:
- **Project identifier:** `TURN`.
- **Modules:** Join · Set up my home · Capture a repair · Share and get quotes · Get the work done · Close out and record · Keep history and maintain · Platform.
- **Labels:** `gap`, `figjam`, `eraser`, `bruno`, `figma`, `db`, `plane`, `observability`.
- **Estimates:** 1 point ≈ 1 focused hour.

Personas in Givens come from `05-prisma/README.md`. Personas marked (P) are PROPOSED in `seed-authz-personas.ts`.

---

### 1a. Switch DB access to a transaction-capable driver and add a `withTransaction` helper
- Gap: GAP-ERASER-01   Priority: Urgent   Labels: gap, eraser, db   Module: Platform   Estimate: 2 pts
- Context: `lib/db/index.ts:2` uses `drizzle-orm/neon-http`, which can't run interactive transactions (`docs/03-design/constraints.md:13`). No action uses `db.transaction` (`search:transaction`). Add a second client on `drizzle-orm/neon-serverless` (WebSocket Pool) used only for multi-write actions.

```gherkin
Feature: Transactions are available to server actions

  Scenario: A failing write rolls back earlier writes
    Given a test that opens withTransaction and inserts a decision_log row
    When the next statement in the same transaction throws
    Then no decision_log row from that transaction exists

  Scenario: Single-statement reads keep using the HTTP driver
    When the owner dashboard loads
    Then it uses the existing neon-http client
```
- Out of scope: converting every action (1b).

### 1b. Make quote approval and closeout review atomic
- Gap: GAP-ERASER-01   Priority: Urgent   Labels: gap, eraser, db   Module: Close out and record   Estimate: 3 pts
- Context: `approveQuoteAction` makes 3 sequential writes (`lib/actions/quotes.ts:93-112`). `reviewCloseoutSubmissionAction` makes up to 5 (`lib/actions/closeout-submissions.ts:147-208`). A failure in the middle half-applies the decision (F5, `docs/07-refinement/findings-and-roadmap.md:17`).

```gherkin
Feature: Owner decisions apply completely or not at all

  Background:
    Given I am signed in as "owner@test.com"
    And the request "Kitchen faucet leaking" has a pending closeout from "vendor@test.com"

  Scenario: Approval succeeds
    When I approve the closeout
    Then the closeout is "approved"
    And the request is "Complete" with final cost set
    And exactly one billing record exists for that closeout
    And the decision log has one "closeout_approved" entry

  Scenario: Approval fails midway
    Given inserting the billing record will fail
    When I approve the closeout
    Then I see "That didn't go through. Nothing was saved."
    And the closeout is still "pending"
    And the request status is unchanged
    And no "closeout_approved" entry exists
```
- Out of scope: the other multi-write actions (follow-up ticket per action file).

### 2. Keep the decision log when a request is deleted (archive instead of delete)
- Gap: GAP-ERASER-02   Priority: Urgent   Labels: gap, eraser, db   Module: Keep history and maintain   Estimate: 3 pts
- Context: `decision_log.request_id` is `ON DELETE CASCADE` (`lib/db/schema.ts:286-291`), and `deleteRequestAction` hard-deletes (`lib/actions/requests.ts:234`). The "permanent history" promise breaks (F8, `docs/03-design/data-model.md:83`).

```gherkin
Feature: Repair history survives removal

  Background:
    Given I am signed in as "owner@test.com"
    And the request "Kitchen faucet leaking" has 5 decision log entries

  Scenario: Removing a request archives it
    When I remove the request
    Then it no longer appears on my dashboard
    And its status is "Archived"
    And its 5 decision log entries still exist

  Scenario: The log cannot be deleted directly
    When any code runs "DELETE FROM decision_log"
    Then the database rejects it
```
- Out of scope: a UI to restore archived requests.

### 3a. Test database harness for integration tests
- Gap: GAP-BRUNO-01   Priority: High   Labels: gap, bruno   Module: Platform   Estimate: 3 pts
- Context: there's no integration layer (`docs/06-testing/test-strategy.md:13`, `:23`). Coverage of `lib/actions` is 0% (`cmd:npx vitest run --coverage`). Depends on GAP-PRISMA-04 (a local or branch database the driver can reach).

```gherkin
Feature: Integration tests run against a real database

  Scenario: Fresh seeded database per test run
    Given CI starts Postgres with the Neon HTTP proxy
    When "npm run test:integration" runs
    Then migrations and the seed (including the authorization personas) are applied first
    And each test file runs inside a rolled-back transaction or a truncated schema
```

### 3b. Authorization matrix for quotes, closeout, and requests actions
- Gap: GAP-BRUNO-01   Priority: High   Labels: gap, bruno   Module: Platform   Estimate: 3 pts
- Context: the planned matrix (`docs/06-testing/test-strategy.md:43-64`). Sketch: `03-bruno/README.md`.

```gherkin
Feature: Only the right actor can call each action

  Scenario Outline: approveQuoteAction by each actor
    Given a pending quote on "Kitchen faucet leaking" owned by "owner@test.com"
    When <actor> calls approveQuoteAction
    Then the result is <result>
    And if denied, the quotes, requests, and decision_log row counts are unchanged

    Examples:
      | actor                      | result  |
      | owner@test.com             | allowed |
      | other-owner@test.com (P)   | denied  |
      | vendor@test.com            | denied  |
      | collaborator@test.com      | denied  |
      | signed out                 | denied  |
```

### 3c. Authorization matrix for the remaining action files
- Gap: GAP-BRUNO-01   Priority: High   Labels: gap, bruno   Module: Platform   Estimate: 3 pts
- Context: the other 13 files in `lib/actions/` (invites, tasks, work sessions, vault, reminders, backup, ...). Same outline as 3b, one table per action. Done when every exported action has a row.

### 4. Add error boundaries for every portal and the root
- Gap: GAP-FIGMA-01   Priority: High   Labels: gap, figma   Module: Platform   Estimate: 2 pts
- Context: no `error.tsx` or `global-error.tsx` anywhere (`missing:app/error.tsx`, `missing:app/global-error.tsx`). 21 server actions throw (`02-eraser/contracts.md`). Spec: `04-figma/missing-state-specs.md` §1.

```gherkin
Feature: Unexpected failures are recoverable

  Scenario: A page fails to load
    Given I am signed in as "owner@test.com"
    And the database is unreachable
    When I open the dashboard
    Then I see "This page didn't load."
    And I see the owner sidebar
    And I see a "Try again" button and a reference code

  Scenario: Retry recovers
    Given the database is reachable again
    When I click "Try again"
    Then I see my requests
```
- Out of scope: converting thrown action errors into `{ error }` returns (ticket 10).

### 5. Capture server and client errors in Sentry with alerts
- Gap: GAP-CODE-01   Priority: High   Labels: gap, observability   Module: Platform   Estimate: 3 pts
- Context: planned in `docs/IMPLEMENTATION_BACKLOG.md:96-97`, not installed (`missing:instrumentation.ts`, `search:@sentry/`). Today errors only reach `console.error` (24 sites). The rate limiter fails open on DB errors and only logs it (`lib/auth/rate-limit.ts:34-36`).

```gherkin
Feature: Production errors reach a human

  Scenario: Unhandled server error is captured
    Given Sentry is configured for environment "preview"
    When a server action throws during approveQuoteAction
    Then a Sentry issue appears with a readable stack trace for lib/actions/quotes.ts
    And it is tagged with the deploy's git SHA as the release

  Scenario: Rate limiter failure is visible
    When the auth_attempts query fails during login
    Then a Sentry event "rate-limit check failed; allowing request" is recorded

  Scenario: No personal data leaves the app
    When an error occurs during sign-in
    Then the Sentry event contains no password, email, or request body
```
- Out of scope: performance tracing beyond the default sample rate.

### 6. Approve exactly one quote per request
- Gap: GAP-ERASER-03   Priority: High   Labels: gap, eraser   Module: Share and get quotes   Estimate: 2 pts
- Context: `approveQuoteAction` doesn't check the current status or decline the others (`lib/actions/quotes.ts:81-112`). F11, `docs/07-refinement/findings-and-roadmap.md:23`.

```gherkin
Feature: One approved quote per request

  Background:
    Given I am signed in as "owner@test.com"
    And the request has pending quotes from "Ace Plumbing" and "Bay Pipes"

  Scenario: Approving one declines the others
    When I approve "Ace Plumbing"
    Then "Ace Plumbing" is approved
    And "Bay Pipes" is declined
    And the decision log records both decisions

  Scenario: A second approval is rejected
    Given "Ace Plumbing" is already approved
    When I try to approve "Bay Pipes"
    Then I see "A quote is already approved for this request."
    And only one quote is approved
```

### 7. Review a closeout only while it is pending
- Gap: GAP-ERASER-04   Priority: High   Labels: gap, eraser   Module: Close out and record   Estimate: 1 pt
- Context: `reviewCloseoutSubmissionAction` never checks `closeout.status` (`lib/actions/closeout-submissions.ts:136-158`). An approved closeout can later get `changes_requested` while the request stays `Complete`.

```gherkin
Feature: A closeout decision is final

  Scenario: Reviewing an already-approved closeout
    Given I am signed in as "owner@test.com"
    And the closeout for "Kitchen faucet leaking" is approved
    When I request changes on that closeout
    Then I see "This closeout was already reviewed."
    And the closeout stays "approved"
```

### 8. HTTP contract tests for the 7 route handlers in CI
- Gap: GAP-BRUNO-02   Priority: Medium   Labels: gap, bruno   Module: Platform   Estimate: 2 pts
- Context: no `.bru`, `.http`, or Postman files (`search:**/*.bru`). The collection is generated in `03-bruno/`. Adopt it at `bruno/` and run it in CI after the app boots.

```gherkin
Feature: Route contracts are checked on every PR

  Scenario: Collection passes against a seeded app
    Given the app runs on a freshly seeded database
    When "npx @usebruno/cli run --env ci" runs in bruno/
    Then all 18 requests pass

  Scenario: A contract change fails CI
    Given /api/files returns 403 instead of 404 for someone else's file
    When the collection runs
    Then "Files - someone else's or missing record" fails
```

### 9. Password reset by email
- Gap: GAP-FIGJAM-01   Priority: Medium   Labels: gap, figjam   Module: Join   Estimate: 3 pts (split UI vs token logic if larger)
- Context: listed as next in `README.md:46` and P1 in `docs/07-refinement/findings-and-roadmap.md:58`. Not built (`search:reset.?password|forgot`).

```gherkin
Feature: Recover a forgotten password

  Scenario: Reset link works once
    Given "owner@test.com" requested a reset link
    When they open the link within 60 minutes and set a new password
    Then they can log in with the new password
    And the same link no longer works

  Scenario: Unknown emails get the same answer
    When someone requests a reset for "nobody@test.com"
    Then they see "If that email has an account, a link is on its way."
    And no email is sent
```

### 10. One validated input/result contract for server actions
- Gap: GAP-ERASER-05   Priority: Medium   Labels: gap, eraser   Module: Platform   Estimate: 3 pts (first 3 action files; repeat per file)
- Context: zod is used only for auth and invite forms (`lib/auth/forms.ts`, `lib/invites/forms.ts`). The rest parse FormData by hand, mixing 21 throws with 61 `{ error }` returns. Restore has no top-level shape check (`lib/actions/backup.ts:99-114`).

```gherkin
Feature: Server actions reject bad input the same way

  Scenario: Invalid amount on a vendor bid
    Given I am signed in as "vendor@test.com"
    When I submit a bid with amount "abc"
    Then the action returns code "VALIDATION_FAILED" with a field error on "amount"
    And nothing is written

  Scenario: Malformed backup file
    Given I am signed in as "owner@test.com"
    When I restore a backup whose "properties" is not a list
    Then I see "This file is not a TurnFlow backup."
    And nothing is imported
```

### 11. Route-level loading states for owner, vendor, and collaborator portals
- Gap: GAP-FIGMA-02   Priority: Medium   Labels: gap, figma   Module: Platform   Estimate: 2 pts
- Context: no `loading.tsx` anywhere. The only Suspense fallback covers the sidebar (`app/owner/layout.tsx:14-20`). Spec: `04-figma/missing-state-specs.md` §2.

```gherkin
Feature: Navigation shows progress

  Scenario: Slow dashboard load
    Given I am signed in as "busy@test.com" (P)
    And the database responds after 2 seconds
    When I open the dashboard
    Then I see request card skeletons with the sidebar still visible
    And then the 25 requests replace the skeletons
```

### 12. Run the browser smoke loops in CI on preview deploys
- Gap: GAP-CODE-02   Priority: Medium   Labels: gap, observability   Module: Platform   Estimate: 3 pts
- Context: 7 Playwright smoke scripts (`package.json:16-22`) need a real DB + Blob and aren't in CI (`docs/06-testing/test-strategy.md:12`). Roadmap P3 (`docs/07-refinement/findings-and-roadmap.md:60`).

```gherkin
Feature: Full role loop runs on every preview

  Scenario: Preview deploy is smoke-tested
    Given a Vercel preview deploy with a seeded Neon branch
    When the "smoke" workflow runs "npm run ux:full-loop"
    Then the owner, vendor, and collaborator loop completes
    And screenshots are uploaded as artifacts if it fails
```

### 13. Run and log three moderated homeowner sessions
- Gap: GAP-FIGJAM-02   Priority: Medium   Labels: gap, figjam   Module: Capture a repair   Estimate: 3 pts per session batch
- Context: protocol exists (`docs/USER_TESTING.md`), with 0 sessions logged (`docs/06-testing/test-strategy.md:24`). Success targets are unmeasured (`docs/01-problem/problem.md:52-60`).

```gherkin
Feature: The backbone is validated with real homeowners

  Scenario: Session produces evidence
    Given a tester who manages their own repairs
    When they capture a real repair from scratch
    Then the time from start to a complete request is recorded
    And every "what happens next?" moment is logged as a finding
```

### 14. Make local development work without a Neon account
- Gap: GAP-PRISMA-04   Priority: Medium   Labels: gap, db   Module: Platform   Estimate: 2 pts
- Context: `CONTRIBUTING.md:26` references a missing `scripts/dev-local.sh`. Plain Postgres can't serve the neon-http driver without a proxy (`lib/db/index.ts:2-11`, inferred). See `05-prisma/README.md`.

```gherkin
Feature: One-command local setup

  Scenario: Fresh clone runs locally
    Given a machine with Docker and no Neon account
    When I run "./scripts/dev-local.sh"
    Then Postgres and the Neon HTTP proxy start
    And migrations and the seed run
    And "npm run dev" serves the dashboard for "owner@test.com"
```

### 15. Move the backlog and open findings into the tracker
- Gap: GAP-PLANE-01   Priority: Medium   Labels: gap, plane   Module: Platform   Estimate: 1 pt
- Context: the backlog asks for one issue per task (`docs/IMPLEMENTATION_BACKLOG.md:12`). GitHub has 1 issue (`issue:#2`). This file is the import source.

```gherkin
Feature: Every known gap is tracked

  Scenario: Import the audit
    Given the 25 gaps in audit.json
    When the tickets in this file are created in Plane
    Then every gap's ticketRef points to a TURN-n key
    And the "Open gaps" view lists all of them by priority
```

### 16. Add the missing foreign key on invites.request_id
- Gap: GAP-PRISMA-02   Priority: Low   Labels: gap, db   Module: Share and get quotes   Estimate: 1 pt
- Context: no FK, to avoid a circular reference (`lib/db/schema.ts:206-208`). Add it in a follow-up migration (`ON DELETE CASCADE` for pending invites), since both tables exist by then.

```gherkin
Feature: Invites always point at a real request

  Scenario: Deleting a request removes its pending invites
    Given a pending invite for "Kitchen faucet leaking"
    When the request row is removed
    Then the invite row is removed too
```

### 17. Refresh the role in the session (JWT) or verify it per request
- Gap: GAP-CODE-04   Priority: Low   Labels: gap, observability   Module: Join   Estimate: 2 pts
- Context: the role is set once at sign-in (`lib/auth/config.ts:73-79`). F12, `docs/07-refinement/findings-and-roadmap.md:33`.

```gherkin
Feature: Role changes take effect

  Scenario: Deleted user loses access
    Given "vendor@test.com" has a session
    When the account is deleted
    Then the next request from that session is treated as signed out
```

### 18. Index the foreign keys used by every page query
- Gap: GAP-PRISMA-01   Priority: Low   Labels: gap, db   Module: Platform   Estimate: 1 pt
- Context: only 2 indexes besides PKs and uniques (`drizzle/0011_romantic_secret_warriors.sql:52-53`, `drizzle/0012_clumsy_ozymandias.sql:7`). Add indexes on `requests(owner_id)`, `requests(property_id)`, `requests(assigned_vendor_id)`, `requests(collaborator_id)`, and `decision_log(request_id)`.

```gherkin
Feature: Dashboard stays fast as history grows

  Scenario: Owner with many requests
    Given "busy@test.com" (P) owns 25 requests among 10,000 rows
    When EXPLAIN runs on the dashboard query
    Then it uses an index scan on requests.owner_id
```

### 19. Seed the authorization-matrix and Idle personas
- Gap: GAP-PRISMA-03   Priority: Low   Labels: gap, db   Module: Platform   Estimate: 1 pt
- Context: the seed only has owner, vendor, and collaborator (`scripts/seed.ts:173-178`). The draft is `05-prisma/seed-authz-personas.ts` (typechecks today).

```gherkin
Feature: Seed covers every test actor

  Scenario: Personas exist after seeding
    When "npm run db:seed && npm run db:seed:authz" runs twice
    Then idle@test.com, other-owner@test.com, stranger-vendor@test.com and busy@test.com exist once each
    And busy@test.com has exactly 25 requests
```

### 20. Decide the fate of workspace plans and billing accounts
- Gap: GAP-FIGJAM-03   Priority: Low   Labels: gap, figjam   Module: Platform   Estimate: 1 pt
- Context: the `billing_accounts` plan/subscription tables (`lib/db/schema.ts:166-181`, `commit:2461065`) map to no story. Payments are out of scope (`docs/03-design/constraints.md:31`).

```gherkin
Feature: Every table serves a story

  Scenario: Decision recorded
    When the team reviews billing_accounts
    Then a story is added to the map below the cut-line, or the tables are scheduled for removal
```

### 21. Add /api/files and the demo-reset cron to the endpoint map
- Gap: GAP-ERASER-06   Priority: Low   Labels: gap, eraser   Module: Platform   Estimate: 1 pt
- Context: `docs/ENDPOINT_EXPERIENCE_MAP.md:76-84` lists 5 of the 7 route handlers.

```gherkin
Feature: The endpoint map is complete

  Scenario: Every route handler is documented
    When I compare app/api/**/route.ts with the endpoint map
    Then all 7 routes appear with audience, purpose, and contract
```

### 22. Create the shared state components in Figma
- Gap: GAP-FIGMA-03   Priority: Low   Labels: gap, figma   Module: Platform   Estimate: 2 pts
- Context: states are specified only in prose (`docs/ENDPOINT_EXPERIENCE_MAP.md:42`). There's no design file (`search:figma`).

```gherkin
Feature: States have a visual source of truth

  Scenario: Designer hands off states
    When the "Page state" component set exists with State and Role properties
    Then every missing cell in state-matrix.md links to a frame
```

### 23. Rewrite backlog acceptance criteria as Gherkin
- Gap: GAP-PLANE-02   Priority: Low   Labels: gap, plane   Module: Platform   Estimate: 1 pt
- Context: acceptance is prose (`docs/IMPLEMENTATION_BACKLOG.md:20`, `docs/USER_REQUIREMENTS_EVENT_MATRIX.md:29-48`).

```gherkin
Feature: Acceptance criteria are executable

  Scenario: Requirement becomes a test name
    Given the requirement "Owner | Create a repair record"
    When it is rewritten as Given/When/Then
    Then a Vitest or Playwright test with the scenario's name exists
```

### 24. Refresh the stale backlog
- Gap: GAP-PLANE-03   Priority: Low   Labels: gap, plane   Module: Platform   Estimate: 1 pt
- Context: last updated 2026-10-16 (`docs/IMPLEMENTATION_BACKLOG.md:3`). Task 2.1 (invite signup) shipped 2026-10-25 (`commit:6a86af5`) but isn't marked done. 11 of 14 listed files don't exist.

```gherkin
Feature: The backlog reflects reality

  Scenario: Shipped work is closed
    When the backlog is reviewed
    Then Task 2.1 is marked done with commit 6a86af5
    And every remaining task has a TURN-n ticket
```

### 25. Report coverage in CI
- Gap: GAP-CODE-03   Priority: Low   Labels: gap, observability   Module: Platform   Estimate: 1 pt
- Context: planned as Task 1.2 (`docs/IMPLEMENTATION_BACKLOG.md:52-54`). Measured during the audit: 38.53% lines, `lib/actions` 0%.

```gherkin
Feature: Coverage is visible

  Scenario: PR shows coverage
    When CI runs "vitest run --coverage"
    Then the job summary shows line coverage per folder
    And lib/actions coverage is listed separately
```
