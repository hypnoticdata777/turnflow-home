import { describe, expect, it } from "vitest";
import { describeLogAction } from "@/components/DecisionLog";

describe("describeLogAction", () => {
  it("describes vendor access removal", () => {
    expect(
      describeLogAction("shared_access_removed", {
        role: "vendor",
        removedUserEmail: "vendor@test.com",
      })
    ).toBe(
      "Removed vendor access for vendor@test.com from this request."
    );
  });

  it("describes collaborator access removal", () => {
    expect(
      describeLogAction("shared_access_removed", {
        role: "collaborator",
        removedUserEmail: "helper@test.com",
      })
    ).toBe(
      "Removed collaborator access for helper@test.com from this request."
    );
  });

  it("keeps a readable fallback when the removed user's email is unavailable", () => {
    expect(describeLogAction("shared_access_removed", { role: "vendor" })).toBe(
      "Removed vendor access from this request."
    );
  });

  it("falls back to the action key for unknown log events", () => {
    expect(describeLogAction("unknown_event", null)).toBe("unknown_event");
  });
});
