# TurnFlow Home System Guide

This is the starting point for understanding TurnFlow Home as a product, a user experience, and a software system.

TurnFlow Home is a homeowner-first maintenance workspace. It keeps the repair record, evidence, cost context, scoped collaboration, closeout, and recurring care connected to the home. The current repository is a launch-oriented SaaS proof of concept built with Next.js 16, React 19, Postgres/Neon, Drizzle ORM, Auth.js, Vercel Blob, Resend, Vitest, and Playwright-based smoke scripts.

## Recommended reading order

1. [Visual system guide](output/system-guide/turnflow-home-system-visual-guide.pptx) — the quickest guided tour of the product, workflows, architecture, data, security, delivery, risks, and extension points.
2. [Site walkthrough](site-walkthrough.md) — the user experience, screen by screen and role by role.
3. [Code glossary](code-glossary.md) — plain-language definitions tied to real repository files.
4. [Problem, algorithm, pseudocode, and flowcharts](problem-algorithm-pseudocode-flowchart.md) — the core decision logic in implementation-ready form.
5. [Explain-the-code practice guide](explain-the-code-practice-guide.md) — short pitches, interview frameworks, exercises, and model answers.
6. [Presentation builder](deck-build/turnflow-home-deck-builder.js) — reproducible source for the PowerPoint.
7. [Engineering documentation index](docs/README.md) — the deeper problem-to-requirements-to-algorithm documentation chain maintained in the repository.

## Project at a glance

| Area | Current implementation |
|---|---|
| Product boundary | Homeowner-managed repair records and recurring care, not a property-management-company operating system |
| Roles | Owner, vendor, collaborator |
| Main record | A maintenance request linked to one property and one owner workspace |
| Frontend | Next.js App Router pages with server-rendered data and interactive React components |
| Mutations | Next.js Server Actions plus a small set of Route Handlers |
| Data | Neon Postgres accessed through Drizzle ORM; 19 primary tables |
| Files | Private Vercel Blob through an authenticated upload proxy and the record-authorized `/api/files` read route |
| Authentication | Auth.js credentials provider, bcrypt password verification, Postgres-backed login/signup limits, JWT sessions |
| Authorization | Optimistic role routing in `proxy.ts`; authoritative role and record ownership checks in the DAL, Server Actions, upload route, and private file route |
| Notifications | Resend when configured, with every attempt recorded in `notification_log`; log-only fallback is supported |
| Verification | 34 Vitest files and 318 tests in the current suite; lint, TypeScript, tests, and the production build passed on 2026-09-30 |
| Deployment target | Vercel, Neon, Vercel Blob, optional Resend, protected cron and deep-health checks |

## What is implemented

- Public homeowner signup and role-aware login.
- Owner onboarding, multi-property records, request intake, evidence capture, quote comparison, scoped sharing, task planning, decisions, comments, work history, closeout review, billing recordkeeping, exports, reminders, notifications, and backups.
- Invite-driven vendor and collaborator portals that show request-scoped data.
- Vendor profiles, vendor bids, work-session events, task updates, proof upload, closeout submissions, and revision loops.
- Completion gating that expects final cost, an after photo, and an assigned vendor, with an explicit logged waiver path.
- Public and protected health endpoints, security headers, readiness checks, unit tests, and browser smoke scripts.

## What remains incomplete or needs human confirmation

- Payment processing, subscription checkout, customer billing portal, team-seat policy, and organization invite UI are not implemented.
- Open vendor opportunity bidding and automated vendor matching are not implemented. The current bid flow is for an already assigned vendor.
- External uptime alerting and centralized log aggregation remain future work.
- Email can operate in log-only mode. A launch environment still needs verified Resend delivery and cron behavior.
- The repository has strong automated checks, but the documented launch gate still requires moderated homeowner testing.
- Invited vendors and collaborators still need an account-creation path; today that lane depends on an existing or seeded account.
- Multi-row workflow writes are not yet transactional, decision-log retention follows request deletion, and quote approval uniqueness is not database-enforced.
- The Content Security Policy is intentionally absent until nonce handling is designed; the current header set covers HSTS, framing, MIME sniffing, referrer policy, and restricted browser capabilities.

## Evidence and scope

This guide was reconciled with upstream commit `52e3c7c` and the checked-out working tree on 2026-09-30. Claims distinguish implemented behavior from planned work. Environment variable names are documented, but no secret values are included.
