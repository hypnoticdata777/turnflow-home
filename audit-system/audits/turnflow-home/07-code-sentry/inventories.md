# TurnFlow Home: Code + Sentry inventories (@ b45b1ac)

## 1. Test coverage inventory

Measured during the audit:
- `npx vitest run`: **36 files, 342 tests, all passing, 2.8 s** (`cmd:npx vitest run`).
- `npx vitest run --coverage` (v8, `lib/**` + `app/**`): **38.53% lines, 40.08% statements, 47.65% branches, 41.52% functions**. `lib/actions` 0%, `app/api/files` 0%, `lib/auth` 22.97% lines (`cmd:npx vitest run --coverage`).

### Unit (Vitest, runs in CI through `npm run verify`, `package.json:25`)

| File | Tests | Covers (inferred from file and module names; counts measured) | Level |
|---|---|---|---|
| `__tests__/owner-readiness.test.ts` | 36 | onboarding progress and next step | unit (guidance) |
| `__tests__/utils.test.ts` | 36 | cost labels, completion requirements, enums | unit |
| `__tests__/helper-workspace.test.ts` | 24 | vendor/helper next-action logic | unit (guidance) |
| `__tests__/vendor-lifecycle.test.ts` | 15 | vendor job stages | unit |
| `__tests__/work-sessions.test.ts` | 15 | start/pause/resume/stop rules, proof gating | unit (domain rule) |
| `__tests__/request-guidance.test.ts` | 13 | request guidance copy | unit (guidance) |
| `__tests__/blob-paths.test.ts` | 12 | upload path parsing and validation (P0) | unit (security rule) |
| `__tests__/closeout-submissions.test.ts` | 12 | closeout readiness and decisions | unit (domain rule) |
| `__tests__/health.test.ts` | 12 | health payloads, deep-health auth | unit (route helper) |
| `__tests__/poc-readiness.test.ts` | 12 | env readiness report | unit |
| `__tests__/bid-review.test.ts` | 11 | bid comparison | unit |
| `__tests__/invite-claim.test.ts` | 11 | invite claim and mismatch rules | unit (security rule) |
| `__tests__/invite-forms.test.ts` | 9 | invite form validation (zod) | unit |
| `__tests__/notification-guidance.test.ts` | 9 | notification copy | unit (guidance) |
| `__tests__/decision-log.test.ts` | 8 | decision-log formatting | unit |
| `__tests__/request-intake.test.ts` | 8 | intake readiness | unit |
| `__tests__/request-status-policy.test.ts` | 8 | who may set which status (P0, F3) | unit (security rule) |
| `__tests__/request-submit.test.ts` | 8 | submit readiness | unit |
| `__tests__/seed-guard.test.ts` | 8 | hosted-DB seed password rules | unit (security rule) |
| `__tests__/vendor-fit.test.ts` | 8 | vendor fit scoring | unit |
| `__tests__/billing-records.test.ts` | 7 | billing status rules | unit |
| `__tests__/backup-guidance.test.ts` | 6 | backup copy | unit (guidance) |
| `__tests__/vendor-profile.test.ts` | 6 | profile normalization | unit |
| `__tests__/workspace-model.test.ts` | 6 | workspace defaults | unit |
| `__tests__/auth-forms.test.ts` | 5 | signup/login validation (zod) | unit |
| `__tests__/comment-guidance.test.ts` | 5 | comment copy | unit (guidance) |
| `__tests__/project-tasks.test.ts` | 5 | task status and acceptance | unit |
| `__tests__/file-access.test.ts` | 4 | who may read a file (P0) | unit (security rule) |
| `__tests__/rate-limit-policy.test.ts` | 4 | rate-limit windows and IP parsing | unit (security rule) |
| `__tests__/status-handoff.test.ts` | 4 | status handoff copy | unit (guidance) |
| `__tests__/vendor-bid.test.ts` | 4 | bid validation | unit |
| `__tests__/cron-auth.test.ts` | 3 | cron bearer, fail-closed in production | unit (security rule) |
| `__tests__/request-workflow.test.ts` | 3 | workflow helpers | unit |
| `__tests__/security-headers.test.ts` | 2 | CSP and security headers | unit |
| `__tests__/vendor-bid-notification.test.ts` | 2 | bid decision email | unit |
| `__tests__/investor-demo.test.ts` | 1 | demo password problem | unit |

### Browser smoke (Playwright scripts, manual only, not in CI)

| Script | Lines | Loop | Evidence |
|---|---|---|---|
| `ux:public` | 114 | landing → signup/login | `scripts/ux-public-smoke.ts`, `package.json:16` |
| `ux:owner` | 176 | owner pages render | `scripts/ux-owner-smoke.ts`, `package.json:17` |
| `ux:owner-flow` | 170 | signup → property → request → upload | `scripts/ux-owner-flow-smoke.ts`, `package.json:18` |
| `ux:helper` | 204 | vendor/collaborator portals | `scripts/ux-helper-smoke.ts`, `package.json:19` |
| `ux:invite` | 279 | invite → accept (existing account) | `scripts/ux-invite-acceptance-smoke.ts`, `package.json:20` |
| `ux:invite-signup` | 308 | invite → signup from invite (F4) | `scripts/ux-invite-signup-smoke.ts`, `package.json:21` |
| `ux:full-loop` | 622 | owner → vendor bid → work → closeout revision → approval → billing | `scripts/ux-full-loop-smoke.ts`, `package.json:22` |

### Totals by level

| Level | Count | In CI? |
|---|---|---|
| Unit | 36 files / 342 tests | yes |
| Integration (server action or route against a real DB) | **0** | n/a (GAP-BRUNO-01) |
| HTTP contract (Bruno or similar) | **0** (18 generated in `03-bruno/`) | n/a (GAP-BRUNO-02) |
| End-to-end (browser) | 7 scripts | **no** (GAP-CODE-02) |
| Moderated human sessions | 0 logged | n/a (GAP-FIGJAM-02) |

Walking skeleton end-to-end: **covered** by `ux:full-loop`, but only when someone runs it by hand.

## 2. Error-handling inventory

| Area | Finding | Evidence |
|---|---|---|
| Write-boundary validation | zod in 3 files (auth forms, invite forms, Auth.js credentials). The other 13 action files validate by hand. Allowlists for category, urgency, and status are present. | `lib/auth/forms.ts`, `lib/invites/forms.ts`, `lib/auth/config.ts:13-16`, `lib/actions/requests.ts:52-66` |
| Action error style | 61 × `return { error }`, 21 × `throw new Error`, plus redirects from `requireRole` | `02-eraser/contracts.md`, `lib/auth/dal.ts:25-36` |
| Restore input | Per-row checks, but no top-level array/shape or size check. A malformed file throws. | `lib/actions/backup.ts:99-114` |
| HTTP routes | Consistent `{ error }` JSON with correct statuses. Storage failures caught and mapped to 502/503. | `app/api/blob-upload/route.ts:139-149`, `app/api/files/route.ts:68-71` |
| Cron digest | No try/catch: a DB failure becomes an unhandled 500 with no structured log | `app/api/cron/reminder-digest/route.ts:17-82` |
| Swallowed errors | **0 empty catch blocks** | `search:catch\s*(\(...\))?\s*\{\s*\}` |
| Logging | 24 `console.error` call sites, which reach Vercel function logs only | `lib/auth/rate-limit.ts:35`, `lib/email.ts:53`, `app/api/files/route.ts:69` |
| Fail-open paths | Rate-limit check allows the request when its DB query fails (deliberate availability choice, but invisible) | `lib/auth/rate-limit.ts:34-36` |
| Email | Failures caught and logged to `notification_log`, never thrown (meets X5) | `lib/email.ts:53`, `docs/02-requirements/README.md:22` |
| Error UI | No `error.tsx`, `global-error.tsx`, or `not-found.tsx` (see `04-figma/state-matrix.md`) | `missing:app/error.tsx`, `missing:app/global-error.tsx` |
| Atomicity | No transactions (neon-http) | `lib/db/index.ts:2`, `search:db.transaction` |

## 3. Sentry setup status

| Item | Status | Evidence |
|---|---|---|
| SDK installed | **no** | `search:@sentry/` (only a transitive mention in package-lock.json) |
| Client init | **no** | `missing:instrumentation-client.ts` |
| Server init | **no** | `missing:instrumentation.ts`, `missing:sentry.server.config.ts` |
| Edge / proxy runtime init | **no** | `missing:sentry.edge.config.ts`, `proxy.ts` |
| environment / release tagging | **no** (but `/api/health` already exposes `VERCEL_ENV` and the commit SHA, which Sentry can reuse) | `lib/health.ts:79-80` |
| Source maps uploaded in CI | **no** | `.github/workflows/ci.yml:29-43` |
| PII scrubbing | n/a until installed | |
| Alert rules | not verifiable from the repo | |
| Planned? | **yes**: "Add Sentry integration (if not present) and basic alerts for 5xx rate and DB connection errors; add uptime check." | `docs/IMPLEMENTATION_BACKLOG.md:96-97` |
| Existing observability | `/api/health` (public), `/api/health/deep` (bearer, DB + runtime config), notification_log for email | `app/api/health/route.ts`, `app/api/health/deep/route.ts`, `docs/DEPLOYMENT.md:56` |

**PROPOSED setup** (Next.js 16): run `npx @sentry/wizard@latest -i nextjs`. Keep the existing `next.config.ts` headers when the wizard wraps it with `withSentryConfig`. Add Sentry's ingest host to `connect-src` in `lib/security-headers.ts` if the CSP blocks it. Set `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, and `SENTRY_AUTH_TOKEN` (CI only). Set `sendDefaultPii: false`, and add a `beforeSend` that drops request bodies for `/api/auth/*`.

## 4. Top risks (likelihood × impact, 1–3 each)

| Rank | Risk | L | I | Score | Gap |
|---|---|---|---|---|---|
| 1 | A production failure (DB timeout, thrown action) goes unnoticed, and the user sees a dead-end error page | 3 | 3 | 9 | GAP-CODE-01, GAP-FIGMA-01 |
| 2 | Approval or closeout half-applies on a mid-sequence failure (e.g. request Complete without a billing record) | 2 | 3 | 6 | GAP-ERASER-01 |
| 3 | An authorization regression in one of 44 server actions ships, because none is tested against a DB | 2 | 3 | 6 | GAP-BRUNO-01 |
| 4 | An owner deletes a request and loses its permanent history | 2 | 3 | 6 | GAP-ERASER-02 |
| 5 | Two quotes approved, or a decided closeout re-reviewed, leaving contradictory cost and status records | 2 | 2 | 4 | GAP-ERASER-03, GAP-ERASER-04 |
| 6 | Rate limiting silently disabled during a DB incident | 1 | 3 | 3 | GAP-CODE-01 |

## CI pipeline (what a bad PR still gets past)

`npm run verify` = lint → typecheck → unit tests → `npm audit --omit=dev` → `drizzle-kit generate` + `git diff --exit-code -- drizzle` → build (`package.json:25`, `.github/workflows/ci.yml:42-43`).

A PR can still: break an ownership check in a server action, break any route's HTTP contract, break the end-to-end loop, or drop coverage, and CI stays green.
