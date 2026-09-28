import { describe, expect, it } from "vitest";
import { authorizeCronRequest } from "@/lib/cron-auth";

describe("authorizeCronRequest", () => {
  it("accepts only the exact bearer secret when one is set", () => {
    const env = { CRON_SECRET: "s".repeat(32), NODE_ENV: "production" };
    expect(authorizeCronRequest(`Bearer ${"s".repeat(32)}`, env)).toEqual({ ok: true });
    expect(authorizeCronRequest("Bearer wrong", env)).toMatchObject({ ok: false, status: 401 });
    expect(authorizeCronRequest(null, env)).toMatchObject({ ok: false, status: 401 });
  });

  it("fails closed in production when the secret is missing", () => {
    expect(authorizeCronRequest(null, { NODE_ENV: "production" })).toMatchObject({
      ok: false,
      status: 503,
    });
  });

  it("stays open for local development without a secret", () => {
    expect(authorizeCronRequest(null, { NODE_ENV: "development" })).toEqual({ ok: true });
  });
});
