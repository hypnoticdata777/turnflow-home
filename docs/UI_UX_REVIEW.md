# TurnFlow Home UI/UX Review Process

Use this review before public screenshots, hosted POC demos, and any feature
that changes a homeowner-facing workflow.

## Review Rhythm

- Run this after `npm run verify` and before a user-testing session.
- Run `npm run ux:public` against a local or preview server for public entry
  routes before refreshing screenshots.
- Run `npm run ux:owner` after seeding demo accounts when owner routes changed.
- Run `npm run ux:helper` after seeding demo accounts when shared-access routes
  changed.
- Review desktop and mobile widths for every changed route.
- Capture screenshots only with public-safe demo data.
- Log every `0` score and repeated `1` score in `docs/UI_UX_FINDINGS.md`.
- Record review outcomes in `docs/BUILD_LOG.md`.

## Scorecard

Score each area from 0 to 2:

- `0`: confusing, broken, or risky.
- `1`: usable, but needs polish before broader launch.
- `2`: clear enough for a POC user without coaching.

| Area | Question | Score |
|---|---|---|
| First impression | Does the screen immediately explain what the owner can do next? | |
| Task clarity | Are primary actions obvious without reading instructions elsewhere? | |
| Trust | Does the screen explain what is shared, saved, or irreversible? | |
| Friction | Can a homeowner complete the task without unnecessary steps? | |
| Language | Does copy sound homeowner-friendly rather than PMC/internal? | |
| Responsive layout | Does it work at mobile, tablet, and desktop widths? | |
| Accessibility | Are labels, focus states, contrast, and keyboard paths usable? | |
| Empty/loading/error states | Are non-happy paths understandable and recoverable? | |
| Data safety | Is public/demo data free of private addresses, contacts, and receipts? | |

Treat any `0` as a release blocker for that workflow.

## Finding Triage

Use `docs/UI_UX_FINDINGS.md` as the durable issue register for review outcomes.
Every scorecard `0` should become a finding before the release can continue.
Repeated `1` scores should become `P1` or `P2` findings based on whether they
hurt homeowner trust or only add polish/friction debt.

## Route Checklist

Review these routes in every POC pass:

- `/signup`: owner-focused positioning, clear password expectations, no vendor
  or PMC confusion.
- `/owner/onboarding`: setup guide feels useful, not like extra admin work.
- `/owner/dashboard`: homeowner-value snapshot, request-card signals, status
  filters, counts, and next action are scannable.
- `/owner/requests/new`: intake length, safety checklist, access notes, and
  contact preference feel worth the effort.
- `/owner/requests/[id]`: record-value snapshot, proof, quote, comments,
  decision log, and sharing controls feel like one repair record.
- `/owner/account`: sharing boundaries, active access, invite history, and
  profile edits are understandable.
- `/owner/vault`: documents feel connected to property history, not hidden
  storage.
- `/owner/calendar`: reminders feel useful for homeowners, not just operators.
- `/vendor` and `/collaborator`: scoped access is obvious and unrelated owner
  data is absent.

## Interaction Checks

- Keyboard can reach primary actions, destructive actions, forms, and logout.
- Buttons keep stable size when pending/success/error text appears.
- Form errors sit next to the field they explain.
- Copyable links can be copied without selecting surrounding UI.
- Tables remain readable or become horizontally scrollable on mobile.
- Destructive actions use clear labels and explain the result.
- Empty states name the next useful action.

## Visual Checks

- Use consistent spacing and quiet hierarchy on SaaS/tool screens.
- Avoid marketing-style hero layouts inside the product app.
- Keep cards for repeated items, forms, and framed tools; avoid cards inside
  cards.
- Confirm no text overlaps at 375px, 768px, and desktop width.
- Confirm badges, buttons, and table cells do not resize the layout during
  pending or error states.
- Confirm screenshots show real product state, not blank or placeholder-heavy
  screens.

## Trust Copy Checks

Every sharing or evidence workflow should answer:

- Who can see this?
- What can they change?
- Can the owner remove access?
- What proof is saved after the job?
- What happens if email is not configured or does not arrive?

## Session Notes Template

```text
Route:
Device/width:
Scenario:
Finding ID:

First-impression score:
Task-clarity score:
Trust score:
Friction score:
Language score:
Responsive-layout score:
Accessibility score:
State-coverage score:
Data-safety score:

Top issue:
Suggested fix:
Release blocker?:
Screenshot path:
```
