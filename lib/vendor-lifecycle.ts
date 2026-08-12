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

export type VendorNextActionRequest = VendorLifecycleRequest & {
  id?: string;
  vendorBid?: { status: string; amount?: string | number | null } | null;
  tasks?: Array<{ status: string; acceptedAt?: string | Date | null }>;
  closeoutSubmissions?: Array<{ status: string; submittedAt?: string | Date }>;
  billingRecords?: Array<{ status: string; recordedAt?: string | Date }>;
  workSessions?: Array<{ event: string; createdAt?: string | Date | null }>;
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

export type VendorNextAction = {
  label: string;
  detail: string;
  cta: string;
  href: string;
  tone: "attention" | "progress" | "ready";
};

export type VendorWorkQueueMetric = {
  label: string;
  value: number;
  detail: string;
  tone: "attention" | "progress" | "ready" | "empty";
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

function latestByDate<T extends { submittedAt?: string | Date; recordedAt?: string | Date }>(
  rows: T[] | undefined,
  field: "submittedAt" | "recordedAt"
) {
  if (!rows || rows.length === 0) return null;
  return [...rows].sort((a, b) => {
    const left = new Date(a[field] ?? 0).getTime();
    const right = new Date(b[field] ?? 0).getTime();
    return right - left;
  })[0];
}

function latestWorkSession(request: VendorNextActionRequest) {
  const events = request.workSessions ?? [];
  if (events.length === 0) return null;
  return [...events].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  )[0];
}

function anchor(request: VendorNextActionRequest, suffix: string) {
  return request.id ? `#${suffix}-${request.id}` : `#${suffix}`;
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

export function vendorNextAction(request: VendorNextActionRequest): VendorNextAction {
  const bid = request.vendorBid;
  const latestCloseout = latestByDate(request.closeoutSubmissions, "submittedAt");
  const latestBilling = latestByDate(request.billingRecords, "recordedAt");
  const latestSession = latestWorkSession(request);
  const tasks = request.tasks ?? [];
  const blockedTasks = tasks.filter((task) => task.status === "blocked").length;
  const doneTasks = tasks.filter((task) => task.status === "done").length;
  const acceptedTasks = tasks.filter((task) => task.acceptedAt).length;
  const taskGap = tasks.length > 0 && doneTasks < tasks.length;
  const acceptanceGap = tasks.length > 0 && doneTasks > acceptedTasks;

  if (!bid && request.status === "Needs Quote") {
    return {
      label: "Bid requested",
      detail:
        "The owner needs price, scope, and availability before they can approve or schedule the work.",
      cta: "Submit bid",
      href: anchor(request, "vendor-bid"),
      tone: "attention",
    };
  }

  if (bid?.status === "pending") {
    return {
      label: "Waiting on owner approval",
      detail: "Your bid is saved. Keep the owner updated only if scope, price, or timing changes.",
      cta: "Review bid",
      href: anchor(request, "vendor-bid"),
      tone: "progress",
    };
  }

  if (bid?.status === "declined") {
    return {
      label: "Bid needs revision",
      detail: "The owner declined the current bid. Revise only if amount, availability, or scope changed.",
      cta: "Revise bid",
      href: anchor(request, "vendor-bid"),
      tone: "attention",
    };
  }

  if (!hasJobContext(request)) {
    return {
      label: "Ask for job context",
      detail:
        "Location, access instructions, and preferred contact need to be clear before work starts.",
      cta: "Ask owner",
      href: anchor(request, "request-updates"),
      tone: "attention",
    };
  }

  if (blockedTasks > 0) {
    return {
      label: "Resolve blocked scope",
      detail: `${blockedTasks} ${blockedTasks === 1 ? "task is" : "tasks are"} blocked. Leave the owner a clear note before work continues.`,
      cta: "Post update",
      href: anchor(request, "request-updates"),
      tone: "attention",
    };
  }

  if (request.status === "Scheduled" || (request.status === "In Progress" && !latestSession)) {
    return {
      label: "Start with proof",
      detail:
        "Record the start event with a before photo so the owner can see what work began.",
      cta: "Start work",
      href: anchor(request, "vendor-work"),
      tone: "attention",
    };
  }

  if (latestSession?.event === "paused") {
    return {
      label: "Resume or close the visit",
      detail: "Work is paused. Resume when work continues, or stop with proof when this visit is done.",
      cta: "Resume work",
      href: anchor(request, "vendor-work"),
      tone: "progress",
    };
  }

  if (latestSession?.event === "started" || latestSession?.event === "resumed") {
    return {
      label: "Stop with completion proof",
      detail:
        "When this visit is done, record a stop event with an after photo so the owner has proof.",
      cta: "Stop work",
      href: anchor(request, "vendor-work"),
      tone: "progress",
    };
  }

  if (taskGap) {
    return {
      label: "Update task progress",
      detail: `${doneTasks} of ${tasks.length} project tasks are marked done. Keep task status current before closeout.`,
      cta: "Review tasks",
      href: anchor(request, "vendor-tasks"),
      tone: "progress",
    };
  }

  if (!hasPhotoType(request, "after")) {
    return {
      label: "Add after photo",
      detail: "The owner needs completion proof before closeout feels trustworthy.",
      cta: "Upload proof",
      href: "#helper-upload",
      tone: "attention",
    };
  }

  if (!hasCost(request.finalCost)) {
    return {
      label: "Share final cost context",
      detail: "Photos are present. Add invoice or final amount context so the owner can finish the record.",
      cta: "Post cost update",
      href: anchor(request, "request-updates"),
      tone: "attention",
    };
  }

  if (latestCloseout?.status === "pending") {
    return {
      label: "Closeout under owner review",
      detail: "The handoff is submitted. Wait for the owner to approve it or request specific changes.",
      cta: "Review closeout",
      href: anchor(request, "vendor-closeout"),
      tone: "progress",
    };
  }

  if (latestCloseout?.status === "changes_requested") {
    return {
      label: "Closeout changes requested",
      detail: "The owner needs a revised handoff. Update completion notes, receipts, or final amount.",
      cta: "Revise closeout",
      href: anchor(request, "vendor-closeout"),
      tone: "attention",
    };
  }

  if (!latestCloseout || (request.status === "Needs Review" && latestCloseout.status !== "approved")) {
    return {
      label: "Submit closeout",
      detail:
        "Proof and final cost are ready. Submit completion notes so the owner can approve or request changes.",
      cta: "Submit handoff",
      href: anchor(request, "vendor-closeout"),
      tone: "attention",
    };
  }

  if (acceptanceGap) {
    return {
      label: "Waiting on task acceptance",
      detail:
        "Done tasks are waiting for owner acceptance. Add a note if the owner needs review context.",
      cta: "Review tasks",
      href: anchor(request, "vendor-tasks"),
      tone: "progress",
    };
  }

  if (latestBilling?.status === "disputed") {
    return {
      label: "Billing needs context",
      detail: "The owner flagged the billing record for follow-up. Add invoice or materials context in updates.",
      cta: "Post billing note",
      href: anchor(request, "request-updates"),
      tone: "attention",
    };
  }

  if (latestBilling?.status === "paid") {
    return {
      label: "Job record settled",
      detail: "Closeout is approved and the owner marked the final charge paid outside TurnFlow.",
      cta: "Review record",
      href: anchor(request, "vendor-billing"),
      tone: "ready",
    };
  }

  if (latestBilling) {
    return {
      label: "Billing recorded",
      detail: "The owner has a final-charge record. TurnFlow stores history; payment happens outside the app.",
      cta: "Review billing",
      href: anchor(request, "vendor-billing"),
      tone: "ready",
    };
  }

  return {
    label: "Waiting on owner closeout",
    detail: "Closeout is approved. The owner controls final billing recordkeeping from here.",
    cta: "Review closeout",
    href: anchor(request, "vendor-closeout"),
    tone: "ready",
  };
}

export function vendorWorkQueueMetrics(
  requests: VendorNextActionRequest[]
): VendorWorkQueueMetric[] {
  const nextActions = requests.map((request) => vendorNextAction(request));
  const countByLabel = (labels: string[]) =>
    nextActions.filter((action) => labels.includes(action.label)).length;
  const bidCount = countByLabel(["Bid requested", "Bid needs revision"]);
  const workCount = countByLabel([
    "Resolve blocked scope",
    "Start with proof",
    "Resume or close the visit",
    "Stop with completion proof",
    "Update task progress",
  ]);
  const closeoutCount = countByLabel([
    "Add after photo",
    "Share final cost context",
    "Closeout changes requested",
    "Submit closeout",
    "Billing needs context",
  ]);
  const ownerWaitCount = countByLabel([
    "Waiting on owner approval",
    "Closeout under owner review",
    "Waiting on task acceptance",
  ]);

  return [
    {
      label: "Bid queue",
      value: bidCount,
      detail:
        bidCount > 0
          ? `${bidCount} ${bidCount === 1 ? "job needs" : "jobs need"} price, scope, or availability before the owner can decide.`
          : requests.length > 0
            ? "No assigned job is waiting on a vendor bid right now."
            : "Assigned jobs that need a bid will appear here.",
      tone: bidCount > 0 ? "attention" : requests.length > 0 ? "ready" : "empty",
    },
    {
      label: "Work starts/stops",
      value: workCount,
      detail:
        workCount > 0
          ? `${workCount} ${workCount === 1 ? "job needs" : "jobs need"} start proof, stop proof, or task progress before closeout.`
          : requests.length > 0
            ? "No job is waiting on start, stop, or task progress right now."
            : "Scheduled and active work will appear here.",
      tone: workCount > 0 ? "attention" : requests.length > 0 ? "ready" : "empty",
    },
    {
      label: "Closeout handoffs",
      value: closeoutCount,
      detail:
        closeoutCount > 0
          ? `${closeoutCount} ${closeoutCount === 1 ? "job needs" : "jobs need"} proof, final cost, or a revised handoff before owner approval.`
          : requests.length > 0
            ? "No job is waiting on vendor closeout right now."
            : "Jobs ready for closeout will appear here.",
      tone: closeoutCount > 0 ? "attention" : requests.length > 0 ? "ready" : "empty",
    },
    {
      label: "Owner waits",
      value: ownerWaitCount,
      detail:
        ownerWaitCount > 0
          ? `${ownerWaitCount} ${ownerWaitCount === 1 ? "job is" : "jobs are"} waiting on owner approval, review, or task acceptance.`
          : requests.length > 0
            ? "No current job is blocked on an owner decision."
            : "Owner review states will appear here once work is assigned.",
      tone: ownerWaitCount > 0 ? "progress" : requests.length > 0 ? "ready" : "empty",
    },
  ];
}
