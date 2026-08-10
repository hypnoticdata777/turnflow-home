export type HelperRole = "vendor" | "collaborator";

export type HelperWorkspaceRequest = {
  status: string;
  finalCost?: string | number | null;
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

function hasAfterPhoto(request: HelperWorkspaceRequest) {
  return (request.photos ?? []).some((photo) => photo.type === "after");
}

function hasFinalCost(request: HelperWorkspaceRequest) {
  return request.finalCost !== undefined && request.finalCost !== null && request.finalCost !== "";
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
