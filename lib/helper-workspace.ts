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
