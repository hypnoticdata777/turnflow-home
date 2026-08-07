import { describe, expect, it } from "vitest";
import {
  ownerAccountReadinessItems,
  ownerReadinessFlags,
  ownerSetupProgress,
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
