import { describe, expect, it } from "vitest";
import { requestWorkflowSteps, type RequestWorkflowInput } from "@/lib/request-workflow";

const baseInput: RequestWorkflowInput = {
  status: "Pending Approval",
  category: "Plumbing",
  urgency: "High",
  assignedVendorId: null,
  collaboratorId: null,
  pendingVendorInviteId: null,
  pendingCollaboratorInviteId: null,
  estimatedCost: null,
  quotedCost: null,
  finalCost: null,
  photos: [],
  quotes: [],
  tasks: [],
  closeoutSubmissions: [],
  billingRecords: [],
  workSessions: [],
  comments: [],
  log: [],
};

describe("requestWorkflowSteps", () => {
  it("maps a new owner request into clear missing and optional workflow states", () => {
    const steps = requestWorkflowSteps(baseInput);

    expect(steps.map((step) => step.label)).toEqual([
      "Intake",
      "Scope",
      "Cost",
      "Bids",
      "Help",
      "Proof",
      "Work",
      "Closeout",
      "Billing",
      "Updates",
      "History",
    ]);
    expect(steps.find((step) => step.label === "Help")).toMatchObject({
      state: "Owner only",
      tone: "attention",
      cta: "Invite help",
    });
    expect(steps.find((step) => step.label === "Proof")).toMatchObject({
      state: "Missing",
      tone: "attention",
      cta: "Add proof",
    });
    expect(steps.find((step) => step.id === "billing")).toMatchObject({
      state: "Not created",
      tone: "progress",
    });
  });

  it("surfaces owner review when vendor closeout is pending", () => {
    const steps = requestWorkflowSteps({
      ...baseInput,
      status: "Needs Review",
      assignedVendorId: "vendor-1",
      finalCost: "450",
      photos: [{ type: "before" }, { type: "after" }],
      tasks: [
        {
          status: "done",
          acceptedAt: null,
        },
      ],
      closeoutSubmissions: [
        {
          status: "pending",
          submittedAt: "2026-08-12T09:00:00.000Z",
        },
      ],
      workSessions: [{}],
      comments: [{}],
      log: [{}, {}],
    });

    expect(steps.find((step) => step.id === "cost")).toMatchObject({
      state: "Finalized",
      tone: "ready",
    });
    expect(steps.find((step) => step.label === "Scope")).toMatchObject({
      state: "1/1 done",
      tone: "progress",
    });
    expect(steps.find((step) => step.id === "closeout")).toMatchObject({
      state: "Owner review",
      tone: "attention",
      detail: "Vendor handoff is waiting for owner approval or requested changes.",
    });
  });

  it("marks closeout and billing mature after owner approval and paid history", () => {
    const steps = requestWorkflowSteps({
      ...baseInput,
      status: "Complete",
      assignedVendorId: "vendor-1",
      finalCost: "450",
      photos: [{ type: "before" }, { type: "after" }, { type: "receipt" }],
      tasks: [
        {
          status: "done",
          acceptedAt: "2026-08-12T10:00:00.000Z",
        },
      ],
      closeoutSubmissions: [
        {
          status: "approved",
          submittedAt: "2026-08-12T09:00:00.000Z",
        },
      ],
      billingRecords: [
        {
          status: "paid",
          recordedAt: "2026-08-12T10:30:00.000Z",
        },
      ],
      workSessions: [{}, {}],
      comments: [{}],
      log: [{}, {}, {}],
    });

    expect(steps.find((step) => step.label === "Scope")).toMatchObject({
      state: "Accepted",
      tone: "ready",
    });
    expect(steps.find((step) => step.id === "closeout")).toMatchObject({
      state: "Approved",
      tone: "ready",
    });
    expect(steps.find((step) => step.id === "billing")).toMatchObject({
      state: "Paid",
      tone: "ready",
    });
  });
});
