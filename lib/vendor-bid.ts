export type VendorBidRequest = {
  status: string;
  quotedCost?: string | number | null;
};

export type VendorBid = {
  amount: string | number;
  status: string;
  availabilityWindow?: string | null;
  notes?: string | null;
};

export type VendorBidGuidance = {
  label: string;
  detail: string;
  tone: "attention" | "progress" | "ready";
  cta: string;
};

function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
}

export function vendorBidGuidance({
  request,
  bid,
}: {
  request: VendorBidRequest;
  bid: VendorBid | null | undefined;
}): VendorBidGuidance {
  if (!bid) {
    return {
      label: request.status === "Needs Quote" ? "Bid requested" : "Bid not submitted",
      detail:
        request.status === "Needs Quote"
          ? "The owner needs price context. Submit your amount, availability, and scope notes for owner review."
          : "Submit a bid when the owner needs pricing before approval or scheduling.",
      tone: "attention",
      cta: "Submit bid",
    };
  }

  if (bid.status === "approved") {
    return {
      label: "Bid approved",
      detail: `The owner approved your ${formatMoney(bid.amount)} bid. Keep status and proof current as work moves.`,
      tone: "ready",
      cta: "Update bid if scope changes",
    };
  }

  if (bid.status === "declined") {
    return {
      label: "Bid declined",
      detail:
        "The owner declined this bid. Submit an updated bid only if the scope, amount, or availability changed.",
      tone: "attention",
      cta: "Revise bid",
    };
  }

  return {
    label: "Bid under owner review",
    detail: `Your ${formatMoney(bid.amount)} bid is saved privately for the owner to approve or decline.`,
    tone: "progress",
    cta: "Update bid",
  };
}
