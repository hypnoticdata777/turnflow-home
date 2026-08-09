# TurnFlow Home

A maintenance-request tracker for property owners, vendors, and household
collaborators — built to replace the "text a photo and hope someone
remembers" workflow with a single shared source of truth for every repair,
quote, and receipt.

Owners log an issue in under a minute (with a category-specific safety
checklist), invite a vendor by email, track status from submission through
completion, and keep a running record of cost and decisions per property.
Vendors get a scoped portal showing only the jobs assigned to them.

> **Status:** feature-complete port of the original v1.2 MVP onto the new
> stack, tested against a real Postgres database throughout — every
> package from the Firebase build (guided intake, vendor invites, quotes,
> decision log with completion gating, property vault, PDF/CSV export,
> maintenance calendar, email notifications, collaborator sharing) has a
> working equivalent here.

## Screenshots

| | |
|---|---|
| **Sign in** | **Owner dashboard — status filtering** |
| ![Login](screenshots/01-login.png) | ![Dashboard](screenshots/02-dashboard.png) |
| **Guided intake with safety checklist** | **Request detail — quotes, cost, decision log** |
| ![New request](screenshots/03-new-request-checklist.png) | ![Request detail](screenshots/04-request-detail.png) |
| **Properties** | **Property document vault** |
| ![Properties](screenshots/05-properties.png) | ![Vault](screenshots/06-vault.png) |
| **Maintenance calendar** | **Vendor portal** |
| ![Calendar](screenshots/07-calendar.png) | ![Vendor portal](screenshots/08-vendor-portal.png) |

## Why it was rebuilt

The original MVP (v1.2) was a static, vanilla-JS site backed entirely by
Firebase — Firestore, Firebase Auth, and Firestore security rules as the
*only* authorization layer, with no server of its own. It shipped every
planned feature but was never run against live infrastructure.

This version drops Firebase for a stack with a real backend and moves
every authorization rule that used to live in `firestore.rules` into
server-side code that re-checks session, role, and ownership on every
write:

| Layer | Then | Now |
|---|---|---|
| Framework | Static HTML + vanilla JS | Next.js (App Router, TypeScript) |
| Database | Firestore | Neon (serverless Postgres) + Drizzle ORM |
| File storage | Firebase Storage | Vercel Blob (direct-from-browser upload, server-authorized) |
| Auth | Firebase Auth | Auth.js (NextAuth v5), credentials + JWT sessions |
| Authorization | Firestore security rules | Server Actions, re-validated per request |
| Hosting | Firebase Hosting | Vercel |

## Tech stack

- **Next.js 16** (App Router, TypeScript, Server Actions)
- **Neon** (serverless Postgres) via **Drizzle ORM**
- **Vercel Blob** for photo/document storage
- **Auth.js (NextAuth v5)** — credentials provider, JWT sessions
- **Tailwind CSS v4**
- **Vitest** for unit tests

## Getting started

```bash
npm install
npm run db:migrate            # apply committed Drizzle migrations to your Postgres database
npm run db:seed               # create sample owner/vendor/collaborator accounts and test data
npm run db:seed:demo          # optional — richer demo data (quotes, vault doc, reminder)
npm run dev
```

Before deploying or asking for a POC test pass, run:

```bash
npm run verify
```

That gate runs lint, typecheck, tests, production audit, Drizzle schema drift
checks, and a production build. Pair it with `docs/QA_CHECKLIST.md` for manual
owner/vendor/collaborator smoke testing.

Hosted environments expose `/api/health` for public uptime checks. A protected
`/api/health/deep` endpoint also checks database connectivity when called with
`Authorization: Bearer $HEALTHCHECK_SECRET`.

Global browser security headers are configured in `next.config.ts`, with the
shared header policy defined in `lib/security-headers.ts`.

Environment variables (`.env.local`, see `.env.local.example`):

```
DATABASE_URL=                  # Neon pooled connection string
BLOB_READ_WRITE_TOKEN=         # Vercel Blob read/write token
AUTH_SECRET=                   # random string, e.g. `openssl rand -base64 32`
APP_URL=http://localhost:3000
RESEND_API_KEY=                # optional — leave blank to log-only, no email sent
NOTIFICATIONS_FROM_EMAIL=notifications@example.com
CRON_SECRET=                   # optional — protects /api/cron/reminder-digest in production
```

Run the test suite:

```bash
npm test
```

Deployment and build notes:

- [Deployment runbook](docs/DEPLOYMENT.md)
- [Build log](docs/BUILD_LOG.md)
- [Homeowner user testing protocol](docs/USER_TESTING.md)
- [QA checklist](docs/QA_CHECKLIST.md)
- [UI/UX review process](docs/UI_UX_REVIEW.md)

Regenerate the screenshots above (requires the dev server running and
seeded data):

```bash
npx tsx scripts/screenshot.ts
```

## Core features

- Email/password auth with three roles — owner, vendor, collaborator —
  each routed to its own portal; owners can create accounts from `/signup`
- Property management (add/remove, multiple properties per owner)
- Homeowner setup guide that tracks the first-run path across property,
  request, evidence, helper sharing, repair history, and reminders
- Owner Account & Sharing Center with editable profile context, invite activity,
  launch-readiness signals, and request-scoped sharing boundaries
- Shared owner-readiness rules covered by tests so setup and account surfaces
  stay aligned as the product matures
- Guided request intake: category + urgency-driven safety checklist,
  location, access instructions, preferred contact method, inline
  before/after/receipt/other photo upload, and an inline "add your first
  property" mini-form so a new owner is never blocked
- Owner dashboard with per-status filter chips and live counts
- Vendor and household-collaborator invite-by-email flow with expiring,
  single-use invite links; vendor and collaborator portals each scoped to
  only their own shared requests, with copyable invite links on creation and
  pending invite resend/cancel controls plus accepted-access removal from
  Account & Sharing
- Owner-only quote workspace: competing vendor quotes with optional
  attachment, approve/decline, and one-click copy onto the request's cost
- Append-only decision log recording every status change, and completion
  gating that requires a final cost, an "after" photo, and an assigned
  vendor before a request can move to Complete (or an explicit, logged
  waiver reason); accepted sharing removals are recorded with the removed
  account email when available
- Shared update thread (comments) on every request, postable by the
  owner, assigned vendor, or shared collaborator
- Property document vault for receipts, warranties, manuals, invoices,
  and inspection reports, independent of any single request
- Per-request PDF proof packets and per-property PDF history rollups
  (`jspdf-autotable`), plus JSON backup/restore and CSV history export
- Recurring maintenance calendar per property (HVAC filters, gutter
  cleaning, etc.) with due-soon/overdue tracking and `.ics` calendar
  export
- Email notifications (via Resend) for status changes, vendor/collaborator
  invites, and a daily overdue/due-soon reminder digest (Vercel Cron),
  with every send attempt — success or failure — logged to a
  Notifications page
- Mobile-responsive layout throughout, verified at 375px with no
  horizontal overflow on any page

## Remaining product gaps

A fuller account-management surface, workspace/org model, and detailed
privacy audit trail are still pending. Vendor and collaborator accounts remain
seeded or invite-driven for the POC so public signup stays homeowner-focused.
