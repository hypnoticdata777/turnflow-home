import { describe, expect, it } from "vitest";
import {
  quoteDecisionGuidance,
  quoteReviewSummary,
} from "@/lib/bid-review";

describe("quoteReviewSummary", () => {
  it("asks owners to collect price context when no quotes exist", () => {
    expect(quoteReviewSummary([])).toMatchObject({
      label: "No bids or quotes yet",
      tone: "attention",
      nextAction: "Collect price context",
    });
  });

  it("prioritizes pending vendor bids over regular pending quotes", () => {
    expect(
      quoteReviewSummary([
        { amount: "300", status: "pending", submittedByVendorId: null },
        { amount: "250", status: "pending", submittedByVendorId: "vendor-1" },
      ])
    ).toMatchObject({
      label: "Vendor bid needs owner decision",
      detail: "1 vendor-submitted bid is waiting for approval or decline.",
      tone: "attention",
    });
  });

  it("marks approved quote workspaces as ready", () => {
    expect(
      quoteReviewSummary([{ amount: "250", status: "approved" }])
    ).toMatchObject({
      label: "Approved quote selected",
      tone: "ready",
      nextAction: "Continue work handoff",
    });
  });
});

describe("quoteDecisionGuidance", () => {
  it("explains what approving a vendor bid will do", () => {
    expect(
      quoteDecisionGuidance({
        amount: "250",
        status: "pending",
        submittedByVendorId: "vendor-1",
      })
    ).toMatchObject({
      label: "Owner decision needed",
      detail:
        "Approving this $250.00 vendor bid copies it to quoted cost. Declining keeps it in history without using it for approval.",
      tone: "attention",
      nextAction: "Approve or decline",
    });
  });

  it("explains declined vendor bids as historical records", () => {
    expect(
      quoteDecisionGuidance({
        amount: "250",
        status: "declined",
        submittedByVendorId: "vendor-1",
      })
    ).toMatchObject({
      label: "Vendor bid declined",
      tone: "attention",
      nextAction: "Wait for revised bid",
    });
  });

  it("explains regular owner-entered pending quotes", () => {
    expect(
      quoteDecisionGuidance({
        amount: "300",
        status: "pending",
      })
    ).toMatchObject({
      label: "Quote awaiting decision",
      tone: "progress",
      nextAction: "Compare before approving",
    });
  });
});
