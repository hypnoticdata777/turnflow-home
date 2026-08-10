import { describe, expect, it } from "vitest";
import {
  ownerAccountReadinessItems,
  ownerDashboardGuidance,
  ownerNextSetupStep,
  ownerReadinessFlags,
  ownerSetupProgress,
  ownerSetupSummary,
  ownerSetupSteps,
  type OwnerReadinessInput,
} from "@/lib/owner-readiness";

const emptyInput: OwnerReadinessInput = {
  properties: [],
  requests: [],
  invites: [],
  vaultDocuments: [],
  reminders: [],
};

describe("ownerReadinessFlags", () => {
  it("starts with no launch-readiness signals for a brand-new owner", () => {
    expect(ownerReadinessFlags(emptyInput)).toEqual({
      hasProperty: false,
      hasRequest: false,
      hasEvidence: false,
      hasHelper: false,
      hasVaultDoc: false,
      hasReminder: false,
      sharedRequestCount: 0,
    });
  });

  it("detects evidence, helpers, and shared request footprint", () => {
    const flags = ownerReadinessFlags({
      properties: [{}],
      requests: [
        { id: "r1", photos: [{}], pendingVendorInviteId: "invite-1" },
        { id: "r2", assignedVendorId: "vendor-1" },
        { id: "r3" },
      ],
      invites: [{}],
      vaultDocuments: [{}],
      reminders: [{}],
    });

    expect(flags).toMatchObject({
      hasProperty: true,
      hasRequest: true,
      hasEvidence: true,
      hasHelper: true,
      hasVaultDoc: true,
      hasReminder: true,
      sharedRequestCount: 2,
    });
  });
});

describe("ownerSetupSteps / ownerSetupProgress", () => {
  it("keeps first-run steps in the intended homeowner order", () => {
    const steps = ownerSetupSteps(emptyInput);

    expect(steps.map((step) => step.title)).toEqual([
      "Create your first property",
      "Log one active maintenance issue",
      "Attach proof or context",
      "Bring in the right person",
      "Preserve the repair history",
      "Set one recurring reminder",
    ]);
    expect(ownerSetupProgress(steps)).toEqual({
      completedCount: 0,
      totalCount: 6,
      progress: 0,
    });
  });

  it("sends request-specific steps to the first request once one exists", () => {
    const steps = ownerSetupSteps(
      {
        ...emptyInput,
        properties: [{}],
        requests: [{ id: "request-1", photos: [{}] }],
      },
      "request-1"
    );

    expect(steps[2]).toMatchObject({
      complete: true,
      href: "/owner/requests/request-1",
      cta: "Review evidence",
    });
    expect(steps[3]).toMatchObject({
      complete: false,
      href: "/owner/requests/request-1",
      cta: "Open request",
    });
    expect(ownerSetupProgress(steps)).toMatchObject({ completedCount: 3, progress: 50 });
  });

  it("returns the next incomplete setup step", () => {
    const steps = ownerSetupSteps({
      ...emptyInput,
      properties: [{}],
      requests: [{ id: "request-1" }],
    });

    expect(ownerNextSetupStep(steps)).toMatchObject({
      title: "Attach proof or context",
      cta: "Add evidence",
    });
  });

  it("summarizes empty, in-progress, and ready owner setup states", () => {
    expect(ownerSetupSummary(ownerSetupSteps(emptyInput))).toMatchObject({
      headline: "Start with the home itself.",
      tone: "empty",
    });

    const inProgressSteps = ownerSetupSteps({
      ...emptyInput,
      properties: [{}],
      requests: [{ id: "request-1" }],
    });
    expect(ownerSetupSummary(inProgressSteps)).toMatchObject({
      headline: "2 of 6 launch-readiness steps are complete.",
      tone: "in_progress",
    });

    const readySteps = ownerSetupSteps({
      properties: [{}],
      requests: [{ id: "request-1", photos: [{}], assignedVendorId: "vendor-1" }],
      invites: [],
      vaultDocuments: [{}],
      reminders: [{}],
    });
    expect(ownerNextSetupStep(readySteps)).toBeNull();
    expect(ownerSetupSummary(readySteps)).toMatchObject({
      headline: "This owner workspace is ready for a serious walkthrough.",
      tone: "ready",
    });
  });
});

describe("ownerDashboardGuidance", () => {
  it("points a brand-new owner to the first useful dashboard action", () => {
    const guidance = ownerDashboardGuidance(ownerSetupSteps(emptyInput));

    expect(guidance).toMatchObject({
      eyebrow: "First repair record",
      headline: "Start with the home itself.",
      primaryHref: "/owner/properties",
      primaryCta: "Add property",
      secondaryHref: "/owner/onboarding",
      secondaryCta: "Open setup guide",
      tone: "empty",
    });
  });

  it("keeps the dashboard focused on the next incomplete setup step", () => {
    const guidance = ownerDashboardGuidance(
      ownerSetupSteps(
        {
          ...emptyInput,
          properties: [{}],
          requests: [{ id: "request-1" }],
        },
        "request-1"
      )
    );

    expect(guidance).toMatchObject({
      eyebrow: "Owner workspace progress",
      headline: "2 of 6 launch-readiness steps are complete.",
      primaryHref: "/owner/requests/request-1",
      primaryCta: "Add evidence",
      tone: "in_progress",
    });
  });

  it("switches ready accounts toward daily request management", () => {
    const guidance = ownerDashboardGuidance(
      ownerSetupSteps({
        properties: [{}],
        requests: [{ id: "request-1", photos: [{}], collaboratorId: "helper-1" }],
        invites: [],
        vaultDocuments: [{}],
        reminders: [{}],
      })
    );

    expect(guidance).toMatchObject({
      eyebrow: "Workspace ready",
      headline: "Your repair record is ready for day-to-day use.",
      primaryHref: "/owner/requests/new",
      primaryCta: "Log another request",
      secondaryHref: "/owner/account",
      secondaryCta: "Review sharing",
      tone: "ready",
    });
  });
});

describe("ownerAccountReadinessItems", () => {
  it("summarizes account readiness with owner-friendly labels", () => {
    const items = ownerAccountReadinessItems(
      {
        properties: [{}],
        requests: [{ photos: [{}] }],
        invites: [],
        vaultDocuments: [{}],
        reminders: [],
      },
      "owner@example.com"
    );

    expect(items).toEqual([
      { label: "Owner account", detail: "owner@example.com", complete: true },
      { label: "Property record", detail: "1 property", complete: true },
      { label: "Maintenance history", detail: "1 request logged", complete: true },
      { label: "Evidence trail", detail: "1 request has photos or receipts", complete: true },
      { label: "Saved documents", detail: "1 vault item", complete: true },
      { label: "Recurring care", detail: "0 reminders", complete: false },
    ]);
  });
});
