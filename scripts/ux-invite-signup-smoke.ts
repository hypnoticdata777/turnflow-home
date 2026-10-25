// F4 smoke (2026-10-25): a brand-new vendor and a brand-new helper, with NO
// pre-existing account, open their invite link signed out, create an account
// from the invite, and land in their scoped workspace. Complements
// ux-invite-acceptance-smoke.ts, which covers people who already have accounts.
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
const SIGNUP_NAME_PREFIX = "Invite signup";

type Role = "vendor" | "collaborator";

type Fixture = {
  ownerId: string;
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
  const helperEmail = `signup-${role}-${RUN_ID}@example.com`;
  const owner = await createUser(ownerEmail, "owner", `Owner ${label}`);
  // No helper account on purpose: the browser creates it from the invite.

  const [workspace] = await db
    .insert(schema.workspaces)
    .values({
      ownerId: owner.id,
      name: `Invite signup smoke ${label}`,
      slug: `invite-signup-smoke-${label}`,
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
      notes: "Created by ux-invite-signup-smoke.ts and cleaned up after the run.",
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
    const helper = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, fixture.helperEmail),
      columns: { id: true },
    });
    await db
      .delete(schema.users)
      .where(inArray(schema.users.id, [fixture.ownerId, ...(helper ? [helper.id] : [])]));
  }
}

async function signupFromInvite(page: Page, fixture: Fixture) {
  await page.goto(new URL(`/accept-invite?invite=${fixture.inviteId}`, BASE_URL).toString(), {
    waitUntil: "domcontentloaded",
  });

  // Signed out + no account: the invite page itself must offer signup,
  // with the invited email shown read-only (not an editable field).
  const roleLabel = fixture.role === "vendor" ? "vendor" : "helper";
  const submit = page.getByRole("button", { name: `Create ${roleLabel} account and accept` });
  await submit.waitFor({ timeout: 15000 });
  await page.getByText(fixture.helperEmail).first().waitFor({ timeout: 5000 });
  if ((await page.locator('input[name="email"]').count()) > 0) {
    throw new Error("invite signup form must not have an editable email field");
  }

  await page.getByLabel("Your name or business name").fill(`${SIGNUP_NAME_PREFIX} ${fixture.role} ${RUN_ID}`);
  await page.getByLabel("Create a password").fill(PASSWORD);
  await submit.click();

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
  const helper = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, fixture.helperEmail),
  });
  if (!helper || helper.role !== fixture.role) {
    throw new Error(`${fixture.role} account was not created with the invited role`);
  }
  const helperId = helper.id;

  const invite = await db.query.invites.findFirst({
    where: (i, { eq }) => eq(i.id, fixture.inviteId),
  });
  if (!invite || invite.status !== "accepted" || invite.acceptedById !== helperId) {
    throw new Error(`${fixture.role} invite was not accepted by the expected account`);
  }

  const request = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, fixture.requestId),
  });
  const assignedUserId =
    fixture.role === "vendor" ? request?.assignedVendorId : request?.collaboratorId;
  if (assignedUserId !== helperId) {
    throw new Error(`${fixture.role} request access did not land on the expected user`);
  }

  const acceptedLog = await db.query.decisionLog.findFirst({
    where: (entry, { and, eq }) =>
      and(eq(entry.requestId, fixture.requestId), eq(entry.action, "invite_accepted")),
  });
  if (acceptedLog?.action !== "invite_accepted" || acceptedLog.actorId !== helperId) {
    throw new Error(`${fixture.role} invite acceptance was not recorded in the decision log`);
  }
  if ((acceptedLog.details as Record<string, unknown> | null)?.viaSignup !== true) {
    throw new Error(`${fixture.role} invite_accepted log entry is missing viaSignup: true`);
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
      await signupFromInvite(page, fixture);
      await assertWorkspace(page, fixture);
      await assertDatabaseState(fixture);
      await context.close();
      console.log(`New ${role} signed up from invite and landed in scoped workspace.`);
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
