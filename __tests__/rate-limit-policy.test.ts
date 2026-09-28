import { describe, expect, it } from "vitest";
import {
  LOGIN_EMAIL_RULE,
  LOGIN_IP_RULE,
  SIGNUP_IP_RULE,
  clientIpFromHeaders,
  isOverLimit,
  rateLimitKey,
  windowStart,
} from "@/lib/auth/rate-limit-policy";

describe("rate limit policy", () => {
  it("blocks once attempts in the window reach the limit", () => {
    expect(isOverLimit(4, LOGIN_EMAIL_RULE)).toBe(false);
    expect(isOverLimit(5, LOGIN_EMAIL_RULE)).toBe(true);
    expect(isOverLimit(19, LOGIN_IP_RULE)).toBe(false);
    expect(isOverLimit(20, LOGIN_IP_RULE)).toBe(true);
    expect(isOverLimit(5, SIGNUP_IP_RULE)).toBe(true);
  });

  it("normalizes keys so casing cannot dodge the email counter", () => {
    expect(rateLimitKey(LOGIN_EMAIL_RULE, " Owner@Example.com ")).toBe(
      "login:email:owner@example.com"
    );
  });

  it("computes the sliding window start", () => {
    const now = new Date("2026-09-28T12:00:00Z");
    expect(windowStart(LOGIN_EMAIL_RULE, now).toISOString()).toBe("2026-09-28T11:45:00.000Z");
    expect(windowStart(SIGNUP_IP_RULE, now).toISOString()).toBe("2026-09-28T11:00:00.000Z");
  });

  it("reads the first forwarded IP, then x-real-ip, then a fallback", () => {
    expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": "1.1.1.1, 10.0.0.1" }))).toBe("1.1.1.1");
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "2.2.2.2" }))).toBe("2.2.2.2");
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });
});
