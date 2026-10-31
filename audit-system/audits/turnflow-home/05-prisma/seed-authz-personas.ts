// PROPOSED seed additions (audit 2026-10-30, GAP-PRISMA-03). Not wired into package.json.
//
// Adds the personas the existing seed (scripts/seed.ts) does not create:
//   - idle@test.com          owner with zero properties -> every Idle state
//   - other-owner@test.com   second owner with a property and a request -> "other owner" row of the
//                            authorization matrix (docs/06-testing/test-strategy.md:45-53)
//   - stranger-vendor@test.com vendor assigned to nothing -> "unassigned vendor" row
//   - busy@test.com          owner with 25 generated requests (long titles included) -> Populated / pagination
//
// Deterministic: a fixed-seed PRNG (same idea as faker.seed(42)) generates the busy owner's requests,
// so every run produces identical rows. Idempotent: users are upserted by email, and the busy owner's
// generated requests are deleted and recreated. Guarded: reuses lib/seed-guard.ts.
//
// To adopt: copy to scripts/seed-authz-personas.ts and add "db:seed:authz": "tsx scripts/seed-authz-personas.ts".

import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../../../../lib/db/schema";
import { resolveSeedPassword, seedPasswordProblem } from "../../../../lib/seed-guard";

config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set - see .env.local.example");
}
const passwordProblem = seedPasswordProblem({ DATABASE_URL, SEED_PASSWORD: process.env.SEED_PASSWORD });
if (passwordProblem) {
  throw new Error(`${passwordProblem} Set SEED_PASSWORD in .env.local and run again.`);
}

const db = drizzle(neon(DATABASE_URL), { schema });
const SEED_PASSWORD = resolveSeedPassword({ SEED_PASSWORD: process.env.SEED_PASSWORD });

// mulberry32: tiny deterministic PRNG. Seed 42 -> same sequence on every run.
function prng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = prng(42);
const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];

const CATEGORIES = ["Plumbing", "Electrical", "HVAC", "Appliance", "Other"] as const;
const URGENCIES = ["Low", "Medium", "High", "Emergency"] as const;
const STATUSES = ["Draft", "Needs Quote", "Scheduled", "In Progress", "Needs Review", "Complete"] as const;
const SUBJECTS = ["Kitchen sink", "Garage door", "Upstairs AC", "Water heater", "Back deck", "Dryer vent"];
const PROBLEMS = ["leaks after use", "makes a grinding noise", "stopped working", "needs annual service"];
const BUSY_PREFIX = "[seed:busy]";

async function upsertUser(email: string, role: "owner" | "vendor", name: string) {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const existing = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, email) });
  if (existing) {
    const [user] = await db
      .update(schema.users)
      .set({ passwordHash, role, name })
      .where(eq(schema.users.id, existing.id))
      .returning();
    return user;
  }
  const [user] = await db.insert(schema.users).values({ email, passwordHash, role, name }).returning();
  return user;
}

async function upsertProperty(ownerId: string, address: string, nickname: string) {
  const existing = await db.query.properties.findFirst({ where: (p, { eq }) => eq(p.address, address) });
  if (existing) return existing;
  const [property] = await db.insert(schema.properties).values({ ownerId, address, nickname }).returning();
  return property;
}

async function main() {
  // 1. Idle owner: account only. Every owner page shows its empty state.
  const idle = await upsertUser("idle@test.com", "owner", "Idle Owner");

  // 2. Other owner: owns a property + request that the main demo users must never reach.
  const otherOwner = await upsertUser("other-owner@test.com", "owner", "Other Owner");
  const otherProperty = await upsertProperty(otherOwner.id, "9 Elsewhere Court", "Other owner's home");
  const otherTitle = "Other owner's private repair";
  const otherRequest =
    (await db.query.requests.findFirst({ where: (r, { eq }) => eq(r.title, otherTitle) })) ??
    (
      await db
        .insert(schema.requests)
        .values({
          ownerId: otherOwner.id,
          propertyId: otherProperty.id,
          title: otherTitle,
          category: "Plumbing",
          urgency: "Medium",
          status: "Needs Quote",
        })
        .returning()
    )[0];

  // 3. Unassigned vendor: a real vendor account that is assigned to nothing.
  const stranger = await upsertUser("stranger-vendor@test.com", "vendor", "Stranger Vendor");

  // 4. Busy owner: 25 deterministic requests, one with a 200-character title.
  const busy = await upsertUser("busy@test.com", "owner", "Busy Owner");
  const busyProperty = await upsertProperty(busy.id, "500 Many Repairs Way", "Busy home");
  const oldRows = await db.query.requests.findMany({ where: (r, { eq }) => eq(r.ownerId, busy.id) });
  for (const row of oldRows.filter((r) => r.title.startsWith(BUSY_PREFIX))) {
    await db.delete(schema.requests).where(eq(schema.requests.id, row.id));
  }
  for (let i = 0; i < 25; i++) {
    const title =
      i === 0
        ? `${BUSY_PREFIX} ${"Very long title to test wrapping ".repeat(6)}`.slice(0, 200)
        : `${BUSY_PREFIX} ${pick(SUBJECTS)} ${pick(PROBLEMS)} #${i}`;
    await db.insert(schema.requests).values({
      ownerId: busy.id,
      propertyId: busyProperty.id,
      title,
      category: pick(CATEGORIES),
      urgency: pick(URGENCIES),
      status: pick(STATUSES),
    });
  }

  console.log("Authorization-matrix personas ready:");
  console.log(`  idle owner:        ${idle.email} (no data)`);
  console.log(`  other owner:       ${otherOwner.email} (request ${otherRequest.id})`);
  console.log(`  unassigned vendor: ${stranger.email}`);
  console.log(`  busy owner:        ${busy.email} (25 requests)`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
