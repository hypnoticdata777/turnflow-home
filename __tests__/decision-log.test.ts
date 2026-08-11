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

  it("describes vendor bid submissions and updates", () => {
    expect(
      describeLogAction("vendor_bid_submitted", {
        vendorName: "Brightside Home Services",
        amount: "325.00",
      })
    ).toBe("Vendor bid submitted by Brightside Home Services ($325.00).");
    expect(
      describeLogAction("vendor_bid_updated", {
        vendorName: "Brightside Home Services",
        amount: "350.00",
      })
    ).toBe("Vendor bid updated by Brightside Home Services ($350.00).");
  });

  it("falls back to the action key for unknown log events", () => {
    expect(describeLogAction("unknown_event", null)).toBe("unknown_event");
  });
});
