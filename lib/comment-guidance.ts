export type CommentGuidanceRole = "owner" | "vendor" | "collaborator";

export type CommentGuidanceRequest = {
  status?: string | null;
  location?: string | null;
  accessInstructions?: string | null;
  contactMethod?: string | null;
  finalCost?: string | number | null;
  assignedVendorId?: string | null;
  collaboratorId?: string | null;
  photos?: Array<{ type: string }>;
  comments?: Array<unknown>;
};

export type CommentThreadGuidance = {
  eyebrow: string;
  title: string;
  detail: string;
  emptyState: string;
  placeholder: string;
  suggestions: string[];
};

function hasAfterPhoto(request: CommentGuidanceRequest) {
  return (request.photos ?? []).some((photo) => photo.type === "after");
}

function hasFinalCost(request: CommentGuidanceRequest) {
  return request.finalCost !== undefined && request.finalCost !== null && request.finalCost !== "";
}

function joinList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function missingJobContext(request: CommentGuidanceRequest) {
  const missing = [];
  if (!request.location) missing.push("location");
  if (!request.accessInstructions) missing.push("access instructions");
  if (!request.contactMethod) missing.push("preferred contact");
  return missing;
}

export function commentThreadGuidance(
  role: CommentGuidanceRole,
  request: CommentGuidanceRequest
): CommentThreadGuidance {
  const hasComments = (request.comments ?? []).length > 0;
  const hasHelper = Boolean(request.assignedVendorId || request.collaboratorId);
  const contextMissing = missingJobContext(request);
  const afterPhotoMissing = !hasAfterPhoto(request);
  const finalCostMissing = !hasFinalCost(request);

  if (role === "vendor") {
    if (contextMissing.length > 0) {
      return {
        eyebrow: "Owner handoff",
        title: "Ask for the missing job context before work starts.",
        detail: `This request is missing ${joinList(contextMissing)}. Ask in the thread so the answer stays attached to the repair record.`,
        emptyState: "No vendor/owner updates yet. Ask for the missing context here.",
        placeholder: "Ask the owner for the detail you need...",
        suggestions: [
          `Can you confirm the ${joinList(contextMissing)} before I start?`,
          "I can begin once the access details are clear.",
        ],
      };
    }

    if (afterPhotoMissing || finalCostMissing) {
      return {
        eyebrow: "Closeout handoff",
        title: "Leave the owner a clean closeout update.",
        detail:
          "Use the thread to explain what is done, what proof was added, and whether final cost or invoice context is still needed.",
        emptyState: "No closeout update yet. Add the context the owner needs for review.",
        placeholder: "Tell the owner what changed or what is still needed...",
        suggestions: [
          afterPhotoMissing
            ? "Work is complete on site. I will upload the after photo next."
            : "After-photo proof is uploaded for owner review.",
          finalCostMissing
            ? "Final cost still needs owner or invoice confirmation."
            : "Final cost context is ready for the owner to review.",
        ],
      };
    }

    return {
      eyebrow: "Vendor update",
      title: "Keep the owner current without extra back-and-forth.",
      detail:
        "Post short updates when schedule, site conditions, proof, or closeout status changes.",
      emptyState: "No updates yet. Add the first useful vendor update.",
      placeholder: "Post a short vendor update...",
      suggestions: [
        "Job context and proof are ready for owner review.",
        "No new issue found on site; the repair record is current.",
      ],
    };
  }

  if (role === "collaborator") {
    return {
      eyebrow: "Shared update",
      title: "Add context only where it helps the owner decide.",
      detail:
        "Use this thread for observations, checks, or questions tied to the shared repair.",
      emptyState: "No collaborator updates yet. Add useful context if you have it.",
      placeholder: "Post a helpful update for the owner...",
      suggestions: [
        "I checked this and added what I found here.",
        "This looks ready for the owner to review.",
      ],
    };
  }

  if (!hasHelper) {
    return {
      eyebrow: "Owner notes",
      title: "Keep repair context in the record.",
      detail:
        "Use updates for notes you want preserved before inviting a vendor or trusted helper.",
      emptyState: "No updates yet. Add the first note if there is context to preserve.",
      placeholder: "Add a repair note...",
      suggestions: [
        "I added the current access and contact details to this request.",
        "I want proof and cost saved here before closing this out.",
      ],
    };
  }

  if (contextMissing.length > 0) {
    return {
      eyebrow: "Owner response",
      title: "Help the vendor move by filling the context gap.",
      detail: `This request is missing ${joinList(contextMissing)}. Reply here after you add or confirm those details.`,
      emptyState: "No updates yet. Add the missing context so helpers know what to do next.",
      placeholder: "Reply with the missing detail or next step...",
      suggestions: [
        `I added the ${joinList(contextMissing)} to the request.`,
        "Please confirm if you need anything else before starting.",
      ],
    };
  }

  return {
    eyebrow: "Owner handoff",
    title: hasComments ? "Keep owner/vendor updates in one thread." : "Start the shared repair thread.",
    detail:
      "Use this thread for questions, decisions, site updates, and closeout notes so the repair record stays complete.",
    emptyState: "No updates yet. Start the handoff so everyone knows what happens next.",
    placeholder: "Post an owner update or reply...",
    suggestions: [
      afterPhotoMissing
        ? "Please upload an after photo when the work is complete."
        : "After-photo proof is on record. Please confirm any remaining closeout details.",
      finalCostMissing
        ? "Please share final cost or invoice context when available."
        : "Final cost is saved for review.",
    ],
  };
}
