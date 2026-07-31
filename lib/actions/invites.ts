"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { invites, requests } from "@/lib/db/schema";
import { requireRole, requireAnyRole } from "@/lib/auth/dal";
import { sendNotification } from "@/lib/email";

const INVITE_VALID_DAYS = 14;

export type CreateInviteResult = { inviteId: string } | { error: string };

/**
 * Owner enters a vendor or collaborator's email; we create an invite row,
 * point the request's pending*InviteId at it, and email the invite link
 * (Phase 9). The link is also returned/shown in the UI so the owner can
 * copy-paste it themselves if the email doesn't land.
 */
async function createInvite(
  requestId: string,
  email: string,
  role: "vendor" | "collaborator"
): Promise<CreateInviteResult> {
  const session = await requireRole("owner");

  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });
  if (!req || req.ownerId !== session.user.id) {
    return { error: `Not authorized to invite a ${role} to this request.` };
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    return { error: "Email is required." };
  }

  const expiresAt = new Date(Date.now() + INVITE_VALID_DAYS * 24 * 60 * 60 * 1000);
  const [invite] = await db
    .insert(invites)
    .values({
      ownerId: session.user.id,
      requestId,
      role,
      email: trimmedEmail,
      expiresAt,
    })
    .returning({ id: invites.id });

  await db
    .update(requests)
    .set(role === "vendor" ? { pendingVendorInviteId: invite.id } : { pendingCollaboratorInviteId: invite.id })
    .where(eq(requests.id, requestId));

  const link = `${process.env.APP_URL || ""}/accept-invite?invite=${invite.id}`;
  await sendNotification({
    ownerId: session.user.id,
    requestId,
    type: `${role}_invite`,
    recipientEmail: trimmedEmail,
    subject: "You've been invited to a TurnFlow Home request",
    text: `You've been invited as a ${role} on a TurnFlow Home maintenance request.\n\nAccept it here: ${link}\n\nThis invite expires in ${INVITE_VALID_DAYS} days.`,
  });

  revalidatePath(`/owner/requests/${requestId}`);
  return { inviteId: invite.id };
}

export async function createVendorInviteAction(requestId: string, email: string) {
  return createInvite(requestId, email, "vendor");
}

export async function createCollaboratorInviteAction(requestId: string, email: string) {
  return createInvite(requestId, email, "collaborator");
}

export type AcceptInviteResult = { error: string } | { success: true };

/**
 * The invited vendor or collaborator claims the request themselves once
 * signed in with a matching-email account of the right role — this
 * Server Action is the direct replacement for firestore.rules'
 * isAcceptingOwnVendorInvite()/isAcceptingOwnCollaboratorInvite() from
 * the Firebase build: same checks (pending, unexpired, matching
 * email/role), just as plain application code instead of a
 * security-rule function.
 */
export async function acceptInviteAction(inviteId: string): Promise<AcceptInviteResult> {
  const session = await requireAnyRole(["vendor", "collaborator"]);

  const invite = await db.query.invites.findFirst({
    where: (i, { eq }) => eq(i.id, inviteId),
  });

  if (!invite) return { error: "This invite doesn't exist or is no longer valid." };
  if (invite.status !== "pending") return { error: "This invite has already been used or is no longer valid." };
  if (invite.expiresAt < new Date()) return { error: "This invite has expired. Ask the property owner to send a new one." };
  if (invite.role !== session.user.role) {
    return { error: `This invite is not for a ${session.user.role} account.` };
  }
  if (invite.email !== (session.user.email || "").toLowerCase()) {
    return { error: `This invite was sent to ${invite.email}. Sign out and sign in with that address to accept it.` };
  }
  if (!invite.requestId) return { error: "This invite is missing its request." };

  await db
    .update(requests)
    .set(
      invite.role === "vendor"
        ? { assignedVendorId: session.user.id, pendingVendorInviteId: null }
        : { collaboratorId: session.user.id, pendingCollaboratorInviteId: null }
    )
    .where(eq(requests.id, invite.requestId));

  await db
    .update(invites)
    .set({ status: "accepted", acceptedById: session.user.id, acceptedAt: new Date() })
    .where(eq(invites.id, inviteId));

  revalidatePath(invite.role === "vendor" ? "/vendor" : "/collaborator");
  return { success: true };
}
