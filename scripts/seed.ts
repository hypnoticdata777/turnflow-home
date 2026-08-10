// Dev seed script - creates deterministic demo accounts and scoped helper work.
//
// Run with: npm run db:seed

import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../lib/db/schema";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set - see .env.local.example");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

const SEED_PASSWORD = "password123";
const DEMO_PROPERTY_ADDRESS = "123 Demo Lane";
const DEMO_PROPERTY_NICKNAME = "Demo home";
const DEMO_REQUEST_TITLE = "Kitchen faucet leaking";

async function upsertDemoUser(
  email: string,
  role: "owner" | "vendor" | "collaborator",
  name: string
) {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });

  if (existing) {
    const [user] = await db
      .update(schema.users)
      .set({ passwordHash, role, name })
      .where(eq(schema.users.id, existing.id))
      .returning();
    return user;
  }

  const [user] = await db
    .insert(schema.users)
    .values({ email, passwordHash, role, name })
    .returning();
  return user;
}

async function upsertDemoProperty(ownerId: string) {
  const existing = await db.query.properties.findFirst({
    where: (p, { eq }) => eq(p.address, DEMO_PROPERTY_ADDRESS),
  });

  if (existing) {
    const [property] = await db
      .update(schema.properties)
      .set({
        ownerId,
        nickname: DEMO_PROPERTY_NICKNAME,
        updatedAt: new Date(),
      })
      .where(eq(schema.properties.id, existing.id))
      .returning();
    return property;
  }

  const [property] = await db
    .insert(schema.properties)
    .values({
      ownerId,
      address: DEMO_PROPERTY_ADDRESS,
      nickname: DEMO_PROPERTY_NICKNAME,
    })
    .returning();
  return property;
}

async function upsertDemoRequest({
  ownerId,
  propertyId,
  vendorId,
  collaboratorId,
}: {
  ownerId: string;
  propertyId: string;
  vendorId: string;
  collaboratorId: string;
}) {
  const existing = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.title, DEMO_REQUEST_TITLE),
  });

  const requestValues = {
    ownerId,
    propertyId,
    category: "Plumbing",
    urgency: "Medium",
    location: "Kitchen",
    accessInstructions: "Use the side gate lockbox. Demo code only.",
    contactMethod: "Email",
    notes: "Drips constantly, worse when the dishwasher runs.",
    status: "In Progress" as const,
    estimatedCost: "125.00",
    assignedVendorId: vendorId,
    collaboratorId,
    updatedAt: new Date(),
  };

  if (existing) {
    const [request] = await db
      .update(schema.requests)
      .set(requestValues)
      .where(eq(schema.requests.id, existing.id))
      .returning();
    return request;
  }

  const [request] = await db
    .insert(schema.requests)
    .values({
      ...requestValues,
      title: DEMO_REQUEST_TITLE,
    })
    .returning();
  return request;
}

async function main() {
  console.log("Seeding TurnFlow Home dev data...");

  const owner = await upsertDemoUser("owner@test.com", "owner", "Test Owner");
  const vendor = await upsertDemoUser("vendor@test.com", "vendor", "Test Vendor");
  const collaborator = await upsertDemoUser(
    "collaborator@test.com",
    "collaborator",
    "Test Collaborator"
  );

  const property = await upsertDemoProperty(owner.id);
  const request = await upsertDemoRequest({
    ownerId: owner.id,
    propertyId: property.id,
    vendorId: vendor.id,
    collaboratorId: collaborator.id,
  });

  console.log("Done. Seeded accounts reset to password: %s", SEED_PASSWORD);
  console.log(`  owner:         ${owner.email}`);
  console.log(`  vendor:        ${vendor.email}`);
  console.log(`  collaborator:  ${collaborator.email}`);
  console.log(`  shared request: ${request.title}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
