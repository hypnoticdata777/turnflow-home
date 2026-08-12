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

This captures `/`, `/login`, and `/signup` at desktop and mobile widths and
fails on missing accessible labels, missing primary actions, visible encoding
artifacts, broken public-media routing, or horizontal overflow.

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

## Vendor Smoke Test

1. Sign in as the demo vendor and open `/vendor`.
2. Confirm the vendor work queue summarizes bid queue, work starts/stops,
   closeout handoffs, and owner waits before the per-job cards.
3. Confirm each assigned request has a next-action panel above lifecycle,
   bidding, tasks, work sessions, closeout, billing, and updates.
4. For a `Needs Quote` job, confirm the next action points to the private owner
   bid form.
5. For a scheduled or in-progress job, confirm the next action points to the
   work-session panel and start/stop proof requirements are visible.
6. Confirm Start work and Stop work are disabled until a proof photo is selected
   and that the per-event copy names before/after proof requirements.
7. For a job with missing location, access, or preferred contact, confirm the
   next action points to the owner update thread instead of work controls.
8. For a pending closeout, confirm the next action tells the vendor to wait for
   owner approval or requested changes.
9. For a changes-requested closeout, confirm the next action points to closeout
   revision.
10. Confirm closeout submit is disabled until after-photo proof, done task
    scope, final amount, and completion notes are ready.
11. For approved closeout with a billing record, confirm the next action points
   to read-only billing visibility and does not imply TurnFlow processes
   payment.

## Owner Smoke Test

1. Open `/api/health` and confirm it returns `status: "ok"`.
2. Call `/api/health/deep` with `Authorization: Bearer $HEALTHCHECK_SECRET` and
   confirm it returns `status: "ok"` and `checks.database: "ok"`.
3. Create a homeowner account from `/signup`.
4. Confirm signup lands on `/owner/onboarding`.
5. Add a property with public-safe address data.
6. Create a maintenance request with category, urgency, notes, access context,
   and preferred contact method.
7. Confirm `/owner/requests/new` shows owner-controlled draft copy and vendor
   handoff readiness without blocking draft save.
8. Upload at least one before photo or public-safe proof file.
9. Add cost context or a quote.
10. Add at least one project task with expected proof and estimated cost.
11. Mark a task done, save a final task cost, and accept it for closeout.
12. As the assigned vendor, submit closeout with completion notes, materials or
   receipt notes, and final amount.
13. As the owner, confirm the closeout appears on request detail and the final
    request cost is updated.
14. Confirm the owner closeout decision panel explains approval impact and that
    Request changes is disabled until a review note is entered.
15. Confirm the request-detail workflow rail points to scope, proof, closeout,
    billing, updates, and decision history without losing the owner in the page.
16. Request closeout changes once with a note, then submit a revised closeout
    and approve it as the owner.
17. Confirm approval marks the request complete and accepts remaining done task
    rows.
18. Confirm an approved closeout creates a billing record.
19. Mark the billing record paid outside TurnFlow and add an invoice/reference
    note.
20. Confirm backup JSON and history CSV include billing record data.
21. On `/owner/backup`, select the downloaded JSON and confirm the restore
    preview shows properties, requests, and billing records before restoring.
22. Restore the JSON into a test owner account and confirm properties,
    requests, and billing records are added as new records without overwriting
    existing data.
23. Select an invalid JSON file and confirm the restore action is disabled with
    clear file feedback.
24. Confirm the setup guide progress changes after property, request, evidence,
    sharing, history, and reminder steps.
25. Download a proof packet PDF and confirm billing records appear as their own
    table.
26. Export owner backup data from `/owner/backup`.

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
9. Confirm Account & Sharing shows owner-only records, active people with
   access, open invite links, and shared request footprint correctly.
10. Confirm expired pending invite links are called out as needing cancel or
    resend.

## Trust And Data Checks

- Owner-only areas stay owner-only: vault, backup, notifications, account
  readiness, and property list.
- `docs/UI_UX_REVIEW.md` is complete for every changed homeowner-facing route.
- `docs/UI_UX_FINDINGS.md` has no open `P0` or changed-workflow `P1` issues.
- Browser responses include baseline security headers: nosniff, frame denial,
  strict referrer policy, permissions policy, and HSTS.
- `npm run ux:public` passes for public entry routes before sharing screenshots.
- The public homepage shows actual product UI, not a broken image, blank hero,
  or PMC-positioned placeholder.
- `npm run ux:owner` passes for signed-in owner routes before a moderated test.
- The owner intake screen separates required save fields from optional handoff
  details so homeowners can save a draft without feeling trapped by polish work.
- Account & Sharing must make current visibility understandable before the owner
  opens the invite tables: owner-only records, active access, pending links, and
  shared request footprint.
- `npm run ux:helper` passes for vendor/collaborator routes before testing
  shared access.
- Deep health is protected and does not expose database errors publicly.
- Vendor and collaborator portals do not expose unrelated requests.
- Vendor work queue metrics must match the per-job next-action states so vendors
  can triage without opening every card.
- Vendor start/stop work-session controls must be gated by selected proof photo
  on the client and rechecked by server actions.
- Vendor closeout submission must show per-item readiness and block submission
  until owner-review handoff requirements are complete.
- Notification attempts are logged even when outbound email is not configured.
- Completion still requires final cost, an after photo, and assigned vendor, or
  an explicit waiver reason in the Decision Log.
- Done project tasks can be accepted by the owner, and changing an accepted
  task away from done clears the acceptance.
- Vendor closeout submission requires after-photo proof, done project tasks,
  completion notes, and a positive final amount before owner review.
- Owner closeout approval marks the request complete, logs the decision,
  notifies the vendor, and accepts done task rows that were still waiting.
- Owner closeout change requests require a note and remain visible to the
  vendor.
- Owner closeout review must show the review packet checklist and explain that
  approval marks the request complete and creates billing history.
- Billing records are owner-managed history only; the app must not imply money
  is processed inside TurnFlow.
- Restore from backup must clearly say it creates new records and can duplicate
  data if the same file is restored twice.
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
