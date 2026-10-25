// Pure invite rules shared by the accept-invite page, acceptInviteAction, and
// signupFromInviteAction (F4, 2026-10-25). Keeping them here means the page,
// both actions, the tests, and docs/04-algorithms/05-invite-and-access.md all
// read the same rules.

export type InviteSnapshot = {
  status: "pending" | "accepted";
  role: "vendor" | "collaborator";
  email: string;
  expiresAt: Date;
  requestId: string | null;
};

export type InviteValidityProblem = "missing" | "used" | "expired" | "no_request";

export const INVITE_PROBLEM_MESSAGES: Record<InviteValidityProblem, string> = {
  missing: "This invite doesn't exist or is no longer valid.",
  used: "This invite has already been used or is no longer valid.",
  expired: "This invite has expired. Ask the property owner to send a new one.",
  no_request: "This invite is missing its request.",
};

/** Problems that make an invite unusable by anyone, checked in this order. */
export function inviteValidityProblem(
  invite: InviteSnapshot | null | undefined,
  now: Date = new Date()
): InviteValidityProblem | null {
  if (!invite) return "missing";
  if (invite.status !== "pending") return "used";
  if (invite.expiresAt < now) return "expired";
  if (!invite.requestId) return "no_request";
  return null;
}

/** Problems that stop this signed-in account from claiming a valid invite. */
export function inviteAccountMismatch(
  invite: Pick<InviteSnapshot, "role" | "email">,
  account: { role: string; email?: string | null }
): string | null {
  if (invite.role !== account.role) {
    return `This invite is for a ${invite.role} account. You are signed in as a ${account.role}. Sign out and sign in with the right account to accept it.`;
  }
  if (invite.email !== (account.email || "").toLowerCase()) {
    return `This invite was sent to ${invite.email}. Sign out and sign in with that address to accept it.`;
  }
  return null;
}

export type SignedOutInviteEntry =
  | { kind: "invalid"; message: string }
  | { kind: "login" }
  | { kind: "signup" };

/**
 * What a signed-out visitor with an invite link should see:
 *   invalid invite        -> the reason
 *   account already exists -> log in (the invite resumes after sign-in)
 *   no account yet         -> create one from the invite
 */
export function signedOutInviteEntry(
  invite: InviteSnapshot | null | undefined,
  accountExists: boolean,
  now: Date = new Date()
): SignedOutInviteEntry {
  const problem = inviteValidityProblem(invite, now);
  if (problem) return { kind: "invalid", message: INVITE_PROBLEM_MESSAGES[problem] };
  return accountExists ? { kind: "login" } : { kind: "signup" };
}

export function inviteRoleLabel(role: InviteSnapshot["role"]) {
  return role === "vendor" ? "vendor" : "helper";
}
