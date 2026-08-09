import { describe, expect, it } from "vitest";
import { inviteIdFromFormData, parseInviteIdFields } from "@/lib/invites/forms";
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
