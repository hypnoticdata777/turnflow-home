# TurnFlow Home Code Glossary

## Architecture vocabulary

| Term | Plain-language meaning | Repository evidence |
|---|---|---|
| App Router | Folders under `app/` define pages and server endpoints. | `app/page.tsx`, `app/owner/**/page.tsx`, `app/api/**/route.ts` |
| Server Component | A React component that reads data and renders on the server by default. | Owner, vendor, and collaborator page files |
| Client Component | Interactive browser code marked with `"use client"`. | Form, upload, workspace, and timeline components in `components/` |
| Server Action | A server-side mutation callable from a form or client component. Each action must re-check authorization. | `lib/actions/*.ts` |
| Route Handler | An HTTP endpoint implemented with exported `GET` or `POST` functions. | health, Auth.js, cron, Blob upload, authorized file-read, and demo-reset routes |
| DAL | The data-access boundary for session and role enforcement. | `lib/auth/dal.ts` |
| Proxy | A fast role-routing layer that redirects obvious invalid navigation. It is not the final authorization check. | `proxy.ts` |
| Drizzle ORM | Typed query and schema layer for Postgres. | `lib/db/index.ts`, `lib/db/schema.ts`, `drizzle/` |
| Neon | Serverless Postgres provider used by the runtime and migrations. | `@neondatabase/serverless`, deployment docs |
| Vercel Blob | Private object storage for request proof and vault documents; application routes authorize both writes and reads. | `app/api/blob-upload/route.ts`, `app/api/files/route.ts`, `lib/blob-paths.ts`, `lib/file-access.ts` |
| Auth.js | Credentials authentication and JWT session library. | `lib/auth/config.ts` |
| Decision log | Append-only request history for important workflow events. | `decision_log`, `components/DecisionLog.tsx` |
| Workspace | Ownership and future billing boundary around an owner’s records. | `workspaces`, `workspace_memberships`, `billing_accounts` |

## Important files and folders

| Path | Responsibility |
|---|---|
| `app/` | Routes, layouts, API handlers, and server-rendered page composition |
| `components/` | Interactive forms and workflow surfaces |
| `lib/actions/` | Authenticated mutations and revalidation |
| `lib/auth/config.ts` | Credentials provider, JWT/session callbacks, password verification |
| `lib/auth/dal.ts` | `requireRole`, `requireAnyRole`, and role home routing |
| `lib/auth/rate-limit.ts` | Postgres-backed login/signup counters; pure key and threshold rules live in `lib/auth/rate-limit-policy.ts` |
| `lib/request-status-policy.ts` | Pure role/status transition policy shared by mutation paths and tests |
| `lib/db/schema.ts` | Postgres enums, tables, foreign keys, relations, and inferred types |
| `lib/request-workflow.ts` | Owner-facing workflow rail derived from current request state |
| `lib/request-guidance.ts` | Completion-proof and next-action guidance |
| `lib/request-intake.ts` | Intake progress and vendor handoff readiness |
| `lib/vendor-lifecycle.ts` | Vendor lifecycle stages, queue metrics, and next action |
| `lib/closeout-submissions.ts` | Closeout readiness and owner review guidance |
| `lib/owner-readiness.ts` | Setup, dashboard, property, vault, calendar, and account signals |
| `lib/workspace.ts` | Creates and backfills the default owner workspace |
| `lib/poc-readiness.ts` | Checks environment shape without revealing values |
| `lib/pdf/` | Client-side proof packet and property history PDF generation |
| `scripts/` | Database setup, demo seeds, screenshots, readiness, and browser smoke tests |
| `drizzle/` | Committed SQL migrations and migration metadata |
| `docs/` | Deployment, QA, experience mapping, roadmap, testing, and build history |

## Core models

| Model | Meaning and important relationships |
|---|---|
| `users` | Authenticated owner, vendor, or collaborator account |
| `workspaces` | Owned container for properties, requests, invites, and billing records |
| `workspace_memberships` | Future-facing member/seat structure; owner membership is currently active |
| `billing_accounts` | Plan/status foundation; provider customer and subscription IDs are optional and currently unused |
| `properties` | A home owned by one user and optionally scoped to one workspace |
| `requests` | The central repair record with status, access, costs, and property link |
| `invites` | Expiring request-scoped invitation for a vendor or collaborator |
| `request_photos` | Before, after, receipt, or other proof stored in Blob |
| `quotes` | Owner-entered or vendor-submitted price option with approval state |
| `request_tasks` | Structured work scope, cost, proof expectations, completion, and owner acceptance |
| `work_sessions` | Vendor start, pause, resume, and stop events, optionally linked to proof and a task |
| `closeout_submissions` | Versioned vendor completion handoff and owner decision |
| `billing_records` | Owner-managed record of final charge status; not a payment transaction |
| `comments` | Shared request update thread |
| `decision_log` | Durable record of consequential workflow changes |
| `vault_documents` | Property document with optional request link |
| `reminders` | Recurring care schedule with next due and last notified timestamps |
| `notification_log` | Sent/failed delivery attempts and safe error context |
| `vendor_profiles` | Vendor trades, service area, availability, preferences, and owner-visible credential notes |
| `contacts` | Owner-scoped contact records retained from the original product model |

## High-value functions

| Function | What it decides |
|---|---|
| `roleHome` | Default route for owner, vendor, or collaborator |
| `requireRole` / `requireAnyRole` | Authenticates and enforces the allowed role inside server code |
| `createRequestAction` | Validates intake, checks property ownership, creates the request, logs creation |
| `updateRequestStatusAction` | Enforces allowed statuses, completion proof or waiver, decision logging, and notification |
| `recordRequestPhotoAction` | Allows only the owner or assigned vendor to attach evidence |
| `createVendorInviteAction` / `createCollaboratorInviteAction` | Creates a 14-day invite, links it to the request, logs it, attempts email |
| `acceptInviteAction` | Validates email, role, expiry, state, and request before granting scoped access |
| `requestWorkflowSteps` | Converts database state into the owner’s visible lifecycle rail |
| `vendorNextAction` | Chooses the most useful vendor action from bid, proof, work, closeout, and billing state |
| `closeoutReadiness` | Determines whether the vendor can submit the completion handoff |
| `reviewCloseoutSubmissionAction` | Records approval or requested changes; approval completes the request and creates billing history |
| `workSessionEventReadiness` | Requires before proof at start and after proof at stop |
| `evaluatePocReadiness` | Categorizes environment setup as ready, warning, or blocked |
| `sendNotification` | Sends through Resend when possible and always records the outcome |

## Status vocabularies

Request status: `Draft`, `Needs Quote`, `Waiting`, `Scheduled`, `In Progress`, `Needs Review`, `Complete`, `Archived`.

Task status: `todo`, `in_progress`, `blocked`, `done`.

Quote status: `pending`, `approved`, `declined`.

Closeout status: `pending`, `approved`, `changes_requested`.

Billing record status: `recorded`, `paid`, `disputed`, `void`.

Work-session event: `started`, `paused`, `resumed`, `stopped`.

## Where to make common changes

- Add an owner route: create an `app/owner/.../page.tsx`, add navigation in `components/OwnerSidebar.tsx`, and enforce `requireRole("owner")` in the page or its data path.
- Add a request field: update `lib/db/schema.ts`, generate and review a migration, update the Server Action, update the relevant page/component, then add tests.
- Change completion rules: update `meetsCompletionRequirements`, server enforcement in `updateRequestStatusAction`, and all guidance/tests that explain the rule.
- Add a notification: define the event at the mutation point, call `sendNotification`, add user-facing label/guidance, and test both configured and log-only behavior.
- Add a vendor capability: verify request assignment in the Server Action, keep unrelated owner data out of the portal query, and extend full-loop smoke coverage.
