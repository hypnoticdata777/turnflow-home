import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  billingAccounts,
  billingRecords,
  invites,
  properties,
  requests,
  workspaces,
  workspaceMemberships,
} from "@/lib/db/schema";

function normalizeWorkspaceSlug(email: string, userId: string) {
  const localPart = email.split("@")[0] || "owner";
  const base = localPart
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${base || "owner"}-${userId.slice(0, 8)}`;
}

function defaultWorkspaceName(owner: { name: string | null; email: string }) {
  if (owner.name?.trim()) return `${owner.name.trim()}'s home workspace`;
  return `${owner.email.split("@")[0] || "Owner"}'s home workspace`;
}

export async function getOwnerWorkspaceSnapshot(ownerId: string) {
  return db.query.workspaces.findFirst({
    where: (workspace, { eq }) => eq(workspace.ownerId, ownerId),
    orderBy: (workspace, { asc }) => asc(workspace.createdAt),
    with: {
      memberships: true,
      billingAccount: true,
    },
  });
}

export async function backfillOwnerWorkspaceScope(ownerId: string, workspaceId: string) {
  await Promise.all([
    db
      .update(properties)
      .set({ workspaceId, updatedAt: new Date() })
      .where(and(eq(properties.ownerId, ownerId), isNull(properties.workspaceId))),
    db
      .update(requests)
      .set({ workspaceId, updatedAt: new Date() })
      .where(and(eq(requests.ownerId, ownerId), isNull(requests.workspaceId))),
    db
      .update(invites)
      .set({ workspaceId })
      .where(and(eq(invites.ownerId, ownerId), isNull(invites.workspaceId))),
    db
      .update(billingRecords)
      .set({ workspaceId, updatedAt: new Date() })
      .where(and(eq(billingRecords.ownerId, ownerId), isNull(billingRecords.workspaceId))),
  ]);
}

export async function ensureDefaultWorkspaceForOwner(ownerId: string) {
  const owner = await db.query.users.findFirst({
    where: (user, { eq }) => eq(user.id, ownerId),
    columns: { id: true, name: true, email: true },
  });

  if (!owner) {
    throw new Error("Owner account not found.");
  }

  let workspace = await db.query.workspaces.findFirst({
    where: (candidate, { eq }) => eq(candidate.ownerId, ownerId),
    orderBy: (candidate, { asc }) => asc(candidate.createdAt),
  });

  if (!workspace) {
    const [createdWorkspace] = await db
      .insert(workspaces)
      .values({
        ownerId,
        name: defaultWorkspaceName(owner),
        slug: normalizeWorkspaceSlug(owner.email, owner.id),
        kind: "personal",
      })
      .returning();
    workspace = createdWorkspace;
  }

  const existingMembership = await db.query.workspaceMemberships.findFirst({
    where: (membership, { and, eq }) =>
      and(eq(membership.workspaceId, workspace.id), eq(membership.userId, ownerId)),
  });

  if (!existingMembership) {
    await db.insert(workspaceMemberships).values({
      workspaceId: workspace.id,
      userId: ownerId,
      role: "owner",
      status: "active",
    });
  } else if (existingMembership.role !== "owner" || existingMembership.status !== "active") {
    await db
      .update(workspaceMemberships)
      .set({ role: "owner", status: "active", updatedAt: new Date() })
      .where(eq(workspaceMemberships.id, existingMembership.id));
  }

  const existingBillingAccount = await db.query.billingAccounts.findFirst({
    where: (account, { eq }) => eq(account.workspaceId, workspace.id),
  });

  if (!existingBillingAccount) {
    await db.insert(billingAccounts).values({
      workspaceId: workspace.id,
      plan: "poc",
      status: "trialing",
      billingEmail: owner.email,
    });
  }

  await backfillOwnerWorkspaceScope(ownerId, workspace.id);

  const snapshot = await getOwnerWorkspaceSnapshot(ownerId);
  if (!snapshot) {
    throw new Error("Workspace setup did not complete.");
  }

  return snapshot;
}
