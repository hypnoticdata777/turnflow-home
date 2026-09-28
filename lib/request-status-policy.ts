import { REQUEST_STATUSES, type RequestStatus } from "@/lib/utils";

// Request status transition policy (P0 security, 2026-09-28).
//
// Before this module, updateRequestStatusAction let the owner OR the assigned
// vendor move a request from any status to any status, including Complete
// with a waiver, Archived, or back to Draft. The table below is now the
// single source of truth, enforced on the server and used by the vendor UI to
// show only the moves a vendor may make.
//
//   Owner  : any status -> any other status (the owner is the record's
//            authority). Moving to Complete still needs clean proof
//            (final cost + after photo + assigned vendor) OR a waiver reason.
//   Vendor : only between the four "working" states, and only while the
//            request is open:
//              {Draft, Needs Quote, Waiting, Scheduled, In Progress, Needs Review}
//                -> {Waiting, Scheduled, In Progress, Needs Review}
//            Vendors never complete, waive, archive, reopen, or send work
//            back to owner planning. They finish work by submitting a
//            closeout, which the owner approves.
//
// See docs/04-algorithms/04-request-status-lifecycle.md.

export type StatusActorRole = "owner" | "vendor";

export const VENDOR_WORKING_STATUSES = [
  "Waiting",
  "Scheduled",
  "In Progress",
  "Needs Review",
] as const satisfies readonly RequestStatus[];

export const CLOSED_STATUSES = ["Complete", "Archived"] as const satisfies readonly RequestStatus[];

export function isRequestStatus(value: string): value is RequestStatus {
  return (REQUEST_STATUSES as readonly string[]).includes(value);
}

function isClosed(status: RequestStatus) {
  return (CLOSED_STATUSES as readonly string[]).includes(status);
}

/** Every status this role may move the request to from `current` (excluding `current` itself). */
export function allowedNextStatuses(role: StatusActorRole, current: RequestStatus): RequestStatus[] {
  if (role === "owner") {
    return REQUEST_STATUSES.filter((status) => status !== current);
  }

  if (isClosed(current)) return [];
  return VENDOR_WORKING_STATUSES.filter((status) => status !== current);
}

/** Options for a status <select>: the current status first, then the legal moves. */
export function statusOptionsFor(role: StatusActorRole, current: string): string[] {
  if (!isRequestStatus(current)) return [current];
  return [current, ...allowedNextStatuses(role, current)];
}

export type StatusChangeDecision =
  | { ok: true; kind: "noop" }
  | { ok: true; kind: "change"; logAction: "status_changed" }
  | { ok: true; kind: "change"; logAction: "completion_waived"; waiverReason: string }
  | { ok: false; error: string };

/**
 * Decides whether a status change is allowed and how it is logged.
 * Pure: the action supplies the role, both statuses, whether clean
 * completion proof is on record, and the optional waiver reason.
 */
export function evaluateStatusChange(input: {
  role: StatusActorRole;
  current: RequestStatus;
  next: string;
  meetsCompletionProof: boolean;
  waiverReason?: string | null;
}): StatusChangeDecision {
  const { role, current, next } = input;

  if (!isRequestStatus(next)) {
    return { ok: false, error: "Invalid request status" };
  }
  if (next === current) {
    return { ok: true, kind: "noop" };
  }
  if (!allowedNextStatuses(role, current).includes(next)) {
    return {
      ok: false,
      error:
        role === "vendor"
          ? `Vendors cannot move a request from ${current} to ${next}. Submit a closeout for the owner to approve instead.`
          : `Cannot move a request from ${current} to ${next}.`,
    };
  }

  if (next === "Complete" && !input.meetsCompletionProof) {
    const reason = input.waiverReason?.trim();
    if (!reason) {
      return {
        ok: false,
        error:
          'Cannot mark Complete without final cost, an "after" photo, and an assigned vendor unless a waiver reason is provided.',
      };
    }
    return { ok: true, kind: "change", logAction: "completion_waived", waiverReason: reason };
  }

  return { ok: true, kind: "change", logAction: "status_changed" };
}
