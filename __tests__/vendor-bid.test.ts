import { describe, expect, it } from "vitest";
import { vendorBidGuidance } from "@/lib/vendor-bid";

describe("vendorBidGuidance", () => {
  it("asks vendors to submit pricing when the owner needs a quote", () => {
    expect(
      vendorBidGuidance({
        request: { status: "Needs Quote" },
        bid: null,
      })
    ).toMatchObject({
      label: "Bid requested",
      tone: "attention",
      cta: "Submit bid",
    });
  });

  it("shows pending bids as under owner review", () => {
    expect(
      vendorBidGuidance({
        request: { status: "Waiting" },
        bid: { amount: "250", status: "pending" },
      })
    ).toMatchObject({
      label: "Bid under owner review",
      detail: "Your $250.00 bid is saved privately for the owner to approve or decline.",
      tone: "progress",
      cta: "Update bid",
    });
  });

  it("shows approved bids as ready to work", () => {
    expect(
      vendorBidGuidance({
        request: { status: "Scheduled" },
        bid: { amount: "250", status: "approved" },
      })
    ).toMatchObject({
      label: "Bid approved",
      tone: "ready",
      cta: "Update bid if scope changes",
    });
  });

  it("lets declined bids be revised", () => {
    expect(
      vendorBidGuidance({
        request: { status: "Needs Quote" },
        bid: { amount: "250", status: "declined" },
      })
    ).toMatchObject({
      label: "Bid declined",
      tone: "attention",
      cta: "Revise bid",
    });
  });
});
