import { describe, expect, it } from "vitest";
import { describeLogAction } from "@/components/DecisionLog";

describe("describeLogAction", () => {
  it("describes vendor access removal", () => {
    expect(describeLogAction("shared_access_removed", { role: "vendor" })).toBe(
      "Removed vendor access from this request."
    );
  });

  it("describes collaborator access removal", () => {
    expect(describeLogAction("shared_access_removed", { role: "collaborator" })).toBe(
      "Removed collaborator access from this request."
    );
  });

  it("falls back to the action key for unknown log events", () => {
    expect(describeLogAction("unknown_event", null)).toBe("unknown_event");
  });
});
