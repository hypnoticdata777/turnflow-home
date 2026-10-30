# TurnFlow Home: business rules and where they're enforced (@ b45b1ac)

| # | Rule | Enforced in | Evidence | Status |
|---|---|---|---|---|
| B1 | Every write re-checks role **and** record ownership | handler (each action) | docs/02-requirements/README.md:18, lib/auth/dal.ts:25-36 | built, **untested against a DB** (GAP-BRUNO-01) |
| B2 | Helpers see only requests shared with them | handler (page queries filter by assignment) | docs/02-requirements/README.md:20, app/collaborator/page.tsx | built |
| B3 | The browser never decides stored paths, URLs, or statuses | handler (path validation, status policy) | lib/blob-paths.ts, lib/request-status-policy.ts, app/api/blob-upload/route.ts:99-129 | built |
| B4 | One user per email | db constraint (`users.email UNIQUE`) | lib/db/schema.ts:120 | built |
| B5 | One vendor profile per user; one billing account per workspace; one billing record per closeout | db constraint (UNIQUE FKs) | lib/db/schema.ts:170, lib/db/schema.ts:384, lib/db/schema.ts:468 | built |
| B6 | Only one approved quote per request | **NOT ENFORCED** (no status check, no constraint) | lib/actions/quotes.ts:81-112, docs/07-refinement/findings-and-roadmap.md:23 | GAP-ERASER-03 |
| B7 | A closeout is reviewed exactly once | **NOT ENFORCED** (`reviewCloseoutSubmissionAction` doesn't require `status = pending`) | lib/actions/closeout-submissions.ts:136-158 | GAP-ERASER-04 |
| B8 | Approval / closeout state changes and their decision-log row commit together | **NOT ENFORCED** (neon-http driver, no `db.transaction`) | lib/db/index.ts:2, docs/03-design/constraints.md:13 | GAP-ERASER-01 |
| B9 | Decision history is permanent and append-only | **NOT ENFORCED**: `ON DELETE CASCADE` from requests, plus hard delete | lib/db/schema.ts:286-291, lib/actions/requests.ts:234, docs/03-design/constraints.md:26 | GAP-ERASER-02 |
| B10 | A request-scoped invite always points at a real request | convention only (`invites.request_id` has no FK) | lib/db/schema.ts:206-208 | GAP-PRISMA-02 |
| B11 | Vendors never see competing prices | handler (vendor query filters `submittedByVendorId = me`) | docs/03-design/constraints.md:23, lib/actions/quotes.ts:17-19 | built |
| B12 | Vendors can only move working statuses; owner can set any status | handler (status policy) | lib/request-status-policy.ts, docs/07-refinement/findings-and-roadmap.md:15 | built, unit-tested |
| B13 | Completion needs proof (after photo + final cost) unless waived with a reason | handler | lib/actions/requests.ts:284, lib/utils.ts (meetsCompletionRequirements) | built |
| B14 | Login and signup are rate-limited per email and IP | db table (`auth_attempts`) + handler; **fails open** on DB error | lib/auth/config.ts:42-47, lib/auth/rate-limit.ts:34-36 | built |
| B15 | No payment processing; billing is record-keeping only | product constraint | docs/03-design/constraints.md:31 | built (billing_accounts tables unused, GAP-FIGJAM-03) |
| B16 | Email failures never break a flow | handler (caught + logged to notification_log) | docs/02-requirements/README.md:22, lib/email.ts:53 | built |

## Enum values (database enums)

| Enum | Values | Evidence |
|---|---|---|
| user_role | owner, vendor, collaborator | lib/db/schema.ts:25-29 |
| request_status | Draft, Needs Quote, Waiting, Scheduled, In Progress, Needs Review, Complete, Archived | lib/db/schema.ts:30-39 |
| photo_type | before, after, receipt, other | lib/db/schema.ts:40-45 |
| quote_status | pending, approved, declined | lib/db/schema.ts:46-50 |
| invite_role / invite_status | vendor, collaborator / pending, accepted | lib/db/schema.ts:51-52 |
| vault_category | Receipt, Warranty, Manual, Invoice, Inspection Report, Other | lib/db/schema.ts:53-60 |
| notification_status | sent, failed | lib/db/schema.ts:61-64 |
| work_session_event | started, paused, resumed, stopped | lib/db/schema.ts:65-70 |
| request_task_status | todo, in_progress, blocked, done | lib/db/schema.ts:71-76 |
| closeout_submission_status | pending, approved, changes_requested | lib/db/schema.ts:77-81 |
| billing_record_status | recorded, paid, disputed, void | lib/db/schema.ts:82-87 |
| workspace_kind / member_role / member_status / plan / billing_account_status | personal, household, business / owner, admin, member, billing_admin / active, invited, removed / poc, homeowner, team, enterprise / trialing, active, past_due, paused, canceled | lib/db/schema.ts:88-116 |

`requests.category` and `requests.urgency` are free `varchar` columns. Their allowed values live in code (`REQUEST_CATEGORIES`, `REQUEST_URGENCIES` in `lib/utils.ts`), checked by `createRequestAction` (lib/actions/requests.ts:55-60) and restore (lib/actions/backup.ts:146-151).
