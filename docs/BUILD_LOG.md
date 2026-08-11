# TurnFlow Home Build Log

Keep this log tight: what changed, why it changed, validation, and what remains.

## 2026-08-11 - Vendor Work Session Events

Scope: make vendor work activity traceable from start through pause, resume, and
stop.

### Changed

- Added `work_session_event` and `work_sessions` to the Drizzle schema.
- Added a vendor-only work-session action that verifies assigned-vendor access.
- Added work-session controls to `/vendor` with notes, recommended next action,
  and timeline history.
- Added an owner-visible work timeline to request detail.
- Logged work-session events in the decision log and proof packet.
- Sent/logged owner notifications for work-session events.
- Updated owner/helper smoke checks, README, UI/UX review docs, notification
  guidance, and vendor lifecycle roadmap.

### Why

Status alone is too blunt for a serious vendor workflow. A homeowner should be
able to see when work actually started, why it paused, when it resumed, and
when the vendor stopped for owner review. This creates the trace needed for
later closeout, billing, and user testing without introducing payments yet.

### Validation

- `npm test -- work-sessions decision-log notification-guidance` passed: 19
  tests.
- `npm run typecheck` passed.
- `npm run db:generate` created `drizzle/0003_cute_shooting_star.sql`.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 208 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no additional schema changes.
- `git diff --exit-code -- drizzle` passed after staging the intended
  migration.
- `npm run build` passed.

### Follow-Up

- Add closeout submission and owner review before billing record finalization.
- Add open opportunity notifications before assignment.
- Add manual UX pass for work-session controls on desktop and mobile demo data.

## 2026-08-11 - Owner Quote Comparison Metrics

Scope: make multi-quote owner decisions easier to compare without turning the
workspace into a vendor marketplace.

### Changed

- Added reusable quote comparison metrics for active option count, lowest active
  price, price spread, and vendor-submitted ratio.
- Added per-quote comparison cues for lowest, middle, highest, selected, tied,
  and historical declined prices.
- Added a `Quote comparison` panel to the owner quote workspace, including an
  empty state until at least two active options exist.
- Updated owner smoke checks, README, UI/UX review docs, and vendor lifecycle
  roadmap.

### Why

Homeowners should not have to scan several prices and mentally calculate the
difference before approving work. The comparison panel keeps the owner in
control while reminding them that price is only one decision factor: scope,
availability, and confidence still matter.

### Validation

- `npm test -- bid-review` passed: 11 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 200 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add open opportunity notifications before assignment.
- Add closeout submission and owner review before billing record finalization.
- Add manual UX pass for quote comparison on desktop and mobile demo data.

## 2026-08-11 - Vendor Bid Decision Notifications

Scope: close the assigned-vendor bid loop after owner approval or decline.

### Changed

- Added reusable vendor bid decision notification copy for approved and declined
  bids.
- Sent/logged vendor notifications when an owner approves or declines a
  vendor-submitted bid.
- Revalidated the vendor portal after owner bid decisions so vendors see the
  latest bid state.
- Added notification labels for vendor bid approved/declined attempts.
- Updated README, UI/UX review docs, and vendor lifecycle roadmap.

### Why

Vendors should not have to infer whether their bid was accepted by repeatedly
checking the portal. A mature owner/vendor workflow needs a clear loop:
vendor submits price, owner decides, vendor gets the outcome, and the request
history plus notification log preserve that handoff for POC testing.

### Validation

- `npm test -- vendor-bid-notification notification-guidance` passed: 8 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 195 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add open opportunity notifications after assigned-bid review is tested.
- Add work-session events for start, pause, resume, stop, and billing prep.

## 2026-08-11 - Owner Bid Review Guidance

Scope: make owner decisions on vendor-submitted bids clearer and more
traceable.

### Changed

- Added reusable bid-review guidance for empty quote workspaces, pending vendor
  bids, pending owner-entered quotes, approved quotes, declined bids, and
  inactive quote sets.
- Added a `Bid review` summary to the owner quote workspace.
- Added per-quote decision guidance that explains what approving or declining a
  vendor bid does before the owner clicks.
- Sent/logged owner notifications when a vendor submits or updates a bid.
- Added notification labels for vendor bid submitted/updated attempts.
- Updated owner smoke checks, README, UI/UX review docs, and vendor lifecycle
  roadmap.

### Why

Vendor-submitted bids only feel mature if the owner can understand the decision
without guessing. Owners now see which bids need action, what approving will
copy into quoted cost, and what declining preserves in history. Bid emails also
show up in notification health so failed delivery is visible during POC testing.

### Validation

- `npm test -- bid-review notification-guidance` passed: 12 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 193 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add owner-facing quote comparison metrics once multiple vendor bids exist.
- Add open opportunity notifications after assigned-bid review is tested.

## 2026-08-11 - Assigned Vendor Bid Submission

Scope: let assigned vendors submit private bids for owner review without
exposing competing quote data.

### Changed

- Extended `quotes` with `submitted_by_vendor_id` and `availability_window`.
- Added a vendor-only bid submission action that verifies the signed-in vendor
  is assigned to the request.
- Added an editable `/vendor` private owner bid panel for bid amount,
  availability window, and scope notes.
- Reset vendor-edited bids to `pending` so owners must re-approve changed
  pricing.
- Cleared the copied request `quotedCost` when an approved vendor bid is
  revised.
- Loaded only the signed-in vendor's own bids into the vendor portal.
- Labeled vendor-submitted bids in the owner quote workspace and proof packet.
- Added decision-log text for vendor bid submissions and updates.
- Added focused tests for vendor bid guidance and decision-log bid entries.
- Updated helper smoke checks, README, UI/UX review docs, and vendor lifecycle
  roadmap.

### Why

Vendor profiles and fit cues made the assignment smarter, but vendors still
needed a structured way to provide price, availability, and scope details. This
adds the first real bid loop while preserving the privacy boundary: owners can
compare quotes, vendors only see their own bid state.

### Validation

- `npm test -- vendor-bid decision-log` passed: 9 tests.
- `npm run typecheck` passed.
- `npm run db:generate` created `drizzle/0002_icy_xavin.sql`.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 187 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no additional schema changes.
- `git diff --exit-code -- drizzle` passed after staging the intended
  migration.
- `npm run build` passed.

### Follow-Up

- Add owner notification/log guidance when a vendor submits or updates a bid.
- Add owner-side bid approval handoff copy that distinguishes owner-entered
  quotes from vendor-submitted bids.
- Build open opportunity notifications after assigned-bid behavior is tested.

## 2026-08-11 - Owner Vendor Fit Cues

Scope: help owners judge whether an assigned vendor fits the repair before
approval or work start.

### Changed

- Added reusable vendor-fit guidance for request category, assigned vendor
  state, pending vendor invites, profile completeness, and trade compatibility.
- Added an owner-facing assigned-vendor fit panel to request detail sharing.
- Loaded the assigned vendor's name, email, and matching profile after owner
  authorization on `/owner/requests/[id]`.
- Added tests for exact trade matching, compatible trade matching, no vendor,
  pending invites, missing profile, ready profile, partial profile, and mismatch
  states.
- Updated owner smoke checks, README, UI/UX review docs, and the vendor
  lifecycle roadmap.

### Why

Vendor profiles are more valuable when owners can actually use them during the
repair decision. This slice starts turning vendor metadata into owner trust:
does this vendor handle the trade, do they cover the area, are they available,
and is there enough context to proceed confidently?

### Validation

- `npm test -- vendor-fit` passed: 8 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 182 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Surface vendor fit in owner invite/assignment flows before an invite is sent.
- Add vendor-submitted bids once assigned-vendor fit and profile identity are
  stable.
- Add owner-side comparison once multiple vendor bids exist.

## 2026-08-11 - Vendor Matching Profiles

Scope: give vendor accounts durable profile data for future trade matching,
notifications, bidding, and owner approvals.

### Changed

- Added a `vendor_profiles` table with one profile per vendor account.
- Added vendor profile fields for business name, trade categories, service
  area, availability, notification preference, and license/insurance notes.
- Added a vendor-only profile upsert action with profile normalization and
  trade validation.
- Added a `/vendor` matching profile panel with readiness guidance and editable
  fields.
- Seeded the demo vendor profile for local QA and screenshot readiness.
- Added tests for trade normalization, profile normalization, readiness states,
  and unsupported preferences.
- Updated helper smoke checks, README, UI/UX review docs, and vendor lifecycle
  roadmap.

### Why

The vendor lifecycle tracker made assigned jobs traceable, but the product
still needed a durable way to understand which vendors fit which kinds of work.
Profiles are the first database-backed foundation for trade-specific
notifications and future vendor-submitted bids without exposing private quote
comparison data.

### Validation

- `npm test -- vendor-profile` passed: 6 tests.
- `npm run typecheck` passed.
- `npm run db:generate` created `drizzle/0001_blue_purple_man.sql`.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 174 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no additional schema changes.
- `git diff --exit-code -- drizzle` passed after staging the intended
  migration.
- `npm run build` passed.

### Follow-Up

- Add owner-visible vendor fit cues when inviting or assigning vendors.
- Add vendor-submitted bid records tied to profile identity and request scope.
- Add opt-in opportunity notifications by trade and service area.

## 2026-08-11 - Vendor Lifecycle Tracker

Scope: make assigned vendor work traceable from opportunity through billing
context.

### Changed

- Added reusable vendor lifecycle guidance for opportunity received, bid/price
  context, owner approval, scheduled/ready, work in progress, closeout proof,
  and billing record stages.
- Updated `/vendor` request cards with a per-request lifecycle tracker and
  next-action summary.
- Passed quoted-cost context into the vendor portal without exposing the
  owner-only quote workspace or competing vendor pricing.
- Added unit tests for needs-quote, blocked scheduled work, active closeout
  gaps, complete lifecycle records, and summary prioritization.
- Added `docs/VENDOR_LIFECYCLE_ROADMAP.md` for the larger trade matching,
  vendor bidding, work-session, closeout, and billing build path.
- Updated README, helper smoke checks, and UI/UX review docs for the vendor
  lifecycle surface.

### Why

The vendor portal was useful for scoped assignments, status updates, comments,
and proof uploads, but it did not yet feel like a mature job pipeline. Vendors
need a clear trace from notification/assignment to bid context, approval,
scheduled work, active work, closeout proof, and billing history. This slice
adds that structure now while keeping the future open bidding system behind a
proper data model.

### Validation

- `npm test -- vendor-lifecycle` passed: 6 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 168 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add vendor profiles for trades, service areas, availability, and notification
  preferences.
- Add vendor-submitted bids tied to owner approval without exposing competitor
  pricing.
- Add work-session events for start, pause, resume, stop, notes, and billing
  handoff.

## 2026-08-11 - Notification Delivery Health

Scope: make the owner notification log explain delivery reliability and next
steps.

### Changed

- Added reusable notification guidance for type labels, delivery-health metrics,
  and per-entry failure/action guidance.
- Updated `/owner/notifications` with a notification-health snapshot and clearer
  failed-attempt explanations.
- Added tests for empty logs, mixed sent/failed attempts, Resend configuration
  failures, missing-recipient failures, and known notification type labels.
- Updated owner UX smoke checks to require the notification-health surface.
- Updated README and UI/UX review docs for owner-facing delivery health.

### Why

For a hosted POC, outbound email may be disabled, misconfigured, or delayed.
Owners need to understand whether alerts are trustworthy and what fallback to
use, especially copyable invite links, without reading raw provider errors.

### Validation

- `npm test -- notification-guidance` passed: 6 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 162 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Run owner browser smoke against a seeded environment with both sent and failed
  notification attempts.

## 2026-08-11 - Owner Dashboard Update Signals

Scope: make shared-request communication health visible from the owner
dashboard.

### Changed

- Added reusable `ownerRequestUpdateSignal` rules for owner-only records, shared
  but quiet requests, review-stage threads, completed update history, and active
  shared updates.
- Loaded request comments into `/owner/dashboard` and added a second per-card
  signal focused on update-thread health.
- Extended owner-readiness tests for owner-only, quiet shared, review, and
  completed update states.
- Updated README and UI/UX review docs for dashboard communication-health
  signals.

### Why

After adding guided update drafts, owners still needed a way to see which shared
requests are quiet without opening every record. The dashboard now surfaces
handoff risk directly on each request card.

### Validation

- `npm test -- owner-readiness` passed: 31 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 156 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add owner browser smoke assertions for quiet shared request signals once a
  deterministic seeded owner dashboard state is available.

## 2026-08-11 - Status Handoff Guidance

Scope: make owner/vendor status changes explain their meaning and consequences.

### Changed

- Added reusable `statusHandoffGuidance` rules for owner and vendor status
  decisions across Draft, Needs Quote, Waiting, Scheduled, In Progress, Needs
  Review, Complete, and Archived.
- Added a shared `StatusHandoffGuidance` component under owner and vendor status
  controls.
- Status guidance now reminds users that status changes are decision-log events,
  vendor changes notify the owner, and clean completion needs final cost,
  after-photo proof, and assigned vendor context.
- Added focused tests for owner draft guidance, vendor scheduled guidance, clean
  Needs Review state, and Complete-with-proof-gaps state.
- Updated helper UX smoke expectations, README, and UI/UX review docs.

### Why

Status changes are high-trust moments. The app should not present them as a
plain dropdown when they affect the owner record, notifications, decision log,
and closeout proof quality.

### Validation

- `npm test -- status-handoff` passed: 4 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 152 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add owner request-detail browser smoke coverage for status handoff guidance
  once seeded owner auth can open a deterministic request detail route.

## 2026-08-11 - Guided Owner/Vendor Updates

Scope: make shared request comments feel like a guided handoff instead of a
blank text box.

### Changed

- Added reusable `commentThreadGuidance` rules for owner, vendor, and
  collaborator update threads.
- Updated `CommentThread` with role-aware handoff guidance, empty-state copy,
  placeholders, and one-click draft starters.
- Wired guided updates into owner request detail, vendor request cards, and
  collaborator shared request cards.
- Fixed comment revalidation so vendor workspaces refresh after posting updates.
- Added focused tests for missing-context, closeout, owner-note, owner-response,
  and collaborator update guidance.
- Updated README and UI/UX review docs for guided request updates.

### Why

The owner/vendor handoff lives in the update thread. A blank comment box adds
friction and leaves vendors guessing how to ask for missing context. Guided
drafts help each role post the next useful update while keeping the answer
attached to the repair record.

### Validation

- `npm test -- comment-guidance` passed: 5 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 148 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add browser smoke assertions for guided update drafts once seeded owner/helper
  auth is available locally or in preview.

## 2026-08-11 - Vendor Closeout Snapshot

Scope: make vendor work feel more frictionless by summarizing what remains
before owner review.

### Changed

- Added reusable `vendorCloseoutMetrics` rules for ready-to-close jobs,
  missing owner context, missing after photos, and missing final cost context.
- Added a closeout snapshot to `/vendor` above the first-run checklist and
  request list.
- Extended helper workspace tests for empty, mixed-gap, and ready vendor
  closeout states.
- Updated helper UX smoke expectations so `/vendor` must render the closeout
  snapshot.
- Updated README and UI/UX review docs for the vendor closeout surface.

### Why

Vendors should not have to inspect every request card to understand what they
owe the owner next. A closeout snapshot makes proof, cost, and context gaps
visible immediately, which supports a calmer owner experience too.

### Validation

- `npm test -- helper-workspace` passed: 24 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 143 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Run `npm run ux:helper` against seeded local or hosted auth to verify the
  closeout snapshot visually at desktop and mobile widths.

## 2026-08-10 - README Product Positioning Refresh

Scope: bring the public repo README up to date with the homeowner-first SaaS
POC direction.

### Changed

- Rewrote the README introduction around homeowner maintenance records instead
  of generic property-owner tracking.
- Added product direction notes that distinguish TurnFlow Home from a full PMC
  operations platform.
- Updated status, stack, setup, smoke testing, core features, POC readiness,
  and remaining product gaps.
- Noted that screenshots should be refreshed before public case-study or hosted
  POC use.

### Why

The app has matured beyond a direct MVP port. The README now matches the current
product story: homeowner value, scoped help, property care signals, proof,
history, prevention, and hosted POC readiness.

### Validation

- `git diff --check` passed.
- Full app verification was not rerun because this was documentation-only.

### Follow-Up

- Refresh README screenshots after seeded hosted smoke testing.

## 2026-08-10 - Property Care Signals

Scope: make each property show its homeowner care state and next best action.

### Changed

- Added reusable `ownerPropertyCareSignal` rules for first repair record,
  active work, document gaps, reminder gaps, and ready property-care records.
- Updated `/owner/properties` with homeowner-facing positioning, per-property
  request/document/reminder counts, and next-action panels.
- Improved the zero-property empty state so first-run owners understand why the
  property comes before requests, photos, receipts, and reminders.
- Extended owner-readiness tests for property care states.
- Updated the UI/UX review checklist to include property care signals.

### Why

The property page is the anchor for the product. A homeowner should be able to
look at a property and know whether it has active work, useful history,
recurring care, or a clear gap to fix next.

### Validation

- `npm test -- owner-readiness` passed: 27 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 140 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add owner browser smoke assertions for property care signals once seeded
  owner auth is available locally or in preview.

## 2026-08-10 - Owner Care Value Snapshots

Scope: make the vault and maintenance calendar explain their homeowner value
before the owner interacts with forms or lists.

### Changed

- Added reusable vault-value metrics for saved records, property document
  coverage, repair-linked documents, and saved categories.
- Added reusable calendar-value metrics for overdue care, upcoming routines,
  property coverage, and recurring maintenance cadence.
- Updated `/owner/vault` with a property-history snapshot above the document
  manager.
- Updated `/owner/calendar` with a preventive-care snapshot and tightened the
  reminder manager heading/copy.
- Extended owner-readiness tests for vault and calendar value states.
- Updated the UI/UX review route checklist for the new care snapshots.

### Why

Homeowners should feel the payoff after a repair is complete, not just while a
request is active. The vault and calendar now frame documents and reminders as
maintenance history, prevention, and decision support instead of plain storage.

### Validation

- `npm test -- owner-readiness` passed: 23 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 136 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add owner browser smoke assertions for vault/calendar snapshots once seeded
  owner auth is available locally or in preview.

## 2026-08-10 - Owner Request Card Signals

Scope: make each owner dashboard request card explain the next useful action.

### Changed

- Added reusable `ownerRequestCardSignal` rules for decision-needed, quote-needed,
  proof-gap, proof-backed, first-proof, cost-context, owner-only, and in-motion
  request states.
- Updated `/owner/dashboard` request cards with per-card guidance and direct
  action links.
- Extended owner-readiness tests for the new request-card signal states.
- Updated the UI/UX review route checklist to include request-card signals.

### Why

The dashboard should help homeowners triage maintenance at a glance. A request
card should explain why it matters and what to do next without forcing the owner
to open every record.

### Validation

- `npm test -- owner-readiness` passed: 19 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 132 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add owner browser smoke assertions for dashboard request-card signals once
  seeded owner auth is available locally or in preview.

## 2026-08-10 - Request Record Value Snapshot

Scope: make an individual repair record explain the value it gives a
homeowner.

### Changed

- Added reusable request record-value metrics for proof packet, cost clarity,
  shared coordination, and decision history.
- Added a record-value snapshot to the owner request detail page.
- Moved proof-packet export into the value snapshot and removed the duplicate
  status-row export button.
- Extended request-guidance tests for empty, partial, and mature repair record
  value states.
- Updated the UI/UX review route checklist to include the request record-value
  snapshot.

### Why

The request detail page is where a homeowner should feel the product payoff:
proof saved, costs understood, helpers coordinated, and decisions preserved.
That value should be visible before the owner digs through individual sections.

### Validation

- `npm test -- request-guidance` passed: 13 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 126 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add owner browser smoke assertions for the request record-value snapshot once
  seeded owner auth is available locally or in preview.

## 2026-08-10 - Homeowner Value Snapshot

Scope: make the owner dashboard explain the day-to-day value homeowners get
from TurnFlow Home.

### Changed

- Added reusable `ownerValueMetrics` to summarize owner decisions, proof-backed
  records, shared helper access, and preventive care.
- Added a homeowner-value snapshot to `/owner/dashboard` with metric-specific
  next actions.
- Extended owner-readiness tests for empty, active-decision, proof, sharing, and
  preventive-care value states.
- Updated the UI/UX review route checklist to include the dashboard value
  snapshot.

### Why

Homeowners need to see the payoff quickly: fewer loose decisions, stronger
repair proof, safer helper sharing, and maintenance records that remain useful
after the job. The dashboard should make that value visible without requiring a
tour.

### Validation

- `npm test -- owner-readiness` passed: 13 tests.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 123 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Once seeded owner smoke can run locally or against preview, add browser
  assertions for the homeowner-value snapshot.

## 2026-08-10 - POC Readiness Preflight

Scope: make launch/auth/browser-smoke readiness easier to diagnose before
running seed or inviting users.

### Changed

- Added `lib/poc-readiness.ts` for pure environment readiness checks.
- Added `scripts/poc-readiness.ts` and `npm run poc:ready` for a human-readable
  CLI preflight.
- Added tests for ready, blocked, warning, and invalid email-sender readiness
  states.
- Added `npm run poc:ready` to QA and deployment runbooks.
- Cleaned `.env.local.example` comments so launch setup docs are ASCII-clean.

### Why

The product can pass code verification while still being unusable for seeded
auth flows if required environment variables are missing. A preflight makes the
next blocked step obvious before `db:seed`, `ux:owner`, `ux:helper`, or a hosted
POC launch.

### Validation

- `npm test -- poc-readiness` passed: 4 tests.
- `npm run typecheck` passed.
- `npm run poc:ready` correctly reported this local checkout as blocked because
  required launch env vars are not set.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 120 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Run `npm run poc:ready` in the actual preview/production environment before
  the next hosted POC smoke pass.

## 2026-08-10 - Deterministic Helper Demo Seed

Scope: remove the local/helper smoke blocker by making seeded demo accounts and
scoped helper work repeatable.

### Changed

- Rebuilt `scripts/seed.ts` so known demo accounts are created or reset with
  the documented password on every seed run.
- Added deterministic public-safe demo property data.
- Added deterministic request assignment so the demo vendor and demo
  collaborator both have scoped work to inspect.
- Updated QA and deployment docs to explain that `db:seed` resets demo
  passwords and prepares helper-visible demo work.

### Why

Browser UX smoke should not depend on manual database cleanup or a lucky prior
state. A launch-ready POC needs repeatable seed data so owner, vendor, and
collaborator workflows can be tested the same way every time.

### Validation

- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 116 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- `npm run db:seed` was attempted but is blocked in this local checkout because
  `DATABASE_URL` is not set in `.env.local`; helper browser smoke should be
  rerun after database env is configured.

### Follow-Up

- Keep production seed usage limited to empty public-safe POC databases, never
  a tenant database with real users.

## 2026-08-10 - Vendor Proof Upload Handoff

Scope: reduce vendor friction from request readiness to proof upload and owner
updates.

### Changed

- Made helper request readiness actions interactive when used from the vendor
  workspace.
- Vendor `Add proof` actions now preselect the matching request and scroll to
  the upload form.
- Added selected-request upload guidance so vendors know whether the next best
  proof is an after photo, receipt, extra context photo, or owner final-cost
  follow-up.
- Added vendor update threads to assigned request cards so vendors can ask the
  owner for missing context or final cost details.
- Extended helper tests for upload guidance and updated the helper UX smoke
  script to assert checklist, readiness, updates, and upload guidance.

### Why

A launch-ready vendor flow should not make users reselect the same job or guess
where to communicate. The card should hand the vendor directly into the right
proof or update action.

### Validation

- `npm test -- helper-workspace` passed: 21 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 116 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- `npm run ux:helper` was attempted against local dev; it reached login but
  could not sign in as `vendor@test.com`, so browser UX smoke remains blocked
  until seeded helper auth data is available locally or on the hosted POC.

### Follow-Up

- Run `npm run ux:helper` against the hosted POC after production environment
  variables and seeded/demo helper accounts are configured.

## 2026-08-10 - Helper Request Card Readiness

Scope: make each helper-facing request card explain what is ready, missing, or
waiting for the helper's next action.

### Changed

- Added reusable helper request card state logic for vendor and collaborator
  cards.
- Added `HelperRequestReadiness` so helper cards show a compact readiness cue
  with a clear next action.
- Updated vendor cards to flag missing job context, closeout proof gaps,
  ready-for-closeout work, and completed records with proof gaps.
- Updated collaborator cards to flag quiet threads, active shared work,
  owner-review state, and completed records.
- Extended helper-workspace tests for request-card readiness states.

### Why

Helpers should not have to scan the whole workspace to understand a single job.
Putting readiness directly on each card reduces back-and-forth, helps vendors
collect the right proof, and helps collaborators post useful updates only where
they add value.

### Validation

- `npm test -- helper-workspace` passed: 17 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 112 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Let vendor card actions preselect the matching request in the upload form for
  an even smoother proof-upload path.

## 2026-08-10 - Helper First-Run Onboarding

Scope: make invited vendor and collaborator first-run experiences clearer before
and after invite acceptance.

### Changed

- Added reusable helper onboarding items for vendor and collaborator workspaces.
- Added `HelperOnboardingChecklist` so helper users can jump from first-run
  guidance to scoped access, shared work, uploads, or updates.
- Added role-specific invite expectation copy on `/accept-invite` before the
  helper accepts the request.
- Extended helper-workspace tests for onboarding items and invite expectations.

### Why

Invited helpers should not have to infer what TurnFlow Home is asking from them.
A mature helper experience explains the access boundary, the immediate next
step, and the evidence or update that helps the owner trust the record.

### Validation

- `npm test -- helper-workspace` passed: 11 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 106 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add browser smoke assertions for the helper checklist once seeded helper
  sessions are available in the local UX harness.

## 2026-08-10 - Helper Workspace Guidance

Scope: make vendor and collaborator workspaces feel scoped, clear, and
action-oriented.

### Changed

- Added `lib/helper-workspace.ts` for reusable helper workspace stats and
  role-specific guidance.
- Added `HelperWorkspaceOverview` for shared helper summary cards, next actions,
  and workload metrics.
- Added vendor workspace guidance for assigned work, proof gaps, active work,
  completed work, and scoped access.
- Added collaborator workspace guidance for shared work, quiet request threads,
  active work, completed work, and scoped access.
- Added tests for vendor and collaborator empty, attention, progress, and ready
  helper states.

### Why

Owners will only trust the product if invited vendors and helpers also get a
professional, obvious experience. Helper users should immediately understand
what they can see, what they can do, and what needs attention.

### Validation

- `npm test -- helper-workspace` passed: 6 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 101 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Extend helper smoke coverage to assert the helper overview once seeded helper
  accounts are available locally.

## 2026-08-10 - Post-Create Notice Cleanup

Scope: keep the request-created handoff helpful without making the URL or
refresh behavior feel stale.

### Changed

- Added `RequestCreatedNoticeBanner` as a dismissible saved-request notice for
  the request detail page.
- Cleaned `created` and `uploads` query params from the browser URL after the
  post-create notice renders.
- Added a reusable helper that removes only post-create query params while
  preserving unrelated params and hash anchors.
- Extended request-submit tests for clean request-detail URLs.

### Why

The post-create notice should reassure the homeowner once, then get out of the
way. Leaving handoff query params in the URL makes refreshes feel confusing and
less polished during normal use.

### Validation

- `npm test -- request-submit` passed: 8 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 95 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Revisit this notice after browser smoke coverage exists for the create-request
  journey to confirm timing feels right on slow photo uploads.

## 2026-08-10 - Post-Create Request Handoff

Scope: keep homeowners in the new repair record after request submission.

### Changed

- Added `lib/request-submit.ts` for post-create photo upload outcomes,
  request-detail redirect paths, and creation notice copy.
- Changed `NewRequestForm` so successful request creation opens the new request
  detail page instead of returning to the dashboard.
- Preserved queued photo upload context in the redirect query string so the
  detail page can explain complete, partial, failed, or no-upload outcomes.
- Added a creation notice to `RequestDetailView` for the post-submit landing
  state.
- Added tests for photo upload status, redirect path generation, and
  owner-facing creation notices.

### Why

After creating a request, the next natural homeowner action is to review the
record, confirm proof landed, add costs, or invite help. Returning to the list
adds an avoidable step and makes photo upload failures too easy to miss.

### Validation

- `npm test -- request-submit` passed: 6 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 93 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Consider clearing creation query params after the first view if repeated
  refreshes make the saved notice feel stale during user testing.

## 2026-08-10 - Request Intake Readiness Guidance

Scope: make the new maintenance request form guide homeowners toward a useful
repair record before submission.

### Changed

- Added `lib/request-intake.ts` for reusable intake-readiness steps, progress,
  next action, and summary copy.
- Added a request draft readiness panel to `NewRequestForm` with progress,
  next-action jump links, and field-level readiness signals.
- Made the main intake fields controlled where needed so readiness updates as
  the homeowner fills the form.
- Added explicit labels and steadier alignment to the quick-add property fields.
- Added tests for empty, partial, trimmed, and ready request-intake states.

### Why

Good request intake reduces downstream friction. A homeowner should know whether
the request has enough property, title, category, urgency, and proof context
before they save it and invite someone else into the record.

### Validation

- `npm test -- request-intake` passed: 5 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 87 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Consider adding a small post-submit landing path that opens the new request
  detail page directly when first-run testing shows owners expect to add proof
  or sharing immediately.

## 2026-08-10 - Inline Completion Waiver Review

Scope: replace prototype-style completion prompts with a calmer inline review
flow for owner and vendor users.

### Changed

- Added `CompletionWaiverReview` as a shared client component for completing a
  request when required proof is missing.
- Replaced the owner request detail `window.prompt` with inline proof-gap
  review, required waiver reason entry, cancel controls, and persistent error
  copy.
- Replaced the vendor portal completion prompt with the same inline review,
  including vendor-specific guidance when final cost still needs owner input.
- Reused request proof-gap detection so the UI and server guard stay aligned.

### Why

Browser prompts make a trust-sensitive completion action feel unfinished. Inline
review keeps the user in context, names the missing proof, and makes the waiver
reason feel like part of the repair record instead of an interruption.

### Validation

- `npm run typecheck` passed.
- `npm test -- request-guidance` passed: 10 tests.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 82 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- Owner/vendor completion prompt scan passed.

### Follow-Up

- Add browser smoke coverage for the inline completion review once seeded
  request-detail and vendor workflows can be captured reliably.

## 2026-08-10 - Request Detail Readiness Guidance

Scope: make each repair record show whether it is complete enough to trust.

### Changed

- Added `lib/request-guidance.ts` for reusable request-level readiness signals.
- Added request detail guidance for evidence, cost context, shared help, and
  completion proof.
- Added jump links from the request guidance panel to proof, cost, quotes,
  sharing, comments, and decision-log sections.
- Added tests for empty, partial, ready, completed-with-gaps, and
  assigned-vendor proof-gap states.

### Why

The request detail screen is where homeowner trust is won or lost. A mature
repair record should make proof gaps obvious before the owner exports a packet,
marks work complete, or shares the request with someone else.

### Validation

- `npm test -- request-guidance` passed: 10 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 82 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Consider replacing the browser prompt for completion waivers with an inline
  review modal after route-level smoke coverage can exercise request details.

## 2026-08-10 - Dashboard Readiness Guidance

Scope: make the returning owner dashboard feel state-aware and action-oriented.

### Changed

- Added reusable dashboard guidance derived from the owner readiness setup steps.
- Reworked `/owner/dashboard` so the top banner adapts for empty, in-progress,
  and ready owner workspaces.
- Pulled dashboard readiness from the full owner context: properties, requests,
  proof, invites, vault documents, and reminders.
- Improved the status-filter empty state with a direct path back to all
  requests.
- Added tests for empty, in-progress, and ready dashboard guidance states.

### Why

The dashboard is the most likely day-to-day landing page. It should not keep
showing first-run copy after the owner has made progress; it should reflect the
state of the workspace and point to the next useful action.

### Validation

- `npm test -- owner-readiness` passed: 10 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 72 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add route-level smoke assertions for the dashboard guidance once seeded owner
  route capture is available.

## 2026-08-10 - Owner Readiness Guidance

Scope: make first-run and account readiness feel guided instead of passive.

### Changed

- Added reusable owner readiness summary helpers for next-best-action guidance.
- Added onboarding summary copy that tells a homeowner what to do next, whether
  the workspace is empty, in progress, or ready for a walkthrough.
- Added Account & Sharing readiness guidance so the trust center reinforces the
  same setup story as onboarding.
- Added tests for next incomplete setup step detection and empty/in-progress/
  ready summary states.

### Why

The product should not make early users infer what matters next. A launch-ready
SaaS experience should clearly name the next useful action and help the owner
understand why the record is becoming more valuable.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 69 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- App/component/lib encoding artifact scan passed.

### Follow-Up

- Use this readiness summary in future route-level smoke output once seeded
  owner route capture is available.

## 2026-08-10 - Owner Trust Action Forms

Scope: reduce friction and trust risk in owner forms, invites, proof, quotes,
exports, and destructive actions.

### Changed

- Refreshed `PropertyForm` with explicit labels, clearer placeholders, and
  cleaner pending/error states.
- Refreshed `InviteSection`, `CopyableInviteLink`, `SharedAccessControls`, and
  pending invite messaging so request sharing is easier to understand.
- Refreshed property delete/export controls with clearer action labels and
  pending states.
- Refreshed `RequestDetailView` with a clearer repair-record header, structured
  details, cleaner status/proof packet controls, and better photo proof copy.
- Refreshed `QuoteWorkspace` with labeled inputs, cleaner quote actions, and
  plain pending/success text.
- Removed visible encoding artifacts from owner trust-action components.

### Why

Launch readiness depends on the moments where users make irreversible or
trust-sensitive decisions: inviting helpers, removing access, changing status,
uploading proof, approving quotes, exporting history, and deleting property
records. These controls need to feel explicit, readable, and recoverable.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 67 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- App/component encoding artifact scan passed.

### Follow-Up

- Add browser smoke coverage for the request detail route once seeded owner data
  is available locally or in preview.

## 2026-08-10 - Helper Workspace UX

Scope: mature shared-access experiences for vendors, collaborators, and invite
acceptance.

### Changed

- Added `components/HelperPortalShell.tsx` so vendor and collaborator pages use
  a consistent scoped-workspace frame.
- Refreshed `/vendor` with clearer assigned-request cards, scoped-access copy,
  status controls, and proof-upload guidance.
- Refreshed `/collaborator` with clearer shared-request cards and update
  posting layout.
- Refreshed `/accept-invite` with calmer trust copy, plain error states, and a
  cleaner acceptance card.
- Cleaned visible encoding artifacts from invite acceptance, helper comments,
  vendor status/upload states, and collaborator copy.
- Added `scripts/ux-helper-smoke.ts` and `npm run ux:helper` for vendor and
  collaborator route smoke coverage.
- Updated README, QA, and UI/UX review docs with the helper smoke check.

### Why

TurnFlow Home only earns owner trust if invited helpers see a scoped,
professional experience. Vendors and collaborators should immediately
understand what they can see, what they can update, and why they are not inside
the owner's full workspace.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 67 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- App/component encoding artifact scan passed.
- `npm run ux:helper` added and failure mode verified, but local route capture
  was blocked because `AUTH_SECRET` and `DATABASE_URL` are not configured and
  `npm run db:seed` cannot create demo helper accounts on this machine.

### Follow-Up

- Add a scripted invite-acceptance walkthrough once test database setup is
  available in local/CI.

## 2026-08-10 - Owner Workspace Navigation UX

Scope: mature the signed-in owner workspace so navigation and route confidence
feel cleaner before launch testing.

### Changed

- Rebuilt `components/OwnerSidebar.tsx` as an active-route client navigation
  component with plain labels, route descriptions, and `aria-current`.
- Wrapped owner navigation in `Suspense` from `app/owner/layout.tsx` to follow
  the Next 16 `usePathname` guidance for layouts that include dynamic routes.
- Cleaned visible encoding artifacts and symbol-heavy copy from owner dashboard,
  request intake, properties, vault, calendar, notifications, backup, and shared
  owner components.
- Tightened mobile stacking on request cards, property rows, vault documents,
  reminders, notifications, and request-intake actions.
- Added `scripts/ux-owner-smoke.ts` and `npm run ux:owner` for authenticated
  owner route checks at desktop and mobile widths.
- Updated README, QA, and UI/UX review docs with the owner smoke check.

### Why

The public auth flow now feels stronger, but the signed-in workspace still
needed a clearer sense of place and fewer rough edges. A homeowner should never
see broken glyphs in headings, buttons, status text, or navigation, and every
owner route should make the current location obvious.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 67 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- App/component encoding artifact scan passed.
- `npm run ux:public` passed against `http://localhost:3000`.
- `npm run ux:owner` added and failure mode verified, but local route capture
  was blocked because `DATABASE_URL` is not configured and `npm run db:seed`
  cannot create the demo owner account on this machine.

### Follow-Up

- Extend the owner smoke from route confidence into one scripted create-request
  walkthrough after test data isolation is improved.

## 2026-08-09 - Public Auth UX Smoke

Scope: make the homeowner entry experience feel more mature and easier to
verify.

### Changed

- Added `components/AuthChrome.tsx` as a shared auth shell with homeowner-first
  positioning and trust cues.
- Refreshed `/login` and `/signup` with explicit labels, autocomplete hints,
  clearer owner-facing copy, stronger focus states, and steadier button states.
- Added `scripts/ux-public-smoke.ts` and `npm run ux:public` to check public
  entry routes at desktop and mobile widths.
- Saved public-entry smoke screenshots under `screenshots/ux-public/`.
- Cleaned `scripts/screenshot.ts` comments/output to ASCII so the screenshot
  workflow does not carry encoding noise.
- Updated README, QA, and UI/UX review docs with the public-entry smoke check.

### Why

Signup and login are the first trust moment for a homeowner. These screens need
to explain the product direction quickly, feel less like a school MVP, and be
easy to check before sharing screenshots or a hosted POC.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 67 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- `npm run ux:public` passed against `http://localhost:3000`.

### Follow-Up

- Extend browser smoke coverage to authenticated owner routes after demo data
  setup is standardized.

## 2026-08-09 - UI UX Findings Register

Scope: give product polish reviews a durable triage trail.

### Changed

- Added `docs/UI_UX_FINDINGS.md` with priority levels, statuses, a findings
  table, and review closeout rules.
- Updated UI/UX review, QA, user-testing, and README docs so repeated friction
  and release-blocking issues flow into the findings register.

### Why

TurnFlow Home needs a repeatable way to turn walkthrough notes and homeowner
testing confusion into prioritized product work. The register keeps SaaS
readiness conversations tied to routes, evidence, owner decisions, and fixing
commits.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 67 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add screenshot artifact paths to findings during the first browser-driven
  UI/UX pass.

## 2026-08-09 - UI UX Review Process

Scope: make product polish review repeatable for homeowner-facing workflows.

### Changed

- Added `docs/UI_UX_REVIEW.md` with a scorecard, route checklist, interaction
  checks, visual checks, trust-copy checks, and session notes template.
- Updated QA, user-testing, and README docs so UI/UX review is part of the POC
  release rhythm.

### Why

The app now has a strong technical verification gate, but SaaS readiness also
depends on repeatable product polish. This creates a shared process for judging
clarity, trust, friction, responsive behavior, accessibility, and homeowner
language before demos or testing.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 67 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add browser-driven screenshot checks for the routes in the UI/UX checklist.

## 2026-08-09 - Protected Deep Health Check

Scope: add authenticated operational monitoring for database connectivity.

### Changed

- Added `/api/health/deep`, protected by `HEALTHCHECK_SECRET`.
- Added deep-health auth and payload helpers in `lib/health.ts`.
- Added tests for bearer parsing, health-check authorization, and deep-health
  payload shape.
- Documented `HEALTHCHECK_SECRET` in `.env.local.example`, deployment docs, QA
  checklist, and README.

### Why

The public health route confirms the app responds, but a SaaS operator also
needs a private signal that the database can be reached. Keeping it behind a
separate secret lets monitoring access be rotated independently from cron.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 67 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed and included `/api/health/deep`.

### Follow-Up

- Add storage and email-provider checks if production monitoring needs deeper
  dependency coverage.

## 2026-08-09 - Baseline Security Headers

Scope: add conservative browser security headers for hosted POC hardening.

### Changed

- Added `lib/security-headers.ts` as the shared baseline header policy.
- Updated `next.config.ts` to apply the security headers globally.
- Added unit coverage for header uniqueness and expected values.
- Updated README, deployment docs, and QA checklist to include security-header
  expectations.

### Why

A homeowner SaaS should ship with basic browser protections before public
testing: content-type sniffing protection, clickjacking defense, referrer
control, locked-down browser permissions, and HSTS. CSP is intentionally left
for a separate nonce-aware pass so we do not break Next scripts or uploads.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 61 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Design and test a nonce-based Content Security Policy after the hosted app and
  any analytics/email/asset domains are finalized.

## 2026-08-08 - Public Health Check

Scope: add a monitor-friendly hosted app status endpoint.

### Changed

- Added `/api/health` as an uncached public GET route.
- Added `lib/health.ts` for a testable health payload with status, service,
  timestamp, version, environment, and commit metadata.
- Added unit coverage for the health payload and route response.
- Updated README, deployment smoke tests, and QA checklist to include the
  health endpoint.

### Why

A SaaS POC needs a simple uptime target that does not require login, seeded
data, or database access. This gives hosting checks and external monitors a
stable way to confirm the deployed app is responding.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 59 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed and included `/api/health`.

### Follow-Up

- Add a protected deep-health endpoint later if launch monitoring needs database
  or storage connectivity checks.

## 2026-08-08 - CI Uses Product Gate

Scope: keep GitHub validation aligned with local release validation.

### Changed

- Updated `.github/workflows/ci.yml` to run `npm run verify` as the single CI
  validation step after install.
- Simplified the deployment pre-check list so `npm run verify` is the canonical
  automated gate instead of repeating each command separately.

### Why

The local QA gate only protects the product if CI uses the same command. This
prevents GitHub Actions and local release checks from drifting as the SaaS
readiness bar gets stricter.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 56 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add a GitHub Actions badge to README once the workflow has a few clean runs.

## 2026-08-08 - Product QA Gate

Scope: make SaaS-readiness validation repeatable.

### Changed

- Added `typecheck`, `audit:prod`, and `verify` npm scripts.
- Added `docs/QA_CHECKLIST.md` for automated and manual POC smoke testing.
- Updated README, deployment docs, and user-testing setup to use the new QA
  gate.

### Why

The project had strong individual checks, but a launchable SaaS needs a single
repeatable verification command and a clear manual smoke path for owner, vendor,
collaborator, sharing, exports, and trust boundaries.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 56 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add browser-driven end-to-end tests for the highest-risk smoke paths once the
  test database workflow is stable.

## 2026-08-08 - Shared Access Audit Email

Scope: make access-removal history identifiable to homeowners.

### Changed

- `removeSharedAccessAction` now looks up the removed vendor/collaborator email
  before clearing request access.
- Decision-log details now include `removedUserEmail` when the account exists.
- Decision Log copy now names the removed email address with a readable fallback
  if the email is unavailable.
- Expanded decision-log unit coverage for email-backed and fallback audit copy.

### Why

An audit trail should answer "who did I remove?" without making a homeowner
interpret internal ids. Email-backed revocation history makes the trust center
and request timeline feel more concrete for early users.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 56 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Consider surfacing removed access events directly in Account & Sharing if user
  testing shows owners look there first for sharing history.

## 2026-08-08 - Shared Access Audit Trail

Scope: preserve a request-level record when owner removes accepted access.

### Changed

- `removeSharedAccessAction` now writes a `shared_access_removed` decision-log
  entry after clearing assigned vendor/collaborator access.
- Added decision-log display copy for removed vendor/collaborator access.
- Added unit coverage for the new decision-log copy.

### Why

Revoking access should leave a visible record, not just mutate a hidden
assignment field. This helps homeowners understand their sharing history and
makes the access-control workflow easier to trust during a POC.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 55 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Completed in `2026-08-08 - Shared Access Audit Email`.

## 2026-08-08 - Shared Access Removal

Scope: let owners revoke accepted vendor/collaborator access from Account &
Sharing.

### Changed

- Added shared-access form parsing for request id and role.
- Added `removeSharedAccessAction` with owner-role and request-ownership checks
  before clearing an assigned vendor or collaborator.
- Added `components/SharedAccessControls.tsx` for the remove-access form.
- Added an Active shared access section to Account & Sharing, separate from
  pending/accepted invite history.
- Added tests for shared-access form parsing.
- Updated README, deployment smoke tests, and user-testing tasks to include
  accepted-access removal.

### Why

Accepted invites are not just activity history; they are live visibility into a
homeowner's repair record. Owners need a clear, reversible access control before
the product feels mature enough for real vendors and trusted helpers.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 52 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Completed in `2026-08-08 - Shared Access Audit Trail`.

## 2026-08-08 - Request Invite Copy Link

Scope: make initial request-level invite creation match the mature resend flow.

### Changed

- Extracted `components/CopyableInviteLink.tsx` as the shared copyable invite
  link UI.
- Updated pending invite resend controls to use the shared copyable-link
  component.
- Updated create invite actions to return `inviteLink` and `emailSent` in
  addition to `inviteId`.
- Updated request-level `InviteSection` so newly created vendor/collaborator
  invites show a structured status message and reusable copyable link card.
- Updated README, deployment smoke tests, and user-testing tasks to include the
  initial invite copy-link flow.

### Why

Owners should get the same sharing affordance whether they just created an
invite or are resending it later. This removes the old hard-to-scan status text
and keeps request-page sharing usable when email is disabled for a POC.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 49 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Consider showing existing pending invite links before resend if user testing
  shows owners expect to retrieve links without refreshing expiry.

## 2026-08-08 - Invite Link Fallback

Scope: frictionless pending-invite recovery when email is unavailable.

### Changed

- Added `lib/invites/links.ts` as the shared invite-link builder.
- Updated create/resend invite actions to use the shared link builder.
- Updated `resendInviteAction` to return the invite link to the client every
  time it refreshes a pending invite.
- Made resend copy explain whether email was sent or whether the owner should
  copy the fallback link because email is not configured.
- Added a read-only invite-link field and copy button to
  `PendingInviteControls`.
- Extended invite tests to cover fallback localhost URLs, APP_URL trimming, and
  query-string encoding.
- Updated README, deployment smoke tests, and user-testing tasks to include the
  copyable invite-link fallback.

### Why

The hosted POC may intentionally run without outbound email at first. Owners
still need a smooth way to share an invite link, and testers need to understand
that a failed email send does not block the request-sharing flow.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 49 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Add resend delivery state once real email configuration is active.

## 2026-08-07 - Pending Invite Controls

Scope: owner control over pending vendor/collaborator invite links.

### Changed

- Added `lib/invites/forms.ts` for testable invite form parsing.
- Added `cancelInviteAction` for owners to delete pending invites and clear the
  matching request pending-invite pointer.
- Added `resendInviteAction` for owners to refresh a pending invite expiry and
  send/log a new invite notification attempt.
- Added `components/PendingInviteControls.tsx` and surfaced Resend/Cancel
  controls in Account & Sharing invite activity.
- Added `__tests__/invite-forms.test.ts` for invite-id parsing.
- Updated README, deployment smoke tests, and user-testing tasks to include
  pending invite management.

### Why

Real owners need a recovery path when an invite email does not land or the wrong
person was invited. Resend/cancel controls make sharing feel intentional and
reversible without changing the database schema.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 46 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Completed in `2026-08-08 - Shared Access Removal`.

## 2026-08-07 - Signup and Profile Friction Pass

Scope: smoother account creation and basic owner profile management.

### Changed

- Added `lib/auth/forms.ts` for shared, testable signup and owner profile
  validation.
- Refactored `signupAction` to use the shared parser and return safe name/email
  values after validation or duplicate-email errors.
- Updated `/signup` to preserve name/email after failed submissions and show the
  password rule before submit.
- Added `updateOwnerProfileAction` for owner display-name updates with
  server-side role validation and path revalidation.
- Added `components/OwnerProfileForm.tsx` and embedded it in Account & Sharing.
- Updated Account & Sharing to read the current owner row from the database so
  profile edits display immediately.
- Added `__tests__/auth-forms.test.ts` for signup normalization, password/email
  errors, safe value preservation, and profile-name validation.
- Updated README and user-testing tasks to include editable profile behavior.

### Why

Signup is the first real conversion moment. Keeping safe values after errors,
making password rules visible, and giving owners a basic editable profile makes
the app feel less like a static POC and more like software people can settle
into.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 43 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Add password change/reset flows before a broader public beta.
- Add email verification once outbound email configuration is confirmed.
- Add invite revoke/resend controls from Account & Sharing.

## 2026-08-07 - Owner Readiness Test Coverage

Scope: organize and test the first-run readiness rules that drive launch UX.

### Changed

- Added `lib/owner-readiness.ts` as the shared source of truth for owner setup
  steps, progress, readiness flags, shared-request counts, and account
  readiness checklist items.
- Refactored `/owner/onboarding` and `/owner/account` to use the shared helper
  instead of duplicating first-run logic in page components.
- Added `__tests__/owner-readiness.test.ts` covering empty, partial, and more
  mature owner journeys.
- Updated README and user-testing docs to note that setup/account readiness
  rules are now shared and tested.
- Kept Next's generated `AGENTS.md` guidance change so future worktree status
  stays cleaner after `next dev` rewrites it.

### Why

The product needs to feel frictionless, but the maturity rules cannot drift
between pages. Centralizing and testing them makes the owner journey easier to
change deliberately after user testing.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 38 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Add tests around signup validation once the auth action is split into a
  testable parser/helper.
- Add lightweight route smoke tests after a stable demo database is available.

## 2026-08-07 - Owner Account & Sharing Center

Scope: launch-readiness trust surface for homeowner accounts and invite sharing.

### Changed

- Added `/owner/account`, a state-backed Account & Sharing Center for owners.
- Summarized the signed-in owner profile, shared-request count, pending invite
  count, and first-run readiness signals.
- Documented current sharing boundaries in-product: vendors and collaborators
  are request-scoped, while vault documents, reminders, backups, properties, and
  notification history stay owner-only.
- Added invite activity visibility for pending and accepted request invites.
- Added Account navigation, a dashboard "Review sharing" entry point, and a
  signup trust note explaining request-scoped vendor/helper access.
- Updated README, deployment smoke tests, and user testing tasks to include
  Account & Sharing.

### Why

Early users need confidence before inviting a contractor or helper into a
maintenance record. This page makes the current sharing model visible without
adding a migration or pretending to have full privacy controls yet.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 33 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Add editable owner profile and password/account management.
- Add explicit per-invite revoke/resend controls.
- Turn the current sharing explanation into enforceable privacy-control UI once
  user testing confirms the right defaults.

## 2026-08-07 - Middleweight First-Run Testing Loop

Scope: homeowner-first signup and setup journey for SaaS user testing.

### Changed

- Added public owner signup at `/signup` with server-side validation,
  duplicate-email handling, password hashing, and automatic sign-in.
- Updated the auth proxy so signed-out users can reach `/signup` and signed-in
  users are redirected away from `/login` and `/signup`.
- Added `/owner/onboarding`, a state-backed setup guide that tracks progress
  across property setup, first request, evidence, helper sharing, vault history,
  and recurring reminders.
- Added setup guide entry points in the owner sidebar and dashboard.
- Added `docs/USER_TESTING.md` with a homeowner testing protocol, tasks,
  observation prompts, success signals, and notes template.
- Updated README and deployment docs to reflect public owner signup and the
  homeowner testing path.
- Updated `dompurify` in `package-lock.json` from `3.4.12` to `3.4.13` to
  clear the production dependency audit advisory inherited through `jspdf`.

### Why

The next product risk is not hosting mechanics; it is whether a homeowner can
understand and complete the core SaaS journey without a property management
company. This slice gives testers a serious first-run path while keeping public
account creation scoped to owners.

### Validation

- `npm.cmd ci` passed.
- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 33 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Run three to five homeowner test sessions using `docs/USER_TESTING.md`.
- Watch especially for first-request friction, invite trust/privacy concerns,
  and whether the vault/reminder pieces feel connected to the repair record.
- Keep vendor and collaborator signup invite-driven until sharing scope and
  privacy controls are clearer.

## 2026-08-06 - Lint Blocker Cleared

Scope: React hook lint cleanup for the request detail workflow.

### Changed

- Removed the prop-to-state sync effect from `QuoteWorkspace`.
- Derived the displayed quote list from props plus locally hidden deleted quote IDs.
- Extracted the request cost form into a keyed `CostEditor` child so refreshed
  server cost values remount the form instead of syncing state in an effect.

### Why

Next/React lint now flags synchronous `setState` calls inside effects. The old
pattern worked functionally, but it blocked a clean pre-deploy checklist.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 33 tests.

## 2026-08-06 - Production Audit Cleared

Scope: dependency audit hardening for deploy readiness.

### Changed

- Updated `next` from `16.2.12` to `16.3.0`.
- Updated `eslint-config-next` from `16.2.12` to `16.3.0` to keep lint config
  aligned with the framework version.

### Why

`npm audit --omit=dev` reported high-severity production findings through
Next's transitive `postcss` and `sharp` dependencies. The audited fix path was
the Next `16.3.0` release line.

### Validation

- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 33 tests.
- `npx.cmd drizzle-kit --version` passed.

### Follow-Up

- Full `npm audit` still reports 4 moderate dev-only findings through
  `drizzle-kit -> @esbuild-kit/esm-loader -> @esbuild-kit/core-utils ->
  esbuild@0.18.20`.
- `drizzle-kit@0.31.10` is currently the latest published version, and npm's
  suggested forced fix would downgrade to `drizzle-kit@0.18.1`, so this remains
  documented rather than forced.

## 2026-08-06 - Baseline Migration Added

Scope: replace direct schema push setup with committed Drizzle migrations.

### Changed

- Added the initial generated migration in `drizzle/0000_living_rhino.sql`.
- Committed Drizzle migration metadata under `drizzle/meta/`.
- Updated `drizzle.config.ts` so `db:generate` can run without a live
  `DATABASE_URL`, while `db:migrate` and `db:push` still require one.
- Updated the README and deployment runbook to use `npm run db:migrate` for
  fresh database setup.

### Why

`db:push` was fine for the earliest POC, but a public-safe beta needs a
reviewable, repeatable schema history that can be applied consistently across
local, staging, and deployed databases.

### Validation

- `npm.cmd run db:generate` passed and produced the baseline migration.
- `npm.cmd run db:migrate` without `.env.local` failed fast with the expected
  missing `DATABASE_URL` error.
- `npm.cmd run db:push` without `.env.local` failed fast with the expected
  missing `DATABASE_URL` error.

### Follow-Up

- Run `npm run db:migrate`, `npm run db:seed`, and `npm run db:seed:demo`
  against a real Neon database once `.env.local` is available.

## 2026-08-06 - Production Build Without Local Secrets

Scope: make pre-deploy validation runnable before local Neon credentials are
available.

### Changed

- Made `lib/db/index.ts` initialize the Neon/Drizzle client lazily instead of
  throwing as soon as the module is imported.
- Kept the same missing `DATABASE_URL` error for runtime code paths that
  actually touch the database.
- Added `npm run build` and production audit checks to the deployment runbook's
  pre-deploy checklist.

### Why

`next build` imports protected routes while collecting page data. The old eager
database initialization made a missing local `DATABASE_URL` fail the build even
though Vercel production will provide the variable at runtime. Lazy
initialization lets CI/local build validation run without secrets while still
failing clearly if a database-backed request runs without configuration.

### Validation

- `npm.cmd run build` passed without `.env.local`.
- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 33 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.

### Follow-Up

- Run the app against real Neon and Blob credentials and perform the deployment
  smoke test.

## 2026-08-06 - GitHub CI Added

Scope: move the pre-deploy validation checklist into GitHub Actions.

### Changed

- Added `.github/workflows/ci.yml`.
- CI now runs on pushes to `main` and on pull requests.
- The workflow installs from `package-lock.json`, then runs lint, TypeScript,
  tests, production dependency audit, migration drift check, and production
  build.
- Updated the deployment runbook to note that CI covers the pre-deploy checks.

### Why

The project now has a green local checklist, but it should not rely on memory or
a single workstation. CI makes regressions visible before deploy work continues.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 33 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Confirm the first GitHub Actions run passes on `main` after this commit is
  pushed.

## 2026-08-04 - Trust Boundary Hardening

Commit: `31267e3`  
Scope: server-side guardrails for maintenance workflows.

### Changed

- Added server-side request status validation in `updateRequestStatusAction`.
- Re-checked completion proof server-side before allowing `Complete`.
- Required a non-empty waiver reason when completion proof is missing.
- Scoped reminder deletion to the verified property.
- Validated vault document `requestId` against the same owner and property.

### Why

The client UI already prompted for completion proof and routed users through the
right workflow, but SaaS guardrails need to live on the server. These changes
reduce the risk of invalid status values, bypassed completion proof,
cross-property reminder deletion, and mismatched vault document links.

### Validation

- `npm.cmd test` passed: 33 tests.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd run lint` ran and surfaced pre-existing React hook lint issues in
  `components/QuoteWorkspace.tsx` and `components/RequestDetailView.tsx`.

### Follow-Up

- Fix existing hook lint issues.
- Review npm audit findings before public beta.
- Add deploy runbook and make demo setup repeatable.

## 2026-08-04 - POC Deployment Documentation

Scope: make the hosted demo path repeatable.

### Changed

- Added `docs/DEPLOYMENT.md` with environment variables, setup, seeded demo
  accounts, pre-deploy checks, and smoke-test steps.
- Added `docs/BUILD_LOG.md` as the running project build log.
- Added `db:seed:demo` as a script alias for the existing demo seed.
- Linked deployment docs and build log from the README.

### Why

The app is moving from portfolio MVP toward hosted SaaS POC. Repeatable docs
keep the project understandable when returning to it after each build step.

### Validation

- `npm.cmd test` passed: 33 tests.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd run lint` ran and still reports the known React hook lint issues in
  `components/QuoteWorkspace.tsx` and `components/RequestDetailView.tsx`.
- `npm.cmd install` reported 7 npm audit findings.

### Follow-Up

- Fix lint issues so the pre-deploy checklist can go fully green.
- Convert `db:push` POC setup to committed migrations before broader beta.
