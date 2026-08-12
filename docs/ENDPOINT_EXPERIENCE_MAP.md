# TurnFlow Home Endpoint Experience Map

Use this map as the product contract for each route before a hosted POC, user
testing round, screenshot refresh, or UX hardening pass. Every endpoint should
make the user's current job, trust boundary, and next action obvious without
coaching.

## Route Principles

- Every route should answer: "Why am I here, what can I safely do, and what
  happens next?"
- Owner routes should feel like a home maintenance record, not PMC dispatch
  software.
- Vendor routes should make the next work state obvious: bid, prepare, start,
  pause, stop, close out, or wait for owner review.
- Collaborator routes should stay narrow and confidence-building: see only the
  shared request, add helpful context, and understand that owner data is scoped.
- Public routes should sell the homeowner value plainly, then move people into
  signup or login without extra ceremony.
- Empty states should name the next useful action, not merely say that data is
  missing.
- Success states should point to the next route or next decision.
- Trust copy should appear where sharing, evidence, cost, closeout, billing, or
  account access changes happen.

## POC Readiness Scale

| Score | Meaning |
|---|---|
| `3` | Ready for a coached hosted POC after environment setup and smoke testing. |
| `2` | Usable, but should receive a focused UX hardening pass before external testers. |
| `1` | Feature exists, but the route relationship or user handoff is still too fuzzy. |
| `0` | Not POC-ready. Broken, missing, or risky for the intended user. |

## Public Entry Routes

| Endpoint | Role | User Goal | Primary Action | Success State | Empty/Error States | Trust/Privacy Cues | Next Handoff | POC Score |
|---|---|---|---|---|---|---|---|---|
| `/` | Visitor | Understand TurnFlow Home as a homeowner repair-record product. | Choose signup or login. | Visitor understands this is for self-managed home maintenance. | CTA stays clear even if screenshots or demo media are not fresh. | Product language avoids implying PMC-managed operations or payment processing. | `/signup` or `/login` | `2` |
| `/signup` | New homeowner | Create an owner account. | Submit name, email, and password. | Owner lands in onboarding with setup guidance. | Password and duplicate-account errors are field-adjacent and recoverable. | Explains this creates an owner workspace, not vendor access. | `/owner/onboarding` | `3` |
| `/login` | Returning user | Reach the right role workspace. | Sign in. | Owner, vendor, or collaborator lands in their portal. | Invalid credentials are clear without leaking account existence details. | Role routing reinforces that scoped users only see shared work. | `/owner/dashboard`, `/vendor`, or `/collaborator` | `3` |
| `/accept-invite` | Invited vendor/collaborator | Accept scoped access from an owner. | Accept invite while authenticated. | Shared request becomes visible in the right portal. | Expired, used, mismatched, or missing invite states are understandable. | Copy explains the invite grants request-level access, not owner-wide access. | `/vendor` or `/collaborator` | `3` |

## Owner Workspace Routes

| Endpoint | Role | User Goal | Primary Action | Success State | Empty/Error States | Trust/Privacy Cues | Next Handoff | POC Score |
|---|---|---|---|---|---|---|---|---|
| `/owner/onboarding` | Owner | Finish first-run setup and understand the product shape. | Add property, create request, attach evidence, share access, preserve history, set reminder. | Owner sees progress and knows the next best setup task. | Zero-data states should feel encouraging, not like missing configuration. | Explains setup builds a private owner record first. | `/owner/properties`, `/owner/requests/new`, `/owner/vault`, `/owner/calendar` | `3` |
| `/owner/dashboard` | Owner | Triage active repair records across properties. | Filter status and open the next request needing attention. | Owner can tell which record needs action and why. | Empty dashboard points to creating a property/request. | Communication and closeout signals explain when vendor/helper attention is needed. | `/owner/requests/[id]` or `/owner/requests/new` | `3` |
| `/owner/requests/new` | Owner | Capture a repair with enough context to act on it later. | Create request with property, category, urgency, notes, access, contact preference, and proof. | Request is created with a clear next step. | No-property state offers inline property creation. Upload failures are recoverable. | Safety checklist and access copy explain why the details matter. | `/owner/requests/[id]` | `3` |
| `/owner/requests/[id]` | Owner | Run one complete repair record from intake through proof, closeout, billing, and history. | Review or update quote, tasks, proof, vendor access, closeout, billing, comments, and status. | Owner knows what is done, what is missing, and what will be preserved. | Missing proof, missing cost, missing vendor, and pending closeout states are visible before completion. | Must explain scoped access, irreversible/completion decisions, closeout review impact, and billing-is-recordkeeping-only. | `/owner/dashboard`, proof packet export, `/owner/vault`, `/owner/calendar` | `3` |
| `/owner/properties` | Owner | Maintain home/property records and understand property-level care health. | Add/update property, review request/document/reminder coverage, export history. | Owner sees which properties have useful history and recurring care. | First-property state should quickly lead into request creation. | Delete/export boundaries explain what is saved or removed. | `/owner/requests/new`, `/owner/vault`, `/owner/calendar` | `3` |
| `/owner/vault` | Owner | Store warranties, receipts, manuals, invoices, and property documents. | Upload or review documents by property/category/request link. | Owner sees the vault as durable home memory, not generic file storage. | No-document state suggests first useful record types. | Upload/delete copy clarifies owner-only storage and request links. | `/owner/properties`, `/owner/requests/[id]` | `3` |
| `/owner/calendar` | Owner | Prevent recurring maintenance from becoming repairs. | Add reminders, mark done, export `.ics`. | Owner sees overdue, due-soon, and covered properties. | No-reminder state suggests common homeowner reminders. | Calendar export explains what leaves TurnFlow. | `/owner/properties`, `/owner/dashboard` | `3` |
| `/owner/account` | Owner | Manage profile, pending invites, and accepted scoped access. | Resend/cancel invites, remove accepted access, update profile. | Owner can explain who has access and what changed. | Empty invite/access states explain that sharing is optional. | Strongest trust route: who can see what, what can be removed, and what remains logged. | `/owner/requests/[id]`, `/owner/dashboard` | `3` |
| `/owner/notifications` | Owner | Audit email/send attempts and delivery health. | Review notification attempts and delivery guidance. | Owner understands whether email is live or log-only. | Empty notification state should reassure new accounts. | Explains notification limits and failed-send recovery. | `/owner/dashboard`, `/owner/account` | `3` |
| `/owner/backup` | Owner | Export or restore owner data. | Export JSON backup, restore backup, export history CSV. | Owner trusts that the record is portable. | Empty export/restore errors describe what file/data is expected. | Data portability and restore risk copy should be explicit. | `/owner/properties`, `/owner/vault` | `2` |

## Vendor Workspace Routes

| Endpoint | Role | User Goal | Primary Action | Success State | Empty/Error States | Trust/Privacy Cues | Next Handoff | POC Score |
|---|---|---|---|---|---|---|---|---|
| `/vendor` | Vendor | Understand assigned jobs and move each one through bid, approval, work session, closeout, and billing review. | Follow the per-job next-action panel, update profile, submit bid, add updates, upload proof, start/pause/resume/stop work sessions, complete tasks, submit closeout. | Vendor can tell exactly what the owner is waiting on. | No-assigned-work state should explain that jobs appear by owner invite/assignment. Blocked actions must say what proof, task, cost, or owner decision is missing. | Copy must make scoped access clear and avoid implying vendor sees owner-wide data or receives payment in-app. | Owner review on `/owner/requests/[id]` | `3` |

## Collaborator Workspace Routes

| Endpoint | Role | User Goal | Primary Action | Success State | Empty/Error States | Trust/Privacy Cues | Next Handoff | POC Score |
|---|---|---|---|---|---|---|---|---|
| `/collaborator` | Collaborator | Help the owner with a shared request without seeing unrelated owner data. | Review request readiness and add helpful updates. | Collaborator can contribute context and understands owner owns the record. | No-shared-request state explains invite/shared-access dependency. | Repeats that access is request-scoped and owner-controlled. | Owner sees update on `/owner/requests/[id]` | `3` |

## Operational And API Endpoints

| Endpoint | Audience | Purpose | POC Contract | Score |
|---|---|---|---|---|
| `/api/auth/[...nextauth]` | Auth.js runtime | Session and credential auth. | Must preserve role routing and avoid leaking account state in errors. | `3` |
| `/api/blob-upload` | Authenticated app users | Authorize direct uploads to Blob storage. | Must enforce role/session context and keep uploaded evidence tied to the intended workflow. | `3` |
| `/api/health` | Public monitor | Basic app health. | Returns safe public status without secrets or database details. | `3` |
| `/api/health/deep` | Protected monitor | Database-backed health check. | Requires `HEALTHCHECK_SECRET` bearer token and hides raw infrastructure errors. | `3` |
| `/api/cron/reminder-digest` | Vercel Cron | Send due/overdue reminder digest. | Requires `CRON_SECRET`, logs attempts, and remains safe when email is log-only. | `3` |

## Priority Hardening Queue

1. `/owner/backup`: make export/restore risk and success states more
   homeowner-friendly before hosted POC testing.
2. `/`: refresh public positioning and screenshots after the product UI settles.
3. `/owner/requests/new`: run mobile homeowner testing to confirm the guided
   intake feels worth the effort before adding more fields.
4. `/owner/account`: use testing to confirm sharing/access boundaries are
   understood without facilitator explanation.

## Per-Endpoint UX Pass Template

```text
Endpoint:
Role:
Scenario:

Current primary user job:
Current trust boundary:
Current next action:

What feels mature:
What feels confusing:
What could be removed or collapsed:
What needs stronger empty/error/success state:
What another role sees because of this action:

POC score before:
Fix applied:
Validation:
POC score after:
```
