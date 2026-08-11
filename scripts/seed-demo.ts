// One-off script to add richer demo data for portfolio screenshots.
// Not part of the regular db:seed flow — run manually, once.
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../lib/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  const owner = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, "owner@test.com") });
  if (!owner) throw new Error("Run npm run db:seed first");

  const property = await db.query.properties.findFirst({ where: (p, { eq }) => eq(p.ownerId, owner.id) });
  if (!property) throw new Error("No property found");

  const demoRequests = [
    { title: "HVAC not cooling upstairs", category: "HVAC", urgency: "High", status: "Needs Review" as const, estimatedCost: "180.00", quotedCost: "245.00" },
    { title: "Gutter cleaning before winter", category: "Landscaping", urgency: "Low", status: "Scheduled" as const, estimatedCost: "120.00" },
    { title: "Water heater making noise", category: "Plumbing", urgency: "Medium", status: "Complete" as const, finalCost: "310.00" },
  ];

  for (const r of demoRequests) {
    const existing = await db.query.requests.findFirst({ where: (req, { eq }) => eq(req.title, r.title) });
    if (existing) continue;
    await db.insert(schema.requests).values({
      ownerId: owner.id,
      propertyId: property.id,
      title: r.title,
      category: r.category,
      urgency: r.urgency,
      status: r.status,
      estimatedCost: r.estimatedCost,
      quotedCost: "quotedCost" in r ? r.quotedCost : undefined,
      finalCost: "finalCost" in r ? r.finalCost : undefined,
      location: "Main level",
      contactMethod: "Email",
    });
    console.log("Added:", r.title);
  }

  // A real quote row on the HVAC request, for a populated quote-workspace screenshot.
  const hvacRequest = await db.query.requests.findFirst({ where: (req, { eq }) => eq(req.title, "HVAC not cooling upstairs") });
  if (hvacRequest) {
    const existingQuote = await db.query.quotes.findFirst({ where: (q, { eq }) => eq(q.requestId, hvacRequest.id) });
    if (!existingQuote) {
      await db.insert(schema.quotes).values({
        requestId: hvacRequest.id,
        vendorName: "CoolAir HVAC Services",
        vendorContact: "(555) 019-2244",
        amount: "245.00",
        notes: "Includes diagnostic + refrigerant top-off.",
        status: "approved",
        approvedById: owner.id,
        approvedAt: new Date(),
      });
      await db.insert(schema.quotes).values({
        requestId: hvacRequest.id,
        vendorName: "Budget Home Comfort",
        amount: "310.00",
        availabilityWindow: "Tomorrow afternoon",
        notes: "Includes diagnostic and basic filter check.",
        status: "pending",
      });
      console.log("Added: quotes for HVAC request");
    }

    const existingTask = await db.query.requestTasks.findFirst({ where: (task, { eq }) => eq(task.requestId, hvacRequest.id) });
    if (!existingTask) {
      await db.insert(schema.requestTasks).values([
        {
          requestId: hvacRequest.id,
          title: "Diagnose upstairs airflow",
          description: "Capture before proof at the upstairs vent and condenser before work starts.",
          status: "done",
          estimatedCost: "95.00",
          finalCost: "95.00",
          acceptedById: owner.id,
          acceptedAt: new Date(),
          sortOrder: 0,
          requiredPhotoTypes: ["before", "after"],
          createdById: owner.id,
        },
        {
          requestId: hvacRequest.id,
          title: "Complete refrigerant top-off",
          description: "Record final readings and after proof for owner review.",
          status: "in_progress",
          estimatedCost: "150.00",
          sortOrder: 1,
          requiredPhotoTypes: ["after", "receipt"],
          createdById: owner.id,
        },
      ]);
      console.log("Added: project tasks for HVAC request");
    }
  }

  // A vault document, for a populated vault screenshot.
  const existingDoc = await db.query.vaultDocuments.findFirst({ where: (v, { eq }) => eq(v.propertyId, property.id) });
  if (!existingDoc) {
    await db.insert(schema.vaultDocuments).values({
      propertyId: property.id,
      name: "Water heater warranty",
      category: "Warranty",
      url: "https://example.com/demo-warranty.pdf",
      blobPath: "turnflow-property/demo/warranty.pdf",
      uploadedById: owner.id,
    });
    console.log("Added: vault document");
  }

  // A recurring reminder, for a populated calendar screenshot.
  const existingReminder = await db.query.reminders.findFirst({ where: (r, { eq }) => eq(r.propertyId, property.id) });
  if (!existingReminder) {
    await db.insert(schema.reminders).values({
      propertyId: property.id,
      title: "Replace HVAC filter",
      intervalDays: 90,
      nextDueAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      notes: "3M Filtrete 16x25x1",
    });
    console.log("Added: reminder");
  }
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
