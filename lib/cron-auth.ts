// Shared bearer check for Vercel Cron routes (P0 hardening, 2026-09-28).
// Vercel sends "Authorization: Bearer $CRON_SECRET" on scheduled calls.
//
// Before: a missing CRON_SECRET meant the route was open to anyone.
// Now: a missing secret is only tolerated outside production (local dev);
// in production the route answers 503 until the secret is configured.

export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

export function authorizeCronRequest(
  authorizationHeader: string | null,
  env: { CRON_SECRET?: string; NODE_ENV?: string } = process.env
): CronAuthResult {
  const secret = env.CRON_SECRET?.trim();
  if (!secret) {
    return env.NODE_ENV === "production"
      ? { ok: false, status: 503, error: "CRON_SECRET is not configured" }
      : { ok: true };
  }
  return authorizationHeader === `Bearer ${secret}`
    ? { ok: true }
    : { ok: false, status: 401, error: "Unauthorized" };
}
