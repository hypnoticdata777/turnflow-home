import { describe, expect, it } from "vitest";
import {
  allowedNextStatuses,
  evaluateStatusChange,
  statusOptionsFor,
} from "@/lib/request-status-policy";
import { REQUEST_STATUSES, type RequestStatus } from "@/lib/utils";

describe("allowedNextStatuses", () => {
  it("lets the owner move to any other status", () => {
    for (const current of REQUEST_STATUSES) {
      expect(allowedNextStatuses("owner", current)).toHaveLength(REQUEST_STATUSES.length - 1);
    }
  });

  it("keeps vendors inside the working states", () => {
    expect(allowedNextStatuses("vendor", "Scheduled")).toEqual(["Waiting", "In Progress", "Needs Review"]);
    for (const current of ["Draft", "Needs Quote", "Waiting", "Scheduled", "In Progress", "Needs Review"] as RequestStatus[]) {
      const allowed = allowedNextStatuses("vendor", current);
      expect(allowed).not.toContain("Complete");
      expect(allowed).not.toContain("Archived");
      expect(allowed).not.toContain("Draft");
      expect(allowed).not.toContain("Needs Quote");
    }
  });

  it("gives vendors no moves once a request is closed", () => {
    expect(allowedNextStatuses("vendor", "Complete")).toEqual([]);
    expect(allowedNextStatuses("vendor", "Archived")).toEqual([]);
  });
});

describe("statusOptionsFor", () => {
  it("lists the current status first, then legal moves", () => {
    expect(statusOptionsFor("vendor", "In Progress")).toEqual([
      "In Progress",
      "Waiting",
      "Scheduled",
      "Needs Review",
    ]);
    expect(statusOptionsFor("vendor", "Complete")).toEqual(["Complete"]);
  });
});

describe("evaluateStatusChange", () => {
  const base = { meetsCompletionProof: false, waiverReason: null };

  it("rejects vendor completion, waiver, archive, and reopen attempts", () => {
    for (const [current, next] of [
      ["Needs Review", "Complete"],
      ["In Progress", "Archived"],
      ["Complete", "In Progress"],
      ["Scheduled", "Draft"],
    ] as Array<[RequestStatus, string]>) {
      const decision = evaluateStatusChange({
        ...base,
        role: "vendor",
        current,
        next,
        waiverReason: "vendor says so",
      });
      expect(decision.ok).toBe(false);
    }
  });

  it("allows a vendor working-state move and logs it as a status change", () => {
    expect(
      evaluateStatusChange({ ...base, role: "vendor", current: "Scheduled", next: "In Progress" })
    ).toEqual({ ok: true, kind: "change", logAction: "status_changed" });
  });

  it("requires owner completion proof or a waiver reason", () => {
    expect(
      evaluateStatusChange({ ...base, role: "owner", current: "Needs Review", next: "Complete" }).ok
    ).toBe(false);
    expect(
      evaluateStatusChange({
        ...base,
        role: "owner",
        current: "Needs Review",
        next: "Complete",
        waiverReason: "  Paid cash, no receipt  ",
      })
    ).toEqual({
      ok: true,
      kind: "change",
      logAction: "completion_waived",
      waiverReason: "Paid cash, no receipt",
    });
    expect(
      evaluateStatusChange({
        role: "owner",
        current: "Needs Review",
        next: "Complete",
        meetsCompletionProof: true,
      })
    ).toEqual({ ok: true, kind: "change", logAction: "status_changed" });
  });

  it("treats same-status saves as a no-op and rejects unknown statuses", () => {
    expect(evaluateStatusChange({ ...base, role: "owner", current: "Waiting", next: "Waiting" })).toEqual({
      ok: true,
      kind: "noop",
    });
    expect(evaluateStatusChange({ ...base, role: "owner", current: "Waiting", next: "Done" }).ok).toBe(false);
  });
});
