import { missingCompletionProof } from "@/lib/request-guidance";

export type StatusHandoffRole = "owner" | "vendor";

export type StatusHandoffInput = {
  status: string;
  finalCost?: string | number | null;
  assignedVendorId?: string | null;
  photos?: Array<{ type: string }>;
};

export type StatusHandoffGuidance = {
  eyebrow: string;
  title: string;
  detail: string;
  tone: "attention" | "progress" | "ready";
  reminders: string[];
};

const ownerStatusGuidance: Record<string, Omit<StatusHandoffGuidance, "reminders" | "tone">> = {
  Draft: {
    eyebrow: "Owner status",
    title: "Draft is for capturing the issue before sharing it.",
    detail:
      "Add the property context, photos, cost expectations, and notes you would want preserved before inviting help.",
  },
  "Needs Quote": {
    eyebrow: "Owner status",
    title: "Needs Quote means cost context comes next.",
    detail:
      "Use this when you need a quote, invoice, or rough estimate before approving or scheduling work.",
  },
  Waiting: {
    eyebrow: "Owner status",
    title: "Waiting means the next move is outside the app record.",
    detail:
      "Use updates to note who you are waiting on, what answer is needed, and when you expect the next step.",
  },
  Scheduled: {
    eyebrow: "Owner status",
    title: "Scheduled should include clear access and contact details.",
    detail:
      "Before work starts, make sure the vendor knows where to go, how to access the area, and how to reach you.",
  },
  "In Progress": {
    eyebrow: "Owner status",
    title: "In Progress means the job is active and proof should grow.",
    detail:
      "Watch for vendor updates, before/after photos, receipts, and any cost changes before moving to review.",
  },
  "Needs Review": {
    eyebrow: "Owner status",
    title: "Needs Review is your closeout checkpoint.",
    detail:
      "Review proof, final cost, updates, and the decision log before marking the repair complete.",
  },
  Complete: {
    eyebrow: "Owner status",
    title: "Complete should mean the record is ready to keep.",
    detail:
      "Use Complete when the work is done and the record has enough proof, cost, and vendor context to trust later.",
  },
  Archived: {
    eyebrow: "Owner status",
    title: "Archived keeps old work out of the active queue.",
    detail:
      "Use Archive only when the request no longer needs follow-up but should remain in history.",
  },
};

const vendorStatusGuidance: Record<string, Omit<StatusHandoffGuidance, "reminders" | "tone">> = {
  Draft: {
    eyebrow: "Vendor status",
    title: "Draft usually means the owner is still preparing context.",
    detail:
      "Ask for missing location, access, contact, or scope details before treating the job as ready.",
  },
  "Needs Quote": {
    eyebrow: "Vendor status",
    title: "Needs Quote means the owner needs cost context.",
    detail:
      "Use updates to share quote, invoice, or estimate context the owner should record before scheduling.",
  },
  Waiting: {
    eyebrow: "Vendor status",
    title: "Waiting should explain what is blocking movement.",
    detail:
      "Post a short update naming what you are waiting on so the owner is not left guessing.",
  },
  Scheduled: {
    eyebrow: "Vendor status",
    title: "Scheduled means confirm the job details before arrival.",
    detail:
      "Check location, access instructions, urgency, and preferred contact before moving to In Progress.",
  },
  "In Progress": {
    eyebrow: "Vendor status",
    title: "In Progress means keep proof and updates current.",
    detail:
      "Add useful updates as work changes, then upload after-photo proof before asking the owner to review.",
  },
  "Needs Review": {
    eyebrow: "Vendor status",
    title: "Needs Review means the owner should have enough to decide.",
    detail:
      "Use this when closeout context is ready or when the owner needs to review proof, cost, or a question.",
  },
  Complete: {
    eyebrow: "Vendor status",
    title: "Complete is a durable closeout state.",
    detail:
      "Only move here when the work is done and proof/cost context is on record, unless the waiver explains why.",
  },
  Archived: {
    eyebrow: "Vendor status",
    title: "Archived removes the job from active review.",
    detail:
      "Use Archive only when the owner no longer needs the job in the active workflow.",
  },
};

function toneForStatus(status: string, missingProof: string[]) {
  if (status === "Complete" && missingProof.length > 0) return "attention" as const;
  if (status === "Complete" || status === "Needs Review") return "ready" as const;
  return "progress" as const;
}

export function statusHandoffGuidance(
  role: StatusHandoffRole,
  input: StatusHandoffInput
): StatusHandoffGuidance {
  const missingProof = missingCompletionProof({
    status: input.status,
    finalCost: input.finalCost ?? null,
    assignedVendorId: input.assignedVendorId ?? null,
    photos: input.photos ?? [],
  });
  const base =
    role === "owner"
      ? ownerStatusGuidance[input.status] ?? ownerStatusGuidance.Draft
      : vendorStatusGuidance[input.status] ?? vendorStatusGuidance.Draft;
  const proofReminder =
    missingProof.length > 0
      ? `Missing for clean completion: ${missingProof.join(", ")}.`
      : "Clean completion proof is present.";

  return {
    ...base,
    tone: toneForStatus(input.status, missingProof),
    reminders: [
      "Every status change is saved to the decision log.",
      role === "vendor"
        ? "The owner is notified when status changes."
        : "The owner record should explain why the status changed.",
      proofReminder,
    ],
  };
}
