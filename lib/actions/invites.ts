"use server";

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { decisionLog, invites, requests, users } from "@/lib/db/schema";
import { requireRole, requireAnyRole, roleHome } from "@/lib/auth/dal";
import { signIn } from "@/lib/auth/config";
import { isRateLimited, recordAttempt } from "@/lib/auth/rate-limit";
import {
  RATE_LIMITED_MESSAGE,
  SIGNUP_IP_RULE,
  clientIpFromHeaders,
} from "@/lib/auth/rate-limit-policy";
import { parseInviteSignupFields, type InviteSignupFieldErrors } from "@/lib/auth/forms";
import {
  INVITE_PROBLEM_MESSAGES,
  inviteAccountMismatch,
  inviteValidityProblem,
} from "@/lib/invites/claim";
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
      workspaceId: req.workspaceId,
      requestId,
      role,
      email: trimmedEmail,
      expiresAt,
    })
    .returning({ id: invites.id });

  await db
    .update(requests)
    .set(
      role === "vendor"
        ? { pendingVendorInviteId: invite.id, updatedAt: new Date() }
        : { pendingCollaboratorInviteId: invite.id, updatedAt: new Date() }
    )
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

  await db.insert(decisionLog).values({
    requestId,
    actorId: session.user.id,
    action: "invite_created",
    details: {
      role,
      email: trimmedEmail,
      inviteId: invite.id,
      expiresAt: expiresAt.toISOString(),
      emailSent,
    },
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
  revalidatePath("/owner/dashboard");
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

  const removedUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, assignedUserId),
    columns: { email: true },
  });

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
      removedUserEmail: removedUser?.email || null,
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
          ? { pendingVendorInviteId: null, updatedAt: new Date() }
          : { pendingCollaboratorInviteId: null, updatedAt: new Date() }
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

    await db.insert(decisionLog).values({
      requestId: invite.requestId,
      actorId: session.user.id,
      action: "invite_canceled",
      details: {
        role: invite.role,
        email: invite.email,
        inviteId: invite.id,
      },
    });
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

  await db.insert(decisionLog).values({
    requestId: invite.requestId,
    actorId: session.user.id,
    action: "invite_resent",
    details: {
      role: invite.role,
      email: invite.email,
      inviteId: invite.id,
      expiresAt: expiresAt.toISOString(),
      emailSent,
    },
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

type ClaimableInvite = {
  id: string;
  role: "vendor" | "collaborator";
  email: string;
  requestId: string;
};

/**
 * Assigns the user to the invite's request and marks the invite accepted.
 * Shared by acceptInviteAction (existing account) and signupFromInviteAction
 * (account created from the invite, F4). Not exported, so it is never
 * callable as a Server Action on its own.
 *
 * The invite row is claimed first with a conditional update
 * (status = pending), which is one atomic statement: if two tabs accept at
 * once, only one wins and the other gets "already used".
 */
async function claimInviteForUser(
  invite: ClaimableInvite,
  userId: string,
  options: { viaSignup?: boolean } = {}
): Promise<AcceptInviteResult> {
  const acceptedAt = new Date();
  const claimed = await db
    .update(invites)
    .set({ status: "accepted", acceptedById: userId, acceptedAt })
    .where(and(eq(invites.id, invite.id), eq(invites.status, "pending")))
    .returning({ id: invites.id });
  if (claimed.length === 0) {
    return { error: INVITE_PROBLEM_MESSAGES.used };
  }

  await db
    .update(requests)
    .set(
      invite.role === "vendor"
        ? { assignedVendorId: userId, pendingVendorInviteId: null, updatedAt: acceptedAt }
        : { collaboratorId: userId, pendingCollaboratorInviteId: null, updatedAt: acceptedAt }
    )
    .where(eq(requests.id, invite.requestId));

  await db.insert(decisionLog).values({
    requestId: invite.requestId,
    actorId: userId,
    action: "invite_accepted",
    details: {
      role: invite.role,
      email: invite.email,
      inviteId: invite.id,
      acceptedById: userId,
      ...(options.viaSignup ? { viaSignup: true } : {}),
    },
  });

  revalidateInviteSurfaces(invite.requestId);
  revalidatePath(invite.role === "vendor" ? "/vendor" : "/collaborator");
  return { success: true };
}

/**
 * The invited vendor or collaborator claims the request themselves once
 * signed in with a matching-email account of the right role — this
 * Server Action is the direct replacement for firestore.rules'
 * isAcceptingOwnVendorInvite()/isAcceptingOwnCollaboratorInvite() from
 * the Firebase build: same checks (pending, unexpired, matching
 * email/role), just as plain application code instead of a
 * security-rule function. Rules live in lib/invites/claim.ts.
 */
export async function acceptInviteAction(inviteId: string): Promise<AcceptInviteResult> {
  const session = await requireAnyRole(["vendor", "collaborator"]);

  const invite = await db.query.invites.findFirst({
    where: (i, { eq }) => eq(i.id, inviteId),
  });

  const problem = inviteValidityProblem(invite);
  if (problem || !invite?.requestId) {
    return { error: INVITE_PROBLEM_MESSAGES[problem ?? "no_request"] };
  }
  const mismatch = inviteAccountMismatch(invite, session.user);
  if (mismatch) return { error: mismatch };

  return claimInviteForUser({ ...invite, requestId: invite.requestId }, session.user.id);
}

export type InviteSignupState =
  | {
      error?: string;
      fieldErrors?: InviteSignupFieldErrors;
      name?: string;
    }
  | undefined;

/**
 * F4 (2026-10-25): an invited vendor or helper with no account creates one
 * straight from the invite. The email and role come from the invite row and
 * are never read from the form, so nobody can register as a vendor or helper
 * without having been invited, and nobody can choose a different email.
 * Then the invite is claimed and the user is signed in.
 */
export async function signupFromInviteAction(
  inviteId: string,
  _prevState: InviteSignupState,
  formData: FormData
): Promise<InviteSignupState> {
  const name = String(formData.get("name") || "").trim();
  const parsed = parseInviteSignupFields({
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, name };
  }

  // Same per-IP cap as owner signup (P0, F6).
  const ip = clientIpFromHeaders(await headers());
  if (await isRateLimited(SIGNUP_IP_RULE, ip)) {
    return { error: RATE_LIMITED_MESSAGE, name };
  }
  await recordAttempt(SIGNUP_IP_RULE, ip);

  const invite = await db.query.invites.findFirst({
    where: (i, { eq }) => eq(i.id, inviteId),
  });
  const problem = inviteValidityProblem(invite);
  if (problem || !invite?.requestId) {
    return { error: INVITE_PROBLEM_MESSAGES[problem ?? "no_request"], name };
  }

  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, invite.email),
    columns: { id: true },
  });
  if (existing) {
    return {
      error: `An account already exists for ${invite.email}. Log in to accept this invite.`,
      name,
    };
  }

  let userId: string;
  try {
    const [created] = await db
      .insert(users)
      .values({
        email: invite.email,
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
        role: invite.role,
        name: parsed.data.name,
      })
      .returning({ id: users.id });
    userId = created.id;
  } catch (error) {
    // Most likely a duplicate email from a double submit.
    console.error("Invite signup failed:", error);
    return { error: "Could not create that account. Please try again.", name };
  }

  const claim = await claimInviteForUser(
    { ...invite, requestId: invite.requestId },
    userId,
    { viaSignup: true }
  );
  // The account exists either way; if the claim lost a race, the user still
  // signs in and sees the invite page explain what happened.
  const redirectTo =
    "error" in claim
      ? `/accept-invite?invite=${encodeURIComponent(inviteId)}`
      : `${roleHome(invite.role)}?accepted=1`;

  await signIn("credentials", {
    email: invite.email,
    password: parsed.data.password,
    redirectTo,
  });
}
