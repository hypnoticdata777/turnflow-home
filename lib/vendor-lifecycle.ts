export type VendorLifecycleRequest = {
  status: string;
  quotedCost?: string | number | null;
  finalCost?: string | number | null;
  location?: string | null;
  accessInstructions?: string | null;
  contactMethod?: string | null;
  photos?: Array<{ type: string }>;
  comments?: Array<unknown>;
};

export type VendorLifecycleStageStatus = "done" | "current" | "blocked" | "upcoming";

export type VendorLifecycleStage = {
  key: "opportunity" | "bid" | "approval" | "scheduled" | "work" | "closeout" | "billing";
  label: string;
  detail: string;
  status: VendorLifecycleStageStatus;
};

export type VendorLifecycleSummary = {
  label: string;
  detail: string;
  nextAction: string;
  tone: "attention" | "progress" | "ready";
  completedCount: number;
  totalCount: number;
};

const startedStatuses = new Set(["Scheduled", "In Progress", "Needs Review", "Complete"]);
const activeStatuses = new Set(["In Progress", "Needs Review"]);

function hasCost(value: string | number | null | undefined) {
  return value !== undefined && value !== null && value !== "";
}

function hasPhotoType(request: VendorLifecycleRequest, type: string) {
  return (request.photos ?? []).some((photo) => photo.type === type);
}

function hasJobContext(request: VendorLifecycleRequest) {
  return Boolean(request.location && request.accessInstructions && request.contactMethod);
}

function hasPriceContext(request: VendorLifecycleRequest) {
  return hasCost(request.quotedCost) || hasCost(request.finalCost);
}

function hasVendorUpdate(request: VendorLifecycleRequest) {
  return (request.comments ?? []).length > 0;
}

export function vendorLifecycleStages(
  request: VendorLifecycleRequest
): VendorLifecycleStage[] {
  const priceReady = hasPriceContext(request);
  const jobContextReady = hasJobContext(request);
  const afterPhotoReady = hasPhotoType(request, "after");
  const finalCostReady = hasCost(request.finalCost);
  const proofReady = afterPhotoReady && finalCostReady;
  const started = startedStatuses.has(request.status);
  const active = activeStatuses.has(request.status);

  return [
    {
      key: "opportunity",
      label: "Opportunity received",
      detail: "This job is assigned to your vendor account with scoped request access.",
      status: "done",
    },
    {
      key: "bid",
      label: "Bid / price context",
      detail: priceReady
        ? "A quote, estimate, or final cost is already recorded for the owner."
        : request.status === "Needs Quote"
          ? "Use the update thread to give the owner pricing details for this job."
          : "Pricing context can be added before approval or final billing.",
      status: priceReady ? "done" : request.status === "Needs Quote" ? "current" : "upcoming",
    },
    {
      key: "approval",
      label: "Owner approval",
      detail: started
        ? "The owner moved this beyond approval into scheduled or active work."
        : request.status === "Waiting"
          ? "The record is waiting on a decision, answer, or handoff."
          : "Owner approval comes after the bid or scope is clear.",
      status: started ? "done" : request.status === "Waiting" ? "current" : "upcoming",
    },
    {
      key: "scheduled",
      label: "Scheduled / ready",
      detail: jobContextReady
        ? "Property, location, access, and contact context are available."
        : "Confirm location, access, and preferred contact before work starts.",
      status:
        request.status === "Scheduled"
          ? jobContextReady
            ? "current"
            : "blocked"
          : active || request.status === "Complete"
            ? "done"
            : "upcoming",
    },
    {
      key: "work",
      label: "Work in progress",
      detail: hasVendorUpdate(request)
        ? "The update thread has activity the owner can follow."
        : "Post updates when schedule, site conditions, or scope changes.",
      status:
        request.status === "In Progress"
          ? "current"
          : request.status === "Needs Review" || request.status === "Complete"
            ? "done"
            : "upcoming",
    },
    {
      key: "closeout",
      label: "Closeout proof",
      detail: proofReady
        ? "After-photo proof and final cost are on record."
        : "Add after photos and final cost context before owner closeout feels complete.",
      status: proofReady
        ? "done"
        : request.status === "Complete" || request.status === "Needs Review"
          ? "blocked"
          : request.status === "In Progress"
            ? "current"
            : "upcoming",
    },
    {
      key: "billing",
      label: "Billing record",
      detail: finalCostReady
        ? "Final cost is saved for the homeowner's maintenance history."
        : "Invoice or final cost details still need to be captured before the record is complete.",
      status: finalCostReady
        ? "done"
        : request.status === "Complete" || request.status === "Needs Review"
          ? "current"
          : "upcoming",
    },
  ];
}

export function vendorLifecycleSummary(
  request: VendorLifecycleRequest
): VendorLifecycleSummary {
  const stages = vendorLifecycleStages(request);
  const completedCount = stages.filter((stage) => stage.status === "done").length;
  const blockingStage = stages.find((stage) => stage.status === "blocked");
  const currentStage = stages.find((stage) => stage.status === "current");
  const focusStage = blockingStage ?? currentStage;

  if (!focusStage) {
    return {
      label: "Lifecycle ready",
      detail: "This vendor record has moved through assignment, work, closeout, and billing context.",
      nextAction: "Review record",
      tone: "ready",
      completedCount,
      totalCount: stages.length,
    };
  }

  return {
    label: focusStage.status === "blocked" ? "Lifecycle blocked" : "Lifecycle in motion",
    detail: `${focusStage.label}: ${focusStage.detail}`,
    nextAction:
      focusStage.key === "bid"
        ? "Send bid update"
        : focusStage.key === "approval"
          ? "Clarify decision"
          : focusStage.key === "scheduled"
            ? "Confirm job context"
            : focusStage.key === "closeout"
              ? "Add closeout proof"
              : focusStage.key === "billing"
                ? "Share billing details"
                : "Update owner",
    tone: focusStage.status === "blocked" ? "attention" : "progress",
    completedCount,
    totalCount: stages.length,
  };
}
