import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { chromium, type Page } from "playwright";
import * as schema from "../lib/db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set - see .env.local.example");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

const BASE_URL = process.env.UX_BASE_URL || process.env.APP_URL || "http://localhost:3000";
const RUN_ID =
  process.env.UX_FULL_LOOP_RUN_ID ||
  new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const PASSWORD = "Password123!";
const BID_AMOUNT = "420.50";
const FINAL_AMOUNT = "435.75";
const INVOICE_REFERENCE = `INV-${RUN_ID}`;
const CHANGE_REQUEST_NOTE = "Please clarify the receipt note before I approve this closeout.";

type Fixture = {
  ownerId: string;
  vendorId: string;
  collaboratorId: string;
  workspaceId: string;
  propertyId: string;
  requestId: string;
  requestTaskId: string;
  ownerEmail: string;
  vendorEmail: string;
  collaboratorEmail: string;
  requestTitle: string;
};

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function assertRecord<T>(record: T | undefined, label: string): T {
  if (!record) throw new Error(`${label} was not created`);
  return record;
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
    .returning({ id: schema.users.id });
  return assertRecord(user, `${role} user`);
}

async function createFixture(): Promise<Fixture> {
  const ownerEmail = `full-loop-owner-${RUN_ID}@example.com`;
  const vendorEmail = `full-loop-vendor-${RUN_ID}@example.com`;
  const collaboratorEmail = `full-loop-collab-${RUN_ID}@example.com`;
  const [owner, vendor, collaborator] = await Promise.all([
    createUser(ownerEmail, "owner", `Full Loop Owner ${RUN_ID}`),
    createUser(vendorEmail, "vendor", `Full Loop Vendor ${RUN_ID}`),
    createUser(collaboratorEmail, "collaborator", `Full Loop Collaborator ${RUN_ID}`),
  ]);

  await db.insert(schema.vendorProfiles).values({
    userId: vendor.id,
    businessName: `Loop Repair Co ${RUN_ID}`,
    trades: ["Plumbing", "General repair"],
    serviceArea: "Demo metro",
    availability: "Weekday mornings",
    notificationPreference: "email",
    licenseInsuranceNotes: "POC smoke-test profile.",
  });

  const [workspace] = await db
    .insert(schema.workspaces)
    .values({
      ownerId: owner.id,
      name: `Full loop smoke ${RUN_ID}`,
      slug: `full-loop-smoke-${RUN_ID}`,
    })
    .returning({ id: schema.workspaces.id });
  const createdWorkspace = assertRecord(workspace, "workspace");

  await db.insert(schema.workspaceMemberships).values({
    workspaceId: createdWorkspace.id,
    userId: owner.id,
    role: "owner",
    status: "active",
  });

  await db.insert(schema.billingAccounts).values({
    workspaceId: createdWorkspace.id,
    plan: "poc",
    status: "trialing",
    billingEmail: ownerEmail,
    trialEndsAt: daysFromNow(14),
  });

  const [property] = await db
    .insert(schema.properties)
    .values({
      ownerId: owner.id,
      workspaceId: createdWorkspace.id,
      address: `Full loop smoke home ${RUN_ID}`,
      nickname: `Full loop home ${RUN_ID}`,
    })
    .returning({ id: schema.properties.id });
  const createdProperty = assertRecord(property, "property");

  const requestTitle = `Full loop repair ${RUN_ID}`;
  const [request] = await db
    .insert(schema.requests)
    .values({
      ownerId: owner.id,
      workspaceId: createdWorkspace.id,
      propertyId: createdProperty.id,
      assignedVendorId: vendor.id,
      collaboratorId: collaborator.id,
      title: requestTitle,
      category: "Plumbing",
      urgency: "Medium",
      location: "Kitchen sink cabinet",
      contactMethod: "Email",
      accessInstructions: "Use the side door and text before arrival.",
      notes: "POC full-loop smoke request with scoped helper access.",
      status: "Needs Quote",
      estimatedCost: "400.00",
    })
    .returning({ id: schema.requests.id });
  const createdRequest = assertRecord(request, "request");

  const [task] = await db
    .insert(schema.requestTasks)
    .values({
      requestId: createdRequest.id,
      title: "Replace supply line and verify leak",
      description: "Vendor should complete repair and provide after-proof.",
      status: "todo",
      estimatedCost: "400.00",
      sortOrder: 1,
      requiredPhotoTypes: ["before", "after"],
      createdById: owner.id,
    })
    .returning({ id: schema.requestTasks.id });
  const createdTask = assertRecord(task, "request task");

  await db.insert(schema.decisionLog).values([
    {
      requestId: createdRequest.id,
      actorId: owner.id,
      action: "request_created",
      details: { title: requestTitle, category: "Plumbing" },
    },
    {
      requestId: createdRequest.id,
      actorId: owner.id,
      action: "invite_accepted",
      details: { role: "vendor", email: vendorEmail, smokeSeeded: true },
    },
    {
      requestId: createdRequest.id,
      actorId: owner.id,
      action: "invite_accepted",
      details: { role: "collaborator", email: collaboratorEmail, smokeSeeded: true },
    },
    {
      requestId: createdRequest.id,
      actorId: owner.id,
      action: "request_task_created",
      details: { title: "Replace supply line and verify leak" },
    },
  ]);

  return {
    ownerId: owner.id,
    vendorId: vendor.id,
    collaboratorId: collaborator.id,
    workspaceId: createdWorkspace.id,
    propertyId: createdProperty.id,
    requestId: createdRequest.id,
    requestTaskId: createdTask.id,
    ownerEmail,
    vendorEmail,
    collaboratorEmail,
    requestTitle,
  };
}

async function seedCompletedWork(fixture: Fixture) {
  const [beforePhoto, afterPhoto] = await db
    .insert(schema.requestPhotos)
    .values([
      {
        requestId: fixture.requestId,
        type: "before",
        url: `https://example.com/full-loop/${RUN_ID}/before.png`,
        blobPath: `turnflow/${fixture.requestId}/before/${fixture.vendorId}/before.png`,
        uploadedById: fixture.vendorId,
      },
      {
        requestId: fixture.requestId,
        type: "after",
        url: `https://example.com/full-loop/${RUN_ID}/after.png`,
        blobPath: `turnflow/${fixture.requestId}/after/${fixture.vendorId}/after.png`,
        uploadedById: fixture.vendorId,
      },
    ])
    .returning({ id: schema.requestPhotos.id, type: schema.requestPhotos.type });

  const createdBeforePhoto = assertRecord(beforePhoto, "before proof photo");
  const createdAfterPhoto = assertRecord(afterPhoto, "after proof photo");

  await db
    .update(schema.requestTasks)
    .set({
      status: "done",
      finalCost: FINAL_AMOUNT,
      updatedAt: new Date(),
    })
    .where(eq(schema.requestTasks.id, fixture.requestTaskId));

  await db.insert(schema.workSessions).values([
    {
      requestId: fixture.requestId,
      vendorId: fixture.vendorId,
      proofPhotoId: createdBeforePhoto.id,
      requestTaskId: fixture.requestTaskId,
      taskLabel: "Replace supply line and verify leak",
      event: "started",
      notes: "Started repair with before proof on record.",
    },
    {
      requestId: fixture.requestId,
      vendorId: fixture.vendorId,
      proofPhotoId: createdAfterPhoto.id,
      requestTaskId: fixture.requestTaskId,
      taskLabel: "Replace supply line and verify leak",
      event: "stopped",
      notes: "Stopped after verification and after proof.",
    },
  ]);

  await db
    .update(schema.requests)
    .set({ status: "Needs Review", updatedAt: new Date() })
    .where(eq(schema.requests.id, fixture.requestId));

  await db.insert(schema.decisionLog).values([
    {
      requestId: fixture.requestId,
      actorId: fixture.vendorId,
      action: "request_task_status_changed",
      details: { title: "Replace supply line and verify leak", to: "done" },
    },
    {
      requestId: fixture.requestId,
      actorId: fixture.vendorId,
      action: "work_session_event",
      details: {
        event: "started",
        taskLabel: "Replace supply line and verify leak",
        proofPhotoId: createdBeforePhoto.id,
        proofPhotoType: createdBeforePhoto.type,
      },
    },
    {
      requestId: fixture.requestId,
      actorId: fixture.vendorId,
      action: "work_session_event",
      details: {
        event: "stopped",
        taskLabel: "Replace supply line and verify leak",
        proofPhotoId: createdAfterPhoto.id,
        proofPhotoType: createdAfterPhoto.type,
      },
    },
    {
      requestId: fixture.requestId,
      actorId: fixture.vendorId,
      action: "status_changed",
      details: { from: "Scheduled", to: "Needs Review" },
    },
  ]);
}

async function cleanup(fixture: Fixture | null) {
  if (!fixture) return;

  await db.delete(schema.billingRecords).where(eq(schema.billingRecords.requestId, fixture.requestId));
  await db
    .delete(schema.closeoutSubmissions)
    .where(eq(schema.closeoutSubmissions.requestId, fixture.requestId));
  await db.delete(schema.workSessions).where(eq(schema.workSessions.requestId, fixture.requestId));
  await db.delete(schema.requestPhotos).where(eq(schema.requestPhotos.requestId, fixture.requestId));
  await db.delete(schema.quotes).where(eq(schema.quotes.requestId, fixture.requestId));
  await db.delete(schema.comments).where(eq(schema.comments.requestId, fixture.requestId));
  await db.delete(schema.decisionLog).where(eq(schema.decisionLog.requestId, fixture.requestId));
  await db.delete(schema.notificationLog).where(eq(schema.notificationLog.requestId, fixture.requestId));
  await db.delete(schema.requestTasks).where(eq(schema.requestTasks.requestId, fixture.requestId));
  await db.delete(schema.requests).where(eq(schema.requests.id, fixture.requestId));
  await db.delete(schema.properties).where(eq(schema.properties.id, fixture.propertyId));
  await db.delete(schema.billingAccounts).where(eq(schema.billingAccounts.workspaceId, fixture.workspaceId));
  await db
    .delete(schema.workspaceMemberships)
    .where(eq(schema.workspaceMemberships.workspaceId, fixture.workspaceId));
  await db.delete(schema.vendorProfiles).where(eq(schema.vendorProfiles.userId, fixture.vendorId));
  await db.delete(schema.workspaces).where(eq(schema.workspaces.id, fixture.workspaceId));
  await db
    .delete(schema.users)
    .where(inArray(schema.users.id, [fixture.ownerId, fixture.vendorId, fixture.collaboratorId]));
}

async function login(page: Page, email: string) {
  await page.goto(new URL("/login", BASE_URL).toString(), { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  if (overflow > 2) {
    throw new Error(`${label} has ${overflow}px horizontal overflow`);
  }
}

async function waitForDb(label: string, check: () => Promise<boolean>) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function vendorSubmitsBid(page: Page, fixture: Fixture) {
  await page.goto(new URL("/vendor", BASE_URL).toString(), { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: fixture.requestTitle }).first().waitFor({
    timeout: 15000,
  });
  await page.getByRole("button", { name: "Open workflow controls" }).first().click();
  await page
    .getByRole("button", { name: "Hide workflow controls" })
    .first()
    .waitFor({ timeout: 5000 });
  const bidPanel = page.locator(`[id="vendor-bid-${fixture.requestId}"]`);
  await bidPanel.getByLabel("Bid amount").fill(BID_AMOUNT);
  await bidPanel.getByLabel("Availability window").fill("Thursday morning");
  await bidPanel
    .getByLabel("Scope notes")
    .fill("Replace the failed supply line, test for leaks, and submit closeout proof.");
  await bidPanel.getByRole("button", { name: "Submit bid" }).click();
  await bidPanel.getByText("Bid saved for owner review.").waitFor({ timeout: 15000 });
  await waitForDb("vendor bid submission", async () => {
    const bid = await db.query.quotes.findFirst({
      where: (quote, { and, eq }) =>
        and(
          eq(quote.requestId, fixture.requestId),
          eq(quote.submittedByVendorId, fixture.vendorId)
        ),
    });
    return bid?.amount === BID_AMOUNT && bid.status === "pending";
  });
  await assertNoHorizontalOverflow(page, "vendor bid workspace");
}

async function ownerApprovesBid(page: Page, fixture: Fixture) {
  await page.goto(new URL(`/owner/requests/${fixture.requestId}`, BASE_URL).toString(), {
    waitUntil: "networkidle",
  });
  const quotePanel = page.locator("#quotes");
  await quotePanel.getByText("Submitted by assigned vendor").waitFor({ timeout: 15000 });
  await quotePanel.getByRole("button", { name: "Approve" }).first().click();
  await waitForDb("owner quote approval", async () => {
    const bid = await db.query.quotes.findFirst({
      where: (quote, { and, eq }) =>
        and(
          eq(quote.requestId, fixture.requestId),
          eq(quote.submittedByVendorId, fixture.vendorId)
        ),
    });
    const request = await db.query.requests.findFirst({
      where: (requestRow, { eq }) => eq(requestRow.id, fixture.requestId),
    });
    return bid?.status === "approved" && request?.quotedCost === BID_AMOUNT;
  });
  await assertNoHorizontalOverflow(page, "owner quote approval detail");
}

async function latestCloseoutForRequest(requestId: string) {
  const closeouts = await db.query.closeoutSubmissions.findMany({
    where: (submission, { eq }) => eq(submission.requestId, requestId),
    orderBy: (submission, { desc }) => desc(submission.submittedAt),
    columns: {
      finalAmount: true,
      reviewNotes: true,
      status: true,
    },
  });
  return closeouts[0];
}

async function vendorSubmitsCloseout(
  page: Page,
  fixture: Fixture,
  options: {
    completionNotes: string;
    materialsNotes: string;
    waitLabel: string;
  } = {
    completionNotes: "Supply line replaced, leak tested, and cabinet left dry.",
    materialsNotes: "Includes supply line, sealant, and cleanup.",
    waitLabel: "vendor closeout submission",
  }
) {
  await page.goto(new URL("/vendor", BASE_URL).toString(), { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open workflow controls" }).first().click();
  await page
    .getByRole("button", { name: "Hide workflow controls" })
    .first()
    .waitFor({ timeout: 5000 });
  const closeoutPanel = page.locator(`[id="vendor-closeout-${fixture.requestId}"]`);
  await closeoutPanel.getByRole("heading", { name: "Submit owner handoff" }).waitFor({
    timeout: 15000,
  });
  await closeoutPanel
    .getByLabel("Completion notes")
    .fill(options.completionNotes);
  await closeoutPanel
    .getByLabel("Materials or receipt notes")
    .fill(options.materialsNotes);
  await closeoutPanel.getByLabel("Final amount").fill(FINAL_AMOUNT);
  await closeoutPanel.getByRole("button", { name: "Submit closeout" }).click();
  await closeoutPanel.getByText("Closeout submitted for owner review.").waitFor({
    timeout: 15000,
  });
  await waitForDb(options.waitLabel, async () => {
    const closeout = await latestCloseoutForRequest(fixture.requestId);
    return closeout?.finalAmount === FINAL_AMOUNT && closeout.status === "pending";
  });
  await assertNoHorizontalOverflow(page, "vendor closeout workspace");
}

async function ownerRequestsCloseoutChanges(page: Page, fixture: Fixture) {
  await page.goto(new URL(`/owner/requests/${fixture.requestId}`, BASE_URL).toString(), {
    waitUntil: "networkidle",
  });
  const closeoutPanel = page.locator("#closeout");
  await closeoutPanel.getByText("Ready for owner decision").waitFor({ timeout: 15000 });
  await closeoutPanel.getByLabel("Owner review note").fill(CHANGE_REQUEST_NOTE);
  await closeoutPanel.getByRole("button", { name: "Request changes" }).click();
  await closeoutPanel.getByText("Closeout changes requested.").waitFor({
    timeout: 15000,
  });
  await waitForDb("owner closeout change request", async () => {
    const closeout = await latestCloseoutForRequest(fixture.requestId);
    return (
      closeout?.status === "changes_requested" &&
      closeout.reviewNotes === CHANGE_REQUEST_NOTE
    );
  });
  await assertNoHorizontalOverflow(page, "owner closeout change request detail");
}

async function vendorSeesCloseoutChangesRequested(page: Page, fixture: Fixture) {
  await page.goto(new URL("/vendor", BASE_URL).toString(), { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open workflow controls" }).first().click();
  await page
    .getByRole("button", { name: "Hide workflow controls" })
    .first()
    .waitFor({ timeout: 5000 });
  const closeoutPanel = page.locator(`[id="vendor-closeout-${fixture.requestId}"]`);
  await closeoutPanel.getByText("Changes requested").first().waitFor({ timeout: 15000 });
  await closeoutPanel.getByText(CHANGE_REQUEST_NOTE).waitFor({ timeout: 15000 });
  await assertNoHorizontalOverflow(page, "vendor closeout changes requested workspace");
}

async function ownerApprovesCloseoutAndUpdatesBilling(page: Page, fixture: Fixture) {
  await page.goto(new URL(`/owner/requests/${fixture.requestId}`, BASE_URL).toString(), {
    waitUntil: "networkidle",
  });
  const closeoutPanel = page.locator("#closeout");
  await closeoutPanel.getByText("Ready for owner decision").waitFor({ timeout: 15000 });
  await closeoutPanel.getByRole("button", { name: "Approve closeout" }).click();
  await waitForDb("owner closeout approval", async () => {
    const closeout = await latestCloseoutForRequest(fixture.requestId);
    const billingRecord = await db.query.billingRecords.findFirst({
      where: (record, { eq }) => eq(record.requestId, fixture.requestId),
    });
    return closeout?.status === "approved" && billingRecord?.amount === FINAL_AMOUNT;
  });

  await page.reload({ waitUntil: "networkidle" });
  const billingPanel = page.locator("#billing");
  await billingPanel.getByText("Final charge history").waitFor({ timeout: 15000 });
  await billingPanel.getByLabel("Status").selectOption("paid");
  await billingPanel.getByLabel("Invoice or reference").fill(INVOICE_REFERENCE);
  await billingPanel.getByLabel("Billing notes").fill("Paid outside TurnFlow after owner review.");
  await billingPanel.getByRole("button", { name: "Save billing record" }).click();
  await billingPanel.getByText("Billing record saved.").waitFor({ timeout: 15000 });
  await waitForDb("owner billing update", async () => {
    const billingRecord = await db.query.billingRecords.findFirst({
      where: (record, { eq }) => eq(record.requestId, fixture.requestId),
    });
    return (
      billingRecord?.status === "paid" &&
      billingRecord.invoiceReference === INVOICE_REFERENCE
    );
  });
  await assertNoHorizontalOverflow(page, "owner billing detail");
}

async function collaboratorSeesSharedContext(page: Page, fixture: Fixture) {
  await page.goto(new URL("/collaborator", BASE_URL).toString(), { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: fixture.requestTitle }).first().waitFor({
    timeout: 15000,
  });
  const bodyText = await page.locator("body").innerText();
  for (const expected of ["Owner privacy", fixture.requestTitle, "Complete"]) {
    if (!bodyText.includes(expected)) {
      throw new Error(`collaborator workspace is missing "${expected}"`);
    }
  }
  for (const privateText of ["Final charge history", "Decision Log", INVOICE_REFERENCE]) {
    if (bodyText.includes(privateText)) {
      throw new Error(`collaborator workspace exposed owner-only text "${privateText}"`);
    }
  }
  await assertNoHorizontalOverflow(page, "collaborator shared workspace");
}

async function assertDecisionEvents(fixture: Fixture) {
  const expectedActions = [
    "request_created",
    "request_task_created",
    "request_task_status_changed",
    "work_session_event",
    "vendor_bid_submitted",
    "quote_approved",
    "closeout_submitted",
    "closeout_changes_requested",
    "closeout_approved",
    "billing_record_updated",
  ];
  const entries = await db.query.decisionLog.findMany({
    where: (entry, { eq }) => eq(entry.requestId, fixture.requestId),
    columns: { action: true },
  });
  const actions = entries.map((entry) => entry.action);
  for (const expected of expectedActions) {
    if (!actions.includes(expected)) {
      throw new Error(`decision log is missing ${expected}`);
    }
  }
}

async function main() {
  let fixture: Fixture | null = null;
  const browser = await chromium.launch();

  try {
    fixture = await createFixture();

    const vendorContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const vendorPage = await vendorContext.newPage();
    await login(vendorPage, fixture.vendorEmail);
    await vendorSubmitsBid(vendorPage, fixture);

    const ownerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const ownerPage = await ownerContext.newPage();
    await login(ownerPage, fixture.ownerEmail);
    await ownerApprovesBid(ownerPage, fixture);

    await seedCompletedWork(fixture);
    await vendorSubmitsCloseout(vendorPage, fixture);
    await ownerRequestsCloseoutChanges(ownerPage, fixture);
    await vendorSeesCloseoutChangesRequested(vendorPage, fixture);
    await vendorSubmitsCloseout(vendorPage, fixture, {
      completionNotes:
        "Supply line replaced, leak tested, cabinet left dry, and receipt note clarified.",
      materialsNotes: "Receipt covers supply line, sealant, cleanup, and warranty note.",
      waitLabel: "vendor revised closeout submission",
    });
    await ownerApprovesCloseoutAndUpdatesBilling(ownerPage, fixture);

    const collaboratorContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const collaboratorPage = await collaboratorContext.newPage();
    await login(collaboratorPage, fixture.collaboratorEmail);
    await collaboratorSeesSharedContext(collaboratorPage, fixture);

    await assertDecisionEvents(fixture);

    await collaboratorContext.close();
    await ownerContext.close();
    await vendorContext.close();
    console.log("Completed full owner/vendor/collaborator loop smoke.");
    console.log(`Request: ${fixture.requestTitle}`);
    console.log(`Billing reference: ${INVOICE_REFERENCE}`);
  } finally {
    await browser.close();
    await cleanup(fixture);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
