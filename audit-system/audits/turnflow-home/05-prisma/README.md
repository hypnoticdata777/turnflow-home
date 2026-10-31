# TurnFlow Home: data models, seed, and inspection (step 5)

**Equivalent tool in this repo:** Drizzle ORM + drizzle-kit (Drizzle Studio). The app doesn't use Prisma.

| Artifact | What it is |
|---|---|
| `schema.prisma` | Inspection-only Prisma schema equivalent to the 21 Drizzle tables. **Validated with Prisma 7.10.1** (`prisma validate`). Never migrate with it. |
| `seed-authz-personas.ts` | PROPOSED seed additions in the project's own Drizzle style. Passes the repo's `tsc --noEmit` and ESLint as-is. |

## Built state (verified)

| Check | Result | Evidence |
|---|---|---|
| Models ↔ migrations consistent | `drizzle-kit check`: "Everything's fine" | `cmd:npx drizzle-kit check`, `drizzle/` (13 migrations, 0000–0012) |
| Drift guard in CI | `db:generate` + `git diff --exit-code -- drizzle` inside `npm run verify` | `package.json:25`, `.github/workflows/ci.yml:42-43` |
| Seed deterministic | Yes: fixed fixtures, no randomness | `scripts/seed.ts:33-35` |
| Seed idempotent | Yes: upsert by email, address, and title | `scripts/seed.ts:37-60` |
| Seed guarded | Yes: hosted DB needs a non-default `SEED_PASSWORD` of 12+ characters, unit-tested | `lib/seed-guard.ts:13-35`, `__tests__/seed-guard.test.ts` |
| Personas | owner@test.com, vendor@test.com, collaborator@test.com (+ curated investor demo) | `scripts/seed.ts:173-178`, `lib/demo/investor-seed.ts` |
| Faker | Not used (hand-written fixtures). Fine for determinism. | `search:faker` |

## How to inspect the database

**Native (recommended):** run this with `DATABASE_URL` set in `.env.local`, then open the URL it prints:

```bash
npx drizzle-kit studio
```

**Prisma Studio on the same database (optional, read-mostly):**

```bash
mkdir -p tools/prisma-inspect && cp audit-system/audits/turnflow-home/05-prisma/schema.prisma tools/prisma-inspect/
cd tools/prisma-inspect && npm init -y && npm i -D prisma@7
cat > prisma.config.ts <<'EOF'
import "dotenv/config";
import { defineConfig, env } from "prisma/config";
export default defineConfig({ schema: "schema.prisma", datasource: { url: env("DATABASE_URL") } });
EOF
DATABASE_URL="<your Neon URL>" npx prisma studio
```

In Studio, open **Request**. Filter `status = Complete`, then open its `decisionLog` relation. Keep this in mind: deleting a request here deletes its log too (GAP-ERASER-02).

## Persona table (for Gherkin "Given" steps)

| Persona | Exists today? | UI state it reproduces | Used by |
|---|---|---|---|
| owner@test.com | yes (`scripts/seed.ts:173`) | Populated: one shared request "Kitchen faucet leaking" | Bruno `02-auth`, smoke scripts |
| vendor@test.com | yes (`scripts/seed.ts:174`) | Vendor Populated | smoke scripts |
| collaborator@test.com | yes (`scripts/seed.ts:175-179`) | Collaborator Populated | smoke scripts |
| idle@test.com | **PROPOSED** | every owner Idle state | Figma/Plane Idle scenarios |
| other-owner@test.com | **PROPOSED** | "other owner" row of the authorization matrix | GAP-BRUNO-01 |
| stranger-vendor@test.com | **PROPOSED** | "unassigned vendor" row | GAP-BRUNO-01 |
| busy@test.com | **PROPOSED** | Populated with 25 requests and a 200-char title | dashboard layout and pagination |

Dev password for all of them: your `SEED_PASSWORD` (`password123` only on a localhost database, `lib/seed-guard.ts:9`).

## Reset

There's no single reset command. Neon branches are the practical way: create a branch, `npm run db:migrate && npm run db:seed`, and delete the branch afterward. There's no `migrate reset` equivalent in drizzle-kit.

## GAP-PRISMA-04: the local database path in CONTRIBUTING doesn't work as written

- `CONTRIBUTING.md:23-26` says to run `./scripts/dev-local.sh`, which doesn't exist (`missing:scripts/dev-local.sh`, `missing:docker-compose.local.yml`; planned as backlog Task 0.5 at `docs/IMPLEMENTATION_BACKLOG.md:37-40`).
- The fallback, "run Postgres manually" (`CONTRIBUTING.md:37`), can't work with the current driver. `lib/db/index.ts:2-11` and `scripts/migrate.ts:2-4` use `@neondatabase/serverless` over **HTTP**, which needs a Neon endpoint or a local Neon HTTP proxy in front of plain Postgres (inferred from the driver choice).
- Meanwhile `lib/seed-guard.ts` and `docs/DEPLOYMENT.md:88-94` describe localhost databases as a supported case. So a new contributor (or a CI integration job) currently needs a Neon account to run anything.
- PROPOSED fix: add `docker-compose.local.yml` with `postgres:17` plus a Neon local HTTP proxy, and a `scripts/dev-local.sh` that waits for it, migrates, and seeds.
