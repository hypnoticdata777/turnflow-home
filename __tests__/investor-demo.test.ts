import { describe, expect, it } from "vitest";
import { investorDemoPasswordProblem } from "@/lib/demo/investor-seed";

describe("investorDemoPasswordProblem", () => {
  it("requires a configured password of at least 12 characters", () => {
    expect(investorDemoPasswordProblem(undefined)).toMatch(/not set/);
    expect(investorDemoPasswordProblem("   ")).toMatch(/not set/);
    expect(investorDemoPasswordProblem("short")).toMatch(/at least 12/);
    expect(investorDemoPasswordProblem("a-long-rotated-demo-pass")).toBeNull();
  });
});
