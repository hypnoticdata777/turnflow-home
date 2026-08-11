# TurnFlow Home QA Checklist

Use this before deploying a POC build or asking a new tester to try the app.
Keep failures in the build log with the commit, environment, and exact step.

## Automated Gate

Run:

```bash
npm run verify
npm run poc:ready
```

This checks:

- ESLint.
- TypeScript with `tsc --noEmit`.
- Vitest unit/regression suite.
- Production dependency audit.
- Drizzle schema generation.
- Drizzle migration drift with `git diff --exit-code -- drizzle`.
- Production Next.js build.
- POC-critical environment variables for auth, database, Blob uploads, app
  links, deep health, reminder cron, and email delivery.

For public entry UI checks, run the app locally or against a preview URL, then
run:

```bash
npm run ux:public
```

This captures `/login` and `/signup` at desktop and mobile widths and fails on
missing accessible labels, missing primary actions, visible encoding artifacts,
or horizontal overflow.

After `AUTH_SECRET` and `DATABASE_URL` are configured and demo accounts are
seeded, run:

```bash
npm run db:seed
npm run ux:owner
```

This resets the demo account passwords, ensures public-safe demo owner data
exists, signs in as the demo owner, checks core owner routes at desktop and
mobile widths, verifies active navigation, and saves screenshots under
`screenshots/ux-owner/`.

For scoped helper portals, run:

```bash
npm run db:seed
npm run ux:helper
```

This resets the demo helper account passwords, ensures at least one request is
assigned to the demo vendor and shared with the demo collaborator, checks each
scoped workspace at desktop and mobile widths, and saves screenshots under
`screenshots/ux-helper/`.

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
9. Add at least one project task with expected proof and estimated cost.
10. Mark a task done, save a final task cost, and accept it for closeout.
11. As the assigned vendor, submit closeout with completion notes, materials or
   receipt notes, and final amount.
12. As the owner, confirm the closeout appears on request detail and the final
   request cost is updated.
13. Confirm the setup guide progress changes after property, request, evidence,
   sharing, history, and reminder steps.
14. Download a proof packet PDF.
15. Export owner backup data from `/owner/backup`.

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
- `docs/UI_UX_REVIEW.md` is complete for every changed homeowner-facing route.
- `docs/UI_UX_FINDINGS.md` has no open `P0` or changed-workflow `P1` issues.
- Browser responses include baseline security headers: nosniff, frame denial,
  strict referrer policy, permissions policy, and HSTS.
- `npm run ux:public` passes for public entry routes before sharing screenshots.
- `npm run ux:owner` passes for signed-in owner routes before a moderated test.
- `npm run ux:helper` passes for vendor/collaborator routes before testing
  shared access.
- Deep health is protected and does not expose database errors publicly.
- Vendor and collaborator portals do not expose unrelated requests.
- Notification attempts are logged even when outbound email is not configured.
- Completion still requires final cost, an after photo, and assigned vendor, or
  an explicit waiver reason in the Decision Log.
- Done project tasks can be accepted by the owner, and changing an accepted
  task away from done clears the acceptance.
- Vendor closeout submission requires after-photo proof, done project tasks,
  completion notes, and a positive final amount before owner review.
- Public screenshots and demo records contain no private addresses, contacts,
  receipts, or real customer data.

## Release Blockers

- Any failed automated gate.
- Cross-account data exposure.
- Broken signup/login/logout flow.
- Owner cannot create a property or request.
- Invite acceptance or access removal leaves stale role visibility.
- Proof packet, backup export, or vault upload fails for public-safe demo data.
- Any changed homeowner workflow scores `0` in the UI/UX review scorecard.
- Any open `P0` UI/UX finding, or open `P1` finding tied to a changed workflow.
