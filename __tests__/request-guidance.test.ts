import { describe, expect, it } from "vitest";
import {
  missingCompletionProof,
  requestGuidance,
  requestRecordValueMetrics,
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

describe("requestRecordValueMetrics", () => {
  it("explains the value missing from an empty repair record", () => {
    expect(requestRecordValueMetrics(baseRequest)).toEqual([
      {
        label: "Proof packet",
        value: "0",
        detail: "No photos or receipts are saved yet for this repair.",
        tone: "attention",
        href: "#photos",
        cta: "Add proof",
      },
      {
        label: "Cost clarity",
        value: "$0.00",
        detail: "No estimate, quote, or final cost has been recorded yet.",
        tone: "attention",
        href: "#cost",
        cta: "Add cost",
      },
      {
        label: "Shared coordination",
        value: "0",
        detail: "No vendor or trusted helper has scoped access to this repair yet.",
        tone: "attention",
        href: "#sharing",
        cta: "Invite help",
      },
      {
        label: "Decision history",
        value: "0",
        detail: "Decisions will appear here as quotes, status changes, and access changes happen.",
        tone: "progress",
        href: "#decision-log",
        cta: "Review history",
      },
    ]);
  });

  it("shows partial value when proof, quote, and shared access exist", () => {
    const metrics = requestRecordValueMetrics({
      ...baseRequest,
      estimatedCost: "125",
      assignedVendorId: "vendor-1",
      photos: [{ type: "before" }],
      quotes: [{}],
      comments: [],
    });

    expect(metrics.slice(0, 3)).toMatchObject([
      {
        label: "Proof packet",
        value: "1",
        detail: "1 proof item saved. Missing final cost, after photo.",
        tone: "progress",
      },
      {
        label: "Cost clarity",
        value: "$125.00",
        detail: "Estimated cost is recorded with 1 quote in the workspace.",
        tone: "progress",
        href: "#quotes",
      },
      {
        label: "Shared coordination",
        value: "1",
        detail: "1 helper scoped to this request and 0 updates in the thread.",
        tone: "progress",
      },
    ]);
  });

  it("marks a mature repair record as homeowner-ready", () => {
    const metrics = requestRecordValueMetrics({
      ...baseRequest,
      status: "Needs Review",
      finalCost: "250",
      assignedVendorId: "vendor-1",
      collaboratorId: "helper-1",
      photos: [{ type: "before" }, { type: "after" }, { type: "receipt" }],
      quotes: [{}, {}],
      comments: [{}],
      log: [{}, {}],
    });

    expect(metrics).toMatchObject([
      {
        label: "Proof packet",
        value: "3",
        tone: "ready",
        cta: "Review proof",
      },
      {
        label: "Cost clarity",
        value: "$250.00",
        detail: "Final cost is recorded with 2 quotes in the workspace.",
        tone: "ready",
      },
      {
        label: "Shared coordination",
        value: "2",
        detail: "2 helpers scoped to this request and 1 update in the thread.",
        tone: "ready",
      },
      {
        label: "Decision history",
        value: "2",
        detail: "2 decisions recorded for status, quotes, access, or completion.",
        tone: "ready",
      },
    ]);
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
