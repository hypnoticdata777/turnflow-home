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
  process.env.UX_INVITE_RUN_ID || new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const PASSWORD = "Password123!";

type Role = "vendor" | "collaborator";

type Fixture = {
  ownerId: string;
  helperId: string;
  workspaceId: string;
  propertyId: string;
  requestId: string;
  inviteId: string;
  helperEmail: string;
  requestTitle: string;
  role: Role;
};

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function createUser(email: string, role: "owner" | Role, name: string) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const [user] = await db
    .insert(schema.users)
    .values({ email, passwordHash, role, name })
    .returning({ id: schema.users.id });
  return user;
}

async function createFixture(role: Role): Promise<Fixture> {
  const label = `${role}-${RUN_ID}`;
  const ownerEmail = `owner-${label}@example.com`;
  const helperEmail = `${role}-${RUN_ID}@example.com`;
  const owner = await createUser(ownerEmail, "owner", `Owner ${label}`);
  const helper = await createUser(helperEmail, role, `Invite ${role} ${RUN_ID}`);

  const [workspace] = await db
    .insert(schema.workspaces)
    .values({
      ownerId: owner.id,
      name: `Invite smoke ${label}`,
      slug: `invite-smoke-${label}`,
    })
    .returning({ id: schema.workspaces.id });

  await db.insert(schema.workspaceMemberships).values({
    workspaceId: workspace.id,
    userId: owner.id,
    role: "owner",
    status: "active",
  });

  await db.insert(schema.billingAccounts).values({
    workspaceId: workspace.id,
    plan: "poc",
    status: "trialing",
    billingEmail: ownerEmail,
  });

  const [property] = await db
    .insert(schema.properties)
    .values({
      ownerId: owner.id,
      workspaceId: workspace.id,
      address: `Invite smoke ${role} home ${RUN_ID}`,
      nickname: `Invite ${role} home`,
    })
    .returning({ id: schema.properties.id });

  const requestTitle = `Invite ${role} acceptance ${RUN_ID}`;
  const [request] = await db
    .insert(schema.requests)
    .values({
      ownerId: owner.id,
      workspaceId: workspace.id,
      propertyId: property.id,
      title: requestTitle,
      category: role === "vendor" ? "Plumbing" : "Handyman",
      urgency: "Medium",
      location: role === "vendor" ? "Kitchen sink cabinet" : "Front hallway",
      contactMethod: "Email",
      accessInstructions: "Use this temporary smoke-test request only.",
      notes: "Created by ux-invite-acceptance-smoke.ts and cleaned up after the run.",
      status: role === "vendor" ? "Needs Quote" : "Waiting",
    })
    .returning({ id: schema.requests.id });

  const [invite] = await db
    .insert(schema.invites)
    .values({
      ownerId: owner.id,
      workspaceId: workspace.id,
      requestId: request.id,
      role,
      email: helperEmail,
      status: "pending",
      expiresAt: daysFromNow(7),
    })
    .returning({ id: schema.invites.id });

  await db
    .update(schema.requests)
    .set(
      role === "vendor"
        ? { pendingVendorInviteId: invite.id }
        : { pendingCollaboratorInviteId: invite.id }
    )
    .where(eq(schema.requests.id, request.id));

  await db.insert(schema.decisionLog).values([
    {
      requestId: request.id,
      actorId: owner.id,
      action: "request_created",
      details: { title: requestTitle, category: role === "vendor" ? "Plumbing" : "Handyman" },
    },
    {
      requestId: request.id,
      actorId: owner.id,
      action: "invite_created",
      details: { role, email: helperEmail, inviteId: invite.id, emailSent: false },
    },
  ]);

  return {
    ownerId: owner.id,
    helperId: helper.id,
    workspaceId: workspace.id,
    propertyId: property.id,
    requestId: request.id,
    inviteId: invite.id,
    helperEmail,
    requestTitle,
    role,
  };
}

async function cleanup(fixtures: Fixture[]) {
  for (const fixture of fixtures) {
    await db
      .update(schema.requests)
      .set({
        assignedVendorId: null,
        collaboratorId: null,
        pendingVendorInviteId: null,
        pendingCollaboratorInviteId: null,
      })
      .where(eq(schema.requests.id, fixture.requestId));

    await db.delete(schema.decisionLog).where(eq(schema.decisionLog.requestId, fixture.requestId));
    await db.delete(schema.notificationLog).where(eq(schema.notificationLog.requestId, fixture.requestId));
    await db.delete(schema.invites).where(eq(schema.invites.id, fixture.inviteId));
    await db.delete(schema.requests).where(eq(schema.requests.id, fixture.requestId));
    await db.delete(schema.properties).where(eq(schema.properties.id, fixture.propertyId));
    await db.delete(schema.billingAccounts).where(eq(schema.billingAccounts.workspaceId, fixture.workspaceId));
    await db
      .delete(schema.workspaceMemberships)
      .where(eq(schema.workspaceMemberships.workspaceId, fixture.workspaceId));
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, fixture.workspaceId));
    await db
      .delete(schema.users)
      .where(inArray(schema.users.id, [fixture.ownerId, fixture.helperId]));
  }
}

async function loginFromInvite(page: Page, fixture: Fixture) {
  await page.goto(new URL(`/accept-invite?invite=${fixture.inviteId}`, BASE_URL).toString(), {
    waitUntil: "domcontentloaded",
  });
  await page.getByLabel("Email").fill(fixture.helperEmail);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  const expectedPath = fixture.role === "vendor" ? "/vendor" : "/collaborator";
  await page.waitForURL(
    (url) => url.pathname === expectedPath && url.searchParams.get("accepted") === "1",
    { timeout: 20000 }
  );
  await page.waitForLoadState("networkidle");
}

async function assertWorkspace(page: Page, fixture: Fixture) {
  const expectedHeading = fixture.role === "vendor" ? "Assigned requests" : "Shared requests";
  await page.getByRole("heading", { name: expectedHeading }).first().waitFor({ timeout: 15000 });
  await page.getByText("Invite accepted").waitFor({ timeout: 15000 });
  await page.getByRole("heading", { name: fixture.requestTitle }).first().waitFor({ timeout: 15000 });

  const bodyText = await page.locator("body").innerText();
  if (!bodyText.includes(fixture.requestTitle)) {
    throw new Error(`${fixture.role} workspace is missing accepted request title`);
  }
  if (!bodyText.includes("Owner-only areas") && fixture.role === "vendor") {
    throw new Error("vendor workspace is missing owner-only privacy boundary copy");
  }
  if (!bodyText.includes("Owner privacy") && fixture.role === "collaborator") {
    throw new Error("collaborator workspace is missing owner privacy boundary copy");
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  if (overflow > 2) {
    throw new Error(`${fixture.role} accepted-invite workspace has ${overflow}px horizontal overflow`);
  }
}

async function assertDatabaseState(fixture: Fixture) {
  const invite = await db.query.invites.findFirst({
    where: (i, { eq }) => eq(i.id, fixture.inviteId),
  });
  if (!invite || invite.status !== "accepted" || invite.acceptedById !== fixture.helperId) {
    throw new Error(`${fixture.role} invite was not accepted by the expected account`);
  }

  const request = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, fixture.requestId),
  });
  const assignedUserId =
    fixture.role === "vendor" ? request?.assignedVendorId : request?.collaboratorId;
  if (assignedUserId !== fixture.helperId) {
    throw new Error(`${fixture.role} request access did not land on the expected user`);
  }

  const acceptedLog = await db.query.decisionLog.findFirst({
    where: (entry, { and, eq }) =>
      and(eq(entry.requestId, fixture.requestId), eq(entry.action, "invite_accepted")),
  });
  if (acceptedLog?.action !== "invite_accepted" || acceptedLog.actorId !== fixture.helperId) {
    throw new Error(`${fixture.role} invite acceptance was not recorded in the decision log`);
  }
}

async function main() {
  const fixtures: Fixture[] = [];
  const browser = await chromium.launch();

  try {
    for (const role of ["vendor", "collaborator"] as const) {
      const fixture = await createFixture(role);
      fixtures.push(fixture);

      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await loginFromInvite(page, fixture);
      await assertWorkspace(page, fixture);
      await assertDatabaseState(fixture);
      await context.close();
      console.log(`Accepted ${role} invite and landed in scoped workspace.`);
    }
  } finally {
    await browser.close();
    await cleanup(fixtures);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
