# TurnFlow Home

A homeowner-first maintenance workspace for people who want to manage repair
records, proof, costs, documents, reminders, and scoped help without handing the
whole process to a property management company.

TurnFlow Home replaces the "text a photo and hope someone remembers" workflow
with one shared record for each property. Homeowners can log an issue, attach
photos or receipts, compare cost context, invite a vendor or trusted helper,
track decisions, preserve property history, and schedule recurring care.
Vendors and collaborators get scoped portals that show only the requests shared
with them.

> **Status:** launch-oriented SaaS POC candidate. The original Firebase MVP has
> been rebuilt on a real backend with Next.js, Postgres/Neon, Drizzle, Auth.js,
> and Vercel Blob. Core homeowner, vendor, and collaborator workflows are in
> place, automated verification passes, and the owner UI now includes
> readiness/value guidance across setup, dashboard, request detail, properties,
> vault, calendar, and account sharing. A real hosted POC still needs production
> environment configuration, seeded demo data, refreshed screenshots, and manual
> user testing before inviting external users.

## Product Direction

TurnFlow Home is intentionally homeowner-focused. It is not trying to be a full
PMC operations platform with dispatch, technician routing, payroll, or internal
company reporting. The value is calmer ownership:

- Know what needs attention at each property.
- Keep proof, costs, quotes, decisions, receipts, warranties, and reminders in
  one home record.
- Share only the right request with a vendor or trusted helper.
- Keep exportable maintenance history after the work is done.
- Catch recurring maintenance before it becomes a bigger repair.

## Screenshots

These screenshots show the current route coverage pattern. Refresh them before
using the repo for a public case study or hosted POC, because the owner UI has
recently gained more value snapshots and care signals.

| | |
|---|---|
| **Sign in** | **Owner dashboard - status filtering** |
| ![Login](screenshots/01-login.png) | ![Dashboard](screenshots/02-dashboard.png) |
| **Guided intake with safety checklist** | **Request detail - quotes, cost, decision log** |
| ![New request](screenshots/03-new-request-checklist.png) | ![Request detail](screenshots/04-request-detail.png) |
| **Properties** | **Property document vault** |
| ![Properties](screenshots/05-properties.png) | ![Vault](screenshots/06-vault.png) |
| **Maintenance calendar** | **Vendor portal** |
| ![Calendar](screenshots/07-calendar.png) | ![Vendor portal](screenshots/08-vendor-portal.png) |

Regenerate screenshots after starting the dev server and seeding demo data:

```bash
npx tsx scripts/screenshot.ts
```

## Why It Was Rebuilt

The original MVP was a static, vanilla-JS site backed by Firebase: Firestore,
Firebase Auth, Firebase Storage, and Firestore security rules. This version
moves the product onto a stack with a real server boundary, relational data,
server-side authorization checks, and deploy-ready verification.

| Layer | Then | Now |
|---|---|---|
| Framework | Static HTML + vanilla JS | Next.js 16 App Router + TypeScript |
| Database | Firestore | Neon serverless Postgres + Drizzle ORM |
| File storage | Firebase Storage | Vercel Blob |
| Auth | Firebase Auth | Auth.js / NextAuth v5 |
| Authorization | Firestore security rules | Server Actions and role/ownership checks |
| Hosting target | Firebase Hosting | Vercel |

## Tech Stack

- Next.js 16, App Router, TypeScript, Server Actions
- Neon serverless Postgres with Drizzle ORM
- Vercel Blob for photos, quote attachments, and vault documents
- Auth.js / NextAuth v5 with credentials auth and JWT sessions
- Tailwind CSS v4
- Vitest for unit tests
- Playwright-based smoke scripts for public, owner, and helper routes

## Getting Started

```bash
npm install
npm run db:migrate
npm run db:seed
npm run db:seed:demo
npm run dev
```

Environment variables live in `.env.local`; use `.env.local.example` as the
template.

```text
DATABASE_URL=
BLOB_READ_WRITE_TOKEN=
AUTH_SECRET=
APP_URL=http://localhost:3000
RESEND_API_KEY=
NOTIFICATIONS_FROM_EMAIL=notifications@example.com
CRON_SECRET=
HEALTHCHECK_SECRET=
```

Before deploying or asking anyone to test a hosted POC, run:

```bash
npm run poc:ready
npm run verify
```

`npm run poc:ready` checks whether the required auth, database, Blob, app URL,
healthcheck, cron, and notification settings are ready for a user-facing POC.

`npm run verify` runs lint, typecheck, unit tests, production dependency audit,
Drizzle schema generation, schema drift check, and a production build.

## Smoke Testing

Run public route checks against a running local or preview server:

```bash
npm run ux:public
```

After configuring `AUTH_SECRET` and `DATABASE_URL`, seed demo accounts and run
signed-in owner/helper smoke checks:

```bash
npm run db:seed
npm run ux:owner
npm run ux:helper
```

The smoke scripts check responsive route behavior, active navigation, visible
encoding artifacts, horizontal overflow, and key route-specific cues. Screenshots
are saved under `screenshots/ux-public/`, `screenshots/ux-owner/`, and
`screenshots/ux-helper/`.

## Core Features

- Homeowner public signup and email/password login.
- Role-based owner, vendor, and collaborator portals.
- Property records for multiple homes per owner.
- Property care signals that summarize active work, history gaps, reminder gaps,
  and ready property-care records.
- Homeowner setup guide that tracks first-run progress across property, request,
  evidence, helper sharing, saved history, and recurring care.
- Owner dashboard with status filters, live counts, homeowner-value metrics, and
  request-card next actions plus communication-health signals for quiet shared
  threads and closeout review updates.
- Guided request intake with category-specific safety checklist, urgency,
  location, access instructions, contact preference, inline photo upload, and
  quick first-property creation.
- Request detail value snapshot for proof packet, cost clarity, scoped
  coordination, and decision history.
- Owner-visible vendor fit panel on request detail, comparing assigned vendor
  trades and profile context against the repair category before approval/work.
- Before, after, receipt, and other photo uploads per request.
- Quote workspace with competing vendor quotes, attachments, approve/decline,
  cost-copy actions, and homeowner-friendly comparison metrics.
- Vendor-submitted bid flow for assigned vendors, with private owner review,
  availability windows, scope notes, and decision-log history.
- Owner bid-review guidance that explains pending vendor bids, approve/decline
  impact, copied quoted cost, and revised pricing before owner decisions.
- Quote comparison cues for active option count, lowest active price, price
  spread, vendor-submitted ratio, and per-quote price position.
- Vendor bid decision notifications for owner-approved or owner-declined
  vendor-submitted bids.
- Append-only decision log for status changes, waivers, quote decisions, and
  access changes.
- Completion gating that requires final cost, after-photo proof, and assigned
  vendor, unless the owner records an explicit waiver reason.
- Guided request updates shared by owner, assigned vendor, and shared
  collaborator, with role-aware draft prompts for missing context, closeout
  proof, and useful helper notes.
- Status handoff guidance for owners and vendors so status changes explain
  decision-log impact, owner notification, and missing closeout proof.
- Vendor and collaborator invite flow with expiring links, copyable invite URLs,
  pending invite management, accepted-access removal, and scoped portals.
- Vendor-owned matching profile for business name, trade categories, service
  area, availability, notification preference, and license/insurance notes.
- Vendor lifecycle tracker for assigned jobs, covering opportunity, bid/price
  context, owner approval, scheduled/ready, work in progress, closeout proof,
  and billing record stages.
- Vendor work-session events for start, pause, resume, and stop, with notes,
  owner-visible timeline history, decision-log entries, and owner notifications.
- Vendor closeout snapshot showing ready-to-close jobs, owner-context gaps,
  after-photo gaps, and final-cost gaps before owner review.
- Owner Account & Sharing Center with profile context, invite activity, access
  boundaries, and account-readiness signals.
- Property vault for receipts, warranties, manuals, invoices, inspection
  reports, and other documents.
- Vault value snapshot for saved records, property document coverage,
  repair-linked docs, and saved categories.
- Maintenance calendar with overdue/due-soon signals, property coverage,
  recurring cadence metrics, mark-done actions, and `.ics` export.
- Per-request PDF proof packets, per-property PDF history rollups, CSV history
  export, and JSON backup/restore.
- Email notifications through Resend for invites, status changes, vendor bid
  updates, vendor bid decisions, work-session events, and reminder digests, with
  log-only fallback and owner-facing delivery-health guidance when email is not
  configured.
- Public `/api/health` endpoint and protected `/api/health/deep` database check.
- Global browser security headers configured in `next.config.ts`.

## Documentation

- [Deployment runbook](docs/DEPLOYMENT.md)
- [Build log](docs/BUILD_LOG.md)
- [POC QA checklist](docs/QA_CHECKLIST.md)
- [Homeowner user testing protocol](docs/USER_TESTING.md)
- [Vendor lifecycle roadmap](docs/VENDOR_LIFECYCLE_ROADMAP.md)
- [UI/UX review process](docs/UI_UX_REVIEW.md)
- [UI/UX findings register](docs/UI_UX_FINDINGS.md)

## Current POC Readiness

The codebase is in good shape for the next hosted POC preparation pass:

- Automated verification passes locally.
- Unit coverage includes owner readiness, request guidance, helper workspace,
  POC readiness, utilities, exports, and submission helpers.
- Database schema generation reports no drift.
- Production dependency audit reports no vulnerabilities.
- Browser smoke scripts exist for public, owner, and helper routes.

Before inviting external users, the remaining launch steps are:

- Configure a real preview/production environment.
- Run `npm run poc:ready` in that environment.
- Seed public-safe demo data.
- Run owner and helper browser smoke tests against the hosted URL.
- Refresh screenshots for README, portfolio, and case study.
- Run a homeowner user-testing pass and log findings in `docs/UI_UX_FINDINGS.md`.

## Remaining Product Gaps

- No organization/workspace billing model yet.
- Vendor and collaborator accounts remain invite-driven or seeded for the POC;
  public signup stays homeowner-focused.
- Open vendor opportunity bidding, automated trade matching, richer billing
  records, and payments are planned product layers. The current vendor profile,
  assigned-vendor bid flow, lifecycle tracker, and work-session timeline make
  assigned jobs more traceable, but they do not yet create an open vendor
  marketplace.
- Email can run in log-only mode, but real launch testing should verify Resend
  deliverability, sender domain setup, and reminder cron behavior.
- Privacy/audit history is strong for request decisions and access changes, but
  a deeper account-level privacy audit trail is still future work.
- Payments, subscriptions, onboarding analytics, and production observability are
  not wired yet.
