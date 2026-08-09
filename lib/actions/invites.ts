"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { decisionLog, invites, requests } from "@/lib/db/schema";
import { requireRole, requireAnyRole } from "@/lib/auth/dal";
import { sendNotification } from "@/lib/email";
import { inviteIdFromFormData, sharedAccessFromFormData } from "@/lib/invites/forms";
import { buildInviteLink } from "@/lib/invites/links";

const INVITE_VALID_DAYS = 14;

export type CreateInviteResult =
  | { inviteId: string; inviteLink: string; emailSent: boolean }
  | { error: string };

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

  const link = buildInviteLink(process.env.APP_URL, invite.id);
  const emailSent = await sendNotification({
    ownerId: session.user.id,
    requestId,
    type: `${role}_invite`,
    recipientEmail: trimmedEmail,
    subject: "You've been invited to a TurnFlow Home request",
    text: `You've been invited as a ${role} on a TurnFlow Home maintenance request.\n\nAccept it here: ${link}\n\nThis invite expires in ${INVITE_VALID_DAYS} days.`,
  });

  revalidatePath(`/owner/requests/${requestId}`);
  return { inviteId: invite.id, inviteLink: link, emailSent };
}

export async function createVendorInviteAction(requestId: string, email: string) {
  return createInvite(requestId, email, "vendor");
}

export async function createCollaboratorInviteAction(requestId: string, email: string) {
  return createInvite(requestId, email, "collaborator");
}

export type ManageInviteState =
  | {
      error?: string;
      success?: string;
      inviteLink?: string;
    }
  | undefined;

function revalidateInviteSurfaces(requestId: string | null) {
  revalidatePath("/owner/account");
  if (requestId) {
    revalidatePath(`/owner/requests/${requestId}`);
  }
}

export async function removeSharedAccessAction(
  _prevState: ManageInviteState,
  formData: FormData
): Promise<ManageInviteState> {
  const session = await requireRole("owner");
  const parsed = sharedAccessFromFormData(formData);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      error:
        fieldErrors.requestId?.[0] ||
        fieldErrors.role?.[0] ||
        "Shared access details are invalid.",
    };
  }

  const { requestId, role } = parsed.data;
  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });

  if (!req || req.ownerId !== session.user.id) {
    return { error: "That request could not be found for this owner account." };
  }

  const assignedUserId = role === "vendor" ? req.assignedVendorId : req.collaboratorId;
  if (!assignedUserId) {
    return { error: `There is no active ${role} access on this request.` };
  }

  await db
    .update(requests)
    .set(
      role === "vendor"
        ? { assignedVendorId: null, updatedAt: new Date() }
        : { collaboratorId: null, updatedAt: new Date() }
    )
    .where(and(eq(requests.id, requestId), eq(requests.ownerId, session.user.id)));

  await db.insert(decisionLog).values({
    requestId,
    actorId: session.user.id,
    action: "shared_access_removed",
    details: {
      role,
      removedUserId: assignedUserId,
    },
  });

  revalidateInviteSurfaces(requestId);
  revalidatePath(role === "vendor" ? "/vendor" : "/collaborator");
  return { success: `${role === "vendor" ? "Vendor" : "Collaborator"} access removed.` };
}

export async function cancelInviteAction(
  _prevState: ManageInviteState,
  formData: FormData
): Promise<ManageInviteState> {
  const session = await requireRole("owner");
  const parsed = inviteIdFromFormData(formData);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.inviteId?.[0] || "Invite id is invalid." };
  }

  const invite = await db.query.invites.findFirst({
    where: (i, { eq }) => eq(i.id, parsed.data.inviteId),
  });

  if (!invite || invite.ownerId !== session.user.id) {
    return { error: "That invite could not be found for this owner account." };
  }
  if (invite.status !== "pending") {
    return { error: "Only pending invites can be canceled." };
  }

  if (invite.requestId) {
    await db
      .update(requests)
      .set(
        invite.role === "vendor"
          ? { pendingVendorInviteId: null }
          : { pendingCollaboratorInviteId: null }
      )
      .where(
        and(
          eq(requests.id, invite.requestId),
          eq(requests.ownerId, session.user.id),
          invite.role === "vendor"
            ? eq(requests.pendingVendorInviteId, invite.id)
            : eq(requests.pendingCollaboratorInviteId, invite.id)
        )
      );
  }

  await db
    .delete(invites)
    .where(and(eq(invites.id, invite.id), eq(invites.ownerId, session.user.id)));

  revalidateInviteSurfaces(invite.requestId);
  return { success: "Invite canceled." };
}

export async function resendInviteAction(
  _prevState: ManageInviteState,
  formData: FormData
): Promise<ManageInviteState> {
  const session = await requireRole("owner");
  const parsed = inviteIdFromFormData(formData);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.inviteId?.[0] || "Invite id is invalid." };
  }

  const invite = await db.query.invites.findFirst({
    where: (i, { eq }) => eq(i.id, parsed.data.inviteId),
  });

  if (!invite || invite.ownerId !== session.user.id) {
    return { error: "That invite could not be found for this owner account." };
  }
  if (invite.status !== "pending") {
    return { error: "Only pending invites can be resent." };
  }
  if (!invite.requestId) {
    return { error: "This invite is missing its request." };
  }

  const expiresAt = new Date(Date.now() + INVITE_VALID_DAYS * 24 * 60 * 60 * 1000);
  await db
    .update(invites)
    .set({ expiresAt })
    .where(and(eq(invites.id, invite.id), eq(invites.ownerId, session.user.id)));

  const link = buildInviteLink(process.env.APP_URL, invite.id);
  const emailSent = await sendNotification({
    ownerId: session.user.id,
    requestId: invite.requestId,
    type: `${invite.role}_invite_resend`,
    recipientEmail: invite.email,
    subject: "Your TurnFlow Home invite link",
    text: `You've been invited as a ${invite.role} on a TurnFlow Home maintenance request.\n\nAccept it here: ${link}\n\nThis invite expires in ${INVITE_VALID_DAYS} days.`,
  });

  revalidateInviteSurfaces(invite.requestId);
  return {
    success: emailSent
      ? "Invite resent and expiry refreshed."
      : "Invite expiry refreshed. Email is not configured, so copy this link instead.",
    inviteLink: link,
  };
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
