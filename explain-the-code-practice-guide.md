# Explain the TurnFlow Home Code Practice Guide

## Two-minute product explanation

TurnFlow Home is a homeowner maintenance record that coordinates repairs without turning into a property-management platform. The owner creates properties and requests, saves photos and documents, compares quotes, shares one request with a vendor or trusted helper, and preserves decisions through closeout. Vendors and collaborators receive scoped portals, so sharing one repair does not expose the owner’s whole account.

Technically, it is a Next.js 16 App Router application backed by Neon Postgres through Drizzle. Auth.js verifies credentials, applies login/signup limits, and stores the role in a JWT session. A lightweight proxy routes users toward the correct portal, while pages, Server Actions, upload/file routes, and pure status policy perform the real role and record-ownership checks. Private Vercel Blob storage holds evidence, Resend handles optional email, and the database keeps the repair history. The current suite contains 34 unit-test files and 318 tests plus six browser smoke loops.

## Technical interview explanation

Use this sequence:

1. Define the bounded problem: preserve the owner’s repair record and grant request-level help.
2. Name the central aggregate: `requests`, linked to property, owner, workspace, evidence, quotes, tasks, work sessions, closeout, billing, comments, and decisions.
3. Trace one mutation: form to Server Action, session/role check, ownership check, validation, database write, decision log, notification, and path revalidation.
4. Explain defense in depth: proxy routing, DAL role checks, login limits, resource ownership checks, path-authorized private uploads and reads, strict status transitions, safe health endpoints, and database foreign keys.
5. State maturity honestly: broad POC workflow coverage exists; payments, subscriptions, open vendor matching, external observability, and moderated user testing remain.

## Nontechnical stakeholder explanation

“Each repair gets one durable record. The homeowner controls that record and can share only the repair that another person needs to see. Photos, quotes, work notes, approvals, and final cost stay connected. The product already demonstrates the whole coordination loop, but it records payment status rather than moving money.”

## Code-reading exercises

### Exercise 1: Trace owner signup

Read `app/signup/page.tsx`, `lib/actions/auth.ts`, `lib/auth/config.ts`, `lib/workspace.ts`, and `lib/db/schema.ts`.

Questions:

- Which validation happens before password hashing?
- Why does signup create a workspace even though team billing is future work?
- Which redirect proves the first-run owner experience?

Model answer: the action validates normalized name/email/password fields, checks uniqueness, hashes the password, creates the owner, ensures the default workspace and owner membership, then signs in and redirects to onboarding. The workspace is a migration-safe ownership boundary that lets future billing/team work arrive without rewriting every record.

### Exercise 2: Trace request creation and proof upload

Read `components/NewRequestForm.tsx`, `lib/actions/requests.ts`, `lib/blob-upload-client.ts`, `app/api/blob-upload/route.ts`, and `lib/blob-paths.ts`.

Questions:

- Why does the request row exist before the photo upload?
- Which checks prevent a vendor from writing to another request?
- What survives if an upload fails?

Model answer: the Blob path needs a real request ID, so the app creates the record first. The upload path embeds the user and request identifiers, and the route re-checks the session plus owner/assigned-vendor relationship. A failed upload does not erase the saved request; the UI can report partial proof and allow retry.

### Exercise 3: Explain completion gating

Read `lib/utils.ts`, `lib/request-guidance.ts`, `lib/status-handoff.ts`, `components/CompletionWaiverReview.tsx`, and `updateRequestStatusAction`.

Model answer: clean completion expects final cost, an after photo, and an assigned vendor. The same rule appears in guidance and server enforcement. If the evidence is incomplete, the caller must provide a waiver reason; the server stores a `completion_waived` event so the durable history explains the exception.

### Exercise 4: Explain the vendor closeout loop

Read `lib/vendor-lifecycle.ts`, `lib/closeout-submissions.ts`, `lib/actions/closeout-submissions.ts`, and `components/CloseoutSubmissionPanel.tsx`.

Model answer: vendor next-action logic moves an assigned request through bid, approval, proof-gated work, tasks, and closeout. The vendor submits a completion packet only when the readiness checks pass. The owner can approve or request changes with a note. Approval completes the request, accepts remaining done tasks, creates a billing record, logs the decision, and notifies the vendor.

### Exercise 5: Audit one authorization boundary

Choose an action under `lib/actions/`. Verify four questions:

1. Does it require a session and allowed role?
2. Does it load the target record from the database?
3. Does it compare the target’s owner/assignment to the session user?
4. Does it limit the returned data and revalidate only relevant paths?

## Common questions and strong answers

**Why keep `proxy.ts` if actions re-check authorization?**

The proxy improves navigation and avoids showing the wrong role shell. It can be bypassed or excluded by routing configuration, so authoritative checks remain inside the server entry point that touches data.

**Why use both guidance helpers and server rules?**

Guidance makes the next action understandable. Server rules make it enforceable. Tests should keep both descriptions aligned with the same business policy.

**Is billing implemented?**

Billing recordkeeping is implemented. Payment processing, subscription checkout, and a customer portal are not.

**How is tenant isolation handled?**

The current product uses owner and request ownership checks, assigned vendor/collaborator IDs, workspace IDs, and foreign keys. Workspace membership is a foundation, but many active authorization paths still use owner/request IDs rather than a generalized organization policy engine.

**What would you improve next?**

Close the invite-signup dead end, verify the private-Blob operator migration and demo reset, add transaction boundaries and authorization-matrix tests, run moderated homeowner/vendor sessions, then expand into payments or broader team policy only when the evidence supports it.

## Extension exercises

- Add a safe “requested appointment window” field end to end, including migration, validation, owner/vendor views, tests, and backup support.
- Add a dedicated browser smoke for accepted-access removal.
- Add a centralized authorization helper for “may view this request” and compare it with the current repeated checks.
- Design a subscription boundary without treating `billing_records` as payment transactions.
- Add observability that reports failures without sending private addresses, notes, or secret values.
