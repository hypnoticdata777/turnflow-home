import { describe, expect, it } from "vitest";
import {
  missingCompletionProof,
  requestGuidance,
  requestReadinessItems,
  type RequestGuidanceInput,
} from "@/lib/request-guidance";

const baseRequest: RequestGuidanceInput = {
  status: "Draft",
  assignedVendorId: null,
  collaboratorId: null,
  pendingVendorInviteId: null,
  pendingCollaboratorInviteId: null,
  estimatedCost: null,
  quotedCost: null,
  finalCost: null,
  photos: [],
};

describe("requestReadinessItems", () => {
  it("summarizes request readiness signals for an empty repair record", () => {
    expect(requestReadinessItems(baseRequest)).toEqual([
      { label: "Evidence trail", detail: "No photos or receipts yet", complete: false },
      {
        label: "Cost context",
        detail: "No estimate, quote, or final cost recorded",
        complete: false,
      },
      { label: "Shared help", detail: "Only the owner can see this request", complete: false },
      {
        label: "Completion proof",
        detail: "Missing final cost, after photo, assigned vendor",
        complete: false,
      },
    ]);
  });

  it("marks completion proof ready only when final cost, after photo, and vendor exist", () => {
    const items = requestReadinessItems({
      ...baseRequest,
      finalCost: "250",
      assignedVendorId: "vendor-1",
      photos: [{ type: "before" }, { type: "after" }],
    });

    expect(items).toContainEqual({
      label: "Completion proof",
      detail: "Final cost, after photo, and assigned vendor are on record",
      complete: true,
    });
  });
});

describe("requestGuidance", () => {
  it("points a new request toward first proof", () => {
    expect(requestGuidance(baseRequest)).toMatchObject({
      eyebrow: "Request readiness",
      headline: "Start the evidence trail.",
      primaryHref: "#photos",
      primaryCta: "Add proof",
      tone: "attention",
      progress: 0,
    });
  });

  it("points a request with proof but no cost toward cost context", () => {
    expect(
      requestGuidance({
        ...baseRequest,
        photos: [{ type: "before" }],
      })
    ).toMatchObject({
      headline: "Add cost context before decisions pile up.",
      primaryHref: "#cost",
      primaryCta: "Add cost",
      secondaryHref: "#quotes",
      tone: "progress",
      progress: 25,
    });
  });

  it("points a request with proof and cost toward scoped sharing", () => {
    expect(
      requestGuidance({
        ...baseRequest,
        estimatedCost: "100",
        photos: [{ type: "before" }],
      })
    ).toMatchObject({
      headline: "Bring the right person into this repair.",
      primaryHref: "#sharing",
      primaryCta: "Invite help",
      tone: "progress",
      progress: 50,
    });
  });

  it("points shared in-progress requests toward completion proof", () => {
    const guidance = requestGuidance({
      ...baseRequest,
      estimatedCost: "100",
      pendingVendorInviteId: "invite-1",
      photos: [{ type: "before" }],
    });

    expect(guidance).toMatchObject({
      headline: "Prepare this request for clean completion.",
      primaryHref: "#photos",
      primaryCta: "Add after photo",
      tone: "progress",
      progress: 75,
    });
    expect(guidance.missingCompletionProof).toEqual([
      "final cost",
      "after photo",
      "assigned vendor",
    ]);
  });

  it("switches ready requests toward review instead of setup", () => {
    expect(
      requestGuidance({
        ...baseRequest,
        status: "Needs Review",
        finalCost: "250",
        assignedVendorId: "vendor-1",
        photos: [{ type: "before" }, { type: "after" }],
      })
    ).toMatchObject({
      eyebrow: "Proof packet ready",
      headline: "This request has the core proof needed for clean completion.",
      primaryHref: "#decision-log",
      primaryCta: "Review decision log",
      tone: "ready",
      progress: 100,
      missingCompletionProof: [],
    });
  });

  it("calls out completed requests that were closed with proof gaps", () => {
    expect(
      requestGuidance({
        ...baseRequest,
        status: "Complete",
        estimatedCost: "100",
        photos: [{ type: "before" }],
      })
    ).toMatchObject({
      eyebrow: "Proof gaps",
      headline: "Completion is recorded, but the proof packet has gaps.",
      primaryHref: "#photos",
      primaryCta: "Add after photo",
      secondaryHref: "#decision-log",
      tone: "attention",
    });
  });

  it("routes assigned-vendor proof gaps to sharing controls", () => {
    expect(
      requestGuidance({
        ...baseRequest,
        estimatedCost: "200",
        finalCost: "250",
        pendingCollaboratorInviteId: "invite-1",
        photos: [{ type: "before" }, { type: "after" }],
      })
    ).toMatchObject({
      headline: "Prepare this request for clean completion.",
      primaryHref: "#sharing",
      primaryCta: "Review sharing",
      missingCompletionProof: ["assigned vendor"],
    });
  });
});

describe("missingCompletionProof", () => {
  it("returns the exact missing proof pieces in completion order", () => {
    expect(
      missingCompletionProof({
        ...baseRequest,
        finalCost: "250",
        photos: [{ type: "after" }],
      })
    ).toEqual(["assigned vendor"]);
  });
});
