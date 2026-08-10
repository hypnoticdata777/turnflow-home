import { describe, expect, it } from "vitest";
import {
  helperWorkspaceGuidance,
  helperWorkspaceStats,
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
