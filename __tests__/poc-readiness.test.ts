import { describe, expect, it } from "vitest";
import { evaluatePocReadiness, type PocReadinessEnv } from "@/lib/poc-readiness";

const readyEnv: PocReadinessEnv = {
  DATABASE_URL: "postgres://user:pass@example.neon.tech/db?sslmode=require",
  AUTH_SECRET: "a".repeat(32),
  APP_URL: "https://turnflow-home.example.com",
  BLOB_READ_WRITE_TOKEN: "vercel_blob_token",
  HEALTHCHECK_SECRET: "b".repeat(32),
  CRON_SECRET: "c".repeat(32),
  RESEND_API_KEY: "re_123",
  NOTIFICATIONS_FROM_EMAIL: "notifications@example.com",
};

describe("evaluatePocReadiness", () => {
  it("marks a fully configured POC as ready", () => {
    const report = evaluatePocReadiness(readyEnv);

    expect(report.status).toBe("ready");
    expect(report.blockedCount).toBe(0);
    expect(report.warningCount).toBe(0);
    expect(report.items.every((item) => item.status === "ready")).toBe(true);
  });

  it("blocks missing launch-critical auth, database, app URL, blob, and health config", () => {
    const report = evaluatePocReadiness({});

    expect(report.status).toBe("blocked");
    expect(report.blockedCount).toBe(5);
    expect(report.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "DATABASE_URL", status: "blocked" }),
        expect.objectContaining({ key: "AUTH_SECRET", status: "blocked" }),
        expect.objectContaining({ key: "APP_URL", status: "blocked" }),
        expect.objectContaining({ key: "BLOB_READ_WRITE_TOKEN", status: "blocked" }),
        expect.objectContaining({ key: "HEALTHCHECK_SECRET", status: "blocked" }),
      ])
    );
  });

  it("warns when optional delivery automation is not configured", () => {
    const report = evaluatePocReadiness({
      ...readyEnv,
      CRON_SECRET: "",
      RESEND_API_KEY: "",
    });

    expect(report.status).toBe("warning");
    expect(report.blockedCount).toBe(0);
    expect(report.warningCount).toBe(2);
    expect(report.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "CRON_SECRET", status: "warning" }),
        expect.objectContaining({ key: "RESEND_API_KEY", status: "warning" }),
      ])
    );
  });

  it("blocks email config when Resend has no valid sender", () => {
    const report = evaluatePocReadiness({
      ...readyEnv,
      NOTIFICATIONS_FROM_EMAIL: "not-an-email",
    });

    expect(report.status).toBe("blocked");
    expect(report.items).toContainEqual(
      expect.objectContaining({
        key: "NOTIFICATIONS_FROM_EMAIL",
        status: "blocked",
      })
    );
  });
});
