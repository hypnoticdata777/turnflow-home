import { describe, expect, it } from "vitest";
import {
  parseOwnerProfileFields,
  parseSignupFields,
  signupValuesFromFormData,
} from "@/lib/auth/forms";

describe("parseSignupFields", () => {
  it("normalizes valid owner signup fields", () => {
    const parsed = parseSignupFields({
      name: "  Carlos  ",
      email: "  OWNER@Example.COM ",
      password: "password1",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        name: "Carlos",
        email: "owner@example.com",
        password: "password1",
      });
    }
  });

  it("requires a valid email and a stronger password", () => {
    const parsed = parseSignupFields({
      name: "C",
      email: "not-an-email",
      password: "password",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      expect(errors.name?.[0]).toBe("Enter your name.");
      expect(errors.email?.[0]).toBe("Enter a valid email.");
      expect(errors.password?.[0]).toBe("Use at least one number.");
    }
  });

  it("keeps safe field values after a failed signup submission", () => {
    const formData = new FormData();
    formData.set("name", "  Carlos  ");
    formData.set("email", "  OWNER@Example.COM ");
    formData.set("password", "secret-value");

    expect(signupValuesFromFormData(formData)).toEqual({
      name: "Carlos",
      email: "owner@example.com",
    });
  });
});

describe("parseOwnerProfileFields", () => {
  it("accepts a trimmed display name", () => {
    const parsed = parseOwnerProfileFields({ name: "  Home Owner  " });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Home Owner");
    }
  });

  it("rejects names that are too short", () => {
    const parsed = parseOwnerProfileFields({ name: "A" });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.name?.[0]).toBe("Enter your name.");
    }
  });
});
