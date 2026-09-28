# TurnFlow Home Deployment Runbook

> 📍 **Still current.** It is indexed under **Operations**. Read the
> [P0 rollout runbook](08-operations/p0-rollout-runbook.md) first: the
> 2026-09-28 security release adds a migration and new environment variables.
> Map: [docs/README.md](README.md).

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
NEXTAUTH_SECRET=
AUTH_URL=
NEXTAUTH_URL=
AUTH_TRUST_HOST=true
APP_URL=
RESEND_API_KEY=
NOTIFICATIONS_FROM_EMAIL=
CRON_SECRET=
HEALTHCHECK_SECRET=
```

Notes:

- `DATABASE_URL` should be the Neon pooled connection string.
- `AUTH_SECRET` should be a long random value. In Vercel, set
  `NEXTAUTH_SECRET` to the same value for Auth.js/NextAuth compatibility.
- `AUTH_URL` and `NEXTAUTH_URL` should match the deployed production URL, for
  example `https://turnflow-home.vercel.app`.
- `AUTH_TRUST_HOST` should be `true` in Vercel production so the hosted callback
  path can trust the platform host.
- `APP_URL` must match the deployed app URL in production so invite links are
  correct.
- `RESEND_API_KEY` can stay blank for a no-email POC, but sends will log as
  failed and the owner notification page will keep the test-delivery check in a
  failed or not-run state.
- `NOTIFICATIONS_FROM_EMAIL` should be a Resend-verified sender address before
  relying on outbound delivery.
- `HEALTHCHECK_SECRET` protects `/api/health/deep`; set it before wiring an
  external deep-health monitor.
- `CRON_SECRET` should be set in production because `/api/cron/reminder-digest`
  checks the `Authorization: Bearer <secret>` header when the variable exists.

## Fresh Database Setup

For the current POC, apply the committed schema migrations:

```bash
npm install
npm run poc:ready
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

`npm run db:seed` creates or resets these local/demo accounts (set
`SEED_PASSWORD` to use something other than the local default before seeding
any hosted database):

| Role | Email | Password |
|---|---|---|
| Owner | `owner@test.com` | `password123` |
| Vendor | `vendor@test.com` | `password123` |
| Collaborator | `collaborator@test.com` | `password123` |

Use only public-safe demo data for screenshots, portfolio links, and hosted POC
walkthroughs.

For investor walkthroughs, use the curated reset instead:

```bash
npm run db:seed:investor
```

It resets only these `@turnflow.demo` accounts and rebuilds a polished
owner/vendor/collaborator story:

| Role | Email | Password |
|---|---|---|
| Owner | `investor.owner@turnflow.demo` | value of `INVESTOR_DEMO_PASSWORD` |
| Vendor | `investor.vendor@turnflow.demo` | value of `INVESTOR_DEMO_PASSWORD` |
| Collaborator | `investor.helper@turnflow.demo` | value of `INVESTOR_DEMO_PASSWORD` |

> **Security update (2026-09-28, P0):** the demo password is no longer
> hardcoded or published. Set `INVESTOR_DEMO_PASSWORD` (12+ characters) in
> `.env.local` and in Vercel, and share it privately with each viewer. The old
> published password is retired: reseeding with a new value invalidates it.
> To wipe visitor changes every night, set `INVESTOR_DEMO_RESET_ENABLED=true`
> on the demo deployment only; the `/api/cron/reset-investor-demo` cron in
> `vercel.json` then rebuilds the story daily. See
> `docs/04-algorithms/09-investor-demo-reset.md`.

The investor seed includes multiple properties, assigned vendor work, scoped
helper access, pending invites, proof photos, quotes, tasks, work sessions,
closeout, billing, vault documents, reminders, comments, decision history, and
notification-log rows.

The standard demo seed also guarantees a public-safe demo property and one
request that is assigned to the demo vendor and shared with the demo
collaborator. That data keeps `npm run ux:owner` and `npm run ux:helper`
repeatable in preview and POC environments.

## Pre-Deploy Checklist

GitHub Actions runs validation on every push to `main` and every pull request.
Re-run locally before deploying if the environment or database schema changed:

- `npm run verify` passes.
- `npm run poc:ready` has no blocked items for the target environment.
- `docs/QA_CHECKLIST.md` is complete for the target environment.
- `.env.local` is not committed.
- Vercel project has Neon and Blob environment variables set.
- `BLOB_READ_WRITE_TOKEN` is scoped to Production before deploying production;
  a visible row in Vercel is not enough if the saved value is blank, scoped only
  to another environment, or the app was not redeployed after changing it.
- Vercel project has `AUTH_SECRET` and `NEXTAUTH_SECRET` set to the same long
  random value. If login fails with `MissingSecret`, rotate both and redeploy.
- `AUTH_URL` and `NEXTAUTH_URL` point to the actual deployed URL.
- `APP_URL` points to the actual deployed URL.
- `CRON_SECRET` is set for production.
- `HEALTHCHECK_SECRET` is set for production monitoring.
- Browser responses include the baseline security headers configured in
  `lib/security-headers.ts`.
- Demo data contains no private address, contact, receipt, or customer details.

## Smoke Test After Deploy

1. Open `/api/health` and confirm it returns `status: "ok"` with no cached
   response.
2. Call `/api/health/deep` with `Authorization: Bearer $HEALTHCHECK_SECRET` and
   confirm it returns `status: "ok"`, `checks.database: "ok"`,
   `checks.appUrl: "ok"`, and `checks.blobStorage: "ok"`. Missing email
   delivery may report `checks.emailDelivery: "warning"` for a log-only POC.
3. Create a new owner account from `/signup`.
4. Confirm signup redirects to `/owner/onboarding`.
5. Create a property.
6. Create a maintenance request.
7. Upload a before photo.
8. Invite a vendor and confirm the copyable link uses the deployed `APP_URL`.
9. Sign in as vendor and confirm only assigned requests are visible.
10. Add/update request status.
11. Verify the notification log records the send attempt.
12. Open Notifications, click "Send test email", and confirm the latest
    `Delivery test` row matches the configured Resend posture.
13. Download a proof packet PDF.
14. Open the vault and upload a public-safe document.
15. Add one recurring reminder and confirm the setup guide progress updates.
16. Open Account & Sharing and confirm pending invites and sharing boundaries
    are understandable to a first-time owner.
17. Resend and cancel a pending invite from Account & Sharing, then confirm the
    request page reflects the updated pending state.
18. If `RESEND_API_KEY` is blank, confirm resend still shows a copyable invite
    link fallback.
19. Remove accepted vendor/collaborator access from Account & Sharing, then
    sign in as that role and confirm the request is no longer visible.
20. Open the owner's request detail page and confirm the Decision Log shows the
    access-removal event with the removed account email.

Run the automated hosted smoke scripts after Vercel reports the deployment as
Ready:

```bash
UX_BASE_URL=https://turnflow-home.vercel.app npm run ux:public
UX_BASE_URL=https://turnflow-home.vercel.app npm run ux:owner
UX_BASE_URL=https://turnflow-home.vercel.app npm run ux:owner-flow
UX_BASE_URL=https://turnflow-home.vercel.app npm run ux:helper
```

`npm run ux:owner-flow` is the hosted proof-upload canary: it signs up a fresh
public-safe owner, creates a property, creates a request, uploads a proof image,
and fails if `/api/blob-upload` cannot read `BLOB_READ_WRITE_TOKEN` at runtime.

## Current Known POC Gaps

- Workspace/org billing foundation exists, but team-seat policy, organization
  invitation UI, paid checkout, and customer portal billing management are still
  future work.
- Request-level privacy controls are now visible in Account & Sharing; deeper
  account/org-level privacy policy controls are still future work.
- Full `npm audit` still reports a dev-only Drizzle tooling finding through
  `@esbuild-kit`; production audit is clean with `npm audit --omit=dev`.
