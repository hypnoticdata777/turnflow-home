# TurnFlow Home UI/UX Findings

Use this register to track product polish, trust, accessibility, and workflow
friction found during `docs/UI_UX_REVIEW.md`, QA passes, demos, and moderated
homeowner testing.

## Triage

- `P0`: Blocks signup, login, request creation, invite safety, access control,
  proof capture, or data safety.
- `P1`: Materially hurts homeowner trust, completion, or willingness to share
  the app with a real vendor/helper.
- `P2`: Adds friction or polish debt, but does not block a POC user from
  completing the workflow.
- `P3`: Nice-to-have improvement or future UX idea.

Statuses:

- `Open`: Confirmed issue without an agreed fix.
- `Planned`: Agreed fix, not started.
- `In Progress`: Fix is actively being worked.
- `Fixed`: Fix is merged and verified.
- `Deferred`: Valid issue, intentionally moved out of the current release.
- `Won't Fix`: Considered and intentionally declined.

## Finding Register

| ID | Date | Route | Device/Width | Priority | Status | Finding | Evidence | Owner Decision | Fix Commit |
|---|---|---|---|---|---|---|---|---|---|
| UX-001 | 2026-09-02 | `/owner/requests/new` -> `/owner/requests/[id]` | Desktop smoke, 1440px | P0 | Open | New owner can create a request, but before-proof upload fails in current hosted/local credential setup. | `npm run ux:owner-flow` fails after request creation; hosted `/api/blob-upload` cannot read `BLOB_READ_WRITE_TOKEN`, local Blob token points to a missing store. | Refresh/reconnect Blob token, set it in Vercel Production and local `.env.local`, redeploy, then rerun owner-flow smoke. | - |

## Writing A Finding

- Keep each row to one user-visible problem.
- Include the route, device/width, screenshot path, recording timestamp, or
  tester quote when available.
- Describe the observed behavior before proposing the fix.
- Mark any scorecard `0` from `docs/UI_UX_REVIEW.md` as a release blocker for
  that workflow until resolved or explicitly deferred.
- Link the fixing commit once the issue is closed.

## Review Closeout

Before a POC demo, screenshot refresh, or user-testing round:

- No `Open` or `In Progress` `P0` findings exist.
- No `Open` `P1` findings exist for changed homeowner-facing workflows.
- Any deferred `P0` or `P1` item has an explicit owner decision.
- Fixed findings include the commit and validation note.
- New repeated tester confusion has been converted into a finding row.
