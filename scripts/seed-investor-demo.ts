// Curated investor demo seed.
//
// This script resets only the @turnflow.demo investor accounts below, then
// rebuilds a polished owner/vendor/collaborator story for hosted demos.
import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../lib/db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set - see .env.local.example");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

const PASSWORD = "TurnFlowDemo!2026";
const OWNER_EMAIL = "investor.owner@turnflow.demo";
const VENDOR_EMAIL = "investor.vendor@turnflow.demo";
const HELPER_EMAIL = "investor.helper@turnflow.demo";

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function daysAgo(days: number) {
  return daysFromNow(-days);
}

function proofImage(label: string, background: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640"><rect width="960" height="640" fill="${background}"/><rect x="48" y="48" width="864" height="544" rx="28" fill="rgba(255,255,255,.82)" stroke="rgba(15,23,42,.22)" stroke-width="4"/><text x="96" y="170" fill="#0f172a" font-family="Arial, sans-serif" font-size="64" font-weight="700">${label}</text><text x="96" y="250" fill="#334155" font-family="Arial, sans-serif" font-size="34">TurnFlow Home investor demo</text><text x="96" y="315" fill="#475569" font-family="Arial, sans-serif" font-size="28">Public-safe proof placeholder</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function resetInvestorAccounts() {
  const existingOwner = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, OWNER_EMAIL),
  });
  const existingVendor = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, VENDOR_EMAIL),
  });
  const existingHelper = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, HELPER_EMAIL),
  });

  if (existingOwner) {
    const ownedRequests = await db.query.requests.findMany({
      columns: { id: true },
      where: (r, { eq }) => eq(r.ownerId, existingOwner.id),
    });
    const ownedProperties = await db.query.properties.findMany({
      columns: { id: true },
      where: (p, { eq }) => eq(p.ownerId, existingOwner.id),
    });
    const requestIds = ownedRequests.map((request) => request.id);
    const propertyIds = ownedProperties.map((property) => property.id);

    if (requestIds.length > 0) {
      await db
        .update(schema.requests)
        .set({
          pendingVendorInviteId: null,
          pendingCollaboratorInviteId: null,
        })
        .where(inArray(schema.requests.id, requestIds));
      await db
        .delete(schema.billingRecords)
        .where(inArray(schema.billingRecords.requestId, requestIds));
      await db
        .delete(schema.closeoutSubmissions)
        .where(inArray(schema.closeoutSubmissions.requestId, requestIds));
      await db
        .delete(schema.workSessions)
        .where(inArray(schema.workSessions.requestId, requestIds));
      await db
        .delete(schema.requestTasks)
        .where(inArray(schema.requestTasks.requestId, requestIds));
      await db
        .delete(schema.comments)
        .where(inArray(schema.comments.requestId, requestIds));
      await db
        .delete(schema.decisionLog)
        .where(inArray(schema.decisionLog.requestId, requestIds));
      await db
        .delete(schema.quotes)
        .where(inArray(schema.quotes.requestId, requestIds));
      await db
        .delete(schema.requestPhotos)
        .where(inArray(schema.requestPhotos.requestId, requestIds));
      await db
        .delete(schema.notificationLog)
        .where(inArray(schema.notificationLog.requestId, requestIds));
      await db
        .delete(schema.requests)
        .where(inArray(schema.requests.id, requestIds));
    }

    if (propertyIds.length > 0) {
      await db
        .delete(schema.vaultDocuments)
        .where(inArray(schema.vaultDocuments.propertyId, propertyIds));
      await db
        .delete(schema.reminders)
        .where(inArray(schema.reminders.propertyId, propertyIds));
      await db
        .delete(schema.notificationLog)
        .where(inArray(schema.notificationLog.propertyId, propertyIds));
      await db
        .delete(schema.properties)
        .where(inArray(schema.properties.id, propertyIds));
    }

    await db.delete(schema.invites).where(eq(schema.invites.ownerId, existingOwner.id));
    await db.delete(schema.contacts).where(eq(schema.contacts.ownerId, existingOwner.id));
    await db
      .delete(schema.notificationLog)
      .where(eq(schema.notificationLog.ownerId, existingOwner.id));
    await db.delete(schema.users).where(eq(schema.users.id, existingOwner.id));
  }

  if (existingVendor) {
    await db
      .delete(schema.vendorProfiles)
      .where(eq(schema.vendorProfiles.userId, existingVendor.id));
    await db.delete(schema.users).where(eq(schema.users.id, existingVendor.id));
  }

  if (existingHelper) {
    await db.delete(schema.users).where(eq(schema.users.id, existingHelper.id));
  }
}

async function createUser(
  email: string,
  role: "owner" | "vendor" | "collaborator",
  name: string
) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const [user] = await db
    .insert(schema.users)
    .values({ email, passwordHash, role, name })
    .returning();
  return user;
}

async function main() {
  console.log("Resetting curated investor demo accounts...");
  await resetInvestorAccounts();

  const owner = await createUser(OWNER_EMAIL, "owner", "Maya Rivera");
  const vendor = await createUser(VENDOR_EMAIL, "vendor", "Brightside Home Services");
  const helper = await createUser(HELPER_EMAIL, "collaborator", "Jordan Lee");

  await db.insert(schema.vendorProfiles).values({
    userId: vendor.id,
    businessName: "Brightside Home Services",
    trades: ["HVAC", "Plumbing", "Handyman"],
    serviceArea: "Austin metro homes and rentals",
    availability: "Weekdays 8 AM-5 PM; urgent leaks and no-cooling calls by request",
    notificationPreference: "Email",
    licenseInsuranceNotes: "Demo profile: licensed HVAC and general repair partner.",
  });

  const [home] = await db
    .insert(schema.properties)
    .values({
      ownerId: owner.id,
      address: "1842 Cedar Bend Dr, Austin, TX",
      nickname: "Cedar Bend home",
      createdAt: daysAgo(16),
      updatedAt: daysAgo(1),
    })
    .returning();

  const [rental] = await db
    .insert(schema.properties)
    .values({
      ownerId: owner.id,
      address: "Unit B - 77 Willow Creek Ln, Round Rock, TX",
      nickname: "Willow Creek rental",
      createdAt: daysAgo(12),
      updatedAt: daysAgo(2),
    })
    .returning();

  const [hvac] = await db
    .insert(schema.requests)
    .values({
      ownerId: owner.id,
      propertyId: home.id,
      title: "Upstairs HVAC cooling loss",
      category: "HVAC",
      urgency: "High",
      location: "Upstairs hallway and primary bedroom",
      contactMethod: "Text first, then email summary",
      accessInstructions: "Use smart lock code from the owner thread. Do not enter the nursery.",
      notes:
        "System runs but upstairs stays warm by late afternoon. Owner wants before/after proof, final cost, and a clean closeout record.",
      status: "Needs Review",
      assignedVendorId: vendor.id,
      collaboratorId: helper.id,
      estimatedCost: "250.00",
      quotedCost: "420.00",
      finalCost: "420.00",
      createdAt: daysAgo(7),
      updatedAt: daysAgo(1),
    })
    .returning();

  const [waterHeater] = await db
    .insert(schema.requests)
    .values({
      ownerId: owner.id,
      propertyId: rental.id,
      title: "Water heater leak inspection",
      category: "Plumbing",
      urgency: "Medium",
      location: "Utility closet",
      contactMethod: "Email",
      accessInstructions: "Tenant can open the side gate after 10 AM.",
      notes:
        "Small drip appears under the pan after showers. Need diagnosis, quote, and a photo-backed recommendation.",
      status: "In Progress",
      assignedVendorId: vendor.id,
      estimatedCost: "175.00",
      quotedCost: "260.00",
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
    })
    .returning();

  const [gutter] = await db
    .insert(schema.requests)
    .values({
      ownerId: owner.id,
      propertyId: home.id,
      title: "Gutter cleaning before storm season",
      category: "Landscaping",
      urgency: "Low",
      location: "Front porch, garage side, and back patio run",
      contactMethod: "Email",
      notes: "Preventive maintenance before fall storms. Owner wants receipt saved to the vault.",
      status: "Scheduled",
      estimatedCost: "145.00",
      createdAt: daysAgo(4),
      updatedAt: daysAgo(2),
    })
    .returning();

  const [smokeDetector] = await db
    .insert(schema.requests)
    .values({
      ownerId: owner.id,
      propertyId: home.id,
      title: "Smoke detector battery sweep",
      category: "Electrical",
      urgency: "Low",
      location: "All bedrooms and hallway",
      contactMethod: "Text",
      notes: "Annual safety sweep completed and logged for the home record.",
      status: "Complete",
      collaboratorId: helper.id,
      estimatedCost: "60.00",
      finalCost: "48.00",
      createdAt: daysAgo(20),
      updatedAt: daysAgo(10),
    })
    .returning();

  const [garageDoor] = await db
    .insert(schema.requests)
    .values({
      ownerId: owner.id,
      propertyId: home.id,
      title: "Garage door tune-up estimate",
      category: "Handyman",
      urgency: "Medium",
      location: "Two-car garage",
      contactMethod: "Email",
      notes: "Door shudders near the top. Owner has not chosen a vendor yet.",
      status: "Needs Quote",
      estimatedCost: "180.00",
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    })
    .returning();

  const [gutterVendorInvite] = await db
    .insert(schema.invites)
    .values({
      ownerId: owner.id,
      requestId: gutter.id,
      role: "vendor",
      email: "rainready.gutters@example.com",
      status: "pending",
      expiresAt: daysFromNow(6),
      createdAt: daysAgo(1),
    })
    .returning();

  const [garageHelperInvite] = await db
    .insert(schema.invites)
    .values({
      ownerId: owner.id,
      requestId: garageDoor.id,
      role: "collaborator",
      email: "family-helper@example.com",
      status: "pending",
      expiresAt: daysFromNow(5),
      createdAt: daysAgo(1),
    })
    .returning();

  await db
    .update(schema.requests)
    .set({
      pendingVendorInviteId: gutterVendorInvite.id,
    })
    .where(eq(schema.requests.id, gutter.id));
  await db
    .update(schema.requests)
    .set({
      pendingCollaboratorInviteId: garageHelperInvite.id,
    })
    .where(eq(schema.requests.id, garageDoor.id));

  const [hvacBefore] = await db
    .insert(schema.requestPhotos)
    .values({
      requestId: hvac.id,
      type: "before",
      url: proofImage("HVAC before proof", "#dbeafe"),
      blobPath: "investor-demo/hvac-before.svg",
      uploadedById: owner.id,
      createdAt: daysAgo(7),
    })
    .returning();

  const [hvacAfter] = await db
    .insert(schema.requestPhotos)
    .values({
      requestId: hvac.id,
      type: "after",
      url: proofImage("HVAC after proof", "#dcfce7"),
      blobPath: "investor-demo/hvac-after.svg",
      uploadedById: vendor.id,
      createdAt: daysAgo(1),
    })
    .returning();

  await db.insert(schema.requestPhotos).values([
    {
      requestId: waterHeater.id,
      type: "before",
      url: proofImage("Water heater leak", "#cffafe"),
      blobPath: "investor-demo/water-heater-before.svg",
      uploadedById: helper.id,
      createdAt: daysAgo(5),
    },
    {
      requestId: smokeDetector.id,
      type: "receipt",
      url: proofImage("Battery receipt", "#fef3c7"),
      blobPath: "investor-demo/smoke-detector-receipt.svg",
      uploadedById: owner.id,
      createdAt: daysAgo(10),
    },
  ]);

  const [diagnosticTask] = await db
    .insert(schema.requestTasks)
    .values({
      requestId: hvac.id,
      title: "Diagnose upstairs airflow",
      description: "Capture intake temperature and vent output before repairs.",
      status: "done",
      estimatedCost: "120.00",
      finalCost: "120.00",
      acceptedById: owner.id,
      acceptedAt: daysAgo(1),
      sortOrder: 0,
      requiredPhotoTypes: ["before"],
      createdById: owner.id,
      createdAt: daysAgo(7),
      updatedAt: daysAgo(1),
    })
    .returning();

  await db.insert(schema.requestTasks).values([
    {
      requestId: hvac.id,
      title: "Replace failed capacitor and test cycle",
      description: "Record part replacement, final readings, and after proof.",
      status: "done",
      estimatedCost: "300.00",
      finalCost: "300.00",
      acceptedById: owner.id,
      acceptedAt: daysAgo(1),
      sortOrder: 1,
      requiredPhotoTypes: ["after", "receipt"],
      createdById: vendor.id,
      createdAt: daysAgo(6),
      updatedAt: daysAgo(1),
    },
    {
      requestId: waterHeater.id,
      title: "Confirm source of pan drip",
      description: "Check supply valve, drain valve, and expansion tank before recommending replacement.",
      status: "in_progress",
      estimatedCost: "175.00",
      sortOrder: 0,
      requiredPhotoTypes: ["before", "after"],
      createdById: owner.id,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
    },
  ]);

  await db.insert(schema.quotes).values([
    {
      requestId: hvac.id,
      submittedByVendorId: vendor.id,
      vendorName: "Brightside Home Services",
      vendorContact: VENDOR_EMAIL,
      amount: "420.00",
      availabilityWindow: "Completed next morning",
      notes: "Diagnostic, capacitor replacement, system test, and proof photos included.",
      status: "approved",
      approvedById: owner.id,
      approvedAt: daysAgo(2),
      createdAt: daysAgo(6),
      updatedAt: daysAgo(2),
    },
    {
      requestId: hvac.id,
      vendorName: "Capital City HVAC",
      vendorContact: "quotes@example.com",
      amount: "575.00",
      availabilityWindow: "Three business days",
      notes: "Higher quote, later availability, no proof packet included.",
      status: "declined",
      createdAt: daysAgo(6),
      updatedAt: daysAgo(2),
    },
    {
      requestId: waterHeater.id,
      submittedByVendorId: vendor.id,
      vendorName: "Brightside Home Services",
      vendorContact: VENDOR_EMAIL,
      amount: "260.00",
      availabilityWindow: "Tomorrow between 10 AM and noon",
      notes: "Inspection plus valve repair if no replacement is needed.",
      status: "pending",
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
    },
  ]);

  await db.insert(schema.comments).values([
    {
      requestId: hvac.id,
      authorId: owner.id,
      text: "Please keep the upstairs nursery closed while testing airflow.",
      createdAt: daysAgo(6),
    },
    {
      requestId: hvac.id,
      authorId: vendor.id,
      text: "Found a failed capacitor and weak airflow upstairs. Uploaded before and after proof.",
      createdAt: daysAgo(1),
    },
    {
      requestId: hvac.id,
      authorId: helper.id,
      text: "I checked the hallway after the repair. Temperature is dropping normally now.",
      createdAt: daysAgo(1),
    },
    {
      requestId: waterHeater.id,
      authorId: vendor.id,
      text: "Inspection is underway. Early sign points to the supply valve, not the tank body.",
      createdAt: daysAgo(1),
    },
  ]);

  await db.insert(schema.workSessions).values([
    {
      requestId: hvac.id,
      vendorId: vendor.id,
      proofPhotoId: hvacBefore.id,
      requestTaskId: diagnosticTask.id,
      taskLabel: "Diagnose upstairs airflow",
      event: "started",
      notes: "Started with vent temperature readings and condenser inspection.",
      createdAt: daysAgo(2),
    },
    {
      requestId: hvac.id,
      vendorId: vendor.id,
      proofPhotoId: hvacAfter.id,
      requestTaskId: diagnosticTask.id,
      taskLabel: "Diagnose upstairs airflow",
      event: "stopped",
      notes: "Repair complete; after proof uploaded for owner review.",
      createdAt: daysAgo(1),
    },
  ]);

  const [closeout] = await db
    .insert(schema.closeoutSubmissions)
    .values({
      requestId: hvac.id,
      vendorId: vendor.id,
      completionNotes:
        "Replaced failed capacitor, verified cooling cycle, and confirmed upstairs vent output.",
      materialsNotes: "Capacitor and diagnostic labor included. Receipt image is pending owner archive.",
      finalAmount: "420.00",
      status: "pending",
      submittedAt: daysAgo(1),
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    })
    .returning();

  await db.insert(schema.billingRecords).values({
    requestId: hvac.id,
    ownerId: owner.id,
    vendorId: vendor.id,
    closeoutSubmissionId: closeout.id,
    amount: "420.00",
    status: "recorded",
    invoiceReference: "INV-TFH-420",
    notes: "Awaiting owner final review before marking paid.",
    recordedAt: daysAgo(1),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  });

  await db.insert(schema.vaultDocuments).values([
    {
      propertyId: home.id,
      requestId: smokeDetector.id,
      name: "Smoke detector battery receipt",
      category: "Receipt",
      url: "https://example.com/turnflow-demo/smoke-detector-receipt.pdf",
      blobPath: "investor-demo/smoke-detector-receipt.pdf",
      uploadedById: owner.id,
      createdAt: daysAgo(10),
    },
    {
      propertyId: home.id,
      name: "HVAC warranty and service manual",
      category: "Warranty",
      url: "https://example.com/turnflow-demo/hvac-warranty.pdf",
      blobPath: "investor-demo/hvac-warranty.pdf",
      uploadedById: owner.id,
      createdAt: daysAgo(9),
    },
  ]);

  await db.insert(schema.reminders).values([
    {
      propertyId: home.id,
      title: "Replace HVAC filter",
      intervalDays: 90,
      lastCompletedAt: daysAgo(80),
      nextDueAt: daysFromNow(10),
      notes: "16x25x1 filter stored in laundry shelf.",
      createdAt: daysAgo(20),
      updatedAt: daysAgo(1),
    },
    {
      propertyId: rental.id,
      title: "Flush water heater",
      intervalDays: 365,
      nextDueAt: daysFromNow(28),
      notes: "Coordinate with tenant at least two days ahead.",
      createdAt: daysAgo(12),
      updatedAt: daysAgo(2),
    },
  ]);

  await db.insert(schema.notificationLog).values([
    {
      ownerId: owner.id,
      requestId: gutter.id,
      propertyId: home.id,
      type: "invite",
      recipientEmail: "rainready.gutters@example.com",
      subject: "TurnFlow Home vendor invite: Gutter cleaning before storm season",
      status: "failed",
      error: "Demo mode: RESEND_API_KEY is not configured, copyable invite link shown instead.",
      createdAt: daysAgo(1),
    },
    {
      ownerId: owner.id,
      propertyId: home.id,
      type: "reminder_digest",
      recipientEmail: OWNER_EMAIL,
      subject: "Upcoming home maintenance reminders",
      status: "failed",
      error: "Demo mode: email delivery intentionally deferred.",
      createdAt: daysAgo(1),
    },
  ]);

  await db.insert(schema.decisionLog).values([
    {
      requestId: hvac.id,
      actorId: owner.id,
      action: "status_changed",
      details: { from: "Needs Quote", to: "Scheduled" },
      createdAt: daysAgo(6),
    },
    {
      requestId: hvac.id,
      actorId: owner.id,
      action: "quote_approved",
      details: { amount: "420.00", vendor: "Brightside Home Services" },
      createdAt: daysAgo(2),
    },
    {
      requestId: hvac.id,
      actorId: vendor.id,
      action: "closeout_submitted",
      details: { finalAmount: "420.00", status: "pending" },
      createdAt: daysAgo(1),
    },
    {
      requestId: waterHeater.id,
      actorId: vendor.id,
      action: "status_changed",
      details: { from: "Scheduled", to: "In Progress" },
      createdAt: daysAgo(1),
    },
  ]);

  console.log("Investor demo seed complete.");
  console.log(`  owner:        ${OWNER_EMAIL}`);
  console.log(`  vendor:       ${VENDOR_EMAIL}`);
  console.log(`  collaborator: ${HELPER_EMAIL}`);
  console.log(`  password:     ${PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Investor demo seed failed:", err);
    process.exit(1);
  });
