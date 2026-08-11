import { describe, expect, it } from "vitest";
import {
  quoteComparisonCue,
  quoteComparisonMetrics,
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

describe("quoteComparisonMetrics", () => {
  it("returns no metrics until at least two active options exist", () => {
    expect(quoteComparisonMetrics([{ vendorName: "A", amount: "250", status: "pending" }])).toEqual([]);
  });

  it("summarizes active options, lowest price, spread, and vendor-submitted count", () => {
    expect(
      quoteComparisonMetrics([
        {
          vendorName: "Flow Pros",
          amount: "250",
          status: "pending",
          submittedByVendorId: "vendor-1",
        },
        { vendorName: "Owner quote", amount: "325", status: "pending" },
        { vendorName: "Old option", amount: "200", status: "declined" },
      ])
    ).toEqual([
      {
        label: "Active options",
        value: "2",
        detail:
          "2 pending and 0 approved. Declined quotes stay in history but do not drive the current decision.",
        tone: "progress",
      },
      {
        label: "Lowest active price",
        value: "$250.00",
        detail:
          "Flow Pros is currently lowest. Compare scope, timing, and trust before approving.",
        tone: "progress",
      },
      {
        label: "Price spread",
        value: "$75.00",
        detail: "The highest active quote is $75.00 above the lowest.",
        tone: "attention",
      },
      {
        label: "Vendor-submitted",
        value: "1/2",
        detail:
          "Vendor-submitted bids came directly from assigned vendors; owner-entered quotes may need manual confirmation.",
        tone: "ready",
      },
    ]);
  });
});

describe("quoteComparisonCue", () => {
  const quotes = [
    { vendorName: "Lowest", amount: "250", status: "pending" },
    { vendorName: "Middle", amount: "300", status: "pending" },
    { vendorName: "Highest", amount: "375", status: "pending" },
  ];

  it("marks the lowest active price", () => {
    expect(quoteComparisonCue(quotes[0], quotes)).toMatchObject({
      label: "Lowest active price",
      tone: "ready",
    });
  });

  it("marks middle and highest prices", () => {
    expect(quoteComparisonCue(quotes[1], quotes)).toMatchObject({
      label: "Middle price",
      tone: "progress",
    });
    expect(quoteComparisonCue(quotes[2], quotes)).toMatchObject({
      label: "Highest active price",
      tone: "attention",
    });
  });

  it("excludes declined quotes from active comparison", () => {
    expect(
      quoteComparisonCue(
        { vendorName: "Declined", amount: "100", status: "declined" },
        quotes
      )
    ).toMatchObject({
      label: "Historical price",
      tone: "attention",
    });
  });
});
