# TurnFlow Home Build Log

Keep this log tight: what changed, why it changed, validation, and what remains.

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
