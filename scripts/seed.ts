// Dev seed script — replaces the old Firebase build's seed.html.
// Creates one login-capable account per role (there's no self-serve
// signup in this port either, matching the original's console-created-
// account model) plus one sample property + request for the owner.
//
// Run with: npm run db:seed

import { config } from "dotenv";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../lib/db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — see .env.local.example");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

const SEED_PASSWORD = "password123";

async function upsertUser(email: string, role: "owner" | "vendor" | "collaborator", name: string) {
  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const [user] = await db
    .insert(schema.users)
    .values({ email, passwordHash, role, name })
    .returning();
  return user;
}

async function main() {
  console.log("Seeding TurnFlow Home dev data...");

  const owner = await upsertUser("owner@test.com", "owner", "Test Owner");
  const vendor = await upsertUser("vendor@test.com", "vendor", "Test Vendor");
  const collaborator = await upsertUser(
    "collaborator@test.com",
    "collaborator",
    "Test Collaborator"
  );

  let property = await db.query.properties.findFirst({
    where: (p, { eq }) => eq(p.ownerId, owner.id),
  });
  if (!property) {
    [property] = await db
      .insert(schema.properties)
      .values({
        ownerId: owner.id,
        address: "123 Main St",
        nickname: "The rental",
      })
      .returning();
  }

  const existingRequest = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.propertyId, property!.id),
  });
  if (!existingRequest) {
    await db.insert(schema.requests).values({
      ownerId: owner.id,
      propertyId: property!.id,
      title: "Kitchen faucet leaking",
      category: "Plumbing",
      urgency: "Medium",
      location: "Kitchen",
      contactMethod: "Email",
      notes: "Drips constantly, worse when the dishwasher runs.",
      status: "Draft",
    });
  }

  console.log("Done. Seeded accounts (all use password: %s):", SEED_PASSWORD);
  console.log(`  owner:         ${owner.email}`);
  console.log(`  vendor:        ${vendor.email}`);
  console.log(`  collaborator:  ${collaborator.email}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
