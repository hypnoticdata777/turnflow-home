# TurnFlow Home: user story map (reverse-engineered)

Audit commit `b45b1ac` (application code identical to `6a86af5`). Tags: `[MVP]`/`[LATER]` priority, `{built|partial|missing|unplanned}` state, `@` evidence.

```text
PERSONA: Self-managing homeowner who runs repairs through texts, camera rolls and receipt drawers.
         Goal: capture a repair once, share just that job, prove the work, keep the history.
         @ docs/01-problem/problem.md:16-21, README.md:3
SECONDARY ROLES:
  - Vendor (plumber, handyman): quote, do, prove and close out one invited job   @ docs/01-problem/problem.md:20, app/vendor/page.tsx
  - Collaborator (family, friend, tenant): help with one shared job only          @ docs/01-problem/problem.md:21, app/collaborator/page.tsx

BACKBONE (left -> right)  -- order from README flow + problem.md jobs-to-be-done  @ README.md:20-31, docs/01-problem/problem.md:23-30

1. Join
   - Task: Create an owner account
     - [MVP] {built} Sign up with name, email, password (owners only)          @ app/signup/page.tsx, lib/actions/auth.ts:46
   - Task: Sign in to my role's workspace
     - [MVP] {built} Log in and land in the right portal by role                @ app/login/page.tsx, lib/actions/auth.ts:126, lib/auth/dal.ts:12-21
     - [MVP] {built} Rate-limited, timing-safe login                            @ lib/auth/config.ts:36-69
     - [MVP] {missing} Reset a forgotten password                               @ README.md:46, docs/07-refinement/findings-and-roadmap.md:58, search:reset.?password|forgot
     - [LATER] {missing} Verify email address                                   @ docs/07-refinement/findings-and-roadmap.md:18

2. Set up my home
   - Task: Guided first run
     - [MVP] {built} Onboarding checklist (property, request, proof, share, history, reminder)  @ app/owner/onboarding/page.tsx, docs/ENDPOINT_EXPERIENCE_MAP.md:53
   - Task: Add a property
     - [MVP] {built} Add / update / delete a property                           @ app/owner/properties/page.tsx, lib/actions/properties.ts:14, lib/actions/properties.ts:51

3. Capture a repair
   - Task: Create a repair request
     - [MVP] {built} Title, category, urgency, location, access, contact preference  @ app/owner/requests/new/page.tsx, lib/actions/requests.ts:38-117
     - [MVP] {built} Attach before / receipt / other photos                     @ lib/actions/requests.ts:119, app/api/blob-upload/route.ts:45
     - [MVP] {built} Inline property creation when none exists                  @ components/NewRequestForm.tsx:200
   - Task: Triage my repairs
     - [MVP] {built} Dashboard filtered by status with next action             @ app/owner/dashboard/page.tsx

4. Share and get quotes
   - Task: Invite exactly one vendor / one helper to this request
     - [MVP] {built} Create expiring invite with copyable link                  @ lib/actions/invites.ts:107, lib/actions/invites.ts:111
     - [MVP] {built} Invitee signs up or logs in from the invite (email + role locked)  @ lib/actions/invites.ts:385, lib/actions/invites.ts:417, app/accept-invite/page.tsx
     - [MVP] {built} Resend / cancel pending invite; remove accepted access     @ lib/actions/invites.ts:252, lib/actions/invites.ts:192, lib/actions/invites.ts:131
   - Task: Compare prices and decide
     - [MVP] {built} Vendor submits / updates own bid (no competitor prices)    @ lib/actions/vendor-bids.ts:14
     - [MVP] {built} Owner adds private quotes                                  @ lib/actions/quotes.ts:33
     - [MVP] {partial} Owner approves ONE quote, declines the rest              @ lib/actions/quotes.ts:81-125  -- several quotes can be approved (F11), approval not atomic (F5)

5. Get the work done
   - Task: Plan phased scope
     - [MVP] {built} Create tasks, track status and cost, accept done tasks     @ lib/actions/request-tasks.ts:53, lib/actions/request-tasks.ts:177
   - Task: Prove the visit
     - [MVP] {built} Vendor starts / pauses / resumes / stops work with proof   @ lib/actions/work-sessions.ts:32, components/WorkSessionPanel.tsx
   - Task: Move status forward
     - [MVP] {built} Status policy: owner any, vendor only working states       @ lib/actions/requests.ts:284, lib/request-status-policy.ts
   - Task: Keep everyone informed
     - [MVP] {built} Comment thread for owner, vendor, helper                   @ lib/actions/comments.ts:9, app/collaborator/page.tsx

6. Close out and record
   - Task: Vendor hands off
     - [MVP] {built} Submit closeout: notes, final amount, materials, proof     @ lib/actions/closeout-submissions.ts:26
   - Task: Owner reviews
     - [MVP] {partial} Approve (creates billing record) or request changes      @ lib/actions/closeout-submissions.ts:116-237  -- a decided closeout can be re-reviewed; multi-write not atomic
   - Task: Record payment outside TurnFlow
     - [MVP] {built} Mark billing recorded / paid / disputed / void             @ lib/actions/billing-records.ts:17, docs/03-design/constraints.md:31

7. Keep history and maintain
   - Task: Preserve the record
     - [MVP] {built} Decision log on every meaningful change                    @ docs/02-requirements/README.md:19, lib/actions/quotes.ts:107
     - [MVP] {partial} History survives deleting a request                      @ docs/03-design/data-model.md:83, lib/db/schema.ts:286-291, lib/actions/requests.ts:234  -- cascade deletes the log (F8)
     - [MVP] {built} Proof packet PDF, property history PDF/CSV                 @ lib/pdf/proofPacket.ts, lib/pdf/propertyHistory.ts, lib/actions/properties.ts:96
     - [MVP] {built} Vault for warranties, receipts, manuals                    @ app/owner/vault/page.tsx, lib/actions/vault.ts:28
     - [MVP] {built} JSON backup and add-only restore                           @ app/owner/backup/page.tsx, lib/actions/backup.ts:11, lib/actions/backup.ts:99
   - Task: Prevent repairs
     - [MVP] {built} Recurring reminders, mark done, .ics export                @ app/owner/calendar/page.tsx, lib/actions/reminders.ts:25
     - [MVP] {built} Daily reminder digest email                                @ app/api/cron/reminder-digest/route.ts:17, vercel.json

--- MVP CUT-LINE ---  (placed from the docs: everything in problem.md jobs 1-6 and the POC scope is MVP;
                       "is NOT" items and email verification are below the line)  @ docs/01-problem/problem.md:23-30, docs/01-problem/problem.md:32-50

[LATER] {missing} Payment processing        (explicitly out of scope)  @ docs/03-design/constraints.md:31
[LATER] {missing} Open vendor marketplace   (explicitly out of scope)  @ docs/01-problem/problem.md:32-50
[LATER] {missing} Read-only event explorer  (idea)                     @ docs/USER_REQUIREMENTS_EVENT_MATRIX.md:99

ORPHANS (built, map to no activity):
  - Workspace plans and billing accounts (plan, trial, subscription ids)  @ lib/db/schema.ts:166-181, commit:2461065
    (inferred) Groundwork for paid plans; no user story or screen uses plan state, and payments are out of scope.
  - Investor demo reset cron                                              @ app/api/cron/reset-investor-demo/route.ts
    Operational, documented in docs/04-algorithms/09-investor-demo-reset.md; not a user story (expected).

QUESTIONS / RISKS:
  - What happens to a tester who forgets their password? No recovery path today.  @ README.md:46
  - Are the jobs-to-be-done right? 0 moderated homeowner sessions logged.          @ docs/06-testing/test-strategy.md:24
  - Success targets (< 5 min to a complete request, majority closed with proof) are not measured anywhere.  @ docs/01-problem/problem.md:52-60
```

## Notes for building the FigJam board

- Use 7 yellow activity stickies (Join → Keep history and maintain). Put vendor and collaborator tasks on separate swim lanes under "Share and get quotes", "Get the work done", and "Close out and record".
- Color `{partial}` stories orange and `{missing}` stories red, so the board doubles as a gap map.
