# TurnFlow Home: API payload contracts (as built @ b45b1ac)

TurnFlow has **two API surfaces**:

1. **7 HTTP route handlers** under `app/api/`. These are real HTTP contracts and are testable with Bruno.
2. **44 Server Actions** under `lib/actions/`. These are RPC calls that Next.js serializes. They're the main write API, but they aren't stable HTTP endpoints (the action id changes per build), so they're tested by calling them in-process (authorization matrix) or through the UI (Playwright).

Everything below comes from the code. Items marked **PROPOSED** are recommendations, not current behavior.

## Error envelopes in use

| Surface | Shape | Evidence |
|---|---|---|
| HTTP routes | `{ "error": "<human message>" }` with an HTTP status | `app/api/files/route.ts:17-19`, `app/api/blob-upload/route.ts:51-54` |
| Server actions, style A (61 sites) | returns `{ error: string }` (or a form state with `error`) | `lib/actions/invites.ts`, `lib/actions/closeout-submissions.ts:121-145` |
| Server actions, style B (21 sites) | `throw new Error("...")`. Reaches the client as a generic error, and there's no `error.tsx` to catch it | `lib/actions/quotes.ts:26`, `lib/actions/requests.ts:219`, `missing:app/error.tsx` |
| Server actions, style C | `redirect()` from `requireRole` when the role is wrong or the user is signed out | `lib/auth/dal.ts:25-30` |

**PROPOSED** single contract: every action returns `{ ok: true, data } | { ok: false, code, message, fieldErrors? }`. Codes: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `CONFLICT`, `INTERNAL`. Inputs are parsed with zod at the top of each action.

## HTTP route handlers

```text
GET /api/health                       Auth: none                                   @ app/api/health/route.ts:6
  Request   none                                           validated by: n/a
  200       buildHealthPayload()  (public status, no secrets)    Cache-Control: no-store   @ lib/health.ts

GET /api/health/deep                  Auth: Bearer HEALTHCHECK_SECRET               @ app/api/health/deep/route.ts:17
  Request   header Authorization: Bearer <secret>          validated by: lib/health.ts (authorizeDeepHealth)
  200       { status: "ok", auth: "ok", database: "ok", operational: [...], latencyMs }
  401|503   { status: "unauthorized" | "not_configured", auth }       (503 when secret not configured)
  503       { status: "degraded", database: "ok"|"error", operational, latencyMs }
  Notes     raw infrastructure errors are never returned

GET|POST /api/auth/[...nextauth]      Auth.js v5 runtime                            @ app/api/auth/[...nextauth]/route.ts:1, lib/auth/config.ts:18-88
  GET  /api/auth/csrf                 200 { csrfToken }
  GET  /api/auth/session              200 { user: { id, email, name, role }, expires } | {} when signed out
  POST /api/auth/callback/credentials form-urlencoded: csrfToken, email, password (+ json=true for a JSON reply)
                                      validated by: zod credentialsSchema   @ lib/auth/config.ts:13-16
           success -> Set-Cookie session (JWT strategy), role baked into token   @ lib/auth/config.ts:73-79
           failure -> no session (wrong password, unknown email, and rate-limited all look the same)  @ lib/auth/config.ts:36-60
  Notes     rate limits: per email + per IP, counted in auth_attempts    @ lib/auth/rate-limit-policy.ts
            rate limiter FAILS OPEN when the DB check errors             @ lib/auth/rate-limit.ts:34-36

POST /api/blob-upload                 Auth: session (owner, or assigned vendor for request paths)   @ app/api/blob-upload/route.ts:45
  Request   multipart/form-data: file (File), pathname (string)
            pathname: turnflow/{requestId}/{type}/{uid}/... | turnflow-property/{propertyId}/{uid}/...
            validated by: content-type allowlist :27-33, 4 MB cap :39, parseUploadPath + ownership :99-129
  200       { url: "/api/files?path=<pathname>", pathname }
  400       { error: "Malformed upload request." | "Upload request is missing the file or its target path." }
  403       { error: "Not signed in" | "Not authorized to upload to this path" | "Unknown upload folder" | ... }
  413       { error: "This file is too large to upload here (limit ~4 MB)..." }
  415       { error: "Unsupported file type: <type>" }
  502       { error: "File storage rejected the upload. Try again shortly." }
  503       { error: "File uploads are not configured on the server." }
  Notes     random suffix makes blob names unguessable (:134). Order of checks: token -> form -> type -> size -> auth

GET /api/files?path=<pathname>        Auth: session + canReadUpload                 @ app/api/files/route.ts:21
  200       file stream, Content-Type from blob, Cache-Control: private, no-store, X-Content-Type-Options: nosniff
  400       { error: "Unknown file." }
  401       { error: "Sign in to view this file." }
  404       { error: "File not found." }   (same answer for missing and not-yours, so paths can't be probed)
  502       { error: "File storage could not return this file." }
  503       { error: "File storage is not configured on the server." }
  Notes     NOT listed in docs/ENDPOINT_EXPERIENCE_MAP.md (GAP-ERASER-06)

GET /api/cron/reminder-digest         Auth: Bearer CRON_SECRET (Vercel Cron)        @ app/api/cron/reminder-digest/route.ts:17
  200       { ownersNotified: number, remindersConsidered: number }
  401       { error: "Unauthorized" }
  503       { error: "CRON_SECRET is not configured" }   (production only)    @ lib/cron-auth.ts:12-25
  Notes     idempotent per 72 h cooldown (last_notified_at). No try/catch: a DB error becomes an unlogged 500

GET /api/cron/reset-investor-demo     Auth: Bearer CRON_SECRET                      @ app/api/cron/reset-investor-demo/route.ts:15
  200       { reset: true } | { skipped: true, reason }
  401|503   { error }
  503       { skipped: true, reason: <password problem> }
  500       { error: "Investor demo reset failed" }
  Notes     NOT listed in docs/ENDPOINT_EXPERIENCE_MAP.md (GAP-ERASER-06)
```

## Server actions (44)

Legend: **Role** is the `requireRole`/`requireAnyRole` gate. **Owns** is the record-level check inside the action. **Validation**: `zod` = schema, `manual` = hand-written checks, `none` = takes raw values. **Errors**: R = returns `{error}`, T = throws, D = redirect.

| Action | File:line | Role | Inputs | Validation | Success | Errors | Writes (rows) |
|---|---|---|---|---|---|---|---|
| signupAction | lib/actions/auth.ts:46 | public | form: name, email, password | zod (lib/auth/forms.ts) + rate limit | redirect to onboarding | R | users, auth_attempts |
| updateOwnerProfileAction | lib/actions/auth.ts:101 | owner | form: name | manual | state ok | R | users |
| loginAction | lib/actions/auth.ts:126 | public | form: email, password, callbackUrl | zod | redirect to role home | R | auth_attempts |
| logoutAction | lib/actions/auth.ts:175 | any | none | n/a | redirect | n/a | none |
| getBackupDataAction | lib/actions/backup.ts:11 | owner | none | n/a | backup JSON | D | none (read) |
| restoreBackupAction | lib/actions/backup.ts:99 | owner | object {properties[], requests[], billingRecords?[]} | manual per row; **no top-level shape or size check** | counts + errors[] | R/T | properties, requests, billing_records (add-only) |
| updateBillingRecordAction | lib/actions/billing-records.ts:17 | owner | ids + form: amount, status, invoiceReference, notes | manual | ok | R | billing_records, decision_log |
| submitCloseoutAction | lib/actions/closeout-submissions.ts:26 | vendor (assigned) | requestId + form: completionNotes, finalAmount, materialsNotes | manual | ok | R | closeout_submissions, requests, decision_log, notification_log |
| reviewCloseoutSubmissionAction | lib/actions/closeout-submissions.ts:116 | owner (owns) | ids, decision, form: reviewNotes | manual; **no check that closeout is still pending** | {ok, decision} | R | closeout_submissions, requests, request_tasks, billing_records, decision_log (5 writes, not atomic) |
| createCommentAction | lib/actions/comments.ts:9 | owner / vendor / collaborator (on request) | requestId, text | manual | ok | T | comments |
| createVendorInviteAction | lib/actions/invites.ts:107 | owner (owns) | requestId, email | zod (lib/invites/forms.ts) | ok + link | R | invites, requests, decision_log, notification_log |
| createCollaboratorInviteAction | lib/actions/invites.ts:111 | owner (owns) | requestId, email | zod | ok + link | R | same as above |
| removeSharedAccessAction | lib/actions/invites.ts:131 | owner (owns) | form | manual | state ok | R | requests, decision_log |
| cancelInviteAction | lib/actions/invites.ts:192 | owner (owns) | form | manual | state ok | R | invites (delete), requests, decision_log |
| resendInviteAction | lib/actions/invites.ts:252 | owner (owns) | form | manual | state ok | R | invites, decision_log, notification_log |
| acceptInviteAction | lib/actions/invites.ts:385 | vendor / collaborator | inviteId | manual (lib/invites/claim.ts) | redirect target | R | invites, requests, decision_log |
| signupFromInviteAction | lib/actions/invites.ts:417 | public (invite-locked) | inviteId + form: name, password | zod | signed in + claimed | R | users, invites, requests, decision_log |
| sendTestNotificationAction | lib/actions/notifications.ts:7 | owner | none | n/a | ok | n/a | notification_log |
| createProperty | lib/actions/properties.ts:14 | owner | form: address, unit, nickname | manual | state ok | R | properties |
| deletePropertyAction | lib/actions/properties.ts:51 | owner (owns) | propertyId | manual | ok | T | properties (cascade: requests, logs, documents) |
| getPropertyRequestsForExportAction | lib/actions/properties.ts:96 | owner (owns) | propertyId | manual | rows | T | none (read) |
| createQuoteAction | lib/actions/quotes.ts:33 | owner (owns) | requestId + form: vendorName, vendorContact, amount, notes, attachmentBlobPath | manual + path validation | {quoteId} | R/T | quotes |
| approveQuoteAction | lib/actions/quotes.ts:81 | owner (owns) | requestId, quoteId | **no status check; others not declined** | void | T | quotes, requests, decision_log (3 writes, not atomic) |
| declineQuoteAction | lib/actions/quotes.ts:126 | owner (owns) | requestId, quoteId | manual | void | T | quotes, decision_log |
| deleteQuoteAction | lib/actions/quotes.ts:161 | owner (owns) | requestId, quoteId | manual | void | T | quotes, blob |
| createReminderAction | lib/actions/reminders.ts:25 | owner (owns property) | propertyId + form: title, intervalDays, notes | manual | ok | R/T | reminders |
| markReminderDoneAction | lib/actions/reminders.ts:56 | owner (owns) | ids | manual | void | T | reminders |
| deleteReminderAction | lib/actions/reminders.ts:80 | owner (owns) | ids | manual | void | T | reminders |
| createRequestTaskAction | lib/actions/request-tasks.ts:53 | owner (owns) | requestId + form: title, description, estimatedCost | manual | ok | R | request_tasks, decision_log |
| updateRequestTaskStatusAction | lib/actions/request-tasks.ts:98 | owner / assigned vendor | ids, status | manual (enum) | ok | R | request_tasks, decision_log |
| updateRequestTaskCostAction | lib/actions/request-tasks.ts:143 | owner (owns) | ids + form: estimatedCost, finalCost | manual | ok | R | request_tasks, decision_log |
| acceptRequestTaskAction | lib/actions/request-tasks.ts:177 | owner (owns) | ids | manual | ok | R | request_tasks, decision_log |
| deleteRequestTaskAction | lib/actions/request-tasks.ts:215 | owner (owns) | ids | manual | ok | R/T | request_tasks, decision_log |
| createRequestAction | lib/actions/requests.ts:38 | owner (owns property) | form: propertyId, title, category, urgency, location, contactMethod, accessInstructions, notes | manual (allowlists) | {requestId} | R | requests, decision_log (2 writes, not atomic) |
| recordRequestPhotoAction | lib/actions/requests.ts:119 | owner / assigned vendor | requestId, type, blobPath | path validation | ok | R/T | request_photos |
| updateRequestAction | lib/actions/requests.ts:165 | owner (owns) | form fields as create | manual (allowlists) | redirect | R | requests |
| deleteRequestAction | lib/actions/requests.ts:212 | owner (owns) | requestId | manual | void | T | requests (**cascade deletes decision_log**, F8) + blobs |
| updateCostAction | lib/actions/requests.ts:239 | owner (owns) | requestId, {estimatedCost, quotedCost, finalCost} | manual | ok | R/T | requests, decision_log |
| updateRequestStatusAction | lib/actions/requests.ts:284 | owner / assigned vendor | requestId, status, waiverReason? | policy (lib/request-status-policy.ts) | ok | R/T | requests, decision_log, notification_log |
| createVaultDocumentAction | lib/actions/vault.ts:28 | owner (owns property) | propertyId + form: name, category, requestId, blobPath | manual + path validation | ok | R | vault_documents |
| deleteVaultDocumentAction | lib/actions/vault.ts:87 | owner (owns) | ids | manual | void | T | vault_documents, blob |
| submitVendorBidAction | lib/actions/vendor-bids.ts:14 | vendor (assigned) | requestId + form: amount, availabilityWindow, notes | manual (lib/vendor-bid.ts) | ok | R | quotes, decision_log, notification_log |
| updateVendorProfileAction | lib/actions/vendor-profile.ts:13 | vendor | form: businessName, serviceArea, availability, notificationPreference, licenseInsuranceNotes | manual | ok | R | vendor_profiles |
| recordWorkSessionEventAction | lib/actions/work-sessions.ts:32 | vendor (assigned) | requestId, event, notes, taskLabel, proofPhotoId?, requestTaskId? | manual (lib/work-sessions.ts) | ok | R | work_sessions, requests, decision_log |

Columns marked "manual" were read from the files listed. The success and error shapes of the R-style actions follow each file's exported `*Result` / `*State` type (inferred for the ones not opened line by line).
