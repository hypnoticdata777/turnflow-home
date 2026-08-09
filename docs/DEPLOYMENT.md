# TurnFlow Home Deployment Runbook

This runbook is the repeatable path for a public-safe POC deploy.

## Target

- Host on Vercel.
- Use Neon Postgres for application data.
- Use Vercel Blob for photos, quote attachments, and vault documents.
- Use Auth.js credentials auth with public owner signup; vendor and
  collaborator accounts stay seeded or invite-driven for the POC.
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

1. Create a new owner account from `/signup`.
2. Confirm signup redirects to `/owner/onboarding`.
3. Create a property.
4. Create a maintenance request.
5. Upload a before photo.
6. Invite a vendor and confirm the copyable link uses the deployed `APP_URL`.
7. Sign in as vendor and confirm only assigned requests are visible.
8. Add/update request status.
9. Verify the notification log records the send attempt.
10. Download a proof packet PDF.
11. Open the vault and upload a public-safe document.
12. Add one recurring reminder and confirm the setup guide progress updates.
13. Open Account & Sharing and confirm pending invites and sharing boundaries
    are understandable to a first-time owner.
14. Resend and cancel a pending invite from Account & Sharing, then confirm the
    request page reflects the updated pending state.
15. If `RESEND_API_KEY` is blank, confirm resend still shows a copyable invite
    link fallback.
16. Remove accepted vendor/collaborator access from Account & Sharing, then
    sign in as that role and confirm the request is no longer visible.
17. Open the owner's request detail page and confirm the Decision Log shows the
    access-removal event with the removed account email.

## Current Known POC Gaps

- No workspace/org model yet.
- No privacy-controls UI yet.
- Full `npm audit` still reports a dev-only Drizzle tooling finding through
  `@esbuild-kit`; production audit is clean with `npm audit --omit=dev`.
