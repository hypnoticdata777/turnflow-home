import { describe, expect, it } from "vitest";
import { isLocalUrl } from "@/lib/local-host";
import { resolveSeedPassword, seedPasswordProblem } from "@/lib/seed-guard";

const HOSTED = "postgres://user:pass@ep-example-pooler.us-east-2.aws.neon.tech/db?sslmode=require";

describe("isLocalUrl", () => {
  it("accepts loopback hosts", () => {
    expect(isLocalUrl("postgres://u:p@localhost:5432/db")).toBe(true);
    expect(isLocalUrl("postgres://u:p@127.0.0.1:5432/db")).toBe(true);
    expect(isLocalUrl("http://[::1]:3000")).toBe(true);
    expect(isLocalUrl("http://LOCALHOST:3000")).toBe(true);
  });

  it("fails closed for hosted, look-alike, malformed, and missing values", () => {
    expect(isLocalUrl(HOSTED)).toBe(false);
    expect(isLocalUrl("https://localhost.example.com")).toBe(false);
    expect(isLocalUrl("http://example.com/localhost")).toBe(false);
    expect(isLocalUrl("not a url")).toBe(false);
    expect(isLocalUrl("")).toBe(false);
    expect(isLocalUrl(undefined)).toBe(false);
  });
});

describe("seedPasswordProblem", () => {
  it("lets a local database seed without a password override", () => {
    expect(seedPasswordProblem({ DATABASE_URL: "postgres://u:p@localhost:5432/db" })).toBeNull();
    expect(
      seedPasswordProblem({
        DATABASE_URL: "postgres://u:p@localhost:5432/db",
        SEED_PASSWORD: "password123",
      })
    ).toBeNull();
  });

  it("refuses a hosted database without an explicit password", () => {
    expect(seedPasswordProblem({ DATABASE_URL: HOSTED })).toMatch(/must be set/);
    expect(seedPasswordProblem({ DATABASE_URL: HOSTED, SEED_PASSWORD: "   " })).toMatch(
      /must be set/
    );
  });

  it("refuses the well-known default and short passwords on a hosted database", () => {
    expect(seedPasswordProblem({ DATABASE_URL: HOSTED, SEED_PASSWORD: "password123" })).toMatch(
      /well-known/
    );
    expect(seedPasswordProblem({ DATABASE_URL: HOSTED, SEED_PASSWORD: "short" })).toMatch(
      /at least 12/
    );
  });

  it("allows a hosted database with a strong explicit password", () => {
    expect(
      seedPasswordProblem({ DATABASE_URL: HOSTED, SEED_PASSWORD: "a-long-rotated-seed-pass" })
    ).toBeNull();
  });

  it("treats a missing or malformed DATABASE_URL as hosted", () => {
    expect(seedPasswordProblem({})).toMatch(/must be set/);
    expect(seedPasswordProblem({ DATABASE_URL: "garbage" })).toMatch(/must be set/);
  });
});

describe("resolveSeedPassword", () => {
  it("uses the explicit password, trimmed, else the local default", () => {
    expect(resolveSeedPassword({ SEED_PASSWORD: "  my-own-pass-123  " })).toBe("my-own-pass-123");
    expect(resolveSeedPassword({ SEED_PASSWORD: "" })).toBe("password123");
    expect(resolveSeedPassword({})).toBe("password123");
  });
});
