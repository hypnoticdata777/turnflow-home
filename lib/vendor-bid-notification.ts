export type VendorBidDecision = "approved" | "declined";

export type VendorBidDecisionNotificationInput = {
  decision: VendorBidDecision;
  requestTitle: string;
  vendorName?: string | null;
  amount: string | number;
};

export type VendorBidDecisionNotification = {
  type: "vendor_bid_approved" | "vendor_bid_declined";
  subject: string;
  text: string;
};

function money(amount: string | number) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

export function vendorBidDecisionNotification({
  decision,
  requestTitle,
  vendorName,
  amount,
}: VendorBidDecisionNotificationInput): VendorBidDecisionNotification {
  const isApproved = decision === "approved";
  const action = isApproved ? "approved" : "declined";
  const vendorLabel = vendorName || "Assigned vendor";

  return {
    type: isApproved ? "vendor_bid_approved" : "vendor_bid_declined",
    subject: `TurnFlow Home: your bid was ${action} for "${requestTitle}"`,
    text: `${vendorLabel}, the owner ${action} your ${money(amount)} bid for "${requestTitle}". ${
      isApproved
        ? "Open TurnFlow Home to confirm schedule, start work when ready, and keep proof current."
        : "Open TurnFlow Home to review the request and submit a revised bid only if scope, pricing, or availability changed."
    }`,
  };
}
