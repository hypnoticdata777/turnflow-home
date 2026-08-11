export type OwnerQuoteReviewInput = {
  vendorName?: string | null;
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

export type QuoteComparisonMetric = {
  label: string;
  value: string;
  detail: string;
  tone: "attention" | "progress" | "ready";
};

export type QuoteComparisonCue = {
  label: string;
  detail: string;
  tone: "attention" | "progress" | "ready";
};

function money(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
}

function amountValue(quote: OwnerQuoteReviewInput) {
  const amount = Number(quote.amount);
  return Number.isFinite(amount) ? amount : null;
}

function activeQuotes(quotes: OwnerQuoteReviewInput[]) {
  return quotes.filter((quote) => quote.status !== "declined" && amountValue(quote) !== null);
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

export function quoteComparisonMetrics(
  quotes: OwnerQuoteReviewInput[]
): QuoteComparisonMetric[] {
  const active = activeQuotes(quotes);
  if (active.length < 2) return [];

  const sorted = [...active].sort((a, b) => Number(a.amount) - Number(b.amount));
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  const spread = Number(highest.amount) - Number(lowest.amount);
  const pendingCount = active.filter((quote) => quote.status === "pending").length;
  const approvedCount = active.filter((quote) => quote.status === "approved").length;
  const vendorBidCount = active.filter((quote) => quote.submittedByVendorId).length;

  return [
    {
      label: "Active options",
      value: String(active.length),
      detail: `${pendingCount} pending and ${approvedCount} approved. Declined quotes stay in history but do not drive the current decision.`,
      tone: pendingCount > 0 ? "progress" : "ready",
    },
    {
      label: "Lowest active price",
      value: money(lowest.amount),
      detail: `${lowest.vendorName || "The lowest option"} is currently lowest. Compare scope, timing, and trust before approving.`,
      tone: "progress",
    },
    {
      label: "Price spread",
      value: money(spread),
      detail:
        spread > 0
          ? `The highest active quote is ${money(spread)} above the lowest.`
          : "Active quotes are tied on price, so compare availability and scope.",
      tone: spread > 0 ? "attention" : "ready",
    },
    {
      label: "Vendor-submitted",
      value: `${vendorBidCount}/${active.length}`,
      detail:
        vendorBidCount > 0
          ? "Vendor-submitted bids came directly from assigned vendors; owner-entered quotes may need manual confirmation."
          : "No active vendor-submitted bids yet. Confirm owner-entered quotes before scheduling.",
      tone: vendorBidCount > 0 ? "ready" : "attention",
    },
  ];
}

export function quoteComparisonCue(
  quote: OwnerQuoteReviewInput,
  quotes: OwnerQuoteReviewInput[]
): QuoteComparisonCue {
  const active = activeQuotes(quotes);
  const amount = amountValue(quote);

  if (quote.status === "declined") {
    return {
      label: "Historical price",
      detail: "This declined quote stays in the record but is excluded from the active comparison.",
      tone: "attention",
    };
  }

  if (quote.status === "approved") {
    return {
      label: "Selected quote",
      detail: "This is the approved quoted cost for the request.",
      tone: "ready",
    };
  }

  if (active.length < 2 || amount === null) {
    return {
      label: "Needs comparison",
      detail: "Add another quote or vendor bid if the owner wants price context before approving.",
      tone: "progress",
    };
  }

  const values = active.map((item) => Number(item.amount));
  const lowest = Math.min(...values);
  const highest = Math.max(...values);

  if (amount === lowest && amount === highest) {
    return {
      label: "Price tied",
      detail: "Active quotes are tied on price. Compare timing, scope, and confidence next.",
      tone: "progress",
    };
  }

  if (amount === lowest) {
    return {
      label: "Lowest active price",
      detail: "This is the lowest active option. Confirm the scope and availability still fit.",
      tone: "ready",
    };
  }

  if (amount === highest) {
    return {
      label: "Highest active price",
      detail: "Approve this only if scope, timing, or vendor confidence justifies the difference.",
      tone: "attention",
    };
  }

  return {
    label: "Middle price",
    detail: "This sits between the lowest and highest active options.",
    tone: "progress",
  };
}
