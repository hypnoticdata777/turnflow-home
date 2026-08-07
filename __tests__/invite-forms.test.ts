import { describe, expect, it } from "vitest";
import { inviteIdFromFormData, parseInviteIdFields } from "@/lib/invites/forms";

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
