# TurnFlow Home: reverse-engineering audit summary

## 0. Scope

| | |
|---|---|
| Repository | https://github.com/hypnoticdata777/turnflow-home.git |
| Commit | `b45b1ac` (application code identical to `6a86af5`; later commits only add `audit-system/`) |
| Audited path | root (single Next.js app) |
| Stack | TS · Next.js 16.4 (App Router, Server Actions) · Drizzle + Neon · Auth.js v5 · Vercel Blob · Resend |
| Output mode | files → `audit-system/audits/turnflow-home/` |
| Capabilities | shell: yes · git history: yes · GitHub issues/PRs: yes (API) · running app: **no** (no Neon DB, Docker daemon down) |
| Prompt | `audit-system/prompt/reverse-engineering-prompt.md` (schema v1) |

## 1. Repository snapshot

| Item | Count | Evidence |
|---|---|---|
| Pages (routes users reach) | 16 (15 key screens + landing) | `app/**/page.tsx` |
| HTTP route handlers | 7 | `app/api/**/route.ts` |
| Server actions | 44 in 16 files | `lib/actions/*.ts` |
| Tables / enums / FK relationships | 21 / 17 / 50 | `lib/db/schema.ts` |
| Migrations | 13 (0000–0012), consistent | `drizzle/`, `cmd:npx drizzle-kit check` |
| Unit tests | 36 files, 342 tests, all green | `cmd:npx vitest run` |
| Line coverage | 38.53% (lib/actions 0%) | `cmd:npx vitest run --coverage` |
| Browser smoke scripts | 7 (manual, not in CI) | `package.json:16-22` |
| CI workflows | 1 (`npm run verify`) | `.github/workflows/ci.yml` |
| TODO / FIXME in code | 0 | `search:TODO|FIXME|HACK|XXX` |
| GitHub issues / PRs | 1 open issue / 2 closed PRs | `issue:#2` |
| Docs | 43 Markdown files (problem → requirements → design → algorithms → tests → roadmap) | `docs/` |

Status by tool: **all 7 Partial**. Every step has both a plan and a build, plus at least one medium or high gap.

| Step | Status | Gaps (H/M/L) |
|---|---|---|
| 1 FigJam | Partial | 0/2/1 |
| 2 Eraser.io | Partial | 2/3/1 |
| 3 Bruno | Partial | 1/1/0 |
| 4 Figma | Partial | 1/1/1 |
| 5 Prisma Studio (Drizzle) | Partial | 0/1/3 |
| 6 Plane | Partial | 0/1/2 |
| 7 Code + Sentry | Partial | 1/1/2 |
| **Total** | | **5 / 10 / 10 = 25** |

## 4. Top gaps

| Rank | Gap | Impact | Tool | What's wrong | Why it matters | Fix (ticket title) |
|---|---|---|---|---|---|---|
| 1 | GAP-ERASER-01 | high | Eraser | Multi-write actions aren't atomic (neon-http, no transactions) | Approval or closeout can half-apply and corrupt the record | Switch to a transaction-capable driver; make approval and closeout atomic |
| 2 | GAP-ERASER-02 | high | Eraser | Decision log is cascade-deleted with its request | Breaks the "permanent history" promise | Keep the decision log when a request is deleted (archive) |
| 3 | GAP-BRUNO-01 | high | Bruno | 0 integration/authorization tests; `lib/actions` 0% coverage | A broken ownership check ships silently | Build the server-action authorization matrix |
| 4 | GAP-FIGMA-01 | high | Figma | No `error.tsx` / `global-error.tsx` anywhere | Any unexpected failure is a dead end | Add error boundaries for every portal and the root |
| 5 | GAP-CODE-01 | high | Code + Sentry | No error tracking (Sentry planned, not installed) | Production errors are invisible | Capture server and client errors in Sentry with alerts |
| 6 | GAP-ERASER-03 | medium | Eraser | Several quotes can be approved per request | Contradictory cost records | Approve exactly one quote per request |
| 7 | GAP-ERASER-04 | medium | Eraser | A decided closeout can be reviewed again (**new finding**) | Request "Complete" with closeout "changes requested" | Review a closeout only while it is pending |
| 8 | GAP-BRUNO-02 | medium | Bruno | No HTTP contract tests for the 7 routes | File and upload authorization regressions go unseen | HTTP contract tests in CI |
| 9 | GAP-FIGJAM-01 | medium | FigJam | No password reset | Locked-out testers can't recover | Password reset by email |
| 10 | GAP-ERASER-05 | medium | Eraser | No single action contract; 21 throw vs 61 return | Inconsistent failures; restore accepts malformed input | One validated input/result contract |
| 11 | GAP-FIGMA-02 | medium | Figma | No route-level loading states | No feedback on slow navigations | Route-level loading states |
| 12 | GAP-CODE-02 | medium | Code + Sentry | Smoke loops not in CI | End-to-end regressions caught only manually | Run smoke loops on previews |
| 13 | GAP-FIGJAM-02 | medium | FigJam | 0 moderated sessions | The backbone is unvalidated | Run three moderated sessions |
| 14 | GAP-PRISMA-04 | medium | Prisma | Documented local setup doesn't work (**new finding**) | Contributors and CI need a Neon account | Local development without Neon |
| 15 | GAP-PLANE-01 | medium | Plane | Backlog lives only in Markdown | Progress is invisible | Move the backlog into the tracker |
| 16–25 | PRISMA-02, CODE-04, PRISMA-01, PRISMA-03, FIGJAM-03, ERASER-06, FIGMA-03, PLANE-02, PLANE-03, CODE-03 | low | | see `06-plane/tickets.md` §16–25 | | |

### If you fix only three things

1. **Sentry + error boundaries** (GAP-CODE-01 + GAP-FIGMA-01): you can't fix what you can't see, and users need a way back.
2. **Transactions for approval and closeout** (GAP-ERASER-01): the core loop's money and status records must never half-apply.
3. **Authorization matrix** (GAP-BRUNO-01): 44 hand-written ownership checks with zero tests is the biggest security exposure.

## 5. Coverage and limits

- The app wasn't started. The Bruno collection is parse-verified (22 files, `@usebruno/lang`) but not executed. Expected statuses come from handler code.
- Read in full: all 7 route handlers, `lib/db/schema.ts`, `lib/db/index.ts`, `lib/auth/config.ts`, `lib/auth/dal.ts`, `proxy.ts`, `lib/actions/quotes.ts` (approve), `lib/actions/requests.ts` (create, delete), `lib/actions/closeout-submissions.ts` (review), `lib/actions/backup.ts` (restore), `scripts/seed.ts`, CI, and the planning docs listed in the JSON evidence.
- Read by signature and grep only: the other server actions. Their rows in `02-eraser/contracts.md` marked "manual" or with inferred return shapes come from the signatures, the form fields, and the role guards.
- Not opened: `docs/BUILD_LOG.md` and the monthly build logs (~10k lines), the review PDF, `lib/pdf/*`, most guidance helpers.
- Not verifiable from the repo: Sentry alert rules (none installed), Figma/Plane/Eraser workspaces, production env values, Vercel cron execution history.
- PR #3 (`claude/sweet-hamilton-ltac32`) was opened and closed on GitHub during this session. It doesn't affect the audited code.

## 6. Self-check result

```text
$ python3 audit-system/schema/check_audit.py audit-system/audits/turnflow-home/audit.json --repo .
0 error(s), 0 warning(s), 25 gap(s).
```

Also verified:
- The Field Manual imports `audit.json` ("Valid against schema v1. No rule warnings."), and its export round-trips byte-identical.
- `schema.prisma` passes `prisma validate` (7.10.1).
- `seed-authz-personas.ts` passes the repo's `tsc --noEmit` and ESLint.
- During the run, the checker was fixed to treat Next.js `[id]` folders as literal paths before glob matching.

## 7. Plan to close the top gaps (6 hrs/week, 1 hr/day)

1 point ≈ 1 focused hour (estimates from `06-plane/tickets.md`). Six weeks, about 36 hours, fits before graduation. The order differs slightly from the impact ranking on purpose: **visibility first** (so every later bug shows up), **quick wins second** (momentum), **infrastructure before the tests that depend on it**.

| Week | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Exit check |
|---|---|---|---|---|---|---|---|
| 1 | T15 Set up Plane, import tickets | T4 Error boundaries | T4 (finish + test) | T5 Sentry: wizard + DSN | T5 server/edge + PII scrub | T5 alert rule + verify test error | A thrown error shows the TurnFlow error page **and** a Sentry issue |
| 2 | T7 Closeout pending check + test | T6 One approved quote | T6 (finish) | T1a neon-serverless client + `withTransaction` | T1a (rollback test) | Buffer: write the PR description / LinkedIn note | Two Gherkin scenarios pass as Vitest tests |
| 3 | T1b Atomic quote approval | T1b Atomic closeout review | T1b (failure-injection test) | T2 Archive instead of delete | T2 Insert-only decision log (DB rule) | T2 (finish + test) | Approval can't half-apply; history survives removal |
| 4 | T14 docker-compose + Neon proxy | T14 `dev-local.sh` | T3a Test DB harness | T3a | T3a | Buffer | `npm run test:integration` runs locally against a real DB |
| 5 | T3b Matrix: quotes | T3b Matrix: closeout | T3b Matrix: requests | T8 Adopt `03-bruno/` as `bruno/` | T8 Run it in CI | Re-run the audit prompt, import JSON, compare | Three action files fully matrix-tested; Bruno green in CI |
| 6 | T11 Loading states | T11 | T9 Password reset: tokens | T9 Reset UI | T9 Tests | Final audit diff + portfolio write-up | High gaps 5 → 0 |

**Deferred after graduation:** T3c (rest of the matrix), T10 (action contract), T12 (smoke loops in CI), T13 (moderated sessions), all low-impact tickets.

**Daily session template (60 min):** 5 min re-read the ticket's Gherkin → 40 min implement with a failing test first → 10 min run `npm run verify` → 5 min commit with the ticket key in the message.
