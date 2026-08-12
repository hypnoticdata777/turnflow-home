import { describe, expect, it } from "vitest";
import {
  CLOSEOUT_STATUS_LABELS,
  closeoutReadiness,
  closeoutReadinessChecks,
  closeoutReviewGuidance,
  isCloseoutReviewDecision,
  normalizeCloseoutNotes,
  parseCloseoutAmount,
} from "@/lib/closeout-submissions";

describe("isCloseoutReviewDecision", () => {
  it("accepts owner review decisions", () => {
    expect(isCloseoutReviewDecision("approved")).toBe(true);
    expect(isCloseoutReviewDecision("changes_requested")).toBe(true);
    expect(isCloseoutReviewDecision("pending")).toBe(false);
  });

  it("labels closeout submission statuses", () => {
    expect(CLOSEOUT_STATUS_LABELS.pending).toBe("Pending owner review");
    expect(CLOSEOUT_STATUS_LABELS.approved).toBe("Approved");
    expect(CLOSEOUT_STATUS_LABELS.changes_requested).toBe("Changes requested");
  });
});

describe("parseCloseoutAmount", () => {
  it("normalizes positive final amounts", () => {
    expect(parseCloseoutAmount("125")).toBe("125.00");
    expect(parseCloseoutAmount("125.5")).toBe("125.50");
  });

  it("rejects missing, zero, negative, or invalid amounts", () => {
    expect(parseCloseoutAmount("")).toBeNull();
    expect(parseCloseoutAmount("0")).toBeNull();
    expect(parseCloseoutAmount("-10")).toBeNull();
    expect(parseCloseoutAmount("free")).toBeNull();
  });
});

describe("normalizeCloseoutNotes", () => {
  it("trims and limits notes", () => {
    expect(normalizeCloseoutNotes("  Replaced valve  ")).toBe("Replaced valve");
    expect(normalizeCloseoutNotes("x".repeat(20), 8)).toBe("x".repeat(8));
  });
});

describe("closeoutReadiness", () => {
  it("requires after proof, done project tasks, a final amount, and completion notes", () => {
    expect(
      closeoutReadiness({
        photos: [{ type: "before" }],
        tasks: [{ status: "done" }, { status: "in_progress" }],
        finalAmount: "",
        completionNotes: "",
      })
    ).toMatchObject({
      ready: false,
      missing: ["after photo", "done tasks", "final amount", "completion notes"],
      tone: "attention",
    });
  });

  it("marks closeout ready when proof, tasks, and cost are present", () => {
    expect(
      closeoutReadiness({
        photos: [{ type: "after" }],
        tasks: [{ status: "done" }],
        finalAmount: "250.00",
        completionNotes: "Replaced the supply line and tested for leaks.",
      })
    ).toMatchObject({
      ready: true,
      missing: [],
      tone: "ready",
    });
  });
});

describe("closeoutReadinessChecks", () => {
  it("returns a vendor-facing checklist for closeout submission", () => {
    expect(
      closeoutReadinessChecks({
        photos: [{ type: "after" }],
        tasks: [{ status: "done" }, { status: "blocked" }],
        finalAmount: "250",
        completionNotes: "Work completed.",
      })
    ).toMatchObject([
      {
        label: "After-photo proof",
        complete: true,
      },
      {
        label: "Task scope",
        missingLabel: "done tasks",
        complete: false,
        detail: "1 of 2 project tasks are marked done.",
      },
      {
        label: "Final amount",
        complete: true,
      },
      {
        label: "Completion notes",
        complete: true,
      },
    ]);
  });

  it("treats a simple request without project tasks as scoped enough for closeout", () => {
    const checks = closeoutReadinessChecks({
      photos: [{ type: "after" }],
      tasks: [],
      finalAmount: "125",
      completionNotes: "Adjusted the hinge and confirmed door closes.",
    });

    expect(checks.find((check) => check.label === "Task scope")).toMatchObject({
      complete: true,
      detail: "No project tasks were created, so closeout can use the main request scope.",
    });
  });
});

describe("closeoutReviewGuidance", () => {
  it("keeps owner review waiting when no vendor handoff exists", () => {
    expect(closeoutReviewGuidance({ latest: null })).toMatchObject({
      label: "No vendor handoff yet",
      tone: "progress",
      canApprove: false,
    });
  });

  it("explains the pending owner decision impact", () => {
    expect(
      closeoutReviewGuidance({
        latest: {
          status: "pending",
          finalAmount: "250.00",
          completionNotes: "Replaced valve and tested.",
        },
      })
    ).toMatchObject({
      label: "Ready for owner decision",
      detail:
        "Review the completion notes, final amount, proof, and task scope. Approving marks the request complete and creates the billing record.",
      approveCta: "Approve closeout",
      changesCta: "Request changes",
      tone: "progress",
      canApprove: true,
    });
  });

  it("does not offer approval for already reviewed closeouts", () => {
    expect(
      closeoutReviewGuidance({
        latest: {
          status: "approved",
          finalAmount: "250.00",
          completionNotes: "Done.",
        },
      })
    ).toMatchObject({
      label: "Closeout approved",
      tone: "ready",
      canApprove: false,
    });

    expect(
      closeoutReviewGuidance({
        latest: {
          status: "changes_requested",
          finalAmount: "250.00",
          completionNotes: "Done.",
          reviewNotes: "Please add the receipt.",
        },
      })
    ).toMatchObject({
      label: "Changes requested",
      tone: "attention",
      canApprove: false,
    });
  });
});
