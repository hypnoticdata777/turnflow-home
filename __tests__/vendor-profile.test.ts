import { describe, expect, it } from "vitest";
import {
  normalizeVendorProfile,
  normalizeVendorTrades,
  vendorProfileReadiness,
} from "@/lib/vendor-profile";

describe("normalizeVendorTrades", () => {
  it("keeps supported trades, removes duplicates, and drops unknown values", () => {
    expect(
      normalizeVendorTrades(["Plumbing", "Plumbing", "Unknown", "HVAC"])
    ).toEqual(["Plumbing", "HVAC"]);
  });
});

describe("normalizeVendorProfile", () => {
  it("trims strings and normalizes notification preference", () => {
    expect(
      normalizeVendorProfile({
        businessName: "  Brightside Plumbing  ",
        trades: ["Plumbing"],
        serviceArea: "  Miami-Dade  ",
        availability: "  Weekdays  ",
        notificationPreference: "Email",
        licenseInsuranceNotes: "  Licensed and insured  ",
      })
    ).toEqual({
      businessName: "Brightside Plumbing",
      trades: ["Plumbing"],
      serviceArea: "Miami-Dade",
      availability: "Weekdays",
      notificationPreference: "Email",
      licenseInsuranceNotes: "Licensed and insured",
    });
  });

  it("drops unsupported notification preferences", () => {
    expect(
      normalizeVendorProfile({
        notificationPreference: "Unsupported option",
      }).notificationPreference
    ).toBeNull();
  });
});

describe("vendorProfileReadiness", () => {
  it("marks an empty profile as needing setup", () => {
    expect(vendorProfileReadiness(null)).toMatchObject({
      label: "Vendor profile needs setup",
      tone: "attention",
      completedCount: 0,
      totalCount: 5,
      missing: [
        "business name",
        "trade categories",
        "service area",
        "availability",
        "notification preference",
      ],
    });
  });

  it("marks a partial profile as almost ready", () => {
    expect(
      vendorProfileReadiness({
        businessName: "Brightside Plumbing",
        trades: ["Plumbing"],
        serviceArea: "Miami-Dade",
      })
    ).toMatchObject({
      label: "Vendor profile almost ready",
      tone: "progress",
      completedCount: 3,
      totalCount: 5,
      missing: ["availability", "notification preference"],
    });
  });

  it("marks a complete profile as ready for future matching", () => {
    expect(
      vendorProfileReadiness({
        businessName: "Brightside Plumbing",
        trades: ["Plumbing", "HVAC"],
        serviceArea: "Miami-Dade",
        availability: "Weekdays 8-5",
        notificationPreference: "Email",
      })
    ).toMatchObject({
      label: "Vendor profile ready",
      tone: "ready",
      completedCount: 5,
      totalCount: 5,
      missing: [],
    });
  });
});
