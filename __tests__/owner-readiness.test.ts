import { describe, expect, it } from "vitest";
import {
  ownerAccountReadinessItems,
  ownerDashboardGuidance,
  ownerNextSetupStep,
  ownerReadinessFlags,
  ownerSetupProgress,
  ownerSetupSummary,
  ownerSetupSteps,
  ownerValueMetrics,
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

describe("ownerValueMetrics", () => {
  it("shows a new homeowner the practical value still to build", () => {
    expect(ownerValueMetrics(emptyInput)).toEqual([
      {
        label: "Decisions to make",
        value: 0,
        detail: "No request is waiting on a quote or review right now.",
        tone: "ready",
        href: "/owner/dashboard",
        cta: "View requests",
      },
      {
        label: "Proof-backed records",
        value: 0,
        detail: "Create a request and add proof so the home has a record before work starts.",
        tone: "empty",
        href: "/owner/requests/new",
        cta: "Add proof",
      },
      {
        label: "Shared help",
        value: 0,
        detail: "Invite a vendor or trusted helper only when a repair needs outside help.",
        tone: "empty",
        href: "/owner/requests/new",
        cta: "Invite help",
      },
      {
        label: "Preventive care",
        value: 0,
        detail: "Add reminders and saved documents so the record helps after the repair is done.",
        tone: "empty",
        href: "/owner/onboarding",
        cta: "Add reminder",
      },
    ]);
  });

  it("surfaces open owner decisions and proof value", () => {
    const metrics = ownerValueMetrics({
      properties: [{}],
      requests: [
        {
          id: "request-1",
          status: "Needs Review",
          finalCost: "250",
          photos: [{ type: "before" }, { type: "after" }],
          assignedVendorId: "vendor-1",
        },
        {
          id: "request-2",
          status: "Needs Quote",
          photos: [{ type: "before" }],
          pendingCollaboratorInviteId: "invite-1",
        },
      ],
      invites: [{}],
      vaultDocuments: [{}],
      reminders: [{}],
    });

    expect(metrics).toMatchObject([
      {
        label: "Decisions to make",
        value: 2,
        detail: "1 request needs review, 1 request needs quotes, and 1 invite is pending.",
        tone: "attention",
        href: "/owner/dashboard?status=Needs%20Review",
        cta: "Review decisions",
      },
      {
        label: "Proof-backed records",
        value: 1,
        detail:
          "1 of 2 requests have final cost and after photo proof. 2 have at least one proof item.",
        tone: "ready",
        href: "/owner/requests/request-1#photos",
      },
      {
        label: "Shared help",
        value: 2,
        tone: "ready",
        href: "/owner/requests/request-1#sharing",
      },
      {
        label: "Preventive care",
        value: 1,
        tone: "ready",
        href: "/owner/calendar",
      },
    ]);
  });

  it("treats saved documents without reminders as progress, not complete value", () => {
    const metrics = ownerValueMetrics({
      ...emptyInput,
      requests: [{ id: "request-1", status: "In Progress" }],
      vaultDocuments: [{ id: "doc-1" }],
    });

    expect(metrics[3]).toMatchObject({
      label: "Preventive care",
      value: 0,
      detail: "1 document is saved, but no recurring reminders are scheduled yet.",
      tone: "progress",
      href: "/owner/onboarding",
      cta: "Add reminder",
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
