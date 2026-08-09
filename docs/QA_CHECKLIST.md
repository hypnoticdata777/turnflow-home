# TurnFlow Home QA Checklist

Use this before deploying a POC build or asking a new tester to try the app.
Keep failures in the build log with the commit, environment, and exact step.

## Automated Gate

Run:

```bash
npm run verify
```

This checks:

- ESLint.
- TypeScript with `tsc --noEmit`.
- Vitest unit/regression suite.
- Production dependency audit.
- Drizzle schema generation.
- Drizzle migration drift with `git diff --exit-code -- drizzle`.
- Production Next.js build.

## Owner Smoke Test

1. Open `/api/health` and confirm it returns `status: "ok"`.
2. Call `/api/health/deep` with `Authorization: Bearer $HEALTHCHECK_SECRET` and
   confirm it returns `status: "ok"` and `checks.database: "ok"`.
3. Create a homeowner account from `/signup`.
4. Confirm signup lands on `/owner/onboarding`.
5. Add a property with public-safe address data.
6. Create a maintenance request with category, urgency, notes, access context,
   and preferred contact method.
7. Upload at least one before photo or public-safe proof file.
8. Add cost context or a quote.
9. Confirm the setup guide progress changes after property, request, evidence,
   sharing, history, and reminder steps.
10. Download a proof packet PDF.
11. Export owner backup data from `/owner/backup`.

## Sharing Smoke Test

1. Invite a vendor from a request and confirm the copyable invite link appears.
2. Resend the pending invite from Account & Sharing and confirm the fallback
   link is copyable.
3. Cancel a second pending invite and confirm it disappears from pending state.
4. Accept an invite as the matching vendor or collaborator account.
5. Confirm that role only sees the assigned/shared request.
6. Remove accepted access from Account & Sharing.
7. Confirm the removed role can no longer see the request.
8. Confirm the request Decision Log names the removed account email.

## Trust And Data Checks

- Owner-only areas stay owner-only: vault, backup, notifications, account
  readiness, and property list.
- Browser responses include baseline security headers: nosniff, frame denial,
  strict referrer policy, permissions policy, and HSTS.
- Deep health is protected and does not expose database errors publicly.
- Vendor and collaborator portals do not expose unrelated requests.
- Notification attempts are logged even when outbound email is not configured.
- Completion still requires final cost, an after photo, and assigned vendor, or
  an explicit waiver reason in the Decision Log.
- Public screenshots and demo records contain no private addresses, contacts,
  receipts, or real customer data.

## Release Blockers

- Any failed automated gate.
- Cross-account data exposure.
- Broken signup/login/logout flow.
- Owner cannot create a property or request.
- Invite acceptance or access removal leaves stale role visibility.
- Proof packet, backup export, or vault upload fails for public-safe demo data.
