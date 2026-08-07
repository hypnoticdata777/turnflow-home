# TurnFlow Home Build Log

Keep this log tight: what changed, why it changed, validation, and what remains.

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

- Add a visible copied-link fallback for resend when email is not configured.
- Add accepted-invite removal/unshare controls once user testing confirms how
  owners expect revocation to behave.

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
