import { describe, expect, it } from "vitest";
import { evaluatePocReadiness, type PocReadinessEnv } from "@/lib/poc-readiness";

const readyEnv: PocReadinessEnv = {
  DATABASE_URL: "postgres://user:pass@example.neon.tech/db?sslmode=require",
  AUTH_SECRET: "a".repeat(32),
  NEXTAUTH_SECRET: "a".repeat(32),
  AUTH_URL: "https://turnflow-home.example.com",
  NEXTAUTH_URL: "https://turnflow-home.example.com",
  APP_URL: "https://turnflow-home.example.com",
  BLOB_READ_WRITE_TOKEN: `vercel_blob_rw_${"A".repeat(24)}`,
  BLOB_ACCESS: "private",
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
    expect(report.blockedCount).toBe(8);
    expect(report.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "DATABASE_URL", status: "blocked" }),
        expect.objectContaining({ key: "AUTH_SECRET", status: "blocked" }),
        expect.objectContaining({ key: "NEXTAUTH_SECRET", status: "blocked" }),
        expect.objectContaining({ key: "AUTH_URL", status: "blocked" }),
        expect.objectContaining({ key: "NEXTAUTH_URL", status: "blocked" }),
        expect.objectContaining({ key: "APP_URL", status: "blocked" }),
        expect.objectContaining({ key: "BLOB_READ_WRITE_TOKEN", status: "blocked" }),
        expect.objectContaining({ key: "HEALTHCHECK_SECRET", status: "blocked" }),
      ])
    );
  });

  it("warns when uploads are still stored in a public Blob store", () => {
    for (const BLOB_ACCESS of [undefined, "", "public"]) {
      const report = evaluatePocReadiness({ ...readyEnv, BLOB_ACCESS });

      expect(report.status).toBe("warning");
      expect(report.items).toEqual(
        expect.arrayContaining([expect.objectContaining({ key: "BLOB_ACCESS", status: "warning" })])
      );
    }
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

  it("blocks a Blob token that is present but not a real read/write token", () => {
    const report = evaluatePocReadiness({
      ...readyEnv,
      BLOB_READ_WRITE_TOKEN: "vercel_blob_token",
    });

    expect(report.status).toBe("blocked");
    expect(report.items).toContainEqual(
      expect.objectContaining({
        key: "BLOB_READ_WRITE_TOKEN",
        status: "blocked",
        detail: expect.stringContaining("not a valid Vercel Blob read/write token"),
      })
    );
  });

  it("blocks when the hosted NextAuth secret does not match AUTH_SECRET", () => {
    const report = evaluatePocReadiness({
      ...readyEnv,
      NEXTAUTH_SECRET: "different".repeat(4),
    });

    expect(report.status).toBe("blocked");
    expect(report.items).toContainEqual(
      expect.objectContaining({
        key: "NEXTAUTH_SECRET",
        status: "blocked",
      })
    );
  });

  it("blocks when auth base URLs point at a different host than APP_URL", () => {
    const report = evaluatePocReadiness({
      ...readyEnv,
      AUTH_URL: "https://wrong.example.com",
      NEXTAUTH_URL: "https://wrong.example.com",
    });

    expect(report.status).toBe("blocked");
    expect(report.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "AUTH_URL", status: "blocked" }),
        expect.objectContaining({ key: "NEXTAUTH_URL", status: "blocked" }),
      ])
    );
  });
});
