import { describe, expect, it } from "vitest";
import { vendorBidDecisionNotification } from "@/lib/vendor-bid-notification";

describe("vendorBidDecisionNotification", () => {
  it("builds clear approved-bid copy for the assigned vendor", () => {
    expect(
      vendorBidDecisionNotification({
        decision: "approved",
        requestTitle: "Kitchen faucet replacement",
        vendorName: "Flow Pros",
        amount: "325",
      })
    ).toEqual({
      type: "vendor_bid_approved",
      subject:
        'TurnFlow Home: your bid was approved for "Kitchen faucet replacement"',
      text:
        'Flow Pros, the owner approved your $325.00 bid for "Kitchen faucet replacement". Open TurnFlow Home to confirm schedule, start work when ready, and keep proof current.',
    });
  });

  it("builds revision-oriented declined-bid copy", () => {
    expect(
      vendorBidDecisionNotification({
        decision: "declined",
        requestTitle: "Fence repair",
        amount: 180,
      })
    ).toMatchObject({
      type: "vendor_bid_declined",
      subject: 'TurnFlow Home: your bid was declined for "Fence repair"',
      text:
        'Assigned vendor, the owner declined your $180.00 bid for "Fence repair". Open TurnFlow Home to review the request and submit a revised bid only if scope, pricing, or availability changed.',
    });
  });
});
