export const VENDOR_TRADE_OPTIONS = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Appliance",
  "Roof",
  "Structural",
  "Pest Control",
  "Landscaping",
  "Painting",
  "Cleaning",
  "Handyman",
  "Other",
] as const;

export const VENDOR_NOTIFICATION_OPTIONS = [
  "Email",
  "Text",
  "Phone",
  "Owner preference",
] as const;

export type VendorTrade = (typeof VENDOR_TRADE_OPTIONS)[number];
export type VendorNotificationPreference =
  (typeof VENDOR_NOTIFICATION_OPTIONS)[number];

export type VendorProfileInput = {
  businessName?: string | null;
  trades?: string[] | null;
  serviceArea?: string | null;
  availability?: string | null;
  notificationPreference?: string | null;
  licenseInsuranceNotes?: string | null;
};

export type NormalizedVendorProfile = {
  businessName: string | null;
  trades: VendorTrade[];
  serviceArea: string | null;
  availability: string | null;
  notificationPreference: VendorNotificationPreference | null;
  licenseInsuranceNotes: string | null;
};

export type VendorProfileReadiness = {
  label: string;
  detail: string;
  tone: "attention" | "progress" | "ready";
  missing: string[];
  completedCount: number;
  totalCount: number;
};

function compact(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

export function normalizeVendorTrades(trades: string[] | null | undefined): VendorTrade[] {
  const validTrades = new Set<string>(VENDOR_TRADE_OPTIONS);
  return Array.from(
    new Set(
      (trades ?? [])
        .map((trade) => trade.trim())
        .filter((trade): trade is VendorTrade => validTrades.has(trade))
    )
  );
}

export function normalizeVendorNotificationPreference(
  preference: string | null | undefined
): VendorNotificationPreference | null {
  return VENDOR_NOTIFICATION_OPTIONS.includes(
    preference as VendorNotificationPreference
  )
    ? (preference as VendorNotificationPreference)
    : null;
}

export function normalizeVendorProfile(
  input: VendorProfileInput
): NormalizedVendorProfile {
  return {
    businessName: compact(input.businessName),
    trades: normalizeVendorTrades(input.trades),
    serviceArea: compact(input.serviceArea),
    availability: compact(input.availability),
    notificationPreference: normalizeVendorNotificationPreference(
      input.notificationPreference
    ),
    licenseInsuranceNotes: compact(input.licenseInsuranceNotes),
  };
}

export function vendorProfileReadiness(
  input: VendorProfileInput | null | undefined
): VendorProfileReadiness {
  const profile = normalizeVendorProfile(input ?? {});
  const missing = [];

  if (!profile.businessName) missing.push("business name");
  if (profile.trades.length === 0) missing.push("trade categories");
  if (!profile.serviceArea) missing.push("service area");
  if (!profile.availability) missing.push("availability");
  if (!profile.notificationPreference) missing.push("notification preference");

  const totalCount = 5;
  const completedCount = totalCount - missing.length;

  if (missing.length === 0) {
    return {
      label: "Vendor profile ready",
      detail:
        "Trade, service area, availability, and notification preferences are ready for future job matching.",
      tone: "ready",
      missing,
      completedCount,
      totalCount,
    };
  }

  if (completedCount >= 3) {
    return {
      label: "Vendor profile almost ready",
      detail: `Add ${missing.join(", ")} so future opportunities can be routed cleanly.`,
      tone: "progress",
      missing,
      completedCount,
      totalCount,
    };
  }

  return {
    label: "Vendor profile needs setup",
    detail:
      "Add the vendor's trades, service area, availability, and preferred notification method before matching work.",
    tone: "attention",
    missing,
    completedCount,
    totalCount,
  };
}
