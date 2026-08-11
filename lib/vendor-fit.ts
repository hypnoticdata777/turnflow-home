import {
  normalizeVendorProfile,
  type VendorProfileInput,
} from "@/lib/vendor-profile";

export type VendorFitRequest = {
  category: string;
  assignedVendorId?: string | null;
  pendingVendorInviteId?: string | null;
};

export type VendorFitGuidance = {
  label: string;
  detail: string;
  tone: "attention" | "progress" | "ready";
  nextAction: string;
  items: Array<{
    label: string;
    detail: string;
    complete: boolean;
  }>;
};

const compatibleTradeMap: Record<string, string[]> = {
  Appliance: ["Appliance", "Handyman"],
  Roof: ["Roof", "Structural"],
  Safety: ["Electrical", "Structural", "Handyman", "Other"],
};

function compatibleTradesFor(category: string) {
  return [category, ...(compatibleTradeMap[category] ?? [])];
}

function hasValue(value: string | null | undefined) {
  return Boolean(value && value.trim());
}

export function vendorTradeMatchesRequest(
  category: string,
  trades: string[] | null | undefined
) {
  const compatibleTrades = new Set(compatibleTradesFor(category));
  return (trades ?? []).some((trade) => compatibleTrades.has(trade));
}

export function vendorFitGuidance({
  request,
  profile,
}: {
  request: VendorFitRequest;
  profile: VendorProfileInput | null | undefined;
}): VendorFitGuidance {
  if (!request.assignedVendorId) {
    if (request.pendingVendorInviteId) {
      return {
        label: "Vendor invite pending",
        detail:
          "The owner has invited a vendor, but fit can be reviewed after that vendor accepts and completes a profile.",
        tone: "progress",
        nextAction: "Wait for invite acceptance",
        items: [],
      };
    }

    return {
      label: "No vendor selected",
      detail:
        "Invite a vendor when this repair needs outside help, then review whether their trades and availability fit the job.",
      tone: "attention",
      nextAction: "Invite vendor",
      items: [],
    };
  }

  if (!profile) {
    return {
      label: "Vendor profile missing",
      detail:
        "A vendor is assigned, but they have not added matching details yet. Ask them to complete their vendor profile before using fit for decisions.",
      tone: "attention",
      nextAction: "Ask vendor to complete profile",
      items: [
        {
          label: "Trade fit",
          detail: `No trade profile is available for ${request.category}.`,
          complete: false,
        },
      ],
    };
  }

  const normalized = normalizeVendorProfile(profile);
  const tradeMatch = vendorTradeMatchesRequest(request.category, normalized.trades);
  const items = [
    {
      label: "Trade fit",
      detail: tradeMatch
        ? `${normalized.trades.join(", ")} can cover this ${request.category} request.`
        : `${normalized.trades.length > 0 ? normalized.trades.join(", ") : "No trades"} do not clearly match ${request.category}.`,
      complete: tradeMatch,
    },
    {
      label: "Service area",
      detail: normalized.serviceArea || "No service area is saved on this vendor profile.",
      complete: hasValue(normalized.serviceArea),
    },
    {
      label: "Availability",
      detail: normalized.availability || "No availability window is saved yet.",
      complete: hasValue(normalized.availability),
    },
    {
      label: "Notification",
      detail: normalized.notificationPreference
        ? `${normalized.notificationPreference} is the saved vendor preference.`
        : "No notification preference is saved yet.",
      complete: hasValue(normalized.notificationPreference),
    },
    {
      label: "Credentials",
      detail:
        normalized.licenseInsuranceNotes ||
        "No license or insurance notes are saved yet.",
      complete: hasValue(normalized.licenseInsuranceNotes),
    },
  ];
  const requiredReady = items.slice(0, 4).every((item) => item.complete);

  if (requiredReady) {
    return {
      label: "Vendor looks like a fit",
      detail:
        "The assigned vendor's trades, service area, availability, and notification preference line up well enough for this request.",
      tone: "ready",
      nextAction: "Proceed with owner approval",
      items,
    };
  }

  if (tradeMatch) {
    return {
      label: "Vendor fit needs context",
      detail:
        "The assigned vendor appears to cover this trade, but profile details are still missing before the owner can fully trust the match.",
      tone: "progress",
      nextAction: "Confirm missing profile details",
      items,
    };
  }

  return {
    label: "Review vendor fit",
    detail:
      "The assigned vendor's saved trades do not clearly match this request category. Confirm fit before approval or work start.",
    tone: "attention",
    nextAction: "Confirm trade fit",
    items,
  };
}
