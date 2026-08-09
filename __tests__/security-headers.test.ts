import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS, securityHeaderValue } from "@/lib/security-headers";

describe("SECURITY_HEADERS", () => {
  it("defines a unique baseline browser security header set", () => {
    const keys = SECURITY_HEADERS.map((header) => header.key);

    expect(new Set(keys).size).toBe(keys.length);
    expect(securityHeaderValue("X-Content-Type-Options")).toBe("nosniff");
    expect(securityHeaderValue("X-Frame-Options")).toBe("DENY");
    expect(securityHeaderValue("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(securityHeaderValue("Permissions-Policy")).toContain("camera=()");
    expect(securityHeaderValue("Strict-Transport-Security")).toBe("max-age=31536000");
  });

  it("does not include a CSP until nonce handling is designed", () => {
    expect(securityHeaderValue("Content-Security-Policy")).toBeUndefined();
  });
});
