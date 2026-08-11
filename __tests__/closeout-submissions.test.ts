import { describe, expect, it } from "vitest";
import {
  CLOSEOUT_STATUS_LABELS,
  closeoutReadiness,
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
  it("requires after proof, done project tasks, and a final amount", () => {
    expect(
      closeoutReadiness({
        photos: [{ type: "before" }],
        tasks: [{ status: "done" }, { status: "in_progress" }],
        finalAmount: "",
      })
    ).toMatchObject({
      ready: false,
      missing: ["after photo", "done tasks", "final amount"],
      tone: "attention",
    });
  });

  it("marks closeout ready when proof, tasks, and cost are present", () => {
    expect(
      closeoutReadiness({
        photos: [{ type: "after" }],
        tasks: [{ status: "done" }],
        finalAmount: "250.00",
      })
    ).toMatchObject({
      ready: true,
      missing: [],
      tone: "ready",
    });
  });
});
