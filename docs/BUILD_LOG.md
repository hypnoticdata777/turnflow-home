# TurnFlow Home Build Log

Keep this log tight: what changed, why it changed, validation, and what remains.

## 2026-09-03 - Request Detail: Quotes Section

Scope: the owner request-detail page opens as a command center and then drops
into older "admin form" styling for the deep workflow sections. This is the
first of a few small slices to bring those in line. Quotes first - it is a core
demo moment (comparing and approving vendor bids).

### Changed

- Captured a before screenshot of the `#quotes` section:
  - `docs/screenshots/2026-09-03-quotes-section-before-desktop.png`
- `components/QuoteWorkspace.tsx`:
  - the whole section is now a white card
    (`rounded-lg border ... bg-white p-4 shadow-sm`) with an eyebrow +
    heading (`Vendor pricing` / `Quotes and bids`) like the page's other
    sections, instead of a bare `<h2>Quotes</h2>` on the page ground.
  - quote cards moved from `rounded border p-3` to
    `rounded-lg border ... bg-white p-3 shadow-sm` with a hover raise; the
    approved quote now carries an emerald ring so the selected bid reads at a
    glance.
  - Approve / Delete buttons got the modern affordance and a real tap target;
    Decline is now a neutral outline (affirmative / destructive / neutral
    hierarchy). The "Add quote" submit matches the app's primary buttons.
  - the "Add a quote" form is now a `bg-gray-50` sub-card with normalized
    inputs and a styled file picker; the empty state is a dashed hint.
  - The smoke-checked strings (`Bid review`, `Quote comparison`, `Vendor`) are
    untouched.

### Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 27 files, 273 tests.
- `npm run ux:owner` passed across all nine owner routes at desktop and mobile,
  including `assertFirstRequestDetail` (which reads `Bid review` /
  `Quote comparison` / `Vendor` from the request-detail body). Dev log clean.
- Captured after screenshot:
  - `docs/screenshots/2026-09-03-quotes-section-after-desktop.png`

### Follow-Up

- Remaining request-detail panels still on the old styling: Decision Log,
  Task checklist, Closeout, Billing, Work sessions, Comments. Two or three more
  small slices.

## 2026-09-03 - Completion Waiver / Billing Dispute Colors

Scope: the amber cleanup missed two files. `CompletionWaiverReview` (shown when
an owner marks a request complete without required proof) was still fully amber,
and `BillingRecordPanel` used amber for the `disputed` status pill.

### Changed

- Captured a before screenshot of the completion-waiver panel (driven by
  switching a proof-missing request's status to "Complete"):
  - `docs/screenshots/2026-09-03-completion-waiver-before-desktop.png`
- `components/CompletionWaiverReview.tsx`: the whole panel moved amber -> rose
  (container, inner "missing" box, waiver-reason textarea border, error text).
  Rose is the design language's "blocked / risky" tone and reads as "you are
  bypassing a safeguard" better than amber did. The "Complete with waiver"
  button is now rose with the modern hit-area/shadow/lift affordance; the
  "Cancel" / "Keep current status" buttons are neutral/rose-outline secondaries.
- `components/BillingRecordPanel.tsx`: `disputed` status pill
  `bg-amber-100 text-amber-800` -> `bg-rose-100 text-rose-800` (joins
  `recorded` blue / `paid` emerald / `void` gray).

### Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 27 files, 273 tests.
- `grep -rnE "amber-[0-9]|yellow-[0-9]" app components lib` now returns nothing.
- No smoke covers the waiver panel; captured with a scripted owner login that
  switches a proof-missing request to "Complete". The billing `disputed` pill
  needs a disputed record to render on screen; verified by the class map.
- Captured after screenshot:
  - `docs/screenshots/2026-09-03-completion-waiver-after-desktop.png`

### Follow-Up

- Amber/yellow is now gone from the entire codebase (`app`, `components`,
  `lib`). Every action color is on the slate/blue/cyan/emerald/rose system.

## 2026-09-03 - Accept Invite Action Language

Scope: `/accept-invite` is the first screen an invited vendor or helper sees
after clicking an invite link, and it had never been through the
action-language pass. It sat a step behind the auth pages it links from.

### Changed

- Captured a before screenshot (a temporary pending invite for the investor
  collaborator account was inserted, screenshotted, and deleted; the seed's
  four invites were untouched):
  - `docs/screenshots/2026-09-03-accept-invite-before-desktop.png`
- `app/accept-invite/page.tsx` `Shell`:
  - page ground `bg-[#f6f7f4]` -> `bg-slate-100` (matches `AuthChrome`, which
    is the page the invite flow redirects through).
  - the card now opens with a `bg-slate-950` header strip (emerald "TurnFlow
    Home" eyebrow + "Accept invite" heading + description) instead of that
    block living as plain text inside the white card.
- The happy-path body: the request `Title / Category / Location` `<dl>` became
  three fact tiles (Request full-width, Category + Location in a row), and
  "What happens next" became a numbered list with step badges and bordered
  rows instead of a divide-y text list.
- `components/AcceptInviteButton.tsx`: the "Accept invite" button now matches
  the login/signup submit (hit area, shadow, hover lift, active press); the
  error line moved from `red` to `rose`.

### Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 27 files, 273 tests.
- No smoke covers `/accept-invite`; verified with a scripted login as the
  investor collaborator against a temporary invite, at 1400px.
- Captured after screenshot:
  - `docs/screenshots/2026-09-03-accept-invite-after-desktop.png`
- Confirmed the DB is back to the seed's four invites with no temp rows left.

### Follow-Up

- The command-center / action-language pass now covers every owner, vendor,
  helper, and public page plus the invite-acceptance entry point. Nothing
  specific outstanding.

## 2026-09-03 - Quote Decision Colors

Scope: the last off-palette colors in the app - `QuoteWorkspace` used raw
`green`/`red` for the approve/decline treatment instead of the
`emerald`/`rose` the rest of the app settled on.

### Changed

- Captured before screenshot of a request-detail `#quotes` section:
  - `docs/screenshots/2026-09-03-quote-decision-before-desktop.png`
- `components/QuoteWorkspace.tsx`:
  - `QUOTE_STATUS_CLASSES.approved` `green` -> `emerald`, `.declined`
    `red` -> `rose` (`.pending` was already cyan).
  - the approved-quote card border `border-green-400` -> `border-emerald-400`.
  - the "Approve" button `green` -> `emerald`, the "Delete" button `red` ->
    `rose`; both gained `font-medium`. The "Decline" button stays neutral
    gray because declining a quote is a non-destructive choice, not an error.

### Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 27 files, 273 tests.
- Captured after screenshot:
  - `docs/screenshots/2026-09-03-quote-decision-after-desktop.png`
- The investor seed only has a `pending` quote, so the approved/declined pill
  and the approved-card border are not exercised on screen; verified by reading
  the class map. The visible diff is the pinker "Delete" and the
  emerald "Approve".

### Follow-Up

- Action-color pass is complete across owner, vendor, helper, and public
  surfaces. No off-palette colors remain outside intentional semantics
  (blue "vendor bid" tag, gray "Decline").

## 2026-09-03 - Public Home / Signup Alignment

Scope: bring the public `/` and `/signup` pages onto the same tokens and button
affordance as the rest of the app so the landing -> signup -> app transition
feels like one product. `AuthChrome` (shared by login and signup) was already
in the new language; this pass covers the surrounding pages.

### Changed

- Captured before screenshots:
  - `docs/screenshots/2026-09-03-public-before-home-desktop.png`
  - `docs/screenshots/2026-09-03-public-before-home-mobile.png`
  - `docs/screenshots/2026-09-03-public-before-signup-desktop.png`
- `app/page.tsx`:
  - page background `bg-[#f7f7f2]` -> `bg-slate-100` (matches `AuthChrome`), and
    the dark workflow section `bg-gray-950` -> `bg-slate-950`.
  - all four CTAs (nav "Sign in" / "Create account", hero "Start owner
    workspace" / "Sign in") gained a real hit area, shadow, and hover lift.
  - the "For homeowners / vendors / future you" readiness cards gained
    `bg-white shadow-sm` + hover lift so they match the proof-point cards; the
    proof-point cards and workflow step tiles gained the same hover polish.
- `app/signup/page.tsx`: the "Create owner account" submit button now matches
  the login submit (hit area, shadow, hover lift, active press).

### Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 27 files, 273 tests.
- `npm run ux:public` passed for `/`, `/login`, and `/signup` at desktop (1440)
  and mobile (390): headings (`TurnFlow Home`, `Welcome back`,
  `Start your repair record`), field labels, primary actions
  (`Start owner workspace`, `Sign in`, `Create owner account`), no horizontal
  overflow, no encoding artifacts. Dev server log clean.
- Captured after screenshots:
  - `docs/screenshots/2026-09-03-public-after-home-desktop.png`
  - `docs/screenshots/2026-09-03-public-after-home-mobile.png`
  - `docs/screenshots/2026-09-03-public-after-signup-desktop.png`
- Local screenshot inspection: the landing's lower sections and the auth pages
  now share the same slate ground and white card treatment.

### Follow-Up

- Owner lane and public pages are aligned. Remaining known item: the
  `QuoteWorkspace` approved/declined quote pills still use `green`/`red`
  rather than `emerald`/`rose`.

## 2026-09-03 - Owner Vault Action Language

Scope: `/owner/vault` was the last owner route still opening with a bare
headline + paragraph instead of the command-center shell every other owner
page now uses.

### Changed

- Captured before screenshots for `/owner/vault` at desktop and mobile:
  - `docs/screenshots/2026-09-03-owner-lane-before-vault-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-before-vault-mobile.png`
- `app/owner/vault/page.tsx`: replaced the bare `Property vault` heading +
  gray paragraph with the dark command center (keeps the `Property vault`
  heading), added an "Add a document" CTA that jumps to the manager, and moved
  the four `ownerVaultValueMetrics` tiles into a `border-t` strip beneath the
  hero (dropping the separate "What this vault protects" white card). The
  no-property empty state is now an action card with an "Add a property" CTA
  instead of one gray sentence.
- `components/VaultManager.tsx`: normalized the two `rounded-xl ... shadow`
  cards to the shared `rounded-lg border ... shadow-sm` style; the "Add
  document" button gained a real hit area, shadow, and hover lift; delete
  moved from `red` to `rose`; the empty "No documents yet." line is now a
  dashed hint with a next-step sentence.

### Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 27 files, 273 tests.
- `npm run ux:owner` passed across all nine owner routes at desktop (1440) and
  mobile (390), including the `Property vault` heading and active-nav
  assertions. No horizontal overflow, no encoding artifacts, dev server log
  clean.
- Captured after screenshots:
  - `docs/screenshots/2026-09-03-owner-lane-after-vault-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-after-vault-mobile.png`
- Local screenshot inspection confirmed the page now opens on the same dark
  command center as the rest of the owner lane.

### Follow-Up

- Every `/owner/*` route now opens on the command-center shell with a
  consistent action-color system. Next candidates outside the owner lane:
  the public `/` and `/signup` pages, and the `QuoteWorkspace`
  approved/declined pills (`green`/`red` -> `emerald`/`rose`) if a broader
  vendor-lane pass revisits them.

## 2026-09-03 - Vendor / Helper Lane sky -> cyan Alignment

Scope: finish the progress-tone color alignment. The earlier helper/vendor
slices left a sky/cyan mix; this pass moves every remaining `sky` to `cyan` so
"in progress / moving forward" is one color across owner, vendor, and
collaborator lanes.

### Changed

- Captured before screenshots:
  - `docs/screenshots/2026-09-03-owner-lane-before-sky-cyan-vendor-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-before-sky-cyan-collaborator-desktop.png`
- `sky` -> `cyan` in eight components, all on the `progress` / `pending` /
  `resumed` tone:
  - `HelperRequestReadiness.tsx` (card tone + action button)
  - `HelperWorkspaceOverview.tsx` (guidance tone + button)
  - `QuoteWorkspace.tsx` (`pending` quote pill + comparison-metric tone; the
    review-guidance tone in the same file was already cyan)
  - `VendorBidPanel.tsx`, `VendorProfilePanel.tsx`, `WorkSessionPanel.tsx`
    (guidance/readiness tone)
  - `VendorPortal.tsx` (next-action, work-queue, and closeout-metric tone)
  - `WorkSessionTimeline.tsx` (`resumed` event tone)
- No structural change; `sky-*` no longer appears anywhere under `app/` or
  `components/`.

### Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 27 files, 273 tests.
- `npm run ux:helper` passed for `/vendor` and `/collaborator` at desktop and
  mobile with the investor vendor and collaborator accounts.
- Captured after screenshots:
  - `docs/screenshots/2026-09-03-owner-lane-after-sky-cyan-vendor-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-after-sky-cyan-collaborator-desktop.png`
- Local screenshot inspection: the vendor "needs closeout proof" / "closeout
  under owner review" panels shift from the sky tint to cyan, matching the
  owner lane. The collaborator page has no progress-tone card in the current
  seed, so its before/after are identical.

### Follow-Up

- Progress tone is now uniformly `cyan` app-wide. Remaining non-palette colors
  are all semantic: `green`/`red` for approved/declined quote pills
  (`QuoteWorkspace`), and the `Needs Quote` slot in `requestStatusBadgeClasses`
  is already blue. Nothing outstanding on the color pass.

## 2026-09-03 - RequestDetailView sky -> cyan Alignment

Scope: the follow-up from the status-chip slice. `RequestDetailView` was the one
owner-lane surface still using `sky` for its "in progress" tone and section
eyebrows, while every other owner page standardized on `cyan`.

### Changed

- Captured before screenshot of the record-workflow rail:
  - `docs/screenshots/2026-09-03-owner-lane-before-sky-cyan-workflow-desktop.png`
- `components/RequestDetailView.tsx`, all `sky` -> `cyan`:
  - `WORKFLOW_TONE_CLASSES.progress` and `WORKFLOW_CTA_CLASSES.progress`
    (the workflow-rail "in progress" card + its CTA)
  - the four section eyebrows (Record workflow, Cost lane, Record value,
    Proof lane)
  - the three cost-input focus rings
  - the proof-upload tile hover border / focus-within ring / CTA hover
- No structural change; `sky-*` no longer appears in the file.

### Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 27 files, 273 tests.
- `npm run ux:owner` passed across all nine owner routes at desktop and mobile,
  including the first-request-detail text assertions.
- Captured after screenshot:
  - `docs/screenshots/2026-09-03-owner-lane-after-sky-cyan-workflow-desktop.png`
- Local screenshot inspection confirmed the workflow rail's in-progress cards
  now use the same cyan as the dashboard, calendar, and notifications surfaces.

### Follow-Up

- Other components still using `sky` for the progress tone (`QuoteWorkspace`,
  `WorkSessionPanel`, `WorkSessionTimeline`, `VendorBidPanel`,
  `VendorProfilePanel`, `HelperWorkspaceOverview`, `HelperRequestReadiness`)
  were deliberately set to sky/cyan in the earlier helper/vendor slices; leave
  unless a broader vendor/helper-lane pass revisits them.

## 2026-09-03 - Request Detail Status Chip on Dark Surface

Scope: the request-detail command center puts the status badge on a slate-950
hero, where the light pastel pill from `requestStatusBadgeClasses` read as a
sticker rather than part of the surface. Everything else on that hero uses a
translucent-tint + light-text treatment.

### Changed

- Captured before screenshots of the request-detail command center:
  - `docs/screenshots/2026-09-03-owner-lane-before-status-detail-inprogress-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-before-status-detail-needsreview-desktop.png`
- Added `requestStatusBadgeClassesOnDark(status)` to `lib/utils.ts`: same five
  semantic families as `requestStatusBadgeClasses`, but as a dark-surface chip
  (`bg-<family>-400/15 text-<family>-100 ring-1 ring-inset ring-<family>-300/30`,
  neutral `bg-white/10 text-slate-200 ring-white/20` for Draft/Archived/unknown).
  Siblings share a family color here because the chip always shows the exact
  status label.
- `components/RequestDetailView.tsx`: the command-center status badge now uses
  the dark variant, and the Status `<select>` focus ring moved from `sky` to
  `cyan` to match the hero's accent.
- Added `requestStatusBadgeClassesOnDark` tests (family count, sibling grouping,
  neutral fallback) to `__tests__/utils.test.ts`.

### Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 27 files, 273 tests (3 new).
- `npm run ux:owner` passed across all nine owner routes at desktop and mobile,
  including the first-request-detail text assertions.
- `npm run ux:helper` passed for `/vendor` and `/collaborator` at desktop and
  mobile.
- Captured after screenshots:
  - `docs/screenshots/2026-09-03-owner-lane-after-status-detail-inprogress-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-after-status-detail-needsreview-desktop.png`
- Local screenshot inspection confirmed the chip now sits in the hero's visual
  language (cyan for In Progress, blue for Needs Review) instead of a light
  pastel pill.

### Follow-Up

- `RequestDetailView` still uses `sky` for the workflow-rail `progress` tone
  (`WORKFLOW_TONE_CLASSES` / `WORKFLOW_CTA_CLASSES`) and a few section eyebrows,
  while the rest of the owner lane standardized on `cyan`. Align on a later
  component pass.

## 2026-09-03 - Request Status Badge Scale

Scope: the last amber/yellow in the app was the `Needs Quote` badge in
`requestStatusBadgeClasses`. That function was also an eight-hue rainbow
(gray, yellow, orange, blue, indigo, purple, green, gray) whose colors did not
map to meaning. Redesigned the whole scale to the owner-lane action language.

### Changed

- Captured before screenshots showing the status badges across lanes:
  - `docs/screenshots/2026-09-03-owner-lane-before-status-dashboard-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-before-status-vendor-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-before-status-collaborator-desktop.png`
- `requestStatusBadgeClasses` (`lib/utils.ts`) now uses four semantic families,
  shade-separated so the eight statuses stay distinct:
  - slate = not active: `Draft` (`slate-100`), `Archived` (`slate-200`)
  - blue = owner action needed: `Needs Quote` (`blue-100`),
    `Needs Review` (`blue-200`)
  - cyan = work moving: `Scheduled` (`cyan-100`), `In Progress` (`cyan-200`)
  - rose = blocked: `Waiting`
  - emerald = done: `Complete`
- No consumer parses the returned string; the five call sites
  (`owner/dashboard`, `RequestDetailView`, `VendorPortal`, `collaborator`,
  and the featured card) only spread it onto a pill, so no other change was
  needed.

### Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 27 files, 270 tests, including
  `requestStatusBadgeClasses` "distinct class per status" and
  "Draft == undefined == unknown" fallback.
- `npm run ux:owner` passed across all nine owner routes at desktop and mobile.
- `npm run ux:helper` passed for `/vendor` and `/collaborator` at desktop and
  mobile with the investor vendor and collaborator accounts.
- Captured after screenshots:
  - `docs/screenshots/2026-09-03-owner-lane-after-status-dashboard-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-after-status-vendor-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-after-status-collaborator-desktop.png`
- Local screenshot inspection confirmed the dashboard queue now reads as a
  blue -> cyan -> emerald progression instead of a five-hue rainbow, and the
  vendor lane badges blend with its existing blue/cyan/emerald surfaces.

### Follow-Up

- App-wide amber/yellow cleanup is complete. `reminderStatusBadgeClasses` and
  `requestStatusBadgeClasses` now share the rose/cyan/emerald vocabulary.

## 2026-09-03 - Backup / Restore Action Language

Scope: last owner-lane amber holdout. `BackupManager` still opened with an
eyebrow + headline + paragraph and used an amber caution box for the
restore-duplicates warning.

### Changed

- Captured before screenshots for `/owner/backup` at desktop and mobile:
  - `docs/screenshots/2026-09-03-owner-lane-before-backup-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-before-backup-mobile.png`
- `components/BackupManager.tsx`:
  - Replaced the header with the dark command center (keeps the
    `Backup & restore` heading, which is the route's smoke heading), and moved
    the scope tiles into a `border-t` strip directly beneath it.
  - The restore-duplicates caution moved from amber to blue (attention).
  - JSON export, CSV export, and restore buttons now have a real hit area,
    shadow, and hover lift; the restore preview leads with a check mark when the
    file is restorable.
  - Normalized the outer container to `rounded-lg border ... shadow-sm`.

### Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 27 files, 270 tests.
- `npm run ux:owner` passed against `investor.owner@turnflow.demo` across all
  nine owner routes at desktop (1440) and mobile (390), including the
  `Backup & restore` heading and active-nav assertions. No horizontal overflow,
  no encoding artifacts, dev server log clean.
- Captured after screenshots:
  - `docs/screenshots/2026-09-03-owner-lane-after-backup-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-after-backup-mobile.png`
- The restore preview and status banners render only after a real file select /
  restore, which the route smoke does not exercise; verified by reading the
  rendered markup (emerald/rose tones already in place, no amber).

### Follow-Up

- Owner-lane action-language pass is complete: every `/owner/*` page and its
  owned components (setup, dashboard, request detail, account, properties,
  calendar, notifications, new request, backup) now open on a command surface
  with no amber or yellow. The only remaining amber/yellow in the app is the
  `Needs Quote` entry in `requestStatusBadgeClasses` - an intentional
  seven-status color scale shared across owner/vendor/collaborator; leave it or
  redesign the whole scale in a separate pass.

## 2026-09-03 - New Request Intake Action Language

Scope: clear the last amber holdouts on the owner request-intake path -
`NewRequestForm` and `RequestCreatedNoticeBanner` - and bring the
`/owner/requests/new` header into the same command-center pattern as the rest
of the owner lane.

### Changed

- Captured before screenshots for `/owner/requests/new` at desktop and mobile:
  - `docs/screenshots/2026-09-03-owner-lane-before-new-request-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-before-new-request-mobile.png`
- `app/owner/requests/new/page.tsx`: replaced the eyebrow + headline + paragraph
  header with the dark command center (keeps the `New maintenance request`
  heading) plus a "Start the draft" CTA that jumps to the property field.
- `components/NewRequestForm.tsx`:
  - Intake-summary "in progress" tone moved from amber to cyan (panel border,
    background, and next-step button).
  - Normalized the form container to the shared `rounded-lg border ... shadow-sm`
    card style.
  - "Ready" status pills on the intake steps and vendor-handoff checks now use
    an emerald pill with a check mark; incomplete stays neutral.
  - Submit button moved to emerald with a real hit area, shadow, and hover lift;
    "Cancel" is now a bordered secondary button instead of a solid gray block.
- `components/RequestCreatedNoticeBanner.tsx`: the non-success ("some/all photos
  did not upload") tone moved from amber to blue (attention), and the success
  banner now leads with a check mark. Dismiss button tightened to match.

### Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 27 files, 270 tests.
- `npm run ux:owner` passed against `investor.owner@turnflow.demo` across all
  nine owner routes at desktop (1440) and mobile (390), including the
  `/owner/requests/new` route-quality text checks (`Owner-controlled draft`,
  `Vendor handoff readiness`) and the `New maintenance request` heading and
  active-nav assertions. No horizontal overflow, no encoding artifacts, dev
  server log clean.
- Captured after screenshots:
  - `docs/screenshots/2026-09-03-owner-lane-after-new-request-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-after-new-request-mobile.png`
- `RequestCreatedNoticeBanner` renders only after a real create with a photo
  upload failure, which the route smoke does not trigger; verified by reading
  the rendered markup and the `requestCreatedNotice` tone mapping in
  `lib/request-submit.ts` rather than a screenshot.

### Follow-Up

- Owner-lane amber/yellow cleanup is complete across pages and the intake
  components. Remaining non-owner holdouts: `BackupManager` and the
  `Needs Quote` badge in `requestStatusBadgeClasses` (an intentional
  seven-status color scale - handle separately if at all).

## 2026-09-03 - Owner Calendar / Notifications Action Language

Scope: finish the owner-lane amber cleanup. Calendar and notifications were the
last owner pages opening with an eyebrow + headline + paragraph and using amber
for the in-progress metric tone, plus a yellow "due soon" reminder badge.

### Changed

- Captured before screenshots at desktop and mobile:
  - `docs/screenshots/2026-09-03-owner-lane-before-calendar-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-before-calendar-mobile.png`
  - `docs/screenshots/2026-09-03-owner-lane-before-notifications-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-before-notifications-mobile.png`
- Rebuilt `/owner/calendar` around the dark command center (keeps the
  `Maintenance calendar` heading), added an "Add a reminder" CTA that jumps to
  the reminder manager, and moved the four care-metric tiles into a `border-t`
  strip. The "due soon" metric tone moved from amber to cyan. The empty state
  (no property yet) is now the same command surface with an "Add a property"
  CTA instead of a bare sentence.
- Rebuilt `/owner/notifications` around the dark command center. Folded the old
  `Delivery log` eyebrow and the separate "Notification health" white section
  into the hero so `Notifications`, `Notification health`, and
  `Can owners trust outbound alerts?` all still render (smoke-checked), then
  moved the four delivery-metric tiles into a `border-t` strip. Delivery-attempt
  cards now use rose "failed" pills and tighter typography, with a
  "N delivered / N failed" count next to the section heading.
- `reminderStatusBadgeClasses` (`lib/utils.ts`): overdue red -> rose, due-soon
  yellow -> cyan, scheduled green -> emerald, so the calendar badge palette
  matches the owner-lane action colors.
- `components/ReminderManager.tsx`: normalized the two form/list cards to the
  shared `rounded-lg border ... shadow-sm` style, and moved the row buttons to
  emerald (mark done) and rose (delete).

### Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 27 files, 270 tests.
- `npm run ux:owner` passed against `investor.owner@turnflow.demo` across all
  nine owner routes at desktop (1440) and mobile (390), including the
  `/owner/notifications` route-quality text checks (`Notification health`,
  `Can owners trust outbound alerts?`) and the calendar/notifications heading
  and active-nav assertions. No horizontal overflow, no encoding artifacts,
  dev server log clean.
- Captured after screenshots:
  - `docs/screenshots/2026-09-03-owner-lane-after-calendar-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-after-calendar-mobile.png`
  - `docs/screenshots/2026-09-03-owner-lane-after-notifications-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-after-notifications-mobile.png`
- Local screenshot inspection confirmed both pages now open with a command
  center, a CTA, and status tiles, with no amber or yellow on the surface.

### Follow-Up

- No amber remains in any `/owner/*` page. The remaining amber/yellow holdouts
  are outside the owner lane: `NewRequestForm`, `RequestCreatedNoticeBanner`,
  `BackupManager`, and the `Needs Quote` badge in `requestStatusBadgeClasses`
  (an intentional seven-status color scale - treat separately).

## 2026-09-03 - Owner Setup / Account / Properties Action Language

Scope: carry the action-first lane language into the remaining explanation-heavy
owner subpages. Setup, account, and properties still opened with an eyebrow,
a headline, and a paragraph, and still fell back to amber for in-progress and
"needs work" states. This slice makes each page open as a command surface and
teach through layout, tiles, and button affordance.

### Changed

- Captured before screenshots for the owner lane subpages at desktop and mobile:
  - `docs/screenshots/2026-09-03-owner-lane-before-setup-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-before-setup-mobile.png`
  - `docs/screenshots/2026-09-03-owner-lane-before-account-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-before-account-mobile.png`
  - `docs/screenshots/2026-09-03-owner-lane-before-properties-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-before-properties-mobile.png`
- Rebuilt `/owner/onboarding` around a dark command center that keeps the
  `Build your first repair record` heading, then shows the setup summary,
  an emerald readiness bar, primary/secondary CTAs, and a six-segment step
  status strip. Step cards became emerald (done) / cyan (needs work) surfaces
  with a check-mark status pill and a full-width CTA. Removed the amber summary
  block and the amber "needs work" pill.
- Rebuilt `/owner/account` around the same command center (keeps the
  `Trust center` heading plus the smoke-checked `Sharing boundary snapshot`
  and `Who can see owner records?` text). Added a four-tile trust-stat strip,
  paired the profile form with the launch-readiness checklist, converted the
  checklist rows to emerald/cyan tiles with check-mark pills, condensed the
  "what each role sees" section from paragraphs to short scannable lines, and
  moved sharing "attention" (expired invite) states from amber to rose.
- Rebuilt `/owner/properties` with the dark header (keeps the `Properties`
  heading), a portfolio stat strip, per-property fact tiles for requests,
  documents, and reminders, and a stronger care-signal CTA. Moved the
  property care "progress" state from amber to cyan.
- Standardized owner-lane action colors: slate command surfaces for entry,
  emerald for ready, cyan for in-progress, blue for attention, rose for a
  broken/expired state, gray/white for neutral data. No amber remains in
  these three pages.

### Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 27 files, 270 tests.
- `npm run ux:owner` passed against `investor.owner@turnflow.demo` across all
  nine owner routes at desktop (1440) and mobile (390), including the
  `/owner/account` route-quality text checks and the setup/properties/account
  heading and active-nav assertions. No horizontal overflow, no encoding
  artifacts, dev server log clean.
- Captured after screenshots:
  - `docs/screenshots/2026-09-03-owner-lane-after-setup-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-after-setup-mobile.png`
  - `docs/screenshots/2026-09-03-owner-lane-after-account-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-after-account-mobile.png`
  - `docs/screenshots/2026-09-03-owner-lane-after-properties-desktop.png`
  - `docs/screenshots/2026-09-03-owner-lane-after-properties-mobile.png`
- Local screenshot inspection confirmed each page now opens with a command
  center, progress bar, action buttons, and status tiles instead of a
  paragraph, on desktop and mobile.

### Follow-Up

- `components/PropertyForm.tsx` still ships a standalone green "Add property"
  button; fold it into the shared action-color system on the next component
  pass.
- Apply the same treatment to the remaining amber holdouts:
  `/owner/calendar`, `/owner/notifications`, and the `NewRequestForm` /
  `RequestCreatedNoticeBanner` / `BackupManager` components.

## 2026-09-03 - Helper Lane Action Language

Scope: continue investor-demo readiness by making login, vendor, and
collaborator lanes explain themselves through layout, action surfaces, and
contrast instead of relying on long instructional copy.

### Changed

- Captured before screenshots for the shared lane entry pass:
  - `docs/screenshots/2026-09-03-lane-entry-before-login-desktop.png`
  - `docs/screenshots/2026-09-03-lane-entry-before-login-mobile.png`
  - `docs/screenshots/2026-09-03-lane-entry-before-vendor-desktop.png`
  - `docs/screenshots/2026-09-03-lane-entry-before-collaborator-desktop.png`
- Reworked the login shell to show Owner, Vendor, and Helper as a visual lane
  strip above the credential form, then compressed the product promise into
  three action cards: Request, Share, and Proof.
- Strengthened the login submit button with a larger hit area, shadow, hover
  lift, and active press state so the first interaction feels obviously
  clickable.
- Rebuilt the shared helper shell header as a dark workspace command surface
  with section buttons for Overview, Scope, and Work.
- Converted the shared helper overview into a status-and-action panel with
  stronger primary/secondary CTAs and metric tiles that communicate state at a
  glance.
- Converted the first-run helper checklist from a linear text list into three
  action cards with step numbers, status pills, and full-width CTAs.
- Reworked collaborator scope from a paragraph into three tiles covering shared
  requests, owner privacy, and the update lane.
- Reworked collaborator request cards into command cards with a dark request
  header, compact fact tiles, readiness action, and the update thread beneath.
- Reworked vendor shortcuts into a button grid, rebuilt the vendor command
  center on a dark surface, and converted vendor scope into tiles for assigned
  jobs, private owner-only areas, and proof.
- Reworked vendor proof upload into a proof-lane surface where the request
  picker and each photo type behave like action targets.
- Removed the remaining weak amber progress states from shared helper,
  vendor profile, vendor bid, vendor closeout, and work-session panels. Progress
  now uses sky/cyan; ready uses emerald; blocked/attention stays blue or rose.

### Validation

- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd run ux:public` passed for `/`, `/login`, and `/signup` at desktop
  and mobile widths.
- `npm.cmd run ux:helper` passed for `/vendor` and `/collaborator` at desktop
  and mobile widths using the investor demo helper accounts.
- Captured after screenshots for the lane entry pass:
  - `docs/screenshots/2026-09-03-lane-entry-after-login-desktop.png`
  - `docs/screenshots/2026-09-03-lane-entry-after-login-mobile.png`
  - `docs/screenshots/2026-09-03-lane-entry-after-vendor-desktop.png`
  - `docs/screenshots/2026-09-03-lane-entry-after-collaborator-desktop.png`
- Local screenshot inspection confirmed login, vendor, and collaborator now
  communicate lane purpose with stronger layout, button affordance, and
  high-contrast action states.

### Follow-Up

- Continue replacing explanation-heavy owner subpages with action-first
  surfaces, starting with the remaining owner setup/account/properties/new
  request pages that still lean on amber or paragraph-heavy guidance.

## 2026-09-03 - Request Detail Action-First Hierarchy

Scope: clear the next investor-demo blocker by making the first full repair
record page teach through layout, navigation, and clickable controls instead of
long explanatory text.

### Changed

- Captured before screenshots for the owner request detail:
  - `docs/screenshots/2026-09-03-request-detail-before-desktop.png`
  - `docs/screenshots/2026-09-03-request-detail-before-mobile.png`
- Rebuilt the top of `/owner/requests/[id]` into a `Repair command center`
  that shows title, status, property, priority, proof count, access count, and
  the primary repair actions in the first viewport.
- Added a click-through section strip for Cost, Bids, Access, Proof, Decisions,
  Tasks, Closeout, Billing, Timeline, and Updates so a demo user can explore
  the page without needing a written guide.
- Reworked the repair workflow rail into larger action tiles with lane numbers,
  state pills, and stronger CTA buttons. The page now points the owner toward
  the next checkpoint rather than asking them to read the entire record first.
- Converted record value into a compact owner proof-packet action strip with
  metric cards and direct CTAs.
- Reworked the proof upload section into an evidence board where Before, After,
  Receipt, and Other are large clickable upload targets.
- Removed weak amber/yellow attention states from the request-detail surface and
  its shared widgets. In-progress now uses cyan/sky, ready uses emerald, and
  missing/blocked states use rose for clearer contrast on white.

### Validation

- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed.
- Local `npm.cmd run ux:owner` passed against the investor owner account after
  the action-first hierarchy and final color cleanup.
- Captured after screenshots for the final request detail polish:
  - `docs/screenshots/2026-09-03-request-detail-after-desktop.png`
  - `docs/screenshots/2026-09-03-request-detail-after-mobile.png`
- Local screenshot inspection confirmed the page now opens with a command
  center, click-through section navigation, checkpoint action tiles, proof
  upload tiles, and higher-contrast status colors on desktop and mobile.
- `npm.cmd run verify` passed: lint, typecheck, 270 tests, production audit,
  Drizzle generation/schema drift, and production build.

### Follow-Up

- Continue applying the same action-first pattern to the next investor-demo
  blocker: richer lane-specific UX for the owner/vendor/collaborator handoffs
  that still feel obvious without a written tour.

## 2026-09-03 - Owner Dashboard Investor Walkthrough Polish

Scope: clear the next investor-demo blocker by making `/owner/dashboard` read
as a guided owner command center instead of a stack of useful but busy product
widgets.

### Changed

- Captured before screenshots for the owner dashboard:
  - `docs/screenshots/2026-09-03-owner-dashboard-before-desktop.png`
  - `docs/screenshots/2026-09-03-owner-dashboard-before-mobile.png`
- Replaced the old first card with an `Owner command center` hero that keeps
  the existing `My maintenance requests` route heading while adding launch
  readiness, progress, and next-step context in one first-screen story.
- Added a `Next owner move` panel that selects the first request needing owner
  attention and shows both the record-quality signal and shared-thread signal
  before linking into the repair record.
- Added compact command stats for launch readiness, owner attention, proof
  protection, and scoped help.
- Added a four-step lane strip before the owner value cards so the investor
  can see Owner, Vendor, Collaborator, and System lanes as a connected story.
- Reworked dashboard request cards into a clearer action queue with property,
  scope, cost, proof count, update count, access count, record-quality signal,
  shared-thread signal, and the full-record link.
- Reduced the owner dashboard's reliance on weak yellow/beige attention blocks
  by anchoring the first screen in slate, emerald, blue, cyan, and white states.

### Validation

- `npm.cmd run typecheck` passed.
- `npm.cmd test -- __tests__\owner-readiness.test.ts` passed: 36 tests.
- Local `npm.cmd run ux:owner` passed against the investor owner account after
  one retry. The first run completed the meaningful route checks and failed
  while writing `backup-mobile.png` because Windows/OneDrive temporarily held
  the generated screenshot path; the retry passed all desktop and mobile owner
  routes plus first request detail.
- Captured after screenshots for the final owner dashboard polish:
  - `docs/screenshots/2026-09-03-owner-dashboard-after-desktop.png`
  - `docs/screenshots/2026-09-03-owner-dashboard-after-mobile.png`
- Local screenshot inspection confirmed the dashboard now opens with an owner
  command center, next owner move, launch-readiness stats, lane strip, value
  cards, and clearer request action queue on desktop and mobile.
- `npm.cmd run verify` passed: lint, typecheck, 270 tests, production audit,
  Drizzle generation/schema drift, and production build.

### Follow-Up

- Continue polishing request detail hierarchy after the owner dashboard first
  screen is verified and pushed.

## 2026-09-02 - Vendor Request Progressive Disclosure

Scope: continue investor-demo readiness by reducing the cognitive load inside
the vendor lane. The previous command-center pass made the top of `/vendor`
clearer, but each assigned repair card still exposed lifecycle, bid, task,
work-session, closeout, billing, status, and comment controls all at once.

### Changed

- Kept the vendor request card's investor-readable layer visible first:
  title, status, property, category/urgency, location, preferred contact,
  access instructions, readiness guidance, and next vendor action.
- Added compact per-request counters for proof items, open tasks, updates, and
  closeout submissions so the card can explain its state without forcing the
  viewer through every operational control.
- Added a per-request `Open workflow controls` / `Hide workflow controls`
  disclosure. Only the currently selected repair opens the heavier controls:
  vendor lifecycle, private bid, task checklist, work sessions, closeout
  submission, billing record, status handoff, completion waiver, and update
  thread.
- Kept all assigned requests compact by default so the investor demo starts
  with the job story and opens the deeper workflow only when the viewer chooses
  it.
- Changed vendor next-action CTAs from plain anchors to action buttons that
  expand the target request before scrolling to the relevant workflow section.
  Upload-oriented actions still focus the shared upload panel.
- Changed non-upload readiness actions to expand the request before scrolling
  to the update thread, because that thread now lives inside the hidden
  workflow controls.
- Kept the completion-waiver path expanded when a vendor tries to mark a
  request complete without required proof.
- Updated the helper/vendor smoke so it opens one vendor workflow card to prove
  the hidden controls still render, then collapses it again before capturing
  screenshots.

### Validation

- `npm.cmd run typecheck` passed.
- `npm.cmd test -- __tests__\helper-workspace.test.ts
  __tests__\vendor-lifecycle.test.ts __tests__\vendor-profile.test.ts` passed:
  45 tests.
- Local `npm.cmd run ux:helper` passed against the investor vendor and
  collaborator accounts after starting `next dev` with database access.
- Local screenshot inspection confirmed desktop and mobile vendor request cards
  now default to compact story-first cards with `Open workflow controls`
  available per request.
- `npm.cmd run verify` passed: lint, typecheck, 270 tests, production audit,
  Drizzle generation/schema drift, and production build.

### Follow-Up

- Continue maturing owner/vendor/collaborator lane handoffs after this slice is
  verified and pushed.

## 2026-09-02 - Vendor Lane Command Center Polish

Scope: improve the investor-demo vendor lane after the curated seed made the
page data-rich but visually dense.

### Changed

- Combined the separate vendor work queue and closeout snapshot blocks into one
  `Vendor command center` so bid, work, closeout, and owner-wait state are
  visible together before opening an individual repair.
- Added a compact shortcut rail for Queue, Profile, Scope, Jobs, and Upload so
  the vendor page has an obvious first-screen path on desktop and mobile.
- Changed the vendor profile panel so completed profiles show a compact
  business/service-area/trade summary first, with the full editable form tucked
  behind an `Edit profile details` disclosure.
- Kept incomplete vendor profiles expanded so real setup still gives vendors
  the fields they need immediately.

### Validation

- `npm.cmd run typecheck` passed.
- `npm.cmd test -- __tests__\helper-workspace.test.ts
  __tests__\vendor-lifecycle.test.ts __tests__\vendor-profile.test.ts` passed:
  45 tests.
- Local `npm.cmd run ux:helper` passed against the investor vendor and
  collaborator accounts after starting `next dev` with database access.
- Local screenshot inspection confirmed the vendor first screen now starts with
  overview, shortcuts, command-center metrics, and compact profile context
  before the longer request controls.
- `npm.cmd run verify` passed: lint, typecheck, 270 tests, production audit,
  Drizzle generation/schema drift, and production build.

### Follow-Up

- The individual vendor request cards still expose a lot of controls at once.
  A later pass can add per-request progressive disclosure once the investor
  walkthrough script is finalized.

## 2026-09-02 - Curated Investor Demo Seed and Hosted Smoke Stability

Scope: clear the next investor-demo readiness gate by giving production a
repeatable, public-safe dataset across owner, vendor, and collaborator lanes,
then make hosted smoke checks fail on real route/UX problems instead of
long-lived background network activity.

### Changed

- Added `scripts/seed-investor-demo.ts`, a curated reset that rebuilds only the
  `@turnflow.demo` accounts:
  - Owner: `investor.owner@turnflow.demo`
  - Vendor: `investor.vendor@turnflow.demo`
  - Collaborator: `investor.helper@turnflow.demo`
  - Shared password: `TurnFlowDemo!2026`
- Added `npm run db:seed:investor`.
- Seeded a richer investor story: two properties, five requests, scoped vendor
  and collaborator access, pending invites, proof placeholders, quotes, project
  tasks, work sessions, closeout submission, billing record, vault documents,
  reminders, request comments, decision history, and notification-log rows.
- Reworked the investor seed cleanup so it deletes request/property child rows
  before deleting the demo users. The first version seeded successfully once but
  failed on rerun because `comments.author_id` still referenced the old owner.
- Updated hosted Playwright smoke scripts to wait for `domcontentloaded` and
  route headings/nav instead of using `networkidle` as the primary readiness
  signal. Hosted `/owner/dashboard` can keep background requests alive long
  enough to make `networkidle` a false negative even when the route is usable.
- Documented the investor walkthrough accounts in `README.md` and
  `docs/DEPLOYMENT.md`.

### Validation

- `npm.cmd run typecheck` passed after adding the seed script.
- `npm.cmd run db:seed:investor` passed twice against the configured hosted
  Neon database, proving the curated data can be reset repeatedly.
- Hosted owner smoke passed with `UX_BASE_URL=https://turnflow-home.vercel.app`,
  `UX_OWNER_EMAIL=investor.owner@turnflow.demo`, and the investor demo password
  across desktop and mobile owner pages plus first request detail.
- Hosted helper smoke passed with the investor vendor and collaborator accounts
  across desktop and mobile `/vendor` and `/collaborator`.
- Hosted public smoke passed across `/`, `/login`, and `/signup` at desktop and
  mobile widths.
- `npm.cmd run verify` passed: lint, typecheck, 270 tests, production audit,
  Drizzle generation/schema drift, and production build.

### Follow-Up

- The vendor portal is data-rich but visually dense; keep it on the UX polish
  list before the investor handoff.
- The investor demo has log-only email records while `RESEND_API_KEY` remains
  intentionally out of scope.

## 2026-09-02 - Hosted Latest Deployment Verification

Scope: clear the first investor-demo readiness gate by confirming production
is running the latest dashboard/contrast work.

### Validation

- Hosted `npm.cmd run ux:owner-flow` passed against
  `https://turnflow-home.vercel.app`: fresh owner signup, property creation,
  request creation, and proof upload.
- A direct hosted browser check confirmed `/owner/dashboard` renders the new
  Owner/Vendor/Collaborator/System lane panel with `0` horizontal overflow.
- The hosted dashboard screenshot shows the light-theme contrast fix is live:
  dark readable text on white cards, with the former beige-on-white issue gone.

### Follow-Up

- The broad hosted owner smoke reached signed-in routes but timed out while
  waiting for `networkidle` on `/owner/dashboard`; a direct heading-based check
  passed, so update the smoke script to avoid using `networkidle` as the only
  hosted readiness signal.
- Build curated investor demo seed data so the production demo uses polished
  records instead of timestamped smoke-test records.

## 2026-09-02 - Owner Dashboard Lane Maturity and Contrast Fix

Scope: keep moving after hosted auth/proof uploads by making the owner dashboard
show the app's separate work lanes more clearly, while fixing the washed-out
light UI seen on the hosted page.

### Changed

- Removed the global `prefers-color-scheme: dark` override from
  `app/globals.css`. The app is currently designed as a light interface, and
  that media query made users with dark-mode browsers inherit near-white text
  on white cards.
- Added explicit dark foreground classes to the owner and helper app shells so
  nested cards inherit readable text.
- Added `ownerLaneMetrics()` to summarize the current state of the Owner,
  Vendor, Collaborator, and System lanes from the same request/property/invite/
  proof/vault/reminder data already driving the dashboard.
- Added a new owner dashboard lane panel so the homeowner can see how records,
  vendor paths, helper sharing, and record assets connect.
- Moved the in-progress/accent panels from pale amber to cyan so the dashboard
  no longer stacks beige-on-white sections.
- Fixed the mobile vault overflow found during UX smoke by making the owner
  content column, property selector chips, vault file input, and document rows
  shrink inside narrow viewports.
- Added unit coverage for empty and populated lane states.

### Why

Resend-backed outbound email is useful later, but it is not required for the
core POC now that manual invite/share paths and hosted auth work. The bigger
next step is making the product model legible: owners create the source record,
vendors work inside scoped request paths, collaborators get request-specific
access, and system assets such as proof, vault docs, and reminders attach back
to the record.

### Validation

- `npm.cmd test -- __tests__/owner-readiness.test.ts` passed: 36 tests.
- `npm.cmd run typecheck` passed.
- `npm.cmd run ux:owner-flow` passed locally against a fresh owner account:
  signup, property creation, request creation, and proof upload.
- `npm.cmd run ux:owner` passed locally against that owner account across
  desktop and mobile owner pages after the vault overflow fix.
- `npm.cmd run verify` passed: lint, typecheck, 270 tests, production audit,
  Drizzle generation/schema drift, and production build.

### Follow-Up

- Redeploy and visually re-check the hosted dashboard under a dark-mode browser
  preference to confirm the contrast fix.
- Continue maturing each lane's dedicated UX: vendor closeout, collaborator
  comments, owner review, and system notifications/history.

## 2026-09-02 - Blob Upload Proxy, Public Store, Dev-Audit Cleanup

Scope: get proof/vault uploads actually working. Two stacked failures were in
the way - a Vercel platform CORS bug on browser client uploads, and a Blob
store that was created Private when the app needs Public.

### Changed

- Replaced the browser `@vercel/blob/client` `upload()` flow with a
  **server-side upload proxy**:
  - `app/api/blob-upload/route.ts` now receives the file as
    `multipart/form-data`, re-checks the same path authorization
    (`turnflow/{requestId}/{type}/{uid}/...`,
    `turnflow-property/{propertyId}/{uid}/...`), and stores it with a
    server-side `put(pathname, file, { access: "public", token })`.
    Distinct status codes: `503` no server token, `400` bad form body,
    `403` (typed `UploadAccessError`) authz denial, `413` over ~4 MB,
    `415` disallowed type, `502` storage/infra failure (real cause logged,
    not echoed to the browser).
  - New `lib/blob-upload-client.ts` `uploadFileToBlob(pathname, file)` POSTs
    to that route. Large `image/jpeg|png|webp` files are downscaled on the
    client (canvas, longest edge 2000px, JPEG q0.82) before the request so
    they clear Vercel's ~4.5 MB serverless body limit. HEIC/PDF cannot be
    downscaled in-browser and surface a clear "too large" error if oversized.
  - `NewRequestForm`, `RequestDetailView`, `VendorPortal`, `QuoteWorkspace`,
    `VaultManager`, `WorkSessionPanel` swapped from `upload()` to
    `uploadFileToBlob()`.
- `lib/poc-readiness.ts` now validates the *shape* of `BLOB_READ_WRITE_TOKEN`
  (must start `vercel_blob_rw_`, >= 30 chars) - a stale/placeholder value is
  a hard blocker instead of a green check. Added unit coverage.
- `scripts/ux-owner-flow-smoke.ts` `assertRequestDetail` no longer expects the
  zero-photo "Start the evidence trail" empty state; it now fails if the
  detail page still shows "No photos yet." after the queued before-proof
  upload.
- `package-lock.json` left as-is. An `npm audit fix` (npm 11) was tried for
  the dev-only `js-yaml` advisory GHSA-5p4m-2wfm-xmqj, but it also pruned
  nested `@esbuild/*` platform entries that CI's older `npm ci` requires,
  breaking the Validate job. Reverted to the committed lockfile; `js-yaml`
  stays on `4.3.0` (dev-only, not in `npm run audit:prod`).

### Why

The 2026-09-02 owner-flow smoke hung on proof upload. Tracing the hosted flow:
`POST /api/blob-upload` returned `200` with a valid client token, but the
browser's follow-up `PUT` to `https://vercel.com/api/blob/?pathname=...` (and,
with `NEXT_PUBLIC_VERCEL_BLOB_API_URL` overridden, `blob.vercel-storage.com`)
was **CORS-blocked - no `Access-Control-Allow-Origin`**. This is an open Vercel
platform issue (community thread escalated to Vercel; no SDK/env/dashboard fix
- `@vercel/blob` 2.8.0 uses the same endpoint). Routing uploads through our own
function sidesteps it entirely. With the proxy in place, `put()` then failed
`Cannot use public access on a private store` and, after the old store was
deleted, `This store does not exist` - the `turnflow_blob` store was Private
and access mode is immutable, so it was replaced with a new **Public** store
(`turnflow-home-blob`). The app serves proof photos and vault docs as raw
`blob.url` in `<img>`/`<a>`, which requires a public store.

### Validation

- Local and hosted `npm run ux:owner-flow` both **pass** (commit `5ea0bc8`
  deployed to Production): signup -> property -> request -> before-proof
  upload -> detail page shows "Request saved with initial proof", Evidence
  trail "Ready - 1 photo attached", and the photo thumbnail.
  `screenshots/ux-owner-flow/` regenerated from the hosted run.
- Hosted `npm run ux:public`, `npm run ux:owner`, `npm run ux:helper` all pass.
- `npm.cmd run verify` passed: lint, typecheck, 268 tests, production audit
  (0 vulnerabilities), Drizzle generation, schema drift check, production build.
- `npm.cmd run poc:ready` against `.env.local` (new public store token): 0
  blockers, only the `RESEND_API_KEY` warning.
- Full `npm audit`: 4 moderate + 1 high, all dev-only (`drizzle-kit ->
  @esbuild-kit -> esbuild@0.18.20`, and `js-yaml`); `npm run audit:prod`
  stays at 0.
- `NEXT_PUBLIC_VERCEL_BLOB_API_URL` removed from Vercel.

### Follow-Up
- Real iPhone HEIC photos over ~4 MB will not upload through the proxy (no
  in-browser HEIC transcode). Revisit if user testing hits it - options are a
  HEIC decode lib or a resumable/multipart upload service.
- Add `RESEND_API_KEY` + a verified `NOTIFICATIONS_FROM_EMAIL` before testing
  real outbound invite/reminder email.
- Still deferred: no `Content-Security-Policy` until nonce handling is designed
  (`__tests__/security-headers.test.ts`); the dev-only esbuild audit chain
  (forced fix downgrades `drizzle-kit` to 0.18.1).

## 2026-09-02 - First Owner Flow Smoke and Env Blocker Triage

Scope: turn the first homeowner POC path into a repeatable smoke check and
triage the hosted proof-upload blocker.

### Changed

- Added `npm run ux:owner-flow`, which signs up a public-safe owner, creates a
  property, creates a maintenance request, attempts a before-proof upload, saves
  screenshots under `screenshots/ux-owner-flow/`, and fails if the request saves
  but the proof upload does not.
- Added upload diagnostics to the owner-flow smoke script for `/api/blob-upload`
  and Vercel Blob responses, with client upload tokens redacted from output.
- Expanded `npm run poc:ready` to require `NEXTAUTH_SECRET`, `AUTH_URL`, and
  `NEXTAUTH_URL`, including matching `AUTH_SECRET` and `APP_URL` checks.
- Fixed the local `.env.local` development shape without printing secrets:
  `NEXTAUTH_SECRET` was normalized onto its own row, and local `APP_URL`,
  `AUTH_URL`, and `NEXTAUTH_URL` were set to `http://localhost:3000`.
- Updated README, deployment, and QA docs so the first-owner create/upload path
  is part of hosted POC smoke testing.

### Why

Hosted login was already fixed, so the next real blocker was whether a new
homeowner can complete the first useful workflow: create an account, add a
property, save a request, and attach proof. The new smoke test proved request
creation works but proof upload does not currently complete in the hosted POC.

The production failure is `/api/blob-upload` returning a 400 because the server
function cannot read `BLOB_READ_WRITE_TOKEN`. The local split-test proved a
second credential issue: the local token is present, but Vercel Blob reports
that the referenced store does not exist. That points to Blob environment
wiring/token freshness rather than request-form UI logic.

### Validation

- `npm.cmd test -- __tests__/poc-readiness.test.ts` passed: 5 tests.
- `npm.cmd run poc:ready` now reports 0 hard blockers locally, with one email
  delivery warning while `RESEND_API_KEY` is blank.
- Hosted `UX_BASE_URL=https://turnflow-home.vercel.app npm run ux:owner-flow`
  intentionally fails on proof upload with a missing Blob read/write token.
- Local `UX_BASE_URL=http://localhost:3000 npm run ux:owner-flow` reaches Blob
  token generation but intentionally fails because the local Blob token points
  to a store Vercel Blob cannot find.

### Follow-Up

- Reconnect or recreate the Vercel Blob store, copy a fresh read/write token,
  set `BLOB_READ_WRITE_TOKEN` for Production and local `.env.local`, redeploy,
  then rerun `npm run ux:owner-flow` locally and against production.
- Add `RESEND_API_KEY` and a verified `NOTIFICATIONS_FROM_EMAIL` before testing
  real outbound invite/reminder email.

## 2026-09-02 - Hosted POC Auth and Smoke Hardening

Scope: finish the Vercel hosted-login blocker and make hosted smoke checks
match the live owner/helper UI more reliably.

### Changed

- Added deployment documentation for `AUTH_URL`, `NEXTAUTH_URL`,
  `AUTH_TRUST_HOST`, and matching `AUTH_SECRET`/`NEXTAUTH_SECRET` values.
- Updated `.env.local.example`, README, and deployment runbook so future hosted
  setup includes the Auth.js compatibility secret path.
- Hardened owner smoke detail navigation by waiting for the request-detail URL
  before checking request-detail content.
- Hardened helper smoke route text checks to compare rendered page text
  case-insensitively, so visual uppercase labels still validate the intended UI
  content.

### Why

The hosted app deployed successfully, but login failed at
`/api/auth/callback/credentials`. Vercel runtime logs showed
`MissingSecret`, which means the production function could not see a usable
Auth.js secret. Rotating `AUTH_SECRET`, adding the matching `NEXTAUTH_SECRET`,
and redeploying fixed hosted login. The next hosted smoke pass exposed brittle
test assumptions rather than product breakage, so the checks now follow the
rendered UI more closely.

### Validation

- Hosted login succeeded at `https://turnflow-home.vercel.app`.
- `UX_BASE_URL=https://turnflow-home.vercel.app npm run ux:public` passed.
- `UX_BASE_URL=https://turnflow-home.vercel.app npm run ux:owner` passed.
- `UX_BASE_URL=https://turnflow-home.vercel.app npm run ux:helper` passed.
- `npm.cmd run verify` passed: lint, typecheck, 265 tests, production audit,
  Drizzle generation/schema drift check, and production build.

### Follow-Up

- Capture or curate fresh portfolio-ready signed-in screenshots from the hosted
  environment.
- Begin moderated owner/vendor user testing against the hosted POC.

## 2026-08-17 - App-Wide Button Restyle and Copyright Notice

Scope: consistent rounded/hover button styling across every owner-facing page
and component, plus a copyright line in the owner sidebar.

### Changed

- Rounded every button-shaped element (`<button>`, and `<Link>`/`<a>` styled
  as a button) to `rounded-lg`; pre-existing pills stayed `rounded-full`.
- Added or deepened `hover:` fill/border colors on every button so hover
  states read as noticeably darker, without changing any base color hue.
- Split button interaction style in two: links that navigate to a different
  route get a plain darker-hover color transition; buttons/links that act in
  place (approve/decline a bid, add a comment, toggle a section, copy a link,
  the in-page workflow-rail anchors on the request detail page, dashboard and
  vault filter chips) get the same darker hover plus a small
  `hover:scale-105 active:scale-95` bounce so they read as "stay here" rather
  than "you're leaving."
- Added `© 2026 TurnFlow Home. All rights reserved.` to the owner sidebar
  footer.
- Refreshed `package-lock.json` after a routine `npm install` and let Next.js
  add an explicit `node_modules` line to `.gitignore`.

### Why

The existing app had no shared button component — every button was hand
styled per-component, which had drifted into inconsistent corner radii and
several buttons with no hover state at all. This pass standardizes the
interaction language app-wide instead of one-off patching, and separates
"this leaves the page" from "this changes something here" so the UI signals
which is which.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 265 tests.
- `npm.cmd run build` passed.
- Manual pass through login, owner dashboard, request detail, properties,
  vault, account, and the vendor portal in a headless browser: no console or
  page errors.

### Follow-Up

- Copyright notice currently only appears in the owner sidebar; extend to
  the vendor portal, collaborator view, and login/signup pages if wanted
  everywhere.

## 2026-08-14 - Hosted Auth Cookie Redirect Fix

Scope: make the hosted Vercel POC preserve Auth.js sessions after login.

### Changed

- Updated owner signup to let Auth.js handle the post-signup redirect with
  `redirectTo` after account creation.
- Updated login to validate credentials first, then call Auth.js `signIn` with
  the final role-aware `redirectTo` target so the session cookie and redirect
  are written in one server-action response.
- Updated logout to let Auth.js clear the session and redirect to `/login`.
- Set Auth.js `trustHost: true` explicitly for the hosted Vercel callback path.

### Why

The first hosted owner smoke test reached `/owner/dashboard` after sign-in but
did not retain a session cookie for the next protected navigation. Moving the
redirect into Auth.js keeps hosted cookie handling and navigation in the same
response path. The first redeploy then exposed an Auth.js server configuration
error on `/api/auth/callback/credentials`, so host trust is now explicit instead
of relying on platform auto-detection.

### Validation

- `npm.cmd run typecheck` passed.
- `npm.cmd test` passed: 265 tests.
- `npm.cmd run lint` passed with no warnings.
- `npm.cmd run build` passed.

### Follow-Up

- Push to `main`, wait for Vercel to redeploy, then rerun hosted owner and
  helper smoke tests against `https://turnflow-home.vercel.app`.

## 2026-08-12 - Owner Closeout Review Guidance

Scope: make owner review of vendor closeout handoffs clearer before approval or
change request.

### Changed

- Added `closeoutReviewGuidance` in `lib/closeout-submissions.ts` for no
  handoff, pending owner decision, approved, and changes-requested states.
- Added focused unit coverage for closeout review guidance.
- Updated `CloseoutSubmissionPanel` so owner mode evaluates the latest vendor
  submission instead of blank vendor form state.
- Added owner-facing review packet checklist and Owner Closeout Decision panel.
- Disabled Request changes until the owner enters a review note.
- Expanded owner smoke expectations so request detail must render owner closeout
  decision guidance.
- Updated README, QA checklist, UI/UX review docs, endpoint map, and this build
  log.

### Why

Vendor closeout is only useful if the owner can confidently decide what happens
next. The owner now sees what is included in the review packet, what approval
does, and why a change request needs a written note for the vendor and decision
history.

### Validation

- `npm test -- closeout-submissions` passed: 12 tests.
- `npm run typecheck` passed.
- `npm run lint` passed with no warnings.
- `npm run verify` passed: lint, typecheck, 265 tests, production audit, Drizzle
  generation, schema drift check, and production build.

### Follow-Up

- Run `npm run ux:owner` in a configured database environment to capture the
  updated owner closeout review state.
- In homeowner testing, confirm owners understand that approval completes the
  request and creates the billing record.

## 2026-08-12 - Vendor Closeout Readiness Gate

Scope: make vendor closeout submission harder to send before the owner-review
handoff has the required proof, task, cost, and note context.

### Changed

- Added `closeoutReadinessChecks` in `lib/closeout-submissions.ts` for
  after-photo proof, task scope, final amount, and completion notes.
- Updated `closeoutReadiness` so completion notes are part of the same readiness
  model used by the UI and server action.
- Updated `submitCloseoutAction` to use the unified readiness model.
- Added a vendor-facing closeout readiness checklist in
  `CloseoutSubmissionPanel`.
- Disabled vendor closeout submit until all readiness checks pass.
- Expanded helper smoke expectations so `/vendor` must render closeout checklist
  labels.
- Updated README, QA checklist, UI/UX review docs, endpoint map, and this build
  log.

### Why

Closeout is the vendor-to-owner decision handoff. Vendors should know before
submission whether the owner will receive proof, completed scope, final cost,
and completion notes, instead of learning through a failed submit or an owner
change request.

### Validation

- `npm test -- closeout-submissions` passed: 9 tests.
- `npm run typecheck` passed.
- `npm run lint` passed with no warnings.
- `npm run verify` passed: lint, typecheck, 262 tests, production audit, Drizzle
  generation, schema drift check, and production build.

### Follow-Up

- Run `npm run ux:helper` in a configured database environment to capture the
  updated closeout checklist at desktop and mobile widths.
- In vendor testing, confirm the disabled submit state feels helpful and not
  mysterious when one closeout requirement is missing.

## 2026-08-12 - Vendor Work Session Proof Gate

Scope: make vendor start/stop work-session recording harder to misuse by
surfacing proof requirements before the vendor clicks the event button.

### Changed

- Added `workSessionEventReadiness` in `lib/work-sessions.ts` to explain whether
  a work-session event is blocked by missing proof and which proof type is
  required.
- Added unit coverage for blocked start, allowed stop with proof, and optional
  pause/resume proof states.
- Updated `WorkSessionPanel` so Start work and Stop work controls are disabled
  until a proof photo is selected.
- Added per-event readiness copy and a Proof Gate panel explaining that start
  saves before proof and stop saves after proof.
- Expanded helper smoke expectations so `/vendor` must render Proof Gate.
- Updated README, QA checklist, UI/UX review docs, endpoint map, and this build
  log.

### Why

The server already enforced required before/after proof, but vendors should not
learn that rule only after a failed click. This pass makes proof requirements
visible in the workflow itself so work sessions produce better owner records and
less re-guessing later.

### Validation

- `npm test -- work-sessions` passed: 15 tests.
- `npm run typecheck` passed.
- `npm run lint` passed with no warnings.
- `npm run verify` passed: lint, typecheck, 260 tests, production audit, Drizzle
  generation, schema drift check, and production build.

### Follow-Up

- Run `npm run ux:helper` in a configured database environment to capture the
  updated vendor proof gate at desktop and mobile widths.
- In moderated vendor testing, confirm vendors understand they need a fresh
  before photo to start and an after photo to stop each visit.

## 2026-08-12 - Vendor Work Queue Snapshot

Scope: make `/vendor` easier to triage before vendors open each assigned job.

### Changed

- Added `vendorWorkQueueMetrics` in `lib/vendor-lifecycle.ts` to summarize bid
  queue, work start/stop needs, closeout handoffs, and owner review waits from
  the same next-action logic used by per-job cards.
- Added focused unit coverage for empty queues, mixed vendor states, and settled
  assigned jobs.
- Added a Vendor Work Queue section to the top of `VendorPortal`.
- Expanded helper smoke expectations so `/vendor` must render the work queue
  section.
- Updated README, QA checklist, UI/UX review docs, endpoint map, and this build
  log.

### Why

The vendor portal had strong per-job guidance, but vendors still had to scan
every card to know where the day stood. The work queue gives a quick operational
view of which jobs need bids, proof-backed work events, closeout handoffs, or
owner decisions.

### Validation

- `npm test -- vendor-lifecycle` passed: 15 tests.
- `npm run typecheck` passed.
- `npm run lint` passed with no warnings.
- `npm run verify` passed: lint, typecheck, 257 tests, production audit, Drizzle
  generation, schema drift check, and production build.

### Follow-Up

- Run `npm run db:seed` and `npm run ux:helper` in a configured local or preview
  environment with `DATABASE_URL`.
- Validate the full vendor path with a tester: invite/assignment, bid, start
  proof, stop proof, closeout, owner review, and billing record visibility.

## 2026-08-12 - Account Sharing Boundary Snapshot

Scope: make `/owner/account` clearer as the homeowner trust center for who can
see owner records, which invite links are open, and which requests remain
owner-only.

### Changed

- Added `ownerSharingMetrics` in `lib/owner-readiness.ts` for owner-only
  records, active people with access, open invite links, and shared request
  footprint.
- Added unit coverage for brand-new owners, active vendor/collaborator access,
  private requests, and expired pending invite links.
- Added a Sharing Boundary Snapshot section to `/owner/account` before the
  detailed access and invite tables.
- Added owner smoke text expectations for the new account trust section.
- Updated README, QA checklist, UI/UX review docs, endpoint map, and this build
  log.

### Why

Account & Sharing is the route where homeowners decide whether they trust the
product with outside access. The page now answers "who can see what right now?"
before asking the owner to interpret invite rows or accepted access tables.

### Validation

- `npm test -- owner-readiness` passed: 34 tests.
- `npm run typecheck` passed.
- `npm run verify` passed: lint, typecheck, 254 tests, production audit, Drizzle
  generation, schema drift check, and production build.
- `npm run ux:owner` still requires a configured `DATABASE_URL` and seeded demo
  account before signed-in screenshots can run in this local environment.

### Follow-Up

- Run `npm run db:seed` and `npm run ux:owner` in a configured local or preview
  environment.
- Capture updated account desktop/mobile screenshots once seeded smoke passes.
- Test whether homeowners understand the difference between open invite links,
  accepted access, and owner-only records without facilitator explanation.

## 2026-08-12 - Owner Intake Handoff Readiness

Scope: make `/owner/requests/new` feel clearer and less intimidating for
homeowners while still encouraging the details that make vendor handoff smoother.

### Changed

- Added optional vendor handoff readiness helpers in `lib/request-intake.ts`.
- Added unit coverage for empty, partial, and ready handoff states while keeping
  required draft-save progress separate.
- Updated `NewRequestForm` with an owner-controlled draft panel that explains
  the request stays private until sharing or assignment.
- Added a live vendor handoff readiness panel for location, contact path, access
  context, and issue history.
- Made optional fields controlled so the handoff readiness panel responds as the
  homeowner types.
- Updated `/owner/requests/new` route intro copy to frame the flow as private
  owner record first, smoother handoff later.
- Expanded owner UX smoke text checks for the new intake trust panels.
- Updated README, QA checklist, UI/UX review docs, endpoint map, and this build
  log.

### Why

Request intake is a high-friction moment. Homeowners should know which fields
are required to save the record and which details are optional but useful for a
clean quote or site visit. The route now explains the trust boundary and gives
practical handoff guidance without blocking draft creation.

### Validation

- `npm test -- request-intake` passed: 8 tests.
- `npm run typecheck` passed.
- `npm run lint` passed with no warnings.
- `npm run verify` passed: lint, typecheck, 251 tests, production audit, Drizzle
  generation, schema drift check, and production build.
- `npm run ux:owner` could not complete locally because `DATABASE_URL` is not
  set, so `npm run db:seed` cannot create the demo owner account in this
  environment.

### Follow-Up

- Run `npm run db:seed` and `npm run ux:owner` in a configured local or preview
  environment.
- Capture updated owner intake desktop/mobile screenshots after seeded smoke
  passes.
- Use moderated homeowner testing to confirm the optional handoff guidance feels
  helpful rather than like extra homework.

## 2026-08-12 - Public Homepage Positioning

Scope: make `/` a real public POC entry route for homeowner-first positioning
instead of an unauthenticated redirect-only shell.

### Changed

- Replaced the public root route with a homeowner-facing homepage that explains
  TurnFlow Home as a repair record, shows current product UI, and routes
  visitors to signup or login.
- Updated the auth proxy so `/` remains public for visitors while logged-in
  users still redirect to their role workspace.
- Excluded common public image assets from the proxy matcher so screenshot media
  is served as static files instead of routed through auth.
- Expanded `npm run ux:public` to cover `/`, `/login`, and `/signup` at desktop
  and mobile widths.
- Added homepage desktop and mobile smoke screenshots under
  `screenshots/ux-public/`.
- Updated README, QA checklist, UI/UX review docs, endpoint map, and this build
  log.

### Why

The product needed a public first impression that matched the SaaS direction:
homeowners should understand the value before login, see that the tool already
has a real owner workspace, and know that TurnFlow Home is for self-managed
maintenance records rather than a PMC command center.

### Validation

- `npm run typecheck` passed.
- `npm run lint` passed with no warnings.
- `npm run build` passed.
- `npm run ux:public` passed for `/`, `/login`, and `/signup` at desktop and
  mobile widths.
- `npm run verify` passed: lint, typecheck, 248 tests, production audit, Drizzle
  generation, schema drift check, and production build.
- Visual review passed for `screenshots/ux-public/home-desktop.png` and
  `screenshots/ux-public/home-mobile.png`: product media rendered, CTAs were
  visible, and no mobile overlap was observed.

### Follow-Up

- Refresh signed-in owner/helper screenshots after the next routed UX hardening
  pass.
- Run moderated homeowner testing on `/owner/requests/new` and `/owner/account`
  to confirm intake effort and sharing boundaries without facilitator coaching.

## 2026-08-12 - Backup Restore Trust UX

Scope: make `/owner/backup` clearer and more trustworthy for hosted POC data
portability testing.

### Changed

- Added `lib/backup-guidance.ts` with backup-file preview validation and scope
  summary helpers.
- Added unit tests for invalid backups, current backup counts, older backups
  without billing records, and UI scope summaries.
- Updated backup restore so billing records from JSON backups are restored and
  re-linked to the newly restored request records.
- Reworked `BackupManager` with separate export and restore panels, JSON vs CSV
  purpose copy, file preview, invalid-file feedback, add-only restore warning,
  duplicate-risk warning, and richer success/error messages.
- Updated README, QA checklist, UI/UX review docs, endpoint map, and this build
  log.

### Why

Backup and restore is a trust route. Owners need to know what leaves TurnFlow,
what will come back, what will not be overwritten, and whether financial history
is preserved. The route now previews restore files before action and restores
billing records alongside properties and requests.

### Validation

- `npm test -- backup-guidance` passed: 6 tests.
- `npm run typecheck` passed.
- `npm run lint` passed with no warnings.
- `npm run verify` passed.
- `npm test` passed: 248 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Manually restore a public-safe JSON backup into a fresh test database during
  hosted POC rehearsal.
- Refresh public screenshots and homepage positioning after the route hardening
  pass settles.

## 2026-08-12 - Vendor Next Action Panel

Scope: make the vendor portal route tell vendors exactly what to do next on
each assigned job.

### Changed

- Added `vendorNextAction` to `lib/vendor-lifecycle.ts`.
- Covered bid requested, pending owner approval, scheduled start, active stop
  proof, requested closeout changes, and settled paid-record states in tests.
- Added a next-action panel to each vendor request card with role-specific CTA
  anchors.
- Added per-request anchor IDs for vendor bid, task, work-session, closeout,
  billing, and update sections.
- Made shared task, closeout, billing, and work-session panels accept optional
  IDs while keeping owner defaults unchanged.
- Updated README, QA checklist, UI/UX review docs, endpoint map, vendor roadmap,
  and this build log.

### Why

The vendor portal has become a serious workflow surface with bids, tasks, work
sessions, closeout, and billing visibility. Vendors should not have to infer
the right next step from several panels; the page now names the current action
and jumps them to the exact control.

### Validation

- `npm test -- vendor-lifecycle helper-workspace` passed: 36 tests.
- `npm run typecheck` passed.
- `npm run lint` passed with no warnings.
- `npm run verify` passed.
- `npm test` passed: 242 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Run `npm run ux:helper` against seeded demo data and inspect mobile vendor
  screenshots.
- Harden `/owner/backup` export/restore language and success/error states next.

## 2026-08-12 - Owner Request Workflow Rail

Scope: make the owner request detail route easier to navigate as one mature
repair record.

### Changed

- Added `lib/request-workflow.ts` to summarize request-detail checkpoints for
  intake, scope, cost, bids, help, proof, work sessions, closeout, billing, and
  updates/history.
- Added unit coverage for new, pending-closeout, and mature paid-record states.
- Added a record-workflow rail near the top of owner request detail with anchor
  links into the existing sections.
- Added stable anchors for the record summary and work-session timeline.
- Updated README, QA checklist, UI/UX review docs, and endpoint map.

### Why

The request detail page now carries the full owner record: proof, tasks, bids,
vendor access, work sessions, closeout, billing, updates, and decisions. A
visible workflow rail helps owners understand where they are, what is missing,
and which section to use next without treating the page like a long scroll.

### Validation

- `npm test -- request-workflow` passed: 3 tests.
- `npm run lint` passed with no warnings.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm test` passed: 236 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Run mobile owner smoke testing against a seeded request with pending closeout
  and billing states.
- Apply the same next-action clarity to `/vendor` so vendors always see whether
  they should bid, start work, stop with proof, submit closeout, revise changes,
  or wait for owner review.

## 2026-08-11 - Endpoint Experience Map

Scope: document each route's user job, trust boundary, next handoff, and POC
readiness score.

### Changed

- Added `docs/ENDPOINT_EXPERIENCE_MAP.md` with public, owner, vendor,
  collaborator, and operational endpoint contracts.
- Scored each route for hosted POC readiness and called out the next hardening
  queue.
- Linked the endpoint map from the README documentation list.
- Updated the UI/UX review process to start from the endpoint map when choosing
  routes to review.

### Why

The product now has enough surface area that route maturity needs a shared map.
This keeps owner and vendor UX hardening tied to concrete user jobs instead of
loosely polishing screens one at a time.

### Validation

- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed with no warnings.
- `npm test` passed: 233 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Harden `/owner/requests/[id]` around section navigation and route handoffs.
- Harden `/vendor` around the next-action model from bid through billing
  record visibility.

## 2026-08-11 - Proof Packet Billing Table

Scope: make billing records visible in exported proof packets.

### Changed

- Added billing records to the proof packet PDF export.
- Added a dedicated Billing Records table with amount, status, invoice/reference,
  recorded date, paid date, and notes.
- Passed request billing records into the owner request-detail proof-packet
  generator.
- Added a tested billing export-row helper.
- Updated README, QA checklist, UI/UX review docs, and this build log.

### Why

Owners should not have to infer final-charge history from the decision log.
After closeout approval and billing-record updates, the downloadable proof
packet now includes the financial record directly alongside cost, quotes,
photos, and decisions.

### Validation

- `npm test -- billing-records` passed: 7 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed with no warnings.
- `npm test` passed: 233 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Manually inspect a generated PDF with demo billing data before refreshing
  portfolio screenshots.
- Consider adding closeout submission details as their own proof-packet table
  if user testing shows owners want that separate from the decision log.

## 2026-08-11 - Billing Records After Approved Closeout

Scope: preserve final-charge history after owner-approved vendor closeout
without adding payment processing.

### Changed

- Added `billing_record_status` and `billing_records` to the Drizzle schema.
- Created billing records automatically when an owner approves vendor closeout.
- Added owner-editable billing status for recorded, paid outside TurnFlow,
  disputed, and voided records.
- Added invoice/reference and billing notes fields for owner recordkeeping.
- Added an owner billing record panel on request detail and a read-only vendor
  billing record view.
- Added owner-only billing record update action with request ownership checks.
- Added billing record update events to the decision log and proof packet.
- Included billing records in JSON backup and history CSV exports.
- Updated demo seed data, README, QA, user testing, UI/UX review, and vendor
  lifecycle roadmap.

### Why

Once closeout is approved, homeowners still need a durable financial memory:
what the final amount was, whether it was paid outside the app, where the
invoice/reference lives, and whether anything is disputed. This keeps TurnFlow
useful as a maintenance history tool while avoiding payment-processing scope
until the workflow is tested.

### Validation

- `npm test -- billing-records decision-log` passed: 13 tests.
- `npm run typecheck` passed.
- `npm run db:generate` created `drizzle/0010_cloudy_ego.sql`.
- `npm run verify` passed.
- `npm run lint` passed with no warnings.
- `npm test` passed: 232 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no additional schema changes.
- `git diff --exit-code -- drizzle` passed after staging the intended
  migration.
- `npm run build` passed.

### Follow-Up

- Run owner/vendor mobile UX against recorded, paid, disputed, and void billing
  states.
- Completed in `2026-08-11 - Proof Packet Billing Table`.
- Add payment processing only after billing record behavior is tested.

## 2026-08-11 - Owner Closeout Review Decisions

Scope: turn vendor closeout submissions into an owner decision loop.

### Changed

- Added `closeout_submission_status` plus review notes, reviewed-by, and
  reviewed-at fields to closeout submissions.
- Added owner-only closeout review action for approve or request changes.
- Approval now marks the request `Complete`, copies the closeout final amount
  into request final cost, and accepts any done task rows that were still
  waiting for owner acceptance.
- Change requests require an owner note and keep the closeout visible to the
  vendor for correction/resubmission.
- Updated the closeout panel with owner approve/request-changes controls and
  vendor-visible review status.
- Added decision-log, proof-packet, notification-label, README, QA,
  user-testing, UI/UX review, and vendor roadmap updates.

### Why

Submitting closeout is only half the workflow. Owners need a clear final
decision that either completes the record or tells the vendor exactly what is
missing. This keeps homeowner control central while reducing duplicate clicks
by accepting completed task rows when the closeout is approved.

### Validation

- `npm test -- closeout-submissions decision-log notification-guidance` passed:
  20 tests.
- `npm run typecheck` passed.
- `npm run db:generate` created `drizzle/0009_blushing_odin.sql`.
- `npm run verify` passed.
- `npm run lint` passed with no warnings.
- `npm test` passed: 226 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no additional schema changes.
- `git diff --exit-code -- drizzle` passed after staging the intended
  migration.
- `npm run build` passed.

### Follow-Up

- Run owner/vendor mobile UX against both approved and changes-requested
  closeout states.
- Completed in `2026-08-11 - Billing Records After Approved Closeout`.
- Consider requiring explicit task-level owner acceptance before approval only
  if user testing shows auto-accept feels too broad.

## 2026-08-11 - Vendor Closeout Submission Bundle

Scope: let assigned vendors submit a structured closeout handoff for owner
review.

### Changed

- Added `closeout_submissions` to the Drizzle schema with request/vendor links,
  completion notes, materials or receipt notes, final amount, and submitted
  timestamps.
- Added a vendor-only closeout submission Server Action that verifies assigned
  vendor access before writing closeout history.
- Required closeout submissions to include completion notes, a positive final
  amount, after-photo proof, and completed project tasks.
- Updated the request final cost and moved active work to `Needs Review` when
  closeout is submitted.
- Added an owner/vendor closeout panel: vendors can submit the handoff, owners
  can review the latest handoff and readiness state on request detail.
- Added decision-log, proof-packet, notification-label, demo seed, README, QA,
  user-testing, UI/UX review, and vendor roadmap updates.

### Why

The vendor flow had proof-gated start/stop events and task status tracking, but
closeout still lived across photos, comments, and status changes. A structured
closeout submission gives vendors a clear finish line and gives owners a clean
review artifact before they accept tasks or mark the request complete.

### Validation

- `npm test -- closeout-submissions decision-log notification-guidance` passed:
  18 tests.
- `npm run typecheck` passed.
- `npm run db:generate` created `drizzle/0008_melted_zemo.sql`.
- `npm run verify` passed.
- `npm run lint` passed with no warnings.
- `npm test` passed: 224 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no additional schema changes.
- `git diff --exit-code -- drizzle` passed after staging the intended
  migration.
- `npm run build` passed.

### Follow-Up

- Run owner/vendor mobile UX against seeded closeout data.
- Completed in `2026-08-11 - Owner Closeout Review Decisions`.
- Add invoice/payment records after closeout handoff behavior is tested.

## 2026-08-11 - Task Costs And Owner Acceptance

Scope: add task-level closeout review so owners can accept completed work with
cost context.

### Changed

- Added estimated cost, final cost, owner accepted-by, and owner accepted-at
  fields to project tasks.
- Added owner-only task cost saving and owner-only task acceptance actions.
- Preserved task acceptance while a task stays done, and cleared acceptance if
  the task is moved away from done.
- Updated the project task checklist so owners can save estimated/final cost,
  accept done tasks, and see acceptance state; vendors can see the same cost
  and acceptance context without editing owner-only fields.
- Updated task metrics to track done tasks, accepted tasks, blocked tasks, and
  task-level costs.
- Added decision-log and proof-packet copy for task cost updates and owner
  acceptance.
- Updated demo seed data, README, QA checklist, user testing protocol, UI/UX
  review process, and vendor lifecycle roadmap.

### Why

The previous checklist let owners define scope and vendors update task status,
but closeout still lacked an owner review moment per task. Task-level estimated
cost, final cost, and owner acceptance make bigger jobs easier to audit: each
phase can move from planned work to done work to owner-accepted closeout before
the request is treated as billing-ready.

### Validation

- `npm test -- project-tasks decision-log` passed: 12 tests.
- `npm run typecheck` passed.
- `npm run db:generate` created `drizzle/0007_breezy_nightcrawler.sql`.
- `npm run verify` passed.
- `npm run lint` passed with no warnings.
- `npm test` passed: 219 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no additional schema changes.
- `git diff --exit-code -- drizzle` passed after staging the intended
  migration.
- `npm run build` passed.

### Follow-Up

- Run a manual mobile UX pass for the owner task cost form and accept button.
- Add a richer vendor closeout submission bundle before final billing records.
- Add future invoice/payment state after closeout behavior is tested with
  owners and vendors.

## 2026-08-11 - Structured Project Task Checklist

Scope: promote project phases from free-form labels into owner/vendor task rows.

### Changed

- Added `request_task_status` and `request_tasks` to the Drizzle schema.
- Linked work-session events to an optional `request_task_id`.
- Added an owner-visible and vendor-visible project task checklist.
- Let owners create/delete tasks with expected proof types.
- Let owners and assigned vendors update task status across to-do, in-progress,
  blocked, and done.
- Updated work-session recording so vendors can select a project task instead
  of retyping the task/area.
- Updated decision-log and proof-packet copy for project task lifecycle events.
- Added project task metrics, focused tests, demo seed data, smoke checks,
  README, UI/UX review docs, and vendor lifecycle roadmap updates.

### Why

The previous task label solved simple proof traceability, but a real SaaS
workflow needs reusable task rows for multi-step jobs. Owners can now define the
scope once, vendors can update each task, and work sessions can attach time and
proof to the selected phase without guessing.

### Validation

- `npm test -- project-tasks work-sessions decision-log` passed: 23 tests.
- `npm run typecheck` passed.
- `npm run db:generate` created `drizzle/0006_luxuriant_ender_wiggin.sql`.
- `npm run lint` passed with no warnings.
- `npm run verify` passed.
- `npm test` passed: 218 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no additional schema changes.
- `git diff --exit-code -- drizzle` passed after staging the intended
  migration.
- `npm run build` passed.

### Follow-Up

- Add per-task estimate/final cost fields and closeout acceptance.
- Add owner review for completed project tasks before final billing.
- Add mobile UX pass for task creation and vendor task selection.

## 2026-08-11 - Work Session Proof Gates And Task Labels

Scope: tie vendor work-session events to proof photos and lightweight project
task tracking.

### Changed

- Added `proof_photo_id` and `task_label` to `work_sessions`.
- Updated vendor session recording so `Start work` requires a fresh before
  photo and `Stop work` requires a fresh after photo.
- Uploaded the required proof photo inside the work-session flow and linked it
  directly to the saved event.
- Added task/area labels so single repairs can use `Main repair` while larger
  projects can track phases like demo, plumbing, paint, or install work.
- Displayed linked proof photos and task labels on the owner/vendor work
  timeline.
- Added task-label context to decision-log and proof-packet work-session text.
- Updated README, UI/UX review docs, and vendor lifecycle roadmap.

### Why

Starting or stopping work should not be a blind button press. The vendor now has
to capture the visual proof that explains what began and what changed. For
larger jobs, task labels give the product a practical bridge toward project
task tracking without forcing a full project-management layer into simple
one-task repairs.

### Validation

- `npm test -- work-sessions` passed: 10 tests.
- `npm test -- work-sessions decision-log` passed: 18 tests.
- `npm test -- work-sessions decision-log notification-guidance` passed: 24
  tests.
- `npm run typecheck` passed.
- `npm run db:generate` created `drizzle/0004_abnormal_microbe.sql` and
  `drizzle/0005_tired_fabian_cortez.sql`.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 213 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no additional schema changes.
- `git diff --exit-code -- drizzle` passed after staging the intended
  migrations.
- `npm run build` passed.

### Follow-Up

- Add per-task estimate/final cost fields and closeout acceptance.
- Add closeout submission and owner review before billing record finalization.
- Add manual UX pass for proof-gated work sessions on mobile vendor flow.

## 2026-08-11 - Vendor Work Session Events

Scope: make vendor work activity traceable from start through pause, resume, and
stop.

### Changed

- Added `work_session_event` and `work_sessions` to the Drizzle schema.
- Added a vendor-only work-session action that verifies assigned-vendor access.
- Added work-session controls to `/vendor` with notes, recommended next action,
  and timeline history.
- Added an owner-visible work timeline to request detail.
- Logged work-session events in the decision log and proof packet.
- Sent/logged owner notifications for work-session events.
- Updated owner/helper smoke checks, README, UI/UX review docs, notification
  guidance, and vendor lifecycle roadmap.

### Why

Status alone is too blunt for a serious vendor workflow. A homeowner should be
able to see when work actually started, why it paused, when it resumed, and
when the vendor stopped for owner review. This creates the trace needed for
later closeout, billing, and user testing without introducing payments yet.

### Validation

- `npm test -- work-sessions decision-log notification-guidance` passed: 19
  tests.
- `npm run typecheck` passed.
- `npm run db:generate` created `drizzle/0003_cute_shooting_star.sql`.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 208 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no additional schema changes.
- `git diff --exit-code -- drizzle` passed after staging the intended
  migration.
- `npm run build` passed.

### Follow-Up

- Add closeout submission and owner review before billing record finalization.
- Add open opportunity notifications before assignment.
- Add manual UX pass for work-session controls on desktop and mobile demo data.

## 2026-08-11 - Owner Quote Comparison Metrics

Scope: make multi-quote owner decisions easier to compare without turning the
workspace into a vendor marketplace.

### Changed

- Added reusable quote comparison metrics for active option count, lowest active
  price, price spread, and vendor-submitted ratio.
- Added per-quote comparison cues for lowest, middle, highest, selected, tied,
  and historical declined prices.
- Added a `Quote comparison` panel to the owner quote workspace, including an
  empty state until at least two active options exist.
- Updated owner smoke checks, README, UI/UX review docs, and vendor lifecycle
  roadmap.

### Why

Homeowners should not have to scan several prices and mentally calculate the
difference before approving work. The comparison panel keeps the owner in
control while reminding them that price is only one decision factor: scope,
availability, and confidence still matter.

### Validation

- `npm test -- bid-review` passed: 11 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 200 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add open opportunity notifications before assignment.
- Add closeout submission and owner review before billing record finalization.
- Add manual UX pass for quote comparison on desktop and mobile demo data.

## 2026-08-11 - Vendor Bid Decision Notifications

Scope: close the assigned-vendor bid loop after owner approval or decline.

### Changed

- Added reusable vendor bid decision notification copy for approved and declined
  bids.
- Sent/logged vendor notifications when an owner approves or declines a
  vendor-submitted bid.
- Revalidated the vendor portal after owner bid decisions so vendors see the
  latest bid state.
- Added notification labels for vendor bid approved/declined attempts.
- Updated README, UI/UX review docs, and vendor lifecycle roadmap.

### Why

Vendors should not have to infer whether their bid was accepted by repeatedly
checking the portal. A mature owner/vendor workflow needs a clear loop:
vendor submits price, owner decides, vendor gets the outcome, and the request
history plus notification log preserve that handoff for POC testing.

### Validation

- `npm test -- vendor-bid-notification notification-guidance` passed: 8 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 195 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add open opportunity notifications after assigned-bid review is tested.
- Add work-session events for start, pause, resume, stop, and billing prep.

## 2026-08-11 - Owner Bid Review Guidance

Scope: make owner decisions on vendor-submitted bids clearer and more
traceable.

### Changed

- Added reusable bid-review guidance for empty quote workspaces, pending vendor
  bids, pending owner-entered quotes, approved quotes, declined bids, and
  inactive quote sets.
- Added a `Bid review` summary to the owner quote workspace.
- Added per-quote decision guidance that explains what approving or declining a
  vendor bid does before the owner clicks.
- Sent/logged owner notifications when a vendor submits or updates a bid.
- Added notification labels for vendor bid submitted/updated attempts.
- Updated owner smoke checks, README, UI/UX review docs, and vendor lifecycle
  roadmap.

### Why

Vendor-submitted bids only feel mature if the owner can understand the decision
without guessing. Owners now see which bids need action, what approving will
copy into quoted cost, and what declining preserves in history. Bid emails also
show up in notification health so failed delivery is visible during POC testing.

### Validation

- `npm test -- bid-review notification-guidance` passed: 12 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 193 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add owner-facing quote comparison metrics once multiple vendor bids exist.
- Add open opportunity notifications after assigned-bid review is tested.

## 2026-08-11 - Assigned Vendor Bid Submission

Scope: let assigned vendors submit private bids for owner review without
exposing competing quote data.

### Changed

- Extended `quotes` with `submitted_by_vendor_id` and `availability_window`.
- Added a vendor-only bid submission action that verifies the signed-in vendor
  is assigned to the request.
- Added an editable `/vendor` private owner bid panel for bid amount,
  availability window, and scope notes.
- Reset vendor-edited bids to `pending` so owners must re-approve changed
  pricing.
- Cleared the copied request `quotedCost` when an approved vendor bid is
  revised.
- Loaded only the signed-in vendor's own bids into the vendor portal.
- Labeled vendor-submitted bids in the owner quote workspace and proof packet.
- Added decision-log text for vendor bid submissions and updates.
- Added focused tests for vendor bid guidance and decision-log bid entries.
- Updated helper smoke checks, README, UI/UX review docs, and vendor lifecycle
  roadmap.

### Why

Vendor profiles and fit cues made the assignment smarter, but vendors still
needed a structured way to provide price, availability, and scope details. This
adds the first real bid loop while preserving the privacy boundary: owners can
compare quotes, vendors only see their own bid state.

### Validation

- `npm test -- vendor-bid decision-log` passed: 9 tests.
- `npm run typecheck` passed.
- `npm run db:generate` created `drizzle/0002_icy_xavin.sql`.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 187 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no additional schema changes.
- `git diff --exit-code -- drizzle` passed after staging the intended
  migration.
- `npm run build` passed.

### Follow-Up

- Add owner notification/log guidance when a vendor submits or updates a bid.
- Add owner-side bid approval handoff copy that distinguishes owner-entered
  quotes from vendor-submitted bids.
- Build open opportunity notifications after assigned-bid behavior is tested.

## 2026-08-11 - Owner Vendor Fit Cues

Scope: help owners judge whether an assigned vendor fits the repair before
approval or work start.

### Changed

- Added reusable vendor-fit guidance for request category, assigned vendor
  state, pending vendor invites, profile completeness, and trade compatibility.
- Added an owner-facing assigned-vendor fit panel to request detail sharing.
- Loaded the assigned vendor's name, email, and matching profile after owner
  authorization on `/owner/requests/[id]`.
- Added tests for exact trade matching, compatible trade matching, no vendor,
  pending invites, missing profile, ready profile, partial profile, and mismatch
  states.
- Updated owner smoke checks, README, UI/UX review docs, and the vendor
  lifecycle roadmap.

### Why

Vendor profiles are more valuable when owners can actually use them during the
repair decision. This slice starts turning vendor metadata into owner trust:
does this vendor handle the trade, do they cover the area, are they available,
and is there enough context to proceed confidently?

### Validation

- `npm test -- vendor-fit` passed: 8 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 182 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Surface vendor fit in owner invite/assignment flows before an invite is sent.
- Add vendor-submitted bids once assigned-vendor fit and profile identity are
  stable.
- Add owner-side comparison once multiple vendor bids exist.

## 2026-08-11 - Vendor Matching Profiles

Scope: give vendor accounts durable profile data for future trade matching,
notifications, bidding, and owner approvals.

### Changed

- Added a `vendor_profiles` table with one profile per vendor account.
- Added vendor profile fields for business name, trade categories, service
  area, availability, notification preference, and license/insurance notes.
- Added a vendor-only profile upsert action with profile normalization and
  trade validation.
- Added a `/vendor` matching profile panel with readiness guidance and editable
  fields.
- Seeded the demo vendor profile for local QA and screenshot readiness.
- Added tests for trade normalization, profile normalization, readiness states,
  and unsupported preferences.
- Updated helper smoke checks, README, UI/UX review docs, and vendor lifecycle
  roadmap.

### Why

The vendor lifecycle tracker made assigned jobs traceable, but the product
still needed a durable way to understand which vendors fit which kinds of work.
Profiles are the first database-backed foundation for trade-specific
notifications and future vendor-submitted bids without exposing private quote
comparison data.

### Validation

- `npm test -- vendor-profile` passed: 6 tests.
- `npm run typecheck` passed.
- `npm run db:generate` created `drizzle/0001_blue_purple_man.sql`.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 174 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no additional schema changes.
- `git diff --exit-code -- drizzle` passed after staging the intended
  migration.
- `npm run build` passed.

### Follow-Up

- Add owner-visible vendor fit cues when inviting or assigning vendors.
- Add vendor-submitted bid records tied to profile identity and request scope.
- Add opt-in opportunity notifications by trade and service area.

## 2026-08-11 - Vendor Lifecycle Tracker

Scope: make assigned vendor work traceable from opportunity through billing
context.

### Changed

- Added reusable vendor lifecycle guidance for opportunity received, bid/price
  context, owner approval, scheduled/ready, work in progress, closeout proof,
  and billing record stages.
- Updated `/vendor` request cards with a per-request lifecycle tracker and
  next-action summary.
- Passed quoted-cost context into the vendor portal without exposing the
  owner-only quote workspace or competing vendor pricing.
- Added unit tests for needs-quote, blocked scheduled work, active closeout
  gaps, complete lifecycle records, and summary prioritization.
- Added `docs/VENDOR_LIFECYCLE_ROADMAP.md` for the larger trade matching,
  vendor bidding, work-session, closeout, and billing build path.
- Updated README, helper smoke checks, and UI/UX review docs for the vendor
  lifecycle surface.

### Why

The vendor portal was useful for scoped assignments, status updates, comments,
and proof uploads, but it did not yet feel like a mature job pipeline. Vendors
need a clear trace from notification/assignment to bid context, approval,
scheduled work, active work, closeout proof, and billing history. This slice
adds that structure now while keeping the future open bidding system behind a
proper data model.

### Validation

- `npm test -- vendor-lifecycle` passed: 6 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 168 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add vendor profiles for trades, service areas, availability, and notification
  preferences.
- Add vendor-submitted bids tied to owner approval without exposing competitor
  pricing.
- Add work-session events for start, pause, resume, stop, notes, and billing
  handoff.

## 2026-08-11 - Notification Delivery Health

Scope: make the owner notification log explain delivery reliability and next
steps.

### Changed

- Added reusable notification guidance for type labels, delivery-health metrics,
  and per-entry failure/action guidance.
- Updated `/owner/notifications` with a notification-health snapshot and clearer
  failed-attempt explanations.
- Added tests for empty logs, mixed sent/failed attempts, Resend configuration
  failures, missing-recipient failures, and known notification type labels.
- Updated owner UX smoke checks to require the notification-health surface.
- Updated README and UI/UX review docs for owner-facing delivery health.

### Why

For a hosted POC, outbound email may be disabled, misconfigured, or delayed.
Owners need to understand whether alerts are trustworthy and what fallback to
use, especially copyable invite links, without reading raw provider errors.

### Validation

- `npm test -- notification-guidance` passed: 6 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 162 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Run owner browser smoke against a seeded environment with both sent and failed
  notification attempts.

## 2026-08-11 - Owner Dashboard Update Signals

Scope: make shared-request communication health visible from the owner
dashboard.

### Changed

- Added reusable `ownerRequestUpdateSignal` rules for owner-only records, shared
  but quiet requests, review-stage threads, completed update history, and active
  shared updates.
- Loaded request comments into `/owner/dashboard` and added a second per-card
  signal focused on update-thread health.
- Extended owner-readiness tests for owner-only, quiet shared, review, and
  completed update states.
- Updated README and UI/UX review docs for dashboard communication-health
  signals.

### Why

After adding guided update drafts, owners still needed a way to see which shared
requests are quiet without opening every record. The dashboard now surfaces
handoff risk directly on each request card.

### Validation

- `npm test -- owner-readiness` passed: 31 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 156 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add owner browser smoke assertions for quiet shared request signals once a
  deterministic seeded owner dashboard state is available.

## 2026-08-11 - Status Handoff Guidance

Scope: make owner/vendor status changes explain their meaning and consequences.

### Changed

- Added reusable `statusHandoffGuidance` rules for owner and vendor status
  decisions across Draft, Needs Quote, Waiting, Scheduled, In Progress, Needs
  Review, Complete, and Archived.
- Added a shared `StatusHandoffGuidance` component under owner and vendor status
  controls.
- Status guidance now reminds users that status changes are decision-log events,
  vendor changes notify the owner, and clean completion needs final cost,
  after-photo proof, and assigned vendor context.
- Added focused tests for owner draft guidance, vendor scheduled guidance, clean
  Needs Review state, and Complete-with-proof-gaps state.
- Updated helper UX smoke expectations, README, and UI/UX review docs.

### Why

Status changes are high-trust moments. The app should not present them as a
plain dropdown when they affect the owner record, notifications, decision log,
and closeout proof quality.

### Validation

- `npm test -- status-handoff` passed: 4 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 152 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add owner request-detail browser smoke coverage for status handoff guidance
  once seeded owner auth can open a deterministic request detail route.

## 2026-08-11 - Guided Owner/Vendor Updates

Scope: make shared request comments feel like a guided handoff instead of a
blank text box.

### Changed

- Added reusable `commentThreadGuidance` rules for owner, vendor, and
  collaborator update threads.
- Updated `CommentThread` with role-aware handoff guidance, empty-state copy,
  placeholders, and one-click draft starters.
- Wired guided updates into owner request detail, vendor request cards, and
  collaborator shared request cards.
- Fixed comment revalidation so vendor workspaces refresh after posting updates.
- Added focused tests for missing-context, closeout, owner-note, owner-response,
  and collaborator update guidance.
- Updated README and UI/UX review docs for guided request updates.

### Why

The owner/vendor handoff lives in the update thread. A blank comment box adds
friction and leaves vendors guessing how to ask for missing context. Guided
drafts help each role post the next useful update while keeping the answer
attached to the repair record.

### Validation

- `npm test -- comment-guidance` passed: 5 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 148 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add browser smoke assertions for guided update drafts once seeded owner/helper
  auth is available locally or in preview.

## 2026-08-11 - Vendor Closeout Snapshot

Scope: make vendor work feel more frictionless by summarizing what remains
before owner review.

### Changed

- Added reusable `vendorCloseoutMetrics` rules for ready-to-close jobs,
  missing owner context, missing after photos, and missing final cost context.
- Added a closeout snapshot to `/vendor` above the first-run checklist and
  request list.
- Extended helper workspace tests for empty, mixed-gap, and ready vendor
  closeout states.
- Updated helper UX smoke expectations so `/vendor` must render the closeout
  snapshot.
- Updated README and UI/UX review docs for the vendor closeout surface.

### Why

Vendors should not have to inspect every request card to understand what they
owe the owner next. A closeout snapshot makes proof, cost, and context gaps
visible immediately, which supports a calmer owner experience too.

### Validation

- `npm test -- helper-workspace` passed: 24 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 143 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Run `npm run ux:helper` against seeded local or hosted auth to verify the
  closeout snapshot visually at desktop and mobile widths.

## 2026-08-10 - README Product Positioning Refresh

Scope: bring the public repo README up to date with the homeowner-first SaaS
POC direction.

### Changed

- Rewrote the README introduction around homeowner maintenance records instead
  of generic property-owner tracking.
- Added product direction notes that distinguish TurnFlow Home from a full PMC
  operations platform.
- Updated status, stack, setup, smoke testing, core features, POC readiness,
  and remaining product gaps.
- Noted that screenshots should be refreshed before public case-study or hosted
  POC use.

### Why

The app has matured beyond a direct MVP port. The README now matches the current
product story: homeowner value, scoped help, property care signals, proof,
history, prevention, and hosted POC readiness.

### Validation

- `git diff --check` passed.
- Full app verification was not rerun because this was documentation-only.

### Follow-Up

- Refresh README screenshots after seeded hosted smoke testing.

## 2026-08-10 - Property Care Signals

Scope: make each property show its homeowner care state and next best action.

### Changed

- Added reusable `ownerPropertyCareSignal` rules for first repair record,
  active work, document gaps, reminder gaps, and ready property-care records.
- Updated `/owner/properties` with homeowner-facing positioning, per-property
  request/document/reminder counts, and next-action panels.
- Improved the zero-property empty state so first-run owners understand why the
  property comes before requests, photos, receipts, and reminders.
- Extended owner-readiness tests for property care states.
- Updated the UI/UX review checklist to include property care signals.

### Why

The property page is the anchor for the product. A homeowner should be able to
look at a property and know whether it has active work, useful history,
recurring care, or a clear gap to fix next.

### Validation

- `npm test -- owner-readiness` passed: 27 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 140 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add owner browser smoke assertions for property care signals once seeded
  owner auth is available locally or in preview.

## 2026-08-10 - Owner Care Value Snapshots

Scope: make the vault and maintenance calendar explain their homeowner value
before the owner interacts with forms or lists.

### Changed

- Added reusable vault-value metrics for saved records, property document
  coverage, repair-linked documents, and saved categories.
- Added reusable calendar-value metrics for overdue care, upcoming routines,
  property coverage, and recurring maintenance cadence.
- Updated `/owner/vault` with a property-history snapshot above the document
  manager.
- Updated `/owner/calendar` with a preventive-care snapshot and tightened the
  reminder manager heading/copy.
- Extended owner-readiness tests for vault and calendar value states.
- Updated the UI/UX review route checklist for the new care snapshots.

### Why

Homeowners should feel the payoff after a repair is complete, not just while a
request is active. The vault and calendar now frame documents and reminders as
maintenance history, prevention, and decision support instead of plain storage.

### Validation

- `npm test -- owner-readiness` passed: 23 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 136 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add owner browser smoke assertions for vault/calendar snapshots once seeded
  owner auth is available locally or in preview.

## 2026-08-10 - Owner Request Card Signals

Scope: make each owner dashboard request card explain the next useful action.

### Changed

- Added reusable `ownerRequestCardSignal` rules for decision-needed, quote-needed,
  proof-gap, proof-backed, first-proof, cost-context, owner-only, and in-motion
  request states.
- Updated `/owner/dashboard` request cards with per-card guidance and direct
  action links.
- Extended owner-readiness tests for the new request-card signal states.
- Updated the UI/UX review route checklist to include request-card signals.

### Why

The dashboard should help homeowners triage maintenance at a glance. A request
card should explain why it matters and what to do next without forcing the owner
to open every record.

### Validation

- `npm test -- owner-readiness` passed: 19 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 132 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add owner browser smoke assertions for dashboard request-card signals once
  seeded owner auth is available locally or in preview.

## 2026-08-10 - Request Record Value Snapshot

Scope: make an individual repair record explain the value it gives a
homeowner.

### Changed

- Added reusable request record-value metrics for proof packet, cost clarity,
  shared coordination, and decision history.
- Added a record-value snapshot to the owner request detail page.
- Moved proof-packet export into the value snapshot and removed the duplicate
  status-row export button.
- Extended request-guidance tests for empty, partial, and mature repair record
  value states.
- Updated the UI/UX review route checklist to include the request record-value
  snapshot.

### Why

The request detail page is where a homeowner should feel the product payoff:
proof saved, costs understood, helpers coordinated, and decisions preserved.
That value should be visible before the owner digs through individual sections.

### Validation

- `npm test -- request-guidance` passed: 13 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 126 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add owner browser smoke assertions for the request record-value snapshot once
  seeded owner auth is available locally or in preview.

## 2026-08-10 - Homeowner Value Snapshot

Scope: make the owner dashboard explain the day-to-day value homeowners get
from TurnFlow Home.

### Changed

- Added reusable `ownerValueMetrics` to summarize owner decisions, proof-backed
  records, shared helper access, and preventive care.
- Added a homeowner-value snapshot to `/owner/dashboard` with metric-specific
  next actions.
- Extended owner-readiness tests for empty, active-decision, proof, sharing, and
  preventive-care value states.
- Updated the UI/UX review route checklist to include the dashboard value
  snapshot.

### Why

Homeowners need to see the payoff quickly: fewer loose decisions, stronger
repair proof, safer helper sharing, and maintenance records that remain useful
after the job. The dashboard should make that value visible without requiring a
tour.

### Validation

- `npm test -- owner-readiness` passed: 13 tests.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 123 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Once seeded owner smoke can run locally or against preview, add browser
  assertions for the homeowner-value snapshot.

## 2026-08-10 - POC Readiness Preflight

Scope: make launch/auth/browser-smoke readiness easier to diagnose before
running seed or inviting users.

### Changed

- Added `lib/poc-readiness.ts` for pure environment readiness checks.
- Added `scripts/poc-readiness.ts` and `npm run poc:ready` for a human-readable
  CLI preflight.
- Added tests for ready, blocked, warning, and invalid email-sender readiness
  states.
- Added `npm run poc:ready` to QA and deployment runbooks.
- Cleaned `.env.local.example` comments so launch setup docs are ASCII-clean.

### Why

The product can pass code verification while still being unusable for seeded
auth flows if required environment variables are missing. A preflight makes the
next blocked step obvious before `db:seed`, `ux:owner`, `ux:helper`, or a hosted
POC launch.

### Validation

- `npm test -- poc-readiness` passed: 4 tests.
- `npm run typecheck` passed.
- `npm run poc:ready` correctly reported this local checkout as blocked because
  required launch env vars are not set.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 120 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Run `npm run poc:ready` in the actual preview/production environment before
  the next hosted POC smoke pass.

## 2026-08-10 - Deterministic Helper Demo Seed

Scope: remove the local/helper smoke blocker by making seeded demo accounts and
scoped helper work repeatable.

### Changed

- Rebuilt `scripts/seed.ts` so known demo accounts are created or reset with
  the documented password on every seed run.
- Added deterministic public-safe demo property data.
- Added deterministic request assignment so the demo vendor and demo
  collaborator both have scoped work to inspect.
- Updated QA and deployment docs to explain that `db:seed` resets demo
  passwords and prepares helper-visible demo work.

### Why

Browser UX smoke should not depend on manual database cleanup or a lucky prior
state. A launch-ready POC needs repeatable seed data so owner, vendor, and
collaborator workflows can be tested the same way every time.

### Validation

- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 116 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- `npm run db:seed` was attempted but is blocked in this local checkout because
  `DATABASE_URL` is not set in `.env.local`; helper browser smoke should be
  rerun after database env is configured.

### Follow-Up

- Keep production seed usage limited to empty public-safe POC databases, never
  a tenant database with real users.

## 2026-08-10 - Vendor Proof Upload Handoff

Scope: reduce vendor friction from request readiness to proof upload and owner
updates.

### Changed

- Made helper request readiness actions interactive when used from the vendor
  workspace.
- Vendor `Add proof` actions now preselect the matching request and scroll to
  the upload form.
- Added selected-request upload guidance so vendors know whether the next best
  proof is an after photo, receipt, extra context photo, or owner final-cost
  follow-up.
- Added vendor update threads to assigned request cards so vendors can ask the
  owner for missing context or final cost details.
- Extended helper tests for upload guidance and updated the helper UX smoke
  script to assert checklist, readiness, updates, and upload guidance.

### Why

A launch-ready vendor flow should not make users reselect the same job or guess
where to communicate. The card should hand the vendor directly into the right
proof or update action.

### Validation

- `npm test -- helper-workspace` passed: 21 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 116 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- `npm run ux:helper` was attempted against local dev; it reached login but
  could not sign in as `vendor@test.com`, so browser UX smoke remains blocked
  until seeded helper auth data is available locally or on the hosted POC.

### Follow-Up

- Run `npm run ux:helper` against the hosted POC after production environment
  variables and seeded/demo helper accounts are configured.

## 2026-08-10 - Helper Request Card Readiness

Scope: make each helper-facing request card explain what is ready, missing, or
waiting for the helper's next action.

### Changed

- Added reusable helper request card state logic for vendor and collaborator
  cards.
- Added `HelperRequestReadiness` so helper cards show a compact readiness cue
  with a clear next action.
- Updated vendor cards to flag missing job context, closeout proof gaps,
  ready-for-closeout work, and completed records with proof gaps.
- Updated collaborator cards to flag quiet threads, active shared work,
  owner-review state, and completed records.
- Extended helper-workspace tests for request-card readiness states.

### Why

Helpers should not have to scan the whole workspace to understand a single job.
Putting readiness directly on each card reduces back-and-forth, helps vendors
collect the right proof, and helps collaborators post useful updates only where
they add value.

### Validation

- `npm test -- helper-workspace` passed: 17 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 112 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Let vendor card actions preselect the matching request in the upload form for
  an even smoother proof-upload path.

## 2026-08-10 - Helper First-Run Onboarding

Scope: make invited vendor and collaborator first-run experiences clearer before
and after invite acceptance.

### Changed

- Added reusable helper onboarding items for vendor and collaborator workspaces.
- Added `HelperOnboardingChecklist` so helper users can jump from first-run
  guidance to scoped access, shared work, uploads, or updates.
- Added role-specific invite expectation copy on `/accept-invite` before the
  helper accepts the request.
- Extended helper-workspace tests for onboarding items and invite expectations.

### Why

Invited helpers should not have to infer what TurnFlow Home is asking from them.
A mature helper experience explains the access boundary, the immediate next
step, and the evidence or update that helps the owner trust the record.

### Validation

- `npm test -- helper-workspace` passed: 11 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 106 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add browser smoke assertions for the helper checklist once seeded helper
  sessions are available in the local UX harness.

## 2026-08-10 - Helper Workspace Guidance

Scope: make vendor and collaborator workspaces feel scoped, clear, and
action-oriented.

### Changed

- Added `lib/helper-workspace.ts` for reusable helper workspace stats and
  role-specific guidance.
- Added `HelperWorkspaceOverview` for shared helper summary cards, next actions,
  and workload metrics.
- Added vendor workspace guidance for assigned work, proof gaps, active work,
  completed work, and scoped access.
- Added collaborator workspace guidance for shared work, quiet request threads,
  active work, completed work, and scoped access.
- Added tests for vendor and collaborator empty, attention, progress, and ready
  helper states.

### Why

Owners will only trust the product if invited vendors and helpers also get a
professional, obvious experience. Helper users should immediately understand
what they can see, what they can do, and what needs attention.

### Validation

- `npm test -- helper-workspace` passed: 6 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 101 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Extend helper smoke coverage to assert the helper overview once seeded helper
  accounts are available locally.

## 2026-08-10 - Post-Create Notice Cleanup

Scope: keep the request-created handoff helpful without making the URL or
refresh behavior feel stale.

### Changed

- Added `RequestCreatedNoticeBanner` as a dismissible saved-request notice for
  the request detail page.
- Cleaned `created` and `uploads` query params from the browser URL after the
  post-create notice renders.
- Added a reusable helper that removes only post-create query params while
  preserving unrelated params and hash anchors.
- Extended request-submit tests for clean request-detail URLs.

### Why

The post-create notice should reassure the homeowner once, then get out of the
way. Leaving handoff query params in the URL makes refreshes feel confusing and
less polished during normal use.

### Validation

- `npm test -- request-submit` passed: 8 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 95 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Revisit this notice after browser smoke coverage exists for the create-request
  journey to confirm timing feels right on slow photo uploads.

## 2026-08-10 - Post-Create Request Handoff

Scope: keep homeowners in the new repair record after request submission.

### Changed

- Added `lib/request-submit.ts` for post-create photo upload outcomes,
  request-detail redirect paths, and creation notice copy.
- Changed `NewRequestForm` so successful request creation opens the new request
  detail page instead of returning to the dashboard.
- Preserved queued photo upload context in the redirect query string so the
  detail page can explain complete, partial, failed, or no-upload outcomes.
- Added a creation notice to `RequestDetailView` for the post-submit landing
  state.
- Added tests for photo upload status, redirect path generation, and
  owner-facing creation notices.

### Why

After creating a request, the next natural homeowner action is to review the
record, confirm proof landed, add costs, or invite help. Returning to the list
adds an avoidable step and makes photo upload failures too easy to miss.

### Validation

- `npm test -- request-submit` passed: 6 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 93 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Consider clearing creation query params after the first view if repeated
  refreshes make the saved notice feel stale during user testing.

## 2026-08-10 - Request Intake Readiness Guidance

Scope: make the new maintenance request form guide homeowners toward a useful
repair record before submission.

### Changed

- Added `lib/request-intake.ts` for reusable intake-readiness steps, progress,
  next action, and summary copy.
- Added a request draft readiness panel to `NewRequestForm` with progress,
  next-action jump links, and field-level readiness signals.
- Made the main intake fields controlled where needed so readiness updates as
  the homeowner fills the form.
- Added explicit labels and steadier alignment to the quick-add property fields.
- Added tests for empty, partial, trimmed, and ready request-intake states.

### Why

Good request intake reduces downstream friction. A homeowner should know whether
the request has enough property, title, category, urgency, and proof context
before they save it and invite someone else into the record.

### Validation

- `npm test -- request-intake` passed: 5 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 87 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Consider adding a small post-submit landing path that opens the new request
  detail page directly when first-run testing shows owners expect to add proof
  or sharing immediately.

## 2026-08-10 - Inline Completion Waiver Review

Scope: replace prototype-style completion prompts with a calmer inline review
flow for owner and vendor users.

### Changed

- Added `CompletionWaiverReview` as a shared client component for completing a
  request when required proof is missing.
- Replaced the owner request detail `window.prompt` with inline proof-gap
  review, required waiver reason entry, cancel controls, and persistent error
  copy.
- Replaced the vendor portal completion prompt with the same inline review,
  including vendor-specific guidance when final cost still needs owner input.
- Reused request proof-gap detection so the UI and server guard stay aligned.

### Why

Browser prompts make a trust-sensitive completion action feel unfinished. Inline
review keeps the user in context, names the missing proof, and makes the waiver
reason feel like part of the repair record instead of an interruption.

### Validation

- `npm run typecheck` passed.
- `npm test -- request-guidance` passed: 10 tests.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 82 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- Owner/vendor completion prompt scan passed.

### Follow-Up

- Add browser smoke coverage for the inline completion review once seeded
  request-detail and vendor workflows can be captured reliably.

## 2026-08-10 - Request Detail Readiness Guidance

Scope: make each repair record show whether it is complete enough to trust.

### Changed

- Added `lib/request-guidance.ts` for reusable request-level readiness signals.
- Added request detail guidance for evidence, cost context, shared help, and
  completion proof.
- Added jump links from the request guidance panel to proof, cost, quotes,
  sharing, comments, and decision-log sections.
- Added tests for empty, partial, ready, completed-with-gaps, and
  assigned-vendor proof-gap states.

### Why

The request detail screen is where homeowner trust is won or lost. A mature
repair record should make proof gaps obvious before the owner exports a packet,
marks work complete, or shares the request with someone else.

### Validation

- `npm test -- request-guidance` passed: 10 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 82 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Consider replacing the browser prompt for completion waivers with an inline
  review modal after route-level smoke coverage can exercise request details.

## 2026-08-10 - Dashboard Readiness Guidance

Scope: make the returning owner dashboard feel state-aware and action-oriented.

### Changed

- Added reusable dashboard guidance derived from the owner readiness setup steps.
- Reworked `/owner/dashboard` so the top banner adapts for empty, in-progress,
  and ready owner workspaces.
- Pulled dashboard readiness from the full owner context: properties, requests,
  proof, invites, vault documents, and reminders.
- Improved the status-filter empty state with a direct path back to all
  requests.
- Added tests for empty, in-progress, and ready dashboard guidance states.

### Why

The dashboard is the most likely day-to-day landing page. It should not keep
showing first-run copy after the owner has made progress; it should reflect the
state of the workspace and point to the next useful action.

### Validation

- `npm test -- owner-readiness` passed: 10 tests.
- `npm run typecheck` passed.
- `npm run verify` passed.
- `npm run lint` passed.
- `npm test` passed: 72 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add route-level smoke assertions for the dashboard guidance once seeded owner
  route capture is available.

## 2026-08-10 - Owner Readiness Guidance

Scope: make first-run and account readiness feel guided instead of passive.

### Changed

- Added reusable owner readiness summary helpers for next-best-action guidance.
- Added onboarding summary copy that tells a homeowner what to do next, whether
  the workspace is empty, in progress, or ready for a walkthrough.
- Added Account & Sharing readiness guidance so the trust center reinforces the
  same setup story as onboarding.
- Added tests for next incomplete setup step detection and empty/in-progress/
  ready summary states.

### Why

The product should not make early users infer what matters next. A launch-ready
SaaS experience should clearly name the next useful action and help the owner
understand why the record is becoming more valuable.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 69 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- App/component/lib encoding artifact scan passed.

### Follow-Up

- Use this readiness summary in future route-level smoke output once seeded
  owner route capture is available.

## 2026-08-10 - Owner Trust Action Forms

Scope: reduce friction and trust risk in owner forms, invites, proof, quotes,
exports, and destructive actions.

### Changed

- Refreshed `PropertyForm` with explicit labels, clearer placeholders, and
  cleaner pending/error states.
- Refreshed `InviteSection`, `CopyableInviteLink`, `SharedAccessControls`, and
  pending invite messaging so request sharing is easier to understand.
- Refreshed property delete/export controls with clearer action labels and
  pending states.
- Refreshed `RequestDetailView` with a clearer repair-record header, structured
  details, cleaner status/proof packet controls, and better photo proof copy.
- Refreshed `QuoteWorkspace` with labeled inputs, cleaner quote actions, and
  plain pending/success text.
- Removed visible encoding artifacts from owner trust-action components.

### Why

Launch readiness depends on the moments where users make irreversible or
trust-sensitive decisions: inviting helpers, removing access, changing status,
uploading proof, approving quotes, exporting history, and deleting property
records. These controls need to feel explicit, readable, and recoverable.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 67 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- App/component encoding artifact scan passed.

### Follow-Up

- Add browser smoke coverage for the request detail route once seeded owner data
  is available locally or in preview.

## 2026-08-10 - Helper Workspace UX

Scope: mature shared-access experiences for vendors, collaborators, and invite
acceptance.

### Changed

- Added `components/HelperPortalShell.tsx` so vendor and collaborator pages use
  a consistent scoped-workspace frame.
- Refreshed `/vendor` with clearer assigned-request cards, scoped-access copy,
  status controls, and proof-upload guidance.
- Refreshed `/collaborator` with clearer shared-request cards and update
  posting layout.
- Refreshed `/accept-invite` with calmer trust copy, plain error states, and a
  cleaner acceptance card.
- Cleaned visible encoding artifacts from invite acceptance, helper comments,
  vendor status/upload states, and collaborator copy.
- Added `scripts/ux-helper-smoke.ts` and `npm run ux:helper` for vendor and
  collaborator route smoke coverage.
- Updated README, QA, and UI/UX review docs with the helper smoke check.

### Why

TurnFlow Home only earns owner trust if invited helpers see a scoped,
professional experience. Vendors and collaborators should immediately
understand what they can see, what they can update, and why they are not inside
the owner's full workspace.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 67 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- App/component encoding artifact scan passed.
- `npm run ux:helper` added and failure mode verified, but local route capture
  was blocked because `AUTH_SECRET` and `DATABASE_URL` are not configured and
  `npm run db:seed` cannot create demo helper accounts on this machine.

### Follow-Up

- Add a scripted invite-acceptance walkthrough once test database setup is
  available in local/CI.

## 2026-08-10 - Owner Workspace Navigation UX

Scope: mature the signed-in owner workspace so navigation and route confidence
feel cleaner before launch testing.

### Changed

- Rebuilt `components/OwnerSidebar.tsx` as an active-route client navigation
  component with plain labels, route descriptions, and `aria-current`.
- Wrapped owner navigation in `Suspense` from `app/owner/layout.tsx` to follow
  the Next 16 `usePathname` guidance for layouts that include dynamic routes.
- Cleaned visible encoding artifacts and symbol-heavy copy from owner dashboard,
  request intake, properties, vault, calendar, notifications, backup, and shared
  owner components.
- Tightened mobile stacking on request cards, property rows, vault documents,
  reminders, notifications, and request-intake actions.
- Added `scripts/ux-owner-smoke.ts` and `npm run ux:owner` for authenticated
  owner route checks at desktop and mobile widths.
- Updated README, QA, and UI/UX review docs with the owner smoke check.

### Why

The public auth flow now feels stronger, but the signed-in workspace still
needed a clearer sense of place and fewer rough edges. A homeowner should never
see broken glyphs in headings, buttons, status text, or navigation, and every
owner route should make the current location obvious.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 67 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- App/component encoding artifact scan passed.
- `npm run ux:public` passed against `http://localhost:3000`.
- `npm run ux:owner` added and failure mode verified, but local route capture
  was blocked because `DATABASE_URL` is not configured and `npm run db:seed`
  cannot create the demo owner account on this machine.

### Follow-Up

- Extend the owner smoke from route confidence into one scripted create-request
  walkthrough after test data isolation is improved.

## 2026-08-09 - Public Auth UX Smoke

Scope: make the homeowner entry experience feel more mature and easier to
verify.

### Changed

- Added `components/AuthChrome.tsx` as a shared auth shell with homeowner-first
  positioning and trust cues.
- Refreshed `/login` and `/signup` with explicit labels, autocomplete hints,
  clearer owner-facing copy, stronger focus states, and steadier button states.
- Added `scripts/ux-public-smoke.ts` and `npm run ux:public` to check public
  entry routes at desktop and mobile widths.
- Saved public-entry smoke screenshots under `screenshots/ux-public/`.
- Cleaned `scripts/screenshot.ts` comments/output to ASCII so the screenshot
  workflow does not carry encoding noise.
- Updated README, QA, and UI/UX review docs with the public-entry smoke check.

### Why

Signup and login are the first trust moment for a homeowner. These screens need
to explain the product direction quickly, feel less like a school MVP, and be
easy to check before sharing screenshots or a hosted POC.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 67 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.
- `npm run ux:public` passed against `http://localhost:3000`.

### Follow-Up

- Extend browser smoke coverage to authenticated owner routes after demo data
  setup is standardized.

## 2026-08-09 - UI UX Findings Register

Scope: give product polish reviews a durable triage trail.

### Changed

- Added `docs/UI_UX_FINDINGS.md` with priority levels, statuses, a findings
  table, and review closeout rules.
- Updated UI/UX review, QA, user-testing, and README docs so repeated friction
  and release-blocking issues flow into the findings register.

### Why

TurnFlow Home needs a repeatable way to turn walkthrough notes and homeowner
testing confusion into prioritized product work. The register keeps SaaS
readiness conversations tied to routes, evidence, owner decisions, and fixing
commits.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 67 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add screenshot artifact paths to findings during the first browser-driven
  UI/UX pass.

## 2026-08-09 - UI UX Review Process

Scope: make product polish review repeatable for homeowner-facing workflows.

### Changed

- Added `docs/UI_UX_REVIEW.md` with a scorecard, route checklist, interaction
  checks, visual checks, trust-copy checks, and session notes template.
- Updated QA, user-testing, and README docs so UI/UX review is part of the POC
  release rhythm.

### Why

The app now has a strong technical verification gate, but SaaS readiness also
depends on repeatable product polish. This creates a shared process for judging
clarity, trust, friction, responsive behavior, accessibility, and homeowner
language before demos or testing.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 67 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add browser-driven screenshot checks for the routes in the UI/UX checklist.

## 2026-08-09 - Protected Deep Health Check

Scope: add authenticated operational monitoring for database connectivity.

### Changed

- Added `/api/health/deep`, protected by `HEALTHCHECK_SECRET`.
- Added deep-health auth and payload helpers in `lib/health.ts`.
- Added tests for bearer parsing, health-check authorization, and deep-health
  payload shape.
- Documented `HEALTHCHECK_SECRET` in `.env.local.example`, deployment docs, QA
  checklist, and README.

### Why

The public health route confirms the app responds, but a SaaS operator also
needs a private signal that the database can be reached. Keeping it behind a
separate secret lets monitoring access be rotated independently from cron.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 67 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed and included `/api/health/deep`.

### Follow-Up

- Add storage and email-provider checks if production monitoring needs deeper
  dependency coverage.

## 2026-08-09 - Baseline Security Headers

Scope: add conservative browser security headers for hosted POC hardening.

### Changed

- Added `lib/security-headers.ts` as the shared baseline header policy.
- Updated `next.config.ts` to apply the security headers globally.
- Added unit coverage for header uniqueness and expected values.
- Updated README, deployment docs, and QA checklist to include security-header
  expectations.

### Why

A homeowner SaaS should ship with basic browser protections before public
testing: content-type sniffing protection, clickjacking defense, referrer
control, locked-down browser permissions, and HSTS. CSP is intentionally left
for a separate nonce-aware pass so we do not break Next scripts or uploads.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 61 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Design and test a nonce-based Content Security Policy after the hosted app and
  any analytics/email/asset domains are finalized.

## 2026-08-08 - Public Health Check

Scope: add a monitor-friendly hosted app status endpoint.

### Changed

- Added `/api/health` as an uncached public GET route.
- Added `lib/health.ts` for a testable health payload with status, service,
  timestamp, version, environment, and commit metadata.
- Added unit coverage for the health payload and route response.
- Updated README, deployment smoke tests, and QA checklist to include the
  health endpoint.

### Why

A SaaS POC needs a simple uptime target that does not require login, seeded
data, or database access. This gives hosting checks and external monitors a
stable way to confirm the deployed app is responding.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 59 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed and included `/api/health`.

### Follow-Up

- Add a protected deep-health endpoint later if launch monitoring needs database
  or storage connectivity checks.

## 2026-08-08 - CI Uses Product Gate

Scope: keep GitHub validation aligned with local release validation.

### Changed

- Updated `.github/workflows/ci.yml` to run `npm run verify` as the single CI
  validation step after install.
- Simplified the deployment pre-check list so `npm run verify` is the canonical
  automated gate instead of repeating each command separately.

### Why

The local QA gate only protects the product if CI uses the same command. This
prevents GitHub Actions and local release checks from drifting as the SaaS
readiness bar gets stricter.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 56 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add a GitHub Actions badge to README once the workflow has a few clean runs.

## 2026-08-08 - Product QA Gate

Scope: make SaaS-readiness validation repeatable.

### Changed

- Added `typecheck`, `audit:prod`, and `verify` npm scripts.
- Added `docs/QA_CHECKLIST.md` for automated and manual POC smoke testing.
- Updated README, deployment docs, and user-testing setup to use the new QA
  gate.

### Why

The project had strong individual checks, but a launchable SaaS needs a single
repeatable verification command and a clear manual smoke path for owner, vendor,
collaborator, sharing, exports, and trust boundaries.

### Validation

- `npm run verify` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 56 tests.
- `npm run audit:prod` passed: 0 vulnerabilities.
- `npm run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm run build` passed.

### Follow-Up

- Add browser-driven end-to-end tests for the highest-risk smoke paths once the
  test database workflow is stable.

## 2026-08-08 - Shared Access Audit Email

Scope: make access-removal history identifiable to homeowners.

### Changed

- `removeSharedAccessAction` now looks up the removed vendor/collaborator email
  before clearing request access.
- Decision-log details now include `removedUserEmail` when the account exists.
- Decision Log copy now names the removed email address with a readable fallback
  if the email is unavailable.
- Expanded decision-log unit coverage for email-backed and fallback audit copy.

### Why

An audit trail should answer "who did I remove?" without making a homeowner
interpret internal ids. Email-backed revocation history makes the trust center
and request timeline feel more concrete for early users.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 56 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Consider surfacing removed access events directly in Account & Sharing if user
  testing shows owners look there first for sharing history.

## 2026-08-08 - Shared Access Audit Trail

Scope: preserve a request-level record when owner removes accepted access.

### Changed

- `removeSharedAccessAction` now writes a `shared_access_removed` decision-log
  entry after clearing assigned vendor/collaborator access.
- Added decision-log display copy for removed vendor/collaborator access.
- Added unit coverage for the new decision-log copy.

### Why

Revoking access should leave a visible record, not just mutate a hidden
assignment field. This helps homeowners understand their sharing history and
makes the access-control workflow easier to trust during a POC.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 55 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Completed in `2026-08-08 - Shared Access Audit Email`.

## 2026-08-08 - Shared Access Removal

Scope: let owners revoke accepted vendor/collaborator access from Account &
Sharing.

### Changed

- Added shared-access form parsing for request id and role.
- Added `removeSharedAccessAction` with owner-role and request-ownership checks
  before clearing an assigned vendor or collaborator.
- Added `components/SharedAccessControls.tsx` for the remove-access form.
- Added an Active shared access section to Account & Sharing, separate from
  pending/accepted invite history.
- Added tests for shared-access form parsing.
- Updated README, deployment smoke tests, and user-testing tasks to include
  accepted-access removal.

### Why

Accepted invites are not just activity history; they are live visibility into a
homeowner's repair record. Owners need a clear, reversible access control before
the product feels mature enough for real vendors and trusted helpers.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 52 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Completed in `2026-08-08 - Shared Access Audit Trail`.

## 2026-08-08 - Request Invite Copy Link

Scope: make initial request-level invite creation match the mature resend flow.

### Changed

- Extracted `components/CopyableInviteLink.tsx` as the shared copyable invite
  link UI.
- Updated pending invite resend controls to use the shared copyable-link
  component.
- Updated create invite actions to return `inviteLink` and `emailSent` in
  addition to `inviteId`.
- Updated request-level `InviteSection` so newly created vendor/collaborator
  invites show a structured status message and reusable copyable link card.
- Updated README, deployment smoke tests, and user-testing tasks to include the
  initial invite copy-link flow.

### Why

Owners should get the same sharing affordance whether they just created an
invite or are resending it later. This removes the old hard-to-scan status text
and keeps request-page sharing usable when email is disabled for a POC.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 49 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Consider showing existing pending invite links before resend if user testing
  shows owners expect to retrieve links without refreshing expiry.

## 2026-08-08 - Invite Link Fallback

Scope: frictionless pending-invite recovery when email is unavailable.

### Changed

- Added `lib/invites/links.ts` as the shared invite-link builder.
- Updated create/resend invite actions to use the shared link builder.
- Updated `resendInviteAction` to return the invite link to the client every
  time it refreshes a pending invite.
- Made resend copy explain whether email was sent or whether the owner should
  copy the fallback link because email is not configured.
- Added a read-only invite-link field and copy button to
  `PendingInviteControls`.
- Extended invite tests to cover fallback localhost URLs, APP_URL trimming, and
  query-string encoding.
- Updated README, deployment smoke tests, and user-testing tasks to include the
  copyable invite-link fallback.

### Why

The hosted POC may intentionally run without outbound email at first. Owners
still need a smooth way to share an invite link, and testers need to understand
that a failed email send does not block the request-sharing flow.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 49 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Add resend delivery state once real email configuration is active.

## 2026-08-07 - Pending Invite Controls

Scope: owner control over pending vendor/collaborator invite links.

### Changed

- Added `lib/invites/forms.ts` for testable invite form parsing.
- Added `cancelInviteAction` for owners to delete pending invites and clear the
  matching request pending-invite pointer.
- Added `resendInviteAction` for owners to refresh a pending invite expiry and
  send/log a new invite notification attempt.
- Added `components/PendingInviteControls.tsx` and surfaced Resend/Cancel
  controls in Account & Sharing invite activity.
- Added `__tests__/invite-forms.test.ts` for invite-id parsing.
- Updated README, deployment smoke tests, and user-testing tasks to include
  pending invite management.

### Why

Real owners need a recovery path when an invite email does not land or the wrong
person was invited. Resend/cancel controls make sharing feel intentional and
reversible without changing the database schema.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 46 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Completed in `2026-08-08 - Shared Access Removal`.

## 2026-08-07 - Signup and Profile Friction Pass

Scope: smoother account creation and basic owner profile management.

### Changed

- Added `lib/auth/forms.ts` for shared, testable signup and owner profile
  validation.
- Refactored `signupAction` to use the shared parser and return safe name/email
  values after validation or duplicate-email errors.
- Updated `/signup` to preserve name/email after failed submissions and show the
  password rule before submit.
- Added `updateOwnerProfileAction` for owner display-name updates with
  server-side role validation and path revalidation.
- Added `components/OwnerProfileForm.tsx` and embedded it in Account & Sharing.
- Updated Account & Sharing to read the current owner row from the database so
  profile edits display immediately.
- Added `__tests__/auth-forms.test.ts` for signup normalization, password/email
  errors, safe value preservation, and profile-name validation.
- Updated README and user-testing tasks to include editable profile behavior.

### Why

Signup is the first real conversion moment. Keeping safe values after errors,
making password rules visible, and giving owners a basic editable profile makes
the app feel less like a static POC and more like software people can settle
into.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 43 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Add password change/reset flows before a broader public beta.
- Add email verification once outbound email configuration is confirmed.
- Add invite revoke/resend controls from Account & Sharing.

## 2026-08-07 - Owner Readiness Test Coverage

Scope: organize and test the first-run readiness rules that drive launch UX.

### Changed

- Added `lib/owner-readiness.ts` as the shared source of truth for owner setup
  steps, progress, readiness flags, shared-request counts, and account
  readiness checklist items.
- Refactored `/owner/onboarding` and `/owner/account` to use the shared helper
  instead of duplicating first-run logic in page components.
- Added `__tests__/owner-readiness.test.ts` covering empty, partial, and more
  mature owner journeys.
- Updated README and user-testing docs to note that setup/account readiness
  rules are now shared and tested.
- Kept Next's generated `AGENTS.md` guidance change so future worktree status
  stays cleaner after `next dev` rewrites it.

### Why

The product needs to feel frictionless, but the maturity rules cannot drift
between pages. Centralizing and testing them makes the owner journey easier to
change deliberately after user testing.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 38 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Add tests around signup validation once the auth action is split into a
  testable parser/helper.
- Add lightweight route smoke tests after a stable demo database is available.

## 2026-08-07 - Owner Account & Sharing Center

Scope: launch-readiness trust surface for homeowner accounts and invite sharing.

### Changed

- Added `/owner/account`, a state-backed Account & Sharing Center for owners.
- Summarized the signed-in owner profile, shared-request count, pending invite
  count, and first-run readiness signals.
- Documented current sharing boundaries in-product: vendors and collaborators
  are request-scoped, while vault documents, reminders, backups, properties, and
  notification history stay owner-only.
- Added invite activity visibility for pending and accepted request invites.
- Added Account navigation, a dashboard "Review sharing" entry point, and a
  signup trust note explaining request-scoped vendor/helper access.
- Updated README, deployment smoke tests, and user testing tasks to include
  Account & Sharing.

### Why

Early users need confidence before inviting a contractor or helper into a
maintenance record. This page makes the current sharing model visible without
adding a migration or pretending to have full privacy controls yet.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 33 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Add editable owner profile and password/account management.
- Add explicit per-invite revoke/resend controls.
- Turn the current sharing explanation into enforceable privacy-control UI once
  user testing confirms the right defaults.

## 2026-08-07 - Middleweight First-Run Testing Loop

Scope: homeowner-first signup and setup journey for SaaS user testing.

### Changed

- Added public owner signup at `/signup` with server-side validation,
  duplicate-email handling, password hashing, and automatic sign-in.
- Updated the auth proxy so signed-out users can reach `/signup` and signed-in
  users are redirected away from `/login` and `/signup`.
- Added `/owner/onboarding`, a state-backed setup guide that tracks progress
  across property setup, first request, evidence, helper sharing, vault history,
  and recurring reminders.
- Added setup guide entry points in the owner sidebar and dashboard.
- Added `docs/USER_TESTING.md` with a homeowner testing protocol, tasks,
  observation prompts, success signals, and notes template.
- Updated README and deployment docs to reflect public owner signup and the
  homeowner testing path.
- Updated `dompurify` in `package-lock.json` from `3.4.12` to `3.4.13` to
  clear the production dependency audit advisory inherited through `jspdf`.

### Why

The next product risk is not hosting mechanics; it is whether a homeowner can
understand and complete the core SaaS journey without a property management
company. This slice gives testers a serious first-run path while keeping public
account creation scoped to owners.

### Validation

- `npm.cmd ci` passed.
- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 33 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Run three to five homeowner test sessions using `docs/USER_TESTING.md`.
- Watch especially for first-request friction, invite trust/privacy concerns,
  and whether the vault/reminder pieces feel connected to the repair record.
- Keep vendor and collaborator signup invite-driven until sharing scope and
  privacy controls are clearer.

## 2026-08-06 - Lint Blocker Cleared

Scope: React hook lint cleanup for the request detail workflow.

### Changed

- Removed the prop-to-state sync effect from `QuoteWorkspace`.
- Derived the displayed quote list from props plus locally hidden deleted quote IDs.
- Extracted the request cost form into a keyed `CostEditor` child so refreshed
  server cost values remount the form instead of syncing state in an effect.

### Why

Next/React lint now flags synchronous `setState` calls inside effects. The old
pattern worked functionally, but it blocked a clean pre-deploy checklist.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 33 tests.

## 2026-08-06 - Production Audit Cleared

Scope: dependency audit hardening for deploy readiness.

### Changed

- Updated `next` from `16.2.12` to `16.3.0`.
- Updated `eslint-config-next` from `16.2.12` to `16.3.0` to keep lint config
  aligned with the framework version.

### Why

`npm audit --omit=dev` reported high-severity production findings through
Next's transitive `postcss` and `sharp` dependencies. The audited fix path was
the Next `16.3.0` release line.

### Validation

- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 33 tests.
- `npx.cmd drizzle-kit --version` passed.

### Follow-Up

- Full `npm audit` still reports 4 moderate dev-only findings through
  `drizzle-kit -> @esbuild-kit/esm-loader -> @esbuild-kit/core-utils ->
  esbuild@0.18.20`.
- `drizzle-kit@0.31.10` is currently the latest published version, and npm's
  suggested forced fix would downgrade to `drizzle-kit@0.18.1`, so this remains
  documented rather than forced.

## 2026-08-06 - Baseline Migration Added

Scope: replace direct schema push setup with committed Drizzle migrations.

### Changed

- Added the initial generated migration in `drizzle/0000_living_rhino.sql`.
- Committed Drizzle migration metadata under `drizzle/meta/`.
- Updated `drizzle.config.ts` so `db:generate` can run without a live
  `DATABASE_URL`, while `db:migrate` and `db:push` still require one.
- Updated the README and deployment runbook to use `npm run db:migrate` for
  fresh database setup.

### Why

`db:push` was fine for the earliest POC, but a public-safe beta needs a
reviewable, repeatable schema history that can be applied consistently across
local, staging, and deployed databases.

### Validation

- `npm.cmd run db:generate` passed and produced the baseline migration.
- `npm.cmd run db:migrate` without `.env.local` failed fast with the expected
  missing `DATABASE_URL` error.
- `npm.cmd run db:push` without `.env.local` failed fast with the expected
  missing `DATABASE_URL` error.

### Follow-Up

- Run `npm run db:migrate`, `npm run db:seed`, and `npm run db:seed:demo`
  against a real Neon database once `.env.local` is available.

## 2026-08-06 - Production Build Without Local Secrets

Scope: make pre-deploy validation runnable before local Neon credentials are
available.

### Changed

- Made `lib/db/index.ts` initialize the Neon/Drizzle client lazily instead of
  throwing as soon as the module is imported.
- Kept the same missing `DATABASE_URL` error for runtime code paths that
  actually touch the database.
- Added `npm run build` and production audit checks to the deployment runbook's
  pre-deploy checklist.

### Why

`next build` imports protected routes while collecting page data. The old eager
database initialization made a missing local `DATABASE_URL` fail the build even
though Vercel production will provide the variable at runtime. Lazy
initialization lets CI/local build validation run without secrets while still
failing clearly if a database-backed request runs without configuration.

### Validation

- `npm.cmd run build` passed without `.env.local`.
- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 33 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.

### Follow-Up

- Run the app against real Neon and Blob credentials and perform the deployment
  smoke test.

## 2026-08-06 - GitHub CI Added

Scope: move the pre-deploy validation checklist into GitHub Actions.

### Changed

- Added `.github/workflows/ci.yml`.
- CI now runs on pushes to `main` and on pull requests.
- The workflow installs from `package-lock.json`, then runs lint, TypeScript,
  tests, production dependency audit, migration drift check, and production
  build.
- Updated the deployment runbook to note that CI covers the pre-deploy checks.

### Why

The project now has a green local checklist, but it should not rely on memory or
a single workstation. CI makes regressions visible before deploy work continues.

### Validation

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test` passed: 33 tests.
- `npm.cmd audit --omit=dev --cache .npm-cache` passed: 0 vulnerabilities.
- `npm.cmd run db:generate` passed with no schema changes.
- `git diff --exit-code -- drizzle` passed.
- `npm.cmd run build` passed.

### Follow-Up

- Confirm the first GitHub Actions run passes on `main` after this commit is
  pushed.

## 2026-08-04 - Trust Boundary Hardening

Commit: `31267e3`  
Scope: server-side guardrails for maintenance workflows.

### Changed

- Added server-side request status validation in `updateRequestStatusAction`.
- Re-checked completion proof server-side before allowing `Complete`.
- Required a non-empty waiver reason when completion proof is missing.
- Scoped reminder deletion to the verified property.
- Validated vault document `requestId` against the same owner and property.

### Why

The client UI already prompted for completion proof and routed users through the
right workflow, but SaaS guardrails need to live on the server. These changes
reduce the risk of invalid status values, bypassed completion proof,
cross-property reminder deletion, and mismatched vault document links.

### Validation

- `npm.cmd test` passed: 33 tests.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd run lint` ran and surfaced pre-existing React hook lint issues in
  `components/QuoteWorkspace.tsx` and `components/RequestDetailView.tsx`.

### Follow-Up

- Fix existing hook lint issues.
- Review npm audit findings before public beta.
- Add deploy runbook and make demo setup repeatable.

## 2026-08-04 - POC Deployment Documentation

Scope: make the hosted demo path repeatable.

### Changed

- Added `docs/DEPLOYMENT.md` with environment variables, setup, seeded demo
  accounts, pre-deploy checks, and smoke-test steps.
- Added `docs/BUILD_LOG.md` as the running project build log.
- Added `db:seed:demo` as a script alias for the existing demo seed.
- Linked deployment docs and build log from the README.

### Why

The app is moving from portfolio MVP toward hosted SaaS POC. Repeatable docs
keep the project understandable when returning to it after each build step.

### Validation

- `npm.cmd test` passed: 33 tests.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd run lint` ran and still reports the known React hook lint issues in
  `components/QuoteWorkspace.tsx` and `components/RequestDetailView.tsx`.
- `npm.cmd install` reported 7 npm audit findings.

### Follow-Up

- Fix lint issues so the pre-deploy checklist can go fully green.
- Convert `db:push` POC setup to committed migrations before broader beta.
