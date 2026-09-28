// Pure rate-limit rules for login and signup (P0 security, 2026-09-28).
// lib/auth/rate-limit.ts applies them against the auth_attempts table.
// See docs/04-algorithms/01-auth-and-rate-limiting.md.

export type RateLimitRule = {
  /** Which counter this rule reads, e.g. "login:email". */
  scope: string;
  /** Attempts allowed inside the window before blocking. */
  limit: number;
  windowMinutes: number;
};

export const LOGIN_EMAIL_RULE: RateLimitRule = { scope: "login:email", limit: 5, windowMinutes: 15 };
export const LOGIN_IP_RULE: RateLimitRule = { scope: "login:ip", limit: 20, windowMinutes: 15 };
export const SIGNUP_IP_RULE: RateLimitRule = { scope: "signup:ip", limit: 5, windowMinutes: 60 };

export const RATE_LIMITED_MESSAGE =
  "Too many attempts. Wait a few minutes, then try again.";

export function rateLimitKey(rule: RateLimitRule, subject: string) {
  return `${rule.scope}:${subject.trim().toLowerCase()}`.slice(0, 320);
}

export function windowStart(rule: RateLimitRule, now: Date = new Date()) {
  return new Date(now.getTime() - rule.windowMinutes * 60 * 1000);
}

/** Blocked once the counted attempts in the window reach the limit. */
export function isOverLimit(attemptsInWindow: number, rule: RateLimitRule) {
  return attemptsInWindow >= rule.limit;
}

/**
 * Best-effort client IP from proxy headers. On Vercel, x-forwarded-for is set
 * by the platform edge, so its first entry is the caller's address.
 */
export function clientIpFromHeaders(headers: Pick<Headers, "get">) {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip")?.trim() || "unknown";
}
