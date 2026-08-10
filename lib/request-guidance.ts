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

export function missingCompletionProof(input: RequestGuidanceInput): string[] {
  const missing = [];
  if (!input.finalCost) missing.push("final cost");
  if (!input.photos.some((photo) => photo.type === "after")) missing.push("after photo");
  if (!input.assignedVendorId) missing.push("assigned vendor");
  return missing;
}

export function requestReadinessItems(input: RequestGuidanceInput): RequestReadinessItem[] {
  const helperCount = [
    input.assignedVendorId,
    input.collaboratorId,
    input.pendingVendorInviteId,
    input.pendingCollaboratorInviteId,
  ].filter(Boolean).length;
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
        helperCount > 0
          ? `${pluralize(helperCount, "assigned or invited person", "assigned or invited people")}`
          : "Only the owner can see this request",
      complete: helperCount > 0,
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
