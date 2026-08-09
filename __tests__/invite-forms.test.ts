import { describe, expect, it } from "vitest";
import {
  inviteIdFromFormData,
  parseInviteIdFields,
  parseSharedAccessFields,
  sharedAccessFromFormData,
} from "@/lib/invites/forms";
import { buildInviteLink } from "@/lib/invites/links";

describe("parseInviteIdFields", () => {
  it("accepts a valid invite UUID", () => {
    const parsed = parseInviteIdFields({
      inviteId: "11111111-1111-4111-8111-111111111111",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.inviteId).toBe("11111111-1111-4111-8111-111111111111");
    }
  });

  it("rejects a missing or malformed invite id", () => {
    const missing = parseInviteIdFields({ inviteId: null });
    const malformed = parseInviteIdFields({ inviteId: "not-a-uuid" });

    expect(missing.success).toBe(false);
    expect(malformed.success).toBe(false);
  });

  it("parses invite id from FormData", () => {
    const formData = new FormData();
    formData.set("inviteId", "22222222-2222-4222-8222-222222222222");

    const parsed = inviteIdFromFormData(formData);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.inviteId).toBe("22222222-2222-4222-8222-222222222222");
    }
  });
});

describe("parseSharedAccessFields", () => {
  it("accepts a valid request UUID and shared access role", () => {
    const parsed = parseSharedAccessFields({
      requestId: "33333333-3333-4333-8333-333333333333",
      role: "vendor",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        requestId: "33333333-3333-4333-8333-333333333333",
        role: "vendor",
      });
    }
  });

  it("rejects malformed request ids and unsupported roles", () => {
    const malformedRequest = parseSharedAccessFields({
      requestId: "not-a-uuid",
      role: "vendor",
    });
    const unsupportedRole = parseSharedAccessFields({
      requestId: "33333333-3333-4333-8333-333333333333",
      role: "owner",
    });

    expect(malformedRequest.success).toBe(false);
    expect(unsupportedRole.success).toBe(false);
  });

  it("parses shared access fields from FormData", () => {
    const formData = new FormData();
    formData.set("requestId", "44444444-4444-4444-8444-444444444444");
    formData.set("role", "collaborator");

    const parsed = sharedAccessFromFormData(formData);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        requestId: "44444444-4444-4444-8444-444444444444",
        role: "collaborator",
      });
    }
  });
});

describe("buildInviteLink", () => {
  it("builds an absolute invite link from APP_URL", () => {
    expect(buildInviteLink("https://turnflow.example/", "invite-1")).toBe(
      "https://turnflow.example/accept-invite?invite=invite-1"
    );
  });

  it("falls back to localhost when APP_URL is not configured", () => {
    expect(buildInviteLink(undefined, "invite-1")).toBe(
      "http://localhost:3000/accept-invite?invite=invite-1"
    );
  });

  it("encodes the invite id in the query string", () => {
    expect(buildInviteLink("https://turnflow.example", "id with spaces")).toBe(
      "https://turnflow.example/accept-invite?invite=id%20with%20spaces"
    );
  });
});
