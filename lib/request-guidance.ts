import {
  costForRequest,
  costLabelForRequest,
  meetsCompletionRequirements,
  type CostFields,
} from "@/lib/utils";

export type RequestGuidanceTone = "attention" | "progress" | "ready";

export type RequestGuidanceInput = CostFields & {
  status: string;
  assignedVendorId?: string | null;
  collaboratorId?: string | null;
  pendingVendorInviteId?: string | null;
  pendingCollaboratorInviteId?: string | null;
  photos: Array<{ type: string }>;
};

export type RequestReadinessItem = {
  label: string;
  detail: string;
  complete: boolean;
};

export type RequestGuidance = {
  eyebrow: string;
  headline: string;
  detail: string;
  tone: RequestGuidanceTone;
  primaryHref: string;
  primaryCta: string;
  secondaryHref: string;
  secondaryCta: string;
  items: RequestReadinessItem[];
  completedCount: number;
  totalCount: number;
  progress: number;
  missingCompletionProof: string[];
};

export type RequestRecordValueInput = RequestGuidanceInput & {
  quotes?: Array<unknown>;
  log?: Array<unknown>;
  comments?: Array<unknown>;
};

export type RequestRecordValueMetric = {
  label: string;
  value: string;
  detail: string;
  tone: "attention" | "progress" | "ready";
  href: string;
  cta: string;
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function hasAnyCost(input: CostFields) {
  return costLabelForRequest(input) !== "No cost recorded";
}

function completionProofAction(missingProof: string[]) {
  if (missingProof.includes("after photo")) {
    return { href: "#photos", cta: "Add after photo" };
  }
  if (missingProof.includes("final cost")) {
    return { href: "#cost", cta: "Add final cost" };
  }
  return { href: "#sharing", cta: "Review sharing" };
}

function helperCount(input: RequestGuidanceInput) {
  return [
    input.assignedVendorId,
    input.collaboratorId,
    input.pendingVendorInviteId,
    input.pendingCollaboratorInviteId,
  ].filter(Boolean).length;
}

export function missingCompletionProof(input: RequestGuidanceInput): string[] {
  const missing = [];
  if (!input.finalCost) missing.push("final cost");
  if (!input.photos.some((photo) => photo.type === "after")) missing.push("after photo");
  if (!input.assignedVendorId) missing.push("assigned vendor");
  return missing;
}

export function requestReadinessItems(input: RequestGuidanceInput): RequestReadinessItem[] {
  const helpers = helperCount(input);
  const costLabel = costLabelForRequest(input);
  const currentCost = costForRequest(input);

  return [
    {
      label: "Evidence trail",
      detail:
        input.photos.length > 0
          ? `${pluralize(input.photos.length, "photo")} attached`
          : "No photos or receipts yet",
      complete: input.photos.length > 0,
    },
    {
      label: "Cost context",
      detail:
        costLabel === "No cost recorded"
          ? "No estimate, quote, or final cost recorded"
          : `${costLabel}: $${currentCost.toFixed(2)}`,
      complete: hasAnyCost(input),
    },
    {
      label: "Shared help",
      detail:
        helpers > 0
          ? `${pluralize(helpers, "assigned or invited person", "assigned or invited people")}`
          : "Only the owner can see this request",
      complete: helpers > 0,
    },
    {
      label: "Completion proof",
      detail: meetsCompletionRequirements(input, input.photos)
        ? "Final cost, after photo, and assigned vendor are on record"
        : `Missing ${missingCompletionProof(input).join(", ")}`,
      complete: meetsCompletionRequirements(input, input.photos),
    },
  ];
}

export function requestRecordValueMetrics(
  input: RequestRecordValueInput
): RequestRecordValueMetric[] {
  const missingProof = missingCompletionProof(input);
  const proofReady = meetsCompletionRequirements(input, input.photos);
  const costLabel = costLabelForRequest(input);
  const currentCost = costForRequest(input);
  const helpers = helperCount(input);
  const commentCount = input.comments?.length ?? 0;
  const quoteCount = input.quotes?.length ?? 0;
  const logCount = input.log?.length ?? 0;

  return [
    {
      label: "Proof packet",
      value: String(input.photos.length),
      detail: proofReady
        ? "Final cost, after photo, and assigned vendor are ready for a clean export."
        : input.photos.length > 0
          ? `${pluralize(input.photos.length, "proof item")} saved. Missing ${missingProof.join(", ")}.`
          : "No photos or receipts are saved yet for this repair.",
      tone: proofReady ? "ready" : input.photos.length > 0 ? "progress" : "attention",
      href: "#photos",
      cta: proofReady ? "Review proof" : "Add proof",
    },
    {
      label: "Cost clarity",
      value: costLabel === "No cost recorded" ? "$0.00" : `$${currentCost.toFixed(2)}`,
      detail:
        costLabel === "No cost recorded"
          ? "No estimate, quote, or final cost has been recorded yet."
          : `${costLabel} cost is recorded${quoteCount > 0 ? ` with ${pluralize(quoteCount, "quote")} in the workspace` : ""}.`,
      tone:
        costLabel === "Final"
          ? "ready"
          : costLabel === "No cost recorded"
            ? "attention"
            : "progress",
      href: costLabel === "No cost recorded" ? "#cost" : "#quotes",
      cta: costLabel === "No cost recorded" ? "Add cost" : "Review cost",
    },
    {
      label: "Shared coordination",
      value: String(helpers),
      detail:
        helpers > 0
          ? `${pluralize(helpers, "helper")} scoped to this request and ${pluralize(commentCount, "update")} in the thread.`
          : "No vendor or trusted helper has scoped access to this repair yet.",
      tone: helpers > 0 && commentCount > 0 ? "ready" : helpers > 0 ? "progress" : "attention",
      href: helpers > 0 ? "#comments" : "#sharing",
      cta: helpers > 0 ? "Review updates" : "Invite help",
    },
    {
      label: "Decision history",
      value: String(logCount),
      detail:
        logCount > 0
          ? `${pluralize(logCount, "decision")} recorded for status, quotes, access, or completion.`
          : "Decisions will appear here as quotes, status changes, and access changes happen.",
      tone: logCount > 0 ? "ready" : "progress",
      href: "#decision-log",
      cta: "Review history",
    },
  ];
}

export function requestGuidance(input: RequestGuidanceInput): RequestGuidance {
  const items = requestReadinessItems(input);
  const completedCount = items.filter((item) => item.complete).length;
  const totalCount = items.length;
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const missingProof = missingCompletionProof(input);
  const hasHelper =
    !!input.assignedVendorId ||
    !!input.collaboratorId ||
    !!input.pendingVendorInviteId ||
    !!input.pendingCollaboratorInviteId;
  const proofAction = completionProofAction(missingProof);

  if (input.status === "Complete" && missingProof.length > 0) {
    return {
      eyebrow: "Proof gaps",
      headline: "Completion is recorded, but the proof packet has gaps.",
      detail:
        "The decision log can explain a waiver, but adding the missing proof will make this record stronger later.",
      tone: "attention",
      primaryHref: proofAction.href,
      primaryCta: proofAction.cta,
      secondaryHref: "#decision-log",
      secondaryCta: "Review decision log",
      items,
      completedCount,
      totalCount,
      progress,
      missingCompletionProof: missingProof,
    };
  }

  if (meetsCompletionRequirements(input, input.photos)) {
    return {
      eyebrow: "Proof packet ready",
      headline: "This request has the core proof needed for clean completion.",
      detail:
        "Final cost, after photo, and assigned vendor are in place. Keep comments and decisions current as the work wraps up.",
      tone: "ready",
      primaryHref: "#decision-log",
      primaryCta: "Review decision log",
      secondaryHref: "#photos",
      secondaryCta: "Review proof",
      items,
      completedCount,
      totalCount,
      progress,
      missingCompletionProof: missingProof,
    };
  }

  if (input.photos.length === 0) {
    return {
      eyebrow: "Request readiness",
      headline: "Start the evidence trail.",
      detail:
        "Add a before photo, receipt, or context image so anyone helping can understand the issue without extra back-and-forth.",
      tone: "attention",
      primaryHref: "#photos",
      primaryCta: "Add proof",
      secondaryHref: "#cost",
      secondaryCta: "Add cost",
      items,
      completedCount,
      totalCount,
      progress,
      missingCompletionProof: missingProof,
    };
  }

  if (!hasAnyCost(input)) {
    return {
      eyebrow: "Request readiness",
      headline: "Add cost context before decisions pile up.",
      detail:
        "Even a rough estimate helps the owner record explain what was expected, quoted, and finally paid.",
      tone: "progress",
      primaryHref: "#cost",
      primaryCta: "Add cost",
      secondaryHref: "#quotes",
      secondaryCta: "Record quote",
      items,
      completedCount,
      totalCount,
      progress,
      missingCompletionProof: missingProof,
    };
  }

  if (!hasHelper) {
    return {
      eyebrow: "Request readiness",
      headline: "Bring the right person into this repair.",
      detail:
        "A scoped invite lets a vendor or trusted helper see only this request and add useful updates back to the record.",
      tone: "progress",
      primaryHref: "#sharing",
      primaryCta: "Invite help",
      secondaryHref: "#comments",
      secondaryCta: "Add update",
      items,
      completedCount,
      totalCount,
      progress,
      missingCompletionProof: missingProof,
    };
  }

  return {
    eyebrow: "Request readiness",
    headline: "Prepare this request for clean completion.",
    detail: `Still needed: ${missingProof.join(", ")}.`,
    tone: "progress",
    primaryHref: proofAction.href,
    primaryCta: proofAction.cta,
    secondaryHref: "#sharing",
    secondaryCta: "Review sharing",
    items,
    completedCount,
    totalCount,
    progress,
    missingCompletionProof: missingProof,
  };
}
