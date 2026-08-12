import { describe, expect, it } from "vitest";
import {
  ownerAccountReadinessItems,
  ownerCalendarValueMetrics,
  ownerDashboardGuidance,
  ownerNextSetupStep,
  ownerPropertyCareSignal,
  ownerReadinessFlags,
  ownerRequestCardSignal,
  ownerRequestUpdateSignal,
  ownerSetupProgress,
  ownerSetupSummary,
  ownerSetupSteps,
  ownerSharingMetrics,
  ownerVaultValueMetrics,
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

describe("ownerSharingMetrics", () => {
  it("keeps a brand-new owner focused on private-by-default sharing", () => {
    expect(ownerSharingMetrics(emptyInput, new Date("2026-08-12T12:00:00.000Z"))).toEqual([
      {
        label: "Owner-only records",
        value: 0,
        detail: "New requests start private until you invite or assign someone.",
        tone: "empty",
      },
      {
        label: "Active people with access",
        value: 0,
        detail: "No vendor or collaborator has accepted access right now.",
        tone: "ready",
      },
      {
        label: "Open invite links",
        value: 0,
        detail: "No pending invite links are open.",
        tone: "ready",
      },
      {
        label: "Shared request footprint",
        value: 0,
        detail: "No request is shared or waiting on an invite claim.",
        tone: "empty",
      },
    ]);
  });

  it("summarizes active access and private records separately", () => {
    const metrics = ownerSharingMetrics(
      {
        ...emptyInput,
        requests: [
          { id: "request-1", assignedVendorId: "vendor-1" },
          { id: "request-2", collaboratorId: "helper-1" },
          { id: "request-3" },
        ],
        invites: [{ status: "accepted" }],
      },
      new Date("2026-08-12T12:00:00.000Z")
    );

    expect(metrics).toMatchObject([
      {
        label: "Owner-only records",
        value: 1,
        tone: "ready",
      },
      {
        label: "Active people with access",
        value: 2,
        detail: "2 people can currently open a scoped request.",
        tone: "progress",
      },
      {
        label: "Open invite links",
        value: 0,
        tone: "ready",
      },
      {
        label: "Shared request footprint",
        value: 2,
        tone: "progress",
      },
    ]);
  });

  it("flags expired pending invite links as attention-worthy", () => {
    const metrics = ownerSharingMetrics(
      {
        ...emptyInput,
        requests: [
          {
            id: "request-1",
            pendingVendorInviteId: "invite-1",
          },
        ],
        invites: [
          {
            status: "pending",
            role: "vendor",
            expiresAt: "2026-08-01T12:00:00.000Z",
          },
        ],
      },
      new Date("2026-08-12T12:00:00.000Z")
    );

    expect(metrics[2]).toMatchObject({
      label: "Open invite links",
      value: 1,
      detail: "1 pending invite appears expired and should be canceled or resent.",
      tone: "attention",
    });
  });
});

describe("ownerVaultValueMetrics", () => {
  it("explains the value of saved property documents", () => {
    const metrics = ownerVaultValueMetrics({
      properties: [{ id: "property-1" }, { id: "property-2" }],
      selectedPropertyId: "property-1",
      documents: [
        {
          propertyId: "property-1",
          requestId: "request-1",
          category: "Receipt",
        },
        {
          propertyId: "property-1",
          category: "Warranty",
        },
        {
          propertyId: "property-2",
          category: "Manual",
        },
      ],
    });

    expect(metrics).toEqual([
      {
        label: "Saved records",
        value: 2,
        detail:
          "2 documents saved for this property so warranties, invoices, manuals, and inspections stay findable.",
        tone: "ready",
      },
      {
        label: "Properties covered",
        value: 2,
        detail: "2 of 2 properties have at least one saved document.",
        tone: "ready",
      },
      {
        label: "Repair-linked docs",
        value: 1,
        detail: "1 document can be traced back to a repair request.",
        tone: "ready",
      },
      {
        label: "Categories saved",
        value: 2,
        detail: "Saved categories: Receipt, Warranty.",
        tone: "progress",
      },
    ]);
  });

  it("keeps an empty vault focused on the first useful document", () => {
    const metrics = ownerVaultValueMetrics({
      properties: [{ id: "property-1" }],
      selectedPropertyId: "property-1",
      documents: [],
    });

    expect(metrics[0]).toMatchObject({
      label: "Saved records",
      value: 0,
      tone: "empty",
    });
    expect(metrics[1]).toMatchObject({
      label: "Properties covered",
      value: 0,
      detail: "0 of 1 properties have at least one saved document.",
      tone: "empty",
    });
  });
});

describe("ownerCalendarValueMetrics", () => {
  it("surfaces overdue, due-soon, and property coverage signals", () => {
    const metrics = ownerCalendarValueMetrics(
      {
        properties: [{ id: "property-1" }, { id: "property-2" }, { id: "property-3" }],
        reminders: [
          {
            propertyId: "property-1",
            nextDueAt: "2026-01-10T12:00:00.000Z",
            intervalDays: 30,
          },
          {
            propertyId: "property-2",
            nextDueAt: "2026-01-20T12:00:00.000Z",
            intervalDays: 90,
          },
          {
            propertyId: "property-2",
            nextDueAt: "2026-02-20T12:00:00.000Z",
            intervalDays: 90,
          },
        ],
      },
      new Date("2026-01-15T12:00:00.000Z")
    );

    expect(metrics).toEqual([
      {
        label: "Overdue care",
        value: 1,
        detail: "1 routine should be handled before it turns into a repair.",
        tone: "attention",
      },
      {
        label: "Due soon",
        value: 1,
        detail: "1 routine is due in the next 14 days.",
        tone: "progress",
      },
      {
        label: "Properties covered",
        value: 2,
        detail: "2 of 3 properties have at least one recurring reminder.",
        tone: "progress",
      },
      {
        label: "Recurring routines",
        value: 3,
        detail: "3 reminders saved across 2 cadences.",
        tone: "ready",
      },
    ]);
  });

  it("guides an empty calendar toward one repeatable task", () => {
    const metrics = ownerCalendarValueMetrics({
      properties: [{ id: "property-1" }],
      reminders: [],
    });

    expect(metrics[0]).toMatchObject({
      label: "Overdue care",
      value: 0,
      tone: "empty",
    });
    expect(metrics[3]).toMatchObject({
      label: "Recurring routines",
      value: 0,
      detail: "Start with one repeatable task like HVAC filters, gutters, or water heater care.",
      tone: "empty",
    });
  });
});

describe("ownerPropertyCareSignal", () => {
  it("points a new property toward its first repair record", () => {
    expect(
      ownerPropertyCareSignal({
        propertyId: "property-1",
        requests: [],
        documents: [],
        reminders: [],
      })
    ).toEqual({
      label: "Needs first repair record",
      detail:
        "Start this property with one real maintenance issue so TurnFlow can build a useful home record.",
      tone: "attention",
      href: "/owner/requests/new",
      cta: "Log first issue",
    });
  });

  it("prioritizes active property work before history gaps", () => {
    expect(
      ownerPropertyCareSignal({
        propertyId: "property-1",
        requests: [
          {
            propertyId: "property-1",
            status: "In Progress",
          },
          {
            propertyId: "property-1",
            status: "Complete",
          },
        ],
        documents: [],
        reminders: [],
      })
    ).toMatchObject({
      label: "Work in motion",
      detail:
        "1 request is active for this property. Keep status, cost, and proof current as work moves.",
      tone: "attention",
      href: "/owner/dashboard",
      cta: "Review requests",
    });
  });

  it("moves completed properties toward documents and reminders", () => {
    const base = {
      propertyId: "property-1",
      requests: [
        {
          propertyId: "property-1",
          status: "Complete",
          finalCost: "175",
          photos: [{ type: "after" }],
        },
      ],
      reminders: [],
    };

    expect(
      ownerPropertyCareSignal({
        ...base,
        documents: [],
      })
    ).toMatchObject({
      label: "History gap",
      tone: "progress",
      href: "/owner/vault?propertyId=property-1",
      cta: "Add document",
    });

    expect(
      ownerPropertyCareSignal({
        ...base,
        documents: [{ propertyId: "property-1", category: "Warranty" }],
      })
    ).toMatchObject({
      label: "Prevention gap",
      tone: "progress",
      href: "/owner/calendar",
      cta: "Add reminder",
    });
  });

  it("marks the property care record ready when history and routines exist", () => {
    expect(
      ownerPropertyCareSignal({
        propertyId: "property-1",
        requests: [
          {
            propertyId: "property-1",
            status: "Complete",
            finalCost: "175",
            photos: [{ type: "after" }],
          },
        ],
        documents: [{ propertyId: "property-1", category: "Receipt" }],
        reminders: [{ propertyId: "property-1", intervalDays: 90 }],
      })
    ).toEqual({
      label: "Care record ready",
      detail:
        "1 request logged, 1 proof-backed record, 1 vault document, and 1 reminder saved for this property.",
      tone: "ready",
      href: "/owner/vault?propertyId=property-1",
      cta: "Review history",
    });
  });
});

describe("ownerRequestCardSignal", () => {
  it("prioritizes review decisions on request cards", () => {
    expect(
      ownerRequestCardSignal({
        id: "request-1",
        status: "Needs Review",
        finalCost: "250",
        photos: [{ type: "after" }],
      })
    ).toMatchObject({
      label: "Decision needed",
      detail: "Proof and final cost are ready. Review the record before closing this out.",
      tone: "attention",
      href: "/owner/requests/request-1",
      cta: "Review request",
    });
  });

  it("points quote-needed cards to the quote workspace", () => {
    expect(ownerRequestCardSignal({ id: "request-1", status: "Needs Quote" })).toMatchObject({
      label: "Quote needed",
      tone: "attention",
      href: "/owner/requests/request-1#quotes",
      cta: "Add quote",
    });
  });

  it("flags completed cards with missing proof", () => {
    expect(
      ownerRequestCardSignal({
        id: "request-1",
        status: "Complete",
        finalCost: null,
        photos: [{ type: "before" }],
      })
    ).toMatchObject({
      label: "Closed with proof gap",
      tone: "attention",
      href: "/owner/requests/request-1#photos",
      cta: "Fix proof",
    });
  });

  it("marks cards proof-backed when final cost and after photo are saved", () => {
    expect(
      ownerRequestCardSignal({
        id: "request-1",
        status: "In Progress",
        finalCost: "250",
        photos: [{ type: "after" }],
      })
    ).toMatchObject({
      label: "Proof-backed",
      tone: "ready",
      href: "/owner/requests/request-1#decision-log",
      cta: "Review history",
    });
  });

  it("points empty records toward first proof", () => {
    expect(
      ownerRequestCardSignal({
        id: "request-1",
        status: "Draft",
        photos: [],
      })
    ).toMatchObject({
      label: "Needs first proof",
      tone: "attention",
      href: "/owner/requests/request-1#photos",
      cta: "Add proof",
    });
  });

  it("points proof-only records toward cost context", () => {
    expect(
      ownerRequestCardSignal({
        id: "request-1",
        status: "In Progress",
        photos: [{ type: "before" }],
      })
    ).toMatchObject({
      label: "Needs cost context",
      tone: "progress",
      href: "/owner/requests/request-1#cost",
      cta: "Add cost",
    });
  });
});

describe("ownerRequestUpdateSignal", () => {
  it("points owner-only requests toward scoped sharing", () => {
    expect(
      ownerRequestUpdateSignal({
        id: "request-1",
        status: "Draft",
        comments: [],
      })
    ).toEqual({
      label: "No shared thread yet",
      detail:
        "Only the owner can see this request. Invite a vendor or trusted helper when outside help should update the record.",
      tone: "progress",
      href: "/owner/requests/request-1#sharing",
      cta: "Invite help",
    });
  });

  it("flags shared requests with no updates", () => {
    expect(
      ownerRequestUpdateSignal({
        id: "request-1",
        status: "Scheduled",
        assignedVendorId: "vendor-1",
        comments: [],
      })
    ).toMatchObject({
      label: "Shared but quiet",
      tone: "attention",
      href: "/owner/requests/request-1#comments",
      cta: "Start thread",
    });
  });

  it("pushes review-state requests toward update review", () => {
    expect(
      ownerRequestUpdateSignal({
        id: "request-1",
        status: "Needs Review",
        assignedVendorId: "vendor-1",
        comments: [{}, {}],
      })
    ).toEqual({
      label: "Review the thread",
      detail: "2 updates in the shared thread. Review comments before approving closeout.",
      tone: "attention",
      href: "/owner/requests/request-1#comments",
      cta: "Review updates",
    });
  });

  it("marks completed request updates as preserved history", () => {
    expect(
      ownerRequestUpdateSignal({
        id: "request-1",
        status: "Complete",
        assignedVendorId: "vendor-1",
        comments: [{}],
      })
    ).toEqual({
      label: "Updates preserved",
      detail: "1 update saved with this completed repair record.",
      tone: "ready",
      href: "/owner/requests/request-1#comments",
      cta: "Review thread",
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
