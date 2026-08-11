export type HelperRole = "vendor" | "collaborator";

export type HelperWorkspaceRequest = {
  status: string;
  finalCost?: string | number | null;
  location?: string | null;
  accessInstructions?: string | null;
  contactMethod?: string | null;
  photos?: Array<{ type: string }>;
  comments?: Array<unknown>;
};

export type HelperWorkspaceStats = {
  totalCount: number;
  activeCount: number;
  completeCount: number;
  needsProofCount: number;
  quietCount: number;
};

export type HelperWorkspaceGuidance = {
  eyebrow: string;
  headline: string;
  detail: string;
  tone: "empty" | "attention" | "progress" | "ready";
  primaryHref: string;
  primaryCta: string;
  secondaryHref: string;
  secondaryCta: string;
  stats: HelperWorkspaceStats;
  attentionCount: number;
};

export type HelperOnboardingItem = {
  title: string;
  detail: string;
  href: string;
  cta: string;
  status: "available" | "focus" | "waiting";
};

export type HelperInviteExpectation = {
  title: string;
  detail: string;
};

export type HelperRequestCardState = {
  label: string;
  detail: string;
  tone: "attention" | "progress" | "ready";
  actionHref: string;
  actionCta: string;
};

export type HelperUploadPrompt = {
  title: string;
  detail: string;
  recommendedPhotoTypes: string[];
};

export type VendorCloseoutMetric = {
  label: string;
  value: number;
  detail: string;
  tone: "attention" | "progress" | "ready" | "empty";
};

function hasAfterPhoto(request: HelperWorkspaceRequest) {
  return (request.photos ?? []).some((photo) => photo.type === "after");
}

function hasFinalCost(request: HelperWorkspaceRequest) {
  return request.finalCost !== undefined && request.finalCost !== null && request.finalCost !== "";
}

function missingVendorContext(request: HelperWorkspaceRequest) {
  const missing = [];
  if (!request.location) missing.push("location");
  if (!request.accessInstructions) missing.push("access instructions");
  if (!request.contactMethod) missing.push("preferred contact");
  return missing;
}

function missingVendorProof(request: HelperWorkspaceRequest) {
  const missing = [];
  if (!hasAfterPhoto(request)) missing.push("after photo");
  if (!hasFinalCost(request)) missing.push("final cost");
  return missing;
}

function joinList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

export function helperWorkspaceStats(
  requests: HelperWorkspaceRequest[]
): HelperWorkspaceStats {
  return {
    totalCount: requests.length,
    activeCount: requests.filter((request) => request.status !== "Complete").length,
    completeCount: requests.filter((request) => request.status === "Complete").length,
    needsProofCount: requests.filter(
      (request) => request.status !== "Complete" && (!hasAfterPhoto(request) || !hasFinalCost(request))
    ).length,
    quietCount: requests.filter((request) => (request.comments ?? []).length === 0).length,
  };
}

export function helperWorkspaceGuidance(
  role: HelperRole,
  requests: HelperWorkspaceRequest[]
): HelperWorkspaceGuidance {
  const stats = helperWorkspaceStats(requests);
  const roleLabel = role === "vendor" ? "Vendor" : "Collaborator";
  const attentionCount = role === "vendor" ? stats.needsProofCount : stats.quietCount;

  if (stats.totalCount === 0) {
    return {
      eyebrow: `${roleLabel} scope`,
      headline:
        role === "vendor"
          ? "No assigned repairs yet."
          : "No shared repairs yet.",
      detail:
        "When an owner grants request-specific access, only those repair records appear here.",
      tone: "empty",
      primaryHref: "#helper-scope",
      primaryCta: "Review scope",
      secondaryHref: "/login",
      secondaryCta: "Switch account",
      stats,
      attentionCount,
    };
  }

  if (role === "vendor" && stats.needsProofCount > 0) {
    return {
      eyebrow: "Vendor next step",
      headline: "Add proof before work gets closed out.",
      detail:
        "Requests with missing after photos or final cost context are harder for the owner to trust later.",
      tone: "attention",
      primaryHref: "#helper-upload",
      primaryCta: "Upload proof",
      secondaryHref: "#helper-requests",
      secondaryCta: "Review assigned work",
      stats,
      attentionCount,
    };
  }

  if (role === "collaborator" && stats.quietCount > 0) {
    return {
      eyebrow: "Collaborator next step",
      headline: "Post a useful update where context is missing.",
      detail:
        "A short note can help the owner understand what changed, what you checked, or what still needs a decision.",
      tone: "attention",
      primaryHref: "#helper-requests",
      primaryCta: "Review shared work",
      secondaryHref: "#helper-scope",
      secondaryCta: "Review scope",
      stats,
      attentionCount,
    };
  }

  if (stats.activeCount > 0) {
    return {
      eyebrow: `${roleLabel} progress`,
      headline: `${stats.activeCount} shared ${stats.activeCount === 1 ? "request is" : "requests are"} still active.`,
      detail:
        role === "vendor"
          ? "Keep status and proof current so the owner can follow the work without chasing updates."
          : "Watch the active repair records and add comments only where your context helps.",
      tone: "progress",
      primaryHref: "#helper-requests",
      primaryCta: "Review active work",
      secondaryHref: "#helper-scope",
      secondaryCta: "Review scope",
      stats,
      attentionCount,
    };
  }

  return {
    eyebrow: `${roleLabel} complete`,
    headline: "Everything currently shared with you is complete.",
    detail:
      "You still only have access to the request records the owner shared with this account.",
    tone: "ready",
    primaryHref: "#helper-requests",
    primaryCta: "Review completed work",
    secondaryHref: "#helper-scope",
    secondaryCta: "Review scope",
    stats,
    attentionCount,
  };
}

export function helperOnboardingItems(
  role: HelperRole,
  requests: HelperWorkspaceRequest[]
): HelperOnboardingItem[] {
  const stats = helperWorkspaceStats(requests);
  const hasRequests = stats.totalCount > 0;

  if (role === "vendor") {
    return [
      {
        title: "Know the boundary",
        detail:
          "This account can only see requests assigned to it. Owner documents, other properties, and unrelated repairs stay private.",
        href: "#helper-scope",
        cta: "Review access",
        status: hasRequests ? "available" : "focus",
      },
      {
        title: "Confirm the job context",
        detail:
          "Check the property, location, access instructions, urgency, and preferred contact before changing status.",
        href: "#helper-requests",
        cta: "Review request",
        status: hasRequests ? "focus" : "waiting",
      },
      {
        title: "Close with proof",
        detail:
          "Add after photos, receipts, and final cost context before the owner treats the work as complete.",
        href: "#helper-upload",
        cta: "Upload proof",
        status: stats.needsProofCount > 0 ? "focus" : hasRequests ? "available" : "waiting",
      },
    ];
  }

  return [
    {
      title: "Know the boundary",
      detail:
        "This account can only see requests the owner shared with it. Owner-only tools and unrelated records stay private.",
      href: "#helper-scope",
      cta: "Review access",
      status: hasRequests ? "available" : "focus",
    },
    {
      title: "Read the shared record",
      detail:
        "Review the status, notes, property, cost label, and urgency before adding anything to the thread.",
      href: "#helper-requests",
      cta: "Review work",
      status: hasRequests ? "focus" : "waiting",
    },
    {
      title: "Add useful context",
      detail:
        "Post short updates when you checked something, noticed a change, or need the owner to make a decision.",
      href: "#helper-requests",
      cta: "Post update",
      status: stats.quietCount > 0 ? "focus" : hasRequests ? "available" : "waiting",
    },
  ];
}

export function helperRequestCardState(
  role: HelperRole,
  request: HelperWorkspaceRequest
): HelperRequestCardState {
  if (role === "vendor") {
    const missingContext = missingVendorContext(request);
    const missingProof = missingVendorProof(request);

    if (request.status === "Complete") {
      if (missingProof.length > 0) {
        return {
          label: "Closed with proof gap",
          detail: `This is complete, but ${joinList(missingProof)} ${missingProof.length === 1 ? "is" : "are"} still missing from the record.`,
          tone: "attention",
          actionHref: "#helper-upload",
          actionCta: "Add proof",
        };
      }

      return {
        label: "Closed out",
        detail: "The request is marked complete and the core proof is on record.",
        tone: "ready",
        actionHref: "#helper-requests",
        actionCta: "Review details",
      };
    }

    if (missingContext.length > 0) {
      return {
        label: "Missing job context",
        detail: `Ask the owner for ${joinList(missingContext)} before work starts.`,
        tone: "attention",
        actionHref: "#helper-requests",
        actionCta: "Ask owner",
      };
    }

    if (missingProof.length > 0) {
      return {
        label: "Needs closeout proof",
        detail: `Add ${joinList(missingProof)} before this work is treated as complete.`,
        tone: "progress",
        actionHref: "#helper-upload",
        actionCta: "Add proof",
      };
    }

    return {
      label: "Ready for closeout",
      detail: "Job context and core proof are present. Update status when the owner is ready.",
      tone: "ready",
      actionHref: "#helper-requests",
      actionCta: "Review status",
    };
  }

  if (request.status === "Complete") {
    return {
      label: "Closed out",
      detail: "The owner has marked this shared request complete.",
      tone: "ready",
      actionHref: "#helper-requests",
      actionCta: "Review record",
    };
  }

  if ((request.comments ?? []).length === 0) {
    return {
      label: "Needs first update",
      detail: "Post a short note if you checked something or the owner needs context.",
      tone: "attention",
      actionHref: "#helper-requests",
      actionCta: "Post update",
    };
  }

  if (request.status === "Needs Review") {
    return {
      label: "Ready for owner review",
      detail: "The thread has context and the request is waiting for review.",
      tone: "ready",
      actionHref: "#helper-requests",
      actionCta: "Review thread",
    };
  }

  return {
    label: "In motion",
    detail: "The shared thread has updates. Add another note only when it helps.",
    tone: "progress",
    actionHref: "#helper-requests",
    actionCta: "Review thread",
  };
}

export function vendorUploadPrompt(
  request: HelperWorkspaceRequest | null | undefined
): HelperUploadPrompt {
  if (!request) {
    return {
      title: "Select a request to upload proof.",
      detail: "Choose one assigned request, then add the photo or receipt that belongs to that job.",
      recommendedPhotoTypes: [],
    };
  }

  const missingProof = missingVendorProof(request);
  const recommendedPhotoTypes = [];
  if (!hasAfterPhoto(request)) recommendedPhotoTypes.push("after");
  recommendedPhotoTypes.push("receipt", "other");

  if (missingProof.length === 0) {
    return {
      title: "Core proof is already on record.",
      detail:
        "You can still add receipts or extra context photos if they make the owner's record clearer.",
      recommendedPhotoTypes,
    };
  }

  if (missingProof.includes("after photo") && missingProof.includes("final cost")) {
    return {
      title: "After photo is the best next upload.",
      detail:
        "Upload the after photo here. If final cost is still missing, leave an update so the owner can record it.",
      recommendedPhotoTypes,
    };
  }

  if (missingProof.includes("after photo")) {
    return {
      title: "Add the after photo before closeout.",
      detail: "The final cost is present, so an after photo is the main proof still needed.",
      recommendedPhotoTypes,
    };
  }

  return {
    title: "Final cost still needs owner context.",
    detail:
      "Photos look ready. Leave an update if the owner needs invoice or final cost details from you.",
    recommendedPhotoTypes,
  };
}

export function vendorCloseoutMetrics(
  requests: HelperWorkspaceRequest[]
): VendorCloseoutMetric[] {
  const activeRequests = requests.filter((request) => request.status !== "Complete");
  const contextGapCount = activeRequests.filter(
    (request) => missingVendorContext(request).length > 0
  ).length;
  const afterPhotoGapCount = activeRequests.filter((request) => !hasAfterPhoto(request)).length;
  const finalCostGapCount = activeRequests.filter((request) => !hasFinalCost(request)).length;
  const closeoutReadyCount = activeRequests.filter(
    (request) =>
      missingVendorContext(request).length === 0 &&
      missingVendorProof(request).length === 0
  ).length;

  return [
    {
      label: "Ready to close",
      value: closeoutReadyCount,
      detail:
        activeRequests.length === 0
          ? "No active assigned jobs need closeout right now."
          : closeoutReadyCount > 0
            ? `${closeoutReadyCount} active ${closeoutReadyCount === 1 ? "job has" : "jobs have"} context, after-photo proof, and final cost ready.`
            : "No active job has all closeout pieces ready yet.",
      tone:
        activeRequests.length === 0
          ? "empty"
          : closeoutReadyCount > 0
            ? "ready"
            : "progress",
    },
    {
      label: "Need owner context",
      value: contextGapCount,
      detail:
        contextGapCount > 0
          ? `${contextGapCount} active ${contextGapCount === 1 ? "job is" : "jobs are"} missing location, access, or contact details.`
          : activeRequests.length > 0
            ? "Every active job has the basic context a vendor needs."
            : "Owner context will appear here when new work is assigned.",
      tone:
        contextGapCount > 0 ? "attention" : activeRequests.length > 0 ? "ready" : "empty",
    },
    {
      label: "After photos due",
      value: afterPhotoGapCount,
      detail:
        afterPhotoGapCount > 0
          ? `${afterPhotoGapCount} active ${afterPhotoGapCount === 1 ? "job needs" : "jobs need"} an after photo before closeout feels trustworthy.`
          : activeRequests.length > 0
            ? "After-photo proof is present on every active job."
            : "After-photo gaps will appear here when work starts.",
      tone:
        afterPhotoGapCount > 0 ? "progress" : activeRequests.length > 0 ? "ready" : "empty",
    },
    {
      label: "Final cost needed",
      value: finalCostGapCount,
      detail:
        finalCostGapCount > 0
          ? `${finalCostGapCount} active ${finalCostGapCount === 1 ? "job still needs" : "jobs still need"} final cost context from the owner or invoice.`
          : activeRequests.length > 0
            ? "Final cost context is present on every active job."
            : "Cost gaps will appear here when assigned work starts.",
      tone:
        finalCostGapCount > 0 ? "progress" : activeRequests.length > 0 ? "ready" : "empty",
    },
  ];
}

export function helperInviteExpectations(role: HelperRole): HelperInviteExpectation[] {
  if (role === "vendor") {
    return [
      {
        title: "Scoped request access",
        detail: "After accepting, this vendor account only sees the assigned repair.",
      },
      {
        title: "Job context first",
        detail: "Review the location, urgency, access instructions, and preferred contact.",
      },
      {
        title: "Proof closes the loop",
        detail: "Upload photos or receipts so the owner has a durable record.",
      },
    ];
  }

  return [
    {
      title: "Scoped request access",
      detail: "After accepting, this collaborator account only sees the shared repair.",
    },
    {
      title: "Shared record review",
      detail: "Review status, notes, cost context, and property details in one place.",
    },
    {
      title: "Helpful updates only",
      detail: "Add comments when your context helps the owner decide or understand progress.",
    },
  ];
}
