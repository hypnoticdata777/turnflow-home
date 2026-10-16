# Implementation Backlog — TurnFlow Home

Last updated: 2026-10-16

This document is an actionable, prioritized backlog derived from the engineering review and roadmap. Each Epic is broken into concrete tasks with file-level deliverables where applicable. Use this as a starting point for sprint planning, issue creation, and assignments.

Summary
- Goal: make the repo contributor-ready, complete critical product features, harden for production, and document operational runbooks.
- Priorities: onboarding & reproducibility → code quality & testability → feature completion → production readiness → operations & SLAs.

How to use
- Create one GitHub issue per task below (title and short description provided). Tag with labels: epic:<epic-name>, priority:{p0,p1,p2}, difficulty:{small,medium,large}.
- Tasks marked with `FILE:` include suggested file paths to create. I can create those files for you on request.

PHASE 0 — Onboarding & hygiene (High priority)
Epic: Contributor onboarding
- Task 0.1: Add CONTRIBUTING.md (small, 0.5d)
  - Description: Provide quickstart, developer scripts, env var guidance, PR checklist, how to run tests, and where to find major flows.
  - FILE: docs/CONTRIBUTING.md
  - Acceptance: A new developer can run the app locally within 15 minutes using only the README + this file.

- Task 0.2: Add CODE_OF_CONDUCT.md (small, 0.25d)
  - FILE: CODE_OF_CONDUCT.md
  - Acceptance: Standard Contributor Covenant or similar added; referenced in CONTRIBUTING.md.

- Task 0.3: Add ISSUE_TEMPLATE and PULL_REQUEST_TEMPLATE (small, 0.25d)
  - FILE: .github/ISSUE_TEMPLATE/bug_report.md
  - FILE: .github/ISSUE_TEMPLATE/feature_request.md
  - FILE: .github/PULL_REQUEST_TEMPLATE/pull_request_template.md
  - Acceptance: New issues/PRs get guided fields that speed triage and reduce noise.

- Task 0.4: Add a short docs index and CODE MAP link (small, 0.5d)
  - FILE: docs/README_INDEX.md (link to docs/README.md and code map)
  - Acceptance: Top-level README links to docs/README.md and docs/05-implementation/code-map.md with direct anchors.

Epic: Local reproducibility
- Task 0.5: Add docker-compose for local DB + sample script (medium, 1d)
  - FILE: docker-compose.local.yml
  - FILE: scripts/dev-local.sh (or .ps1) to start DB, migrate, seed, and start Next dev
  - Acceptance: Developer without Neon/Vercel accounts can run local Postgres, run migrations and seeds, and launch Next dev.

- Task 0.6: Make .env.local.example explicit and minimal (small, 0.5d)
  - Modify: .env.local.example (mark required vars: DATABASE_URL, AUTH_SECRET, BLOB_READ_WRITE_TOKEN, SEED_PASSWORD; optional: INVESTOR_DEMO_PASSWORD)
  - Acceptance: Clear comments in file; no accidental secrets.

PHASE 1 — Developer experience & code quality (High priority)
Epic: Project scaffolding & CI
- Task 1.1: Add a 'verify' CI job that can run on forks (medium, 1d)
  - Modify: .github/workflows/ci.yml to ensure non-sensitive checks run for PRs from forks (lint/typecheck/tests if secrets not required)
  - Acceptance: PRs from forks can run the verify pipeline without failing for missing secrets.

- Task 1.2: Add coverage reporting and badge (small, 1d)
  - FILE: .github/workflows/coverage.yml OR extend ci.yml
  - Acceptance: Coverage report is generated in CI, and README shows current coverage badge.

Epic: Modularize UI & separate logic
- Task 1.3: Identify 3 largest UI components to split (medium, 3d)
  - Files to split: components/RequestDetailView.tsx, components/VendorPortal.tsx, components/NewRequestForm.tsx
  - Subtasks: create presentational child components, move business logic calls into lib/*, add unit tests for moved logic.
  - Acceptance: Each component under 800 LOC and logic covered by unit tests.

- Task 1.4: Move complex business logic out of React components (medium, 5d)
  - Targets: complex event/state transitions in components → lib/request-workflow.ts and lib/request-status-policy.ts
  - Acceptance: UI components import pure functions from lib/* for business rules; lib functions have unit tests.

- Task 1.5: Add explicit permission & ownership unit tests (medium, 3d)
  - Files to add tests for: lib/request-intake.ts, lib/request-submit.ts, lib/request-workflow.ts
  - Acceptance: tests assert helpers only see assigned requests; state transitions write decision-log entries.

PHASE 2 — Feature completion & hardening (Medium priority)
Epic: Invite/signup flows and transactional writes
- Task 2.1: Complete invite-based signup (medium, 5d)
  - Files: app/accept-invite/* routes, lib/invites/* ensure robust token validation and expiry, UI flow in components/AcceptInviteButton.tsx and InviteSection.tsx
  - Acceptance: Invited vendors/helpers can sign up using invite token; token is single-use or expires; logs written to decision-log.

- Task 2.2: Ensure transactional writes and audit trail (medium, 3d)
  - Review: all actions that change state call a central transaction wrapper that ensures decision-log append happens atomically with the state change
  - Files: lib/actions/* or wrappers in lib/utils.ts
  - Acceptance: If DB write fails, no decision-log row is committed; transaction tests simulate failures.

Epic: Security & private file access
- Task 2.3: Document and automate blob token lifecycle (small, 2d)
  - FILE: docs/SECURITY_BLOB_TOKENS.md
  - Acceptance: Clear instructions for rotating BLOB_READ_WRITE_TOKEN and how to revoke tokens.

- Task 2.4: Add pre-deploy guard for secrets (small, 1d)
  - FILE: scripts/poc-readiness.ts (already exists — expand to check for dev/demo secrets, warn/fail if risky)
  - Acceptance: pre-deploy script fails when default/demo secrets are present.

PHASE 3 — Production readiness & scaling (Medium priority)
Epic: Backups, monitoring, and runbooks
- Task 3.1: Backup & restore runbook (small, 2d)
  - FILE: docs/ops/backup-and-restore.md
  - Acceptance: Documented steps for Neon snapshot restore and verification test to run after restore.

- Task 3.2: Monitoring & alerting (small, 3d)
  - Add Sentry integration (if not present) and basic alerts for 5xx rate and DB connection errors; add uptime check.
  - Acceptance: Alerts flow to a channel (Slack/email) and an on-call person is documented.

Epic: Canary deploy and rollback testing
- Task 3.3: Canary deploy plan and test (small, 3d)
  - FILE: docs/ops/canary-rollout.md
  - Acceptance: One successful canary deploy completed and rollback tested in staging.

PHASE 4 — Operationalization & SLAs (Lower priority)
- Task 4.1: Incident response runbook and drill (small, 4d)
  - FILES: docs/ops/incident_response.md, docs/ops/p0-rollout-runbook.md (update)
  - Acceptance: Run a tabletop drill; capture and fix one gap.

Supporting files to create (templates)
- docs/CONTRIBUTING.md — Quickstart, dev scripts, env vars, PR checklist
- CODE_OF_CONDUCT.md — Contributor Covenant
- .github/ISSUE_TEMPLATE/bug_report.md
- .github/ISSUE_TEMPLATE/feature_request.md
- .github/PULL_REQUEST_TEMPLATE/pull_request_template.md
- docker-compose.local.yml — Postgres + admin UI example
- scripts/dev-local.sh — start local DB, run migrations, seed, run dev
- scripts/generate-doc.js — small Node generator to build a combined HTML handbook (example provided earlier)
- docs/SECURITY_BLOB_TOKENS.md — blob token lifecycle
- docs/ops/backup-and-restore.md
- docs/ops/canary-rollout.md
- docs/ops/incident_response.md

Suggested first sprint (2 weeks)
- Create CONTRIBUTING.md, CODE_OF_CONDUCT.md, ISSUE and PR templates (Tasks 0.1–0.3)
- Add docker-compose.local.yml + scripts/dev-local.sh (Task 0.5)
- Create docs/CONTRIBUTING.md and docs/README_INDEX.md (Task 0.4)
- Create 6 “good-first-issue” items pointing to: small UI tweaks, documentation improvements, and a focused unit test addition

Suggested labels for GitHub issues
- epic:onboarding, epic:dx, epic:tests, epic:security, epic:ops
- priority: p0, p1, p2
- difficulty: small, medium, large

Issue title templates (copy/paste when creating issues)
- [onboarding] Add CONTRIBUTING.md — quickstart and PR checklist
- [onboarding] Add local docker-compose and dev script
- [dx] Split components/RequestDetailView.tsx into <n> subcomponents
- [feature] Complete invite signup flow (server token validation)
- [tests] Add unit tests for request-workflow permission checks

Next steps I can take for you (pick one)
- Create the top-level files now in the repo: docs/CONTRIBUTING.md, CODE_OF_CONDUCT.md, .github issue/PR templates, docker-compose.local.yml and scripts/dev-local.sh. I will commit them directly.
- Convert each task into a GitHub Issue (I can create them in this repo). Note: the tool allows one call for issue creation per response; if you want multiple issues created I will batch them into one issue that contains the backlog or create them across subsequent turns.
- Produce the exact file contents for each template here for your review before committing.

I can create the files immediately if you want. Which of these would you like me to do next?
