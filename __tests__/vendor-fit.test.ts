import { describe, expect, it } from "vitest";
import {
  vendorFitGuidance,
  vendorTradeMatchesRequest,
} from "@/lib/vendor-fit";

describe("vendorTradeMatchesRequest", () => {
  it("matches exact request categories to vendor trades", () => {
    expect(vendorTradeMatchesRequest("Plumbing", ["Plumbing"])).toBe(true);
    expect(vendorTradeMatchesRequest("HVAC", ["Plumbing"])).toBe(false);
  });

  it("allows compatible trades for broader request categories", () => {
    expect(vendorTradeMatchesRequest("Appliance", ["Handyman"])).toBe(true);
    expect(vendorTradeMatchesRequest("Roof", ["Structural"])).toBe(true);
    expect(vendorTradeMatchesRequest("Safety", ["Electrical"])).toBe(true);
  });
});

describe("vendorFitGuidance", () => {
  it("asks owners to invite a vendor when no vendor is assigned", () => {
    expect(
      vendorFitGuidance({
        request: { category: "Plumbing", assignedVendorId: null },
        profile: null,
      })
    ).toMatchObject({
      label: "No vendor selected",
      tone: "attention",
      nextAction: "Invite vendor",
      items: [],
    });
  });

  it("explains pending invites before profile fit can be reviewed", () => {
    expect(
      vendorFitGuidance({
        request: {
          category: "Plumbing",
          assignedVendorId: null,
          pendingVendorInviteId: "invite-1",
        },
        profile: null,
      })
    ).toMatchObject({
      label: "Vendor invite pending",
      tone: "progress",
      nextAction: "Wait for invite acceptance",
    });
  });

  it("flags an assigned vendor with no profile", () => {
    const guidance = vendorFitGuidance({
      request: { category: "Plumbing", assignedVendorId: "vendor-1" },
      profile: null,
    });

    expect(guidance).toMatchObject({
      label: "Vendor profile missing",
      tone: "attention",
      nextAction: "Ask vendor to complete profile",
    });
    expect(guidance.items[0]).toMatchObject({
      label: "Trade fit",
      complete: false,
    });
  });

  it("marks a fully described matching vendor as ready", () => {
    const guidance = vendorFitGuidance({
      request: { category: "Plumbing", assignedVendorId: "vendor-1" },
      profile: {
        businessName: "Brightside Plumbing",
        trades: ["Plumbing"],
        serviceArea: "Miami-Dade",
        availability: "Weekdays 8-5",
        notificationPreference: "Email",
        licenseInsuranceNotes: "Licensed and insured",
      },
    });

    expect(guidance).toMatchObject({
      label: "Vendor looks like a fit",
      tone: "ready",
      nextAction: "Proceed with owner approval",
    });
    expect(guidance.items.every((item) => item.complete)).toBe(true);
  });

  it("keeps matching vendors in progress when routing context is missing", () => {
    expect(
      vendorFitGuidance({
        request: { category: "Plumbing", assignedVendorId: "vendor-1" },
        profile: {
          businessName: "Brightside Plumbing",
          trades: ["Plumbing"],
        },
      })
    ).toMatchObject({
      label: "Vendor fit needs context",
      tone: "progress",
      nextAction: "Confirm missing profile details",
    });
  });

  it("warns owners when assigned vendor trades do not match the request", () => {
    expect(
      vendorFitGuidance({
        request: { category: "Electrical", assignedVendorId: "vendor-1" },
        profile: {
          businessName: "Brightside Plumbing",
          trades: ["Plumbing"],
          serviceArea: "Miami-Dade",
          availability: "Weekdays 8-5",
          notificationPreference: "Email",
        },
      })
    ).toMatchObject({
      label: "Review vendor fit",
      tone: "attention",
      nextAction: "Confirm trade fit",
    });
  });
});
