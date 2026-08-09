import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";
import {
  authorizeDeepHealth,
  bearerTokenFromHeader,
  buildDeepHealthPayload,
  buildHealthPayload,
} from "@/lib/health";

describe("buildHealthPayload", () => {
  it("builds a monitor-safe health payload", () => {
    const payload = buildHealthPayload(new Date("2026-08-08T12:00:00.000Z"), {
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_SHA: "1234567890abcdef",
    });

    expect(payload).toEqual({
      status: "ok",
      service: "turnflow-home",
      timestamp: "2026-08-08T12:00:00.000Z",
      version: "0.1.0",
      environment: "preview",
      commit: "1234567890ab",
    });
  });

  it("falls back when deployment metadata is unavailable", () => {
    const payload = buildHealthPayload(new Date("2026-08-08T12:00:00.000Z"), {});

    expect(payload.environment).toBe("unknown");
    expect(payload.commit).toBeNull();
  });
});

describe("GET /api/health", () => {
  it("returns an uncached ok response", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload.status).toBe("ok");
    expect(payload.service).toBe("turnflow-home");
    expect(typeof payload.timestamp).toBe("string");
  });
});

describe("bearerTokenFromHeader", () => {
  it("extracts a bearer token from an Authorization header", () => {
    expect(bearerTokenFromHeader("Bearer secret-1")).toBe("secret-1");
  });

  it("rejects missing or malformed authorization headers", () => {
    expect(bearerTokenFromHeader(null)).toBeNull();
    expect(bearerTokenFromHeader("Basic secret-1")).toBeNull();
    expect(bearerTokenFromHeader("Bearer")).toBeNull();
  });
});

describe("authorizeDeepHealth", () => {
  it("requires HEALTHCHECK_SECRET to be configured", () => {
    expect(authorizeDeepHealth("Bearer secret-1", {})).toEqual({
      authorized: false,
      status: 503,
      auth: "not_configured",
    });
  });

  it("rejects missing or invalid bearer tokens", () => {
    expect(authorizeDeepHealth(null, { HEALTHCHECK_SECRET: "secret-1" })).toEqual({
      authorized: false,
      status: 401,
      auth: "missing",
    });
    expect(authorizeDeepHealth("Bearer wrong", { HEALTHCHECK_SECRET: "secret-1" })).toEqual({
      authorized: false,
      status: 401,
      auth: "invalid",
    });
  });

  it("accepts the configured deep-health secret", () => {
    expect(authorizeDeepHealth("Bearer secret-1", { HEALTHCHECK_SECRET: "secret-1" })).toEqual({
      authorized: true,
      status: 200,
      auth: "ok",
    });
  });
});

describe("buildDeepHealthPayload", () => {
  it("builds a database-backed ok payload", () => {
    const payload = buildDeepHealthPayload(
      {
        status: "ok",
        auth: "ok",
        database: "ok",
        latencyMs: 12,
      },
      new Date("2026-08-08T12:00:00.000Z"),
      { VERCEL_ENV: "production" }
    );

    expect(payload.status).toBe("ok");
    expect(payload.environment).toBe("production");
    expect(payload.checks).toEqual({ auth: "ok", database: "ok" });
    expect(payload.latencyMs).toBe(12);
  });
});
