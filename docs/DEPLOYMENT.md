# TurnFlow Home Deployment Runbook

This runbook is the repeatable path for a public-safe POC deploy.

## Target

- Host on Vercel.
- Use Neon Postgres for application data.
- Use Vercel Blob for photos, quote attachments, and vault documents.
- Use Auth.js credentials auth with seeded demo accounts until self-serve
  signup is intentionally added.
- Use Resend for email when configured; otherwise notification attempts are
  still logged as failed rows in the app.

## Required Environment Variables

Set these locally in `.env.local` and in the Vercel project environment:

```bash
DATABASE_URL=
BLOB_READ_WRITE_TOKEN=
AUTH_SECRET=
APP_URL=
RESEND_API_KEY=
NOTIFICATIONS_FROM_EMAIL=
CRON_SECRET=
```

Notes:

- `DATABASE_URL` should be the Neon pooled connection string.
- `AUTH_SECRET` should be a long random value.
- `APP_URL` must match the deployed app URL in production so invite links are
  correct.
- `RESEND_API_KEY` can stay blank for a no-email POC, but sends will log as
  failed.
- `CRON_SECRET` should be set in production because `/api/cron/reminder-digest`
  checks the `Authorization: Bearer <secret>` header when the variable exists.

## Fresh Database Setup

For the current POC, apply the committed schema migrations:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run db:seed:demo
```

Use `db:generate` only after changing `lib/db/schema.ts`; review and commit the
generated SQL before applying it:

```bash
npm run db:generate
npm run db:migrate
```

Do not run seed scripts against a production tenant database that contains real
user data.

## Demo Accounts

`npm run db:seed` creates these local/demo accounts:

| Role | Email | Password |
|---|---|---|
| Owner | `owner@test.com` | `password123` |
| Vendor | `vendor@test.com` | `password123` |
| Collaborator | `collaborator@test.com` | `password123` |

Use only public-safe demo data for screenshots, portfolio links, and hosted POC
walkthroughs.

## Pre-Deploy Checklist

GitHub Actions runs this validation on every push to `main` and every pull
request. Re-run locally before deploying if the environment or database schema
changed:

- `npm test` passes.
- `npx tsc --noEmit` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `npm audit --omit=dev` reports 0 vulnerabilities.
- `.env.local` is not committed.
- Vercel project has Neon and Blob environment variables set.
- `APP_URL` points to the actual deployed URL.
- `CRON_SECRET` is set for production.
- Demo data contains no private address, contact, receipt, or customer details.

## Smoke Test After Deploy

1. Sign in as the owner.
2. Create a property.
3. Create a maintenance request.
4. Upload a before photo.
5. Invite a vendor and confirm the link uses the deployed `APP_URL`.
6. Sign in as vendor and confirm only assigned requests are visible.
7. Add/update request status.
8. Verify the notification log records the send attempt.
9. Download a proof packet PDF.
10. Open the vault and upload a public-safe document.

## Current Known POC Gaps

- No self-serve signup yet.
- No workspace/org model yet.
- No privacy-controls UI yet.
- Full `npm audit` still reports a dev-only Drizzle tooling finding through
  `@esbuild-kit`; production audit is clean with `npm audit --omit=dev`.
