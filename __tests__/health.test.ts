import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";
import { buildHealthPayload } from "@/lib/health";

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
