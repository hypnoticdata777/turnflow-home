export type OwnerQuoteReviewInput = {
  amount: string | number;
  status: string;
  submittedByVendorId?: string | null;
  availabilityWindow?: string | null;
  notes?: string | null;
};

export type BidReviewGuidance = {
  label: string;
  detail: string;
  tone: "attention" | "progress" | "ready";
  nextAction: string;
};

function money(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
}

export function quoteReviewSummary(
  quotes: OwnerQuoteReviewInput[]
): BidReviewGuidance {
  const vendorPendingCount = quotes.filter(
    (quote) => quote.submittedByVendorId && quote.status === "pending"
  ).length;
  const pendingCount = quotes.filter((quote) => quote.status === "pending").length;
  const approvedCount = quotes.filter((quote) => quote.status === "approved").length;

  if (quotes.length === 0) {
    return {
      label: "No bids or quotes yet",
      detail:
        "Add an owner-entered quote or ask the assigned vendor to submit a private bid before approving work.",
      tone: "attention",
      nextAction: "Collect price context",
    };
  }

  if (vendorPendingCount > 0) {
    return {
      label: "Vendor bid needs owner decision",
      detail: `${vendorPendingCount} vendor-submitted ${vendorPendingCount === 1 ? "bid is" : "bids are"} waiting for approval or decline.`,
      tone: "attention",
      nextAction: "Review vendor bid",
    };
  }

  if (approvedCount > 0) {
    return {
      label: "Approved quote selected",
      detail:
        "An approved quote has been copied to the request's quoted cost. Re-approve if a vendor revises pricing later.",
      tone: "ready",
      nextAction: "Continue work handoff",
    };
  }

  if (pendingCount > 0) {
    return {
      label: "Quotes need owner decision",
      detail: `${pendingCount} ${pendingCount === 1 ? "quote is" : "quotes are"} waiting for approval or decline.`,
      tone: "progress",
      nextAction: "Compare quotes",
    };
  }

  return {
    label: "No active quote selected",
    detail:
      "All recorded quotes are declined or inactive. Add a new quote or ask the vendor for revised pricing.",
    tone: "attention",
    nextAction: "Request revised pricing",
  };
}

export function quoteDecisionGuidance(
  quote: OwnerQuoteReviewInput
): BidReviewGuidance {
  const isVendorBid = Boolean(quote.submittedByVendorId);

  if (quote.status === "approved") {
    return {
      label: isVendorBid ? "Vendor bid approved" : "Quote approved",
      detail: `${money(quote.amount)} is the approved quoted cost for this request.`,
      tone: "ready",
      nextAction: "Use for work handoff",
    };
  }

  if (quote.status === "declined") {
    return {
      label: isVendorBid ? "Vendor bid declined" : "Quote declined",
      detail:
        "This price stays in the record for history, but it should not be used for approval or scheduling.",
      tone: "attention",
      nextAction: isVendorBid ? "Wait for revised bid" : "Review other quotes",
    };
  }

  if (isVendorBid) {
    return {
      label: "Owner decision needed",
      detail: `Approving this ${money(quote.amount)} vendor bid copies it to quoted cost. Declining keeps it in history without using it for approval.`,
      tone: "attention",
      nextAction: "Approve or decline",
    };
  }

  return {
    label: "Quote awaiting decision",
    detail: `Approving this ${money(quote.amount)} quote copies it to quoted cost for the request.`,
    tone: "progress",
    nextAction: "Compare before approving",
  };
}
