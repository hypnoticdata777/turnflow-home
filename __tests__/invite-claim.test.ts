import { describe, expect, it } from "vitest";
import {
  INVITE_PROBLEM_MESSAGES,
  inviteAccountMismatch,
  inviteRoleLabel,
  inviteValidityProblem,
  signedOutInviteEntry,
  type InviteSnapshot,
} from "@/lib/invites/claim";
import { parseInviteSignupFields } from "@/lib/auth/forms";

const NOW = new Date("2026-10-25T12:00:00Z");
const valid: InviteSnapshot = {
  status: "pending",
  role: "vendor",
  email: "pro@plumbing.example",
  expiresAt: new Date("2026-11-01T00:00:00Z"),
  requestId: "req-1",
};

describe("inviteValidityProblem", () => {
  it("accepts a pending, unexpired invite with a request", () => {
    expect(inviteValidityProblem(valid, NOW)).toBeNull();
  });

  it("reports problems in a fixed order", () => {
    expect(inviteValidityProblem(null, NOW)).toBe("missing");
    expect(inviteValidityProblem({ ...valid, status: "accepted" }, NOW)).toBe("used");
    expect(inviteValidityProblem({ ...valid, expiresAt: new Date("2026-10-01") }, NOW)).toBe("expired");
    expect(inviteValidityProblem({ ...valid, requestId: null }, NOW)).toBe("no_request");
    // used wins over expired
    expect(
      inviteValidityProblem({ ...valid, status: "accepted", expiresAt: new Date("2026-10-01") }, NOW)
    ).toBe("used");
  });
});

describe("signedOutInviteEntry", () => {
  it("offers signup only for a valid invite with no existing account", () => {
    expect(signedOutInviteEntry(valid, false, NOW)).toEqual({ kind: "signup" });
  });

  it("sends people with an existing account to log in", () => {
    expect(signedOutInviteEntry(valid, true, NOW)).toEqual({ kind: "login" });
  });

  it("never offers signup on an invalid invite, even with no account", () => {
    expect(signedOutInviteEntry({ ...valid, status: "accepted" }, false, NOW)).toEqual({
      kind: "invalid",
      message: INVITE_PROBLEM_MESSAGES.used,
    });
    expect(signedOutInviteEntry(null, false, NOW)).toEqual({
      kind: "invalid",
      message: INVITE_PROBLEM_MESSAGES.missing,
    });
    expect(
      signedOutInviteEntry({ ...valid, expiresAt: new Date("2026-10-01") }, false, NOW).kind
    ).toBe("invalid");
  });
});

describe("inviteAccountMismatch", () => {
  it("accepts the invited email (any casing) with the invited role", () => {
    expect(inviteAccountMismatch(valid, { role: "vendor", email: "Pro@Plumbing.example" })).toBeNull();
  });

  it("rejects a different role or a different email", () => {
    expect(inviteAccountMismatch(valid, { role: "owner", email: valid.email })).toMatch(/vendor account/);
    expect(inviteAccountMismatch(valid, { role: "vendor", email: "other@example.com" })).toMatch(
      /sent to pro@plumbing.example/
    );
    expect(inviteAccountMismatch(valid, { role: "vendor", email: null })).not.toBeNull();
  });
});

describe("parseInviteSignupFields", () => {
  it("needs only a name and a strong-enough password", () => {
    expect(parseInviteSignupFields({ name: "Ana Pro", password: "pipes2026" }).success).toBe(true);
  });

  it("rejects short names and weak passwords", () => {
    expect(parseInviteSignupFields({ name: "A", password: "pipes2026" }).success).toBe(false);
    expect(parseInviteSignupFields({ name: "Ana Pro", password: "short1" }).success).toBe(false);
    expect(parseInviteSignupFields({ name: "Ana Pro", password: "noNumbersHere" }).success).toBe(false);
  });

  it("ignores any email or role in the form: they are not in the schema", () => {
    const parsed = parseInviteSignupFields({ name: "Ana Pro", password: "pipes2026" });
    expect(parsed.success && Object.keys(parsed.data).sort()).toEqual(["name", "password"]);
  });
});

describe("inviteRoleLabel", () => {
  it("uses friendly labels", () => {
    expect(inviteRoleLabel("vendor")).toBe("vendor");
    expect(inviteRoleLabel("collaborator")).toBe("helper");
  });
});
