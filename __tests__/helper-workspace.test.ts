import { describe, expect, it } from "vitest";
import {
  helperInviteExpectations,
  helperOnboardingItems,
  helperRequestCardState,
  helperWorkspaceGuidance,
  helperWorkspaceStats,
  vendorCloseoutMetrics,
  vendorUploadPrompt,
  type HelperWorkspaceRequest,
} from "@/lib/helper-workspace";

describe("helperWorkspaceStats", () => {
  it("summarizes active, complete, proof-gap, and quiet helper work", () => {
    const requests: HelperWorkspaceRequest[] = [
      { status: "In Progress", finalCost: null, photos: [{ type: "before" }], comments: [] },
      { status: "Needs Review", finalCost: "200", photos: [{ type: "after" }], comments: [{}] },
      { status: "Complete", finalCost: "250", photos: [{ type: "after" }], comments: [] },
    ];

    expect(helperWorkspaceStats(requests)).toEqual({
      totalCount: 3,
      activeCount: 2,
      completeCount: 1,
      needsProofCount: 1,
      quietCount: 2,
    });
  });
});

describe("helperOnboardingItems", () => {
  it("keeps vendor onboarding focused on scope, context, and proof", () => {
    const items = helperOnboardingItems("vendor", [
      { status: "In Progress", finalCost: null, photos: [{ type: "before" }] },
    ]);

    expect(items).toMatchObject([
      {
        title: "Know the boundary",
        href: "#helper-scope",
        status: "available",
      },
      {
        title: "Confirm the job context",
        href: "#helper-requests",
        status: "focus",
      },
      {
        title: "Close with proof",
        href: "#helper-upload",
        status: "focus",
      },
    ]);
  });

  it("keeps collaborator onboarding focused on scoped updates", () => {
    const items = helperOnboardingItems("collaborator", [
      { status: "Waiting", comments: [] },
    ]);

    expect(items).toMatchObject([
      {
        title: "Know the boundary",
        href: "#helper-scope",
        status: "available",
      },
      {
        title: "Read the shared record",
        href: "#helper-requests",
        status: "focus",
      },
      {
        title: "Add useful context",
        href: "#helper-requests",
        status: "focus",
      },
    ]);
  });

  it("marks helper work items as waiting when nothing is shared yet", () => {
    expect(helperOnboardingItems("vendor", [])).toMatchObject([
      { status: "focus" },
      { status: "waiting" },
      { status: "waiting" },
    ]);
  });
});

describe("helperInviteExpectations", () => {
  it("sets vendor invite expectations before acceptance", () => {
    expect(helperInviteExpectations("vendor")).toEqual([
      {
        title: "Scoped request access",
        detail: "After accepting, this vendor account only sees the assigned repair.",
      },
      {
        title: "Job context first",
        detail: "Review the location, urgency, access instructions, and preferred contact.",
      },
      {
        title: "Proof closes the loop",
        detail: "Upload photos or receipts so the owner has a durable record.",
      },
    ]);
  });

  it("sets collaborator invite expectations before acceptance", () => {
    expect(helperInviteExpectations("collaborator")).toEqual([
      {
        title: "Scoped request access",
        detail: "After accepting, this collaborator account only sees the shared repair.",
      },
      {
        title: "Shared record review",
        detail: "Review status, notes, cost context, and property details in one place.",
      },
      {
        title: "Helpful updates only",
        detail: "Add comments when your context helps the owner decide or understand progress.",
      },
    ]);
  });
});

describe("helperRequestCardState", () => {
  it("flags missing vendor job context before proof gaps", () => {
    expect(
      helperRequestCardState("vendor", {
        status: "Scheduled",
        finalCost: null,
        location: "",
        accessInstructions: null,
        contactMethod: "Text",
        photos: [],
      })
    ).toMatchObject({
      label: "Missing job context",
      detail: "Ask the owner for location and access instructions before work starts.",
      tone: "attention",
      actionHref: "#helper-requests",
      actionCta: "Ask owner",
    });
  });

  it("points vendors with context toward missing closeout proof", () => {
    expect(
      helperRequestCardState("vendor", {
        status: "In Progress",
        finalCost: "200",
        location: "Kitchen",
        accessInstructions: "Lockbox at side gate",
        contactMethod: "Phone",
        photos: [{ type: "before" }],
      })
    ).toMatchObject({
      label: "Needs closeout proof",
      detail: "Add after photo before this work is treated as complete.",
      tone: "progress",
      actionHref: "#helper-upload",
      actionCta: "Add proof",
    });
  });

  it("marks vendor cards ready when context and proof are present", () => {
    expect(
      helperRequestCardState("vendor", {
        status: "Needs Review",
        finalCost: "200",
        location: "Kitchen",
        accessInstructions: "Lockbox at side gate",
        contactMethod: "Phone",
        photos: [{ type: "after" }],
      })
    ).toMatchObject({
      label: "Ready for closeout",
      tone: "ready",
      actionCta: "Review status",
    });
  });

  it("flags completed vendor cards that still have proof gaps", () => {
    expect(
      helperRequestCardState("vendor", {
        status: "Complete",
        finalCost: null,
        photos: [{ type: "before" }],
      })
    ).toMatchObject({
      label: "Closed with proof gap",
      detail: "This is complete, but after photo and final cost are still missing from the record.",
      tone: "attention",
      actionHref: "#helper-upload",
    });
  });

  it("points quiet collaborator cards toward the first useful update", () => {
    expect(
      helperRequestCardState("collaborator", {
        status: "Waiting",
        comments: [],
      })
    ).toMatchObject({
      label: "Needs first update",
      tone: "attention",
      actionCta: "Post update",
    });
  });

  it("marks collaborator cards ready when the shared thread needs review", () => {
    expect(
      helperRequestCardState("collaborator", {
        status: "Needs Review",
        comments: [{}],
      })
    ).toMatchObject({
      label: "Ready for owner review",
      tone: "ready",
      actionCta: "Review thread",
    });
  });
});

describe("vendorUploadPrompt", () => {
  it("starts with a calm request selection prompt", () => {
    expect(vendorUploadPrompt(null)).toEqual({
      title: "Select a request to upload proof.",
      detail: "Choose one assigned request, then add the photo or receipt that belongs to that job.",
      recommendedPhotoTypes: [],
    });
  });

  it("prioritizes after photos when both closeout proof pieces are missing", () => {
    expect(
      vendorUploadPrompt({
        status: "In Progress",
        finalCost: null,
        photos: [{ type: "before" }],
      })
    ).toEqual({
      title: "After photo is the best next upload.",
      detail:
        "Upload the after photo here. If final cost is still missing, leave an update so the owner can record it.",
      recommendedPhotoTypes: ["after", "receipt", "other"],
    });
  });

  it("points final-cost-only gaps toward owner context instead of another required photo", () => {
    expect(
      vendorUploadPrompt({
        status: "Needs Review",
        finalCost: null,
        photos: [{ type: "after" }],
      })
    ).toEqual({
      title: "Final cost still needs owner context.",
      detail:
        "Photos look ready. Leave an update if the owner needs invoice or final cost details from you.",
      recommendedPhotoTypes: ["receipt", "other"],
    });
  });

  it("keeps extra proof available when core proof is present", () => {
    expect(
      vendorUploadPrompt({
        status: "Needs Review",
        finalCost: "250",
        photos: [{ type: "after" }],
      })
    ).toEqual({
      title: "Core proof is already on record.",
      detail:
        "You can still add receipts or extra context photos if they make the owner's record clearer.",
      recommendedPhotoTypes: ["receipt", "other"],
    });
  });
});

describe("vendorCloseoutMetrics", () => {
  it("keeps an empty vendor workspace calm", () => {
    expect(vendorCloseoutMetrics([])).toEqual([
      {
        label: "Ready to close",
        value: 0,
        detail: "No active assigned jobs need closeout right now.",
        tone: "empty",
      },
      {
        label: "Need owner context",
        value: 0,
        detail: "Owner context will appear here when new work is assigned.",
        tone: "empty",
      },
      {
        label: "After photos due",
        value: 0,
        detail: "After-photo gaps will appear here when work starts.",
        tone: "empty",
      },
      {
        label: "Final cost needed",
        value: 0,
        detail: "Cost gaps will appear here when assigned work starts.",
        tone: "empty",
      },
    ]);
  });

  it("summarizes vendor closeout gaps across active jobs", () => {
    const metrics = vendorCloseoutMetrics([
      {
        status: "Scheduled",
        location: "",
        accessInstructions: null,
        contactMethod: "Phone",
        finalCost: null,
        photos: [{ type: "before" }],
      },
      {
        status: "In Progress",
        location: "Kitchen",
        accessInstructions: "Side gate",
        contactMethod: "Text",
        finalCost: "225",
        photos: [{ type: "before" }],
      },
      {
        status: "Needs Review",
        location: "Laundry",
        accessInstructions: "Owner home",
        contactMethod: "Email",
        finalCost: "150",
        photos: [{ type: "after" }],
      },
      {
        status: "Complete",
        location: "Garage",
        accessInstructions: "Code shared",
        contactMethod: "Text",
        finalCost: "90",
        photos: [{ type: "after" }],
      },
    ]);

    expect(metrics).toEqual([
      {
        label: "Ready to close",
        value: 1,
        detail: "1 active job has context, after-photo proof, and final cost ready.",
        tone: "ready",
      },
      {
        label: "Need owner context",
        value: 1,
        detail: "1 active job is missing location, access, or contact details.",
        tone: "attention",
      },
      {
        label: "After photos due",
        value: 2,
        detail: "2 active jobs need an after photo before closeout feels trustworthy.",
        tone: "progress",
      },
      {
        label: "Final cost needed",
        value: 1,
        detail: "1 active job still needs final cost context from the owner or invoice.",
        tone: "progress",
      },
    ]);
  });

  it("marks active work ready when every closeout requirement is present", () => {
    expect(
      vendorCloseoutMetrics([
        {
          status: "Needs Review",
          location: "Bathroom",
          accessInstructions: "Lockbox",
          contactMethod: "Phone",
          finalCost: "325",
          photos: [{ type: "after" }],
        },
      ])
    ).toEqual([
      {
        label: "Ready to close",
        value: 1,
        detail: "1 active job has context, after-photo proof, and final cost ready.",
        tone: "ready",
      },
      {
        label: "Need owner context",
        value: 0,
        detail: "Every active job has the basic context a vendor needs.",
        tone: "ready",
      },
      {
        label: "After photos due",
        value: 0,
        detail: "After-photo proof is present on every active job.",
        tone: "ready",
      },
      {
        label: "Final cost needed",
        value: 0,
        detail: "Final cost context is present on every active job.",
        tone: "ready",
      },
    ]);
  });
});

describe("helperWorkspaceGuidance", () => {
  it("keeps an empty vendor workspace scoped and calm", () => {
    expect(helperWorkspaceGuidance("vendor", [])).toMatchObject({
      eyebrow: "Vendor scope",
      headline: "No assigned repairs yet.",
      primaryHref: "#helper-scope",
      primaryCta: "Review scope",
      tone: "empty",
    });
  });

  it("points vendors with proof gaps to uploads first", () => {
    expect(
      helperWorkspaceGuidance("vendor", [
        { status: "In Progress", finalCost: "100", photos: [{ type: "before" }] },
      ])
    ).toMatchObject({
      eyebrow: "Vendor next step",
      headline: "Add proof before work gets closed out.",
      primaryHref: "#helper-upload",
      primaryCta: "Upload proof",
      attentionCount: 1,
      tone: "attention",
    });
  });

  it("points collaborators with quiet shared records to review work", () => {
    expect(
      helperWorkspaceGuidance("collaborator", [
        { status: "Waiting", finalCost: null, photos: [], comments: [] },
      ])
    ).toMatchObject({
      eyebrow: "Collaborator next step",
      headline: "Post a useful update where context is missing.",
      primaryHref: "#helper-requests",
      primaryCta: "Review shared work",
      attentionCount: 1,
      tone: "attention",
    });
  });

  it("summarizes active helper work when no attention state is present", () => {
    expect(
      helperWorkspaceGuidance("collaborator", [
        { status: "Waiting", comments: [{}] },
        { status: "Complete", comments: [{}] },
      ])
    ).toMatchObject({
      eyebrow: "Collaborator progress",
      headline: "1 shared request is still active.",
      primaryCta: "Review active work",
      tone: "progress",
    });
  });

  it("marks helper work ready when every shared request is complete", () => {
    expect(
      helperWorkspaceGuidance("vendor", [
        { status: "Complete", finalCost: "100", photos: [{ type: "after" }] },
      ])
    ).toMatchObject({
      eyebrow: "Vendor complete",
      headline: "Everything currently shared with you is complete.",
      primaryCta: "Review completed work",
      tone: "ready",
    });
  });
});
