export type CloseoutReadinessInput = {
  photos?: Array<{ type: string }> | null;
  tasks?: Array<{ status: string }> | null;
  finalAmount?: string | number | null;
  completionNotes?: string | null;
};

export const CLOSEOUT_REVIEW_DECISIONS = ["approved", "changes_requested"] as const;
export type CloseoutReviewDecision = (typeof CLOSEOUT_REVIEW_DECISIONS)[number];
export type CloseoutSubmissionStatus = "pending" | CloseoutReviewDecision;

export const CLOSEOUT_STATUS_LABELS: Record<CloseoutSubmissionStatus, string> = {
  pending: "Pending owner review",
  approved: "Approved",
  changes_requested: "Changes requested",
};

export type CloseoutReadiness = {
  ready: boolean;
  missing: string[];
  detail: string;
  tone: "attention" | "progress" | "ready";
};

export type CloseoutReadinessCheck = {
  label: string;
  missingLabel: string;
  detail: string;
  complete: boolean;
};

export function isCloseoutReviewDecision(value: string): value is CloseoutReviewDecision {
  return (CLOSEOUT_REVIEW_DECISIONS as readonly string[]).includes(value);
}

export function normalizeCloseoutNotes(value: string, maxLength = 1000) {
  return value.trim().slice(0, maxLength);
}

export function parseCloseoutAmount(value: FormDataEntryValue | string | number | null) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const amount = Number.parseFloat(trimmed);
  return Number.isFinite(amount) && amount > 0 ? amount.toFixed(2) : null;
}

function hasAfterPhoto(input: CloseoutReadinessInput) {
  return (input.photos ?? []).some((photo) => photo.type === "after");
}

function allTasksDone(input: CloseoutReadinessInput) {
  const tasks = input.tasks ?? [];
  return tasks.length === 0 || tasks.every((task) => task.status === "done");
}

export function closeoutReadinessChecks(
  input: CloseoutReadinessInput
): CloseoutReadinessCheck[] {
  const tasks = input.tasks ?? [];
  const doneTaskCount = tasks.filter((task) => task.status === "done").length;
  const afterPhotoReady = hasAfterPhoto(input);
  const tasksReady = allTasksDone(input);
  const finalAmountReady = Boolean(parseCloseoutAmount(input.finalAmount ?? null));
  const completionNotesReady = normalizeCloseoutNotes(input.completionNotes ?? "").length > 0;

  return [
    {
      label: "After-photo proof",
      missingLabel: "after photo",
      complete: afterPhotoReady,
      detail: afterPhotoReady
        ? "Completion proof is attached for owner review."
        : "Upload an after photo before submitting closeout.",
    },
    {
      label: "Task scope",
      missingLabel: "done tasks",
      complete: tasksReady,
      detail:
        tasks.length === 0
          ? "No project tasks were created, so closeout can use the main request scope."
          : tasksReady
            ? `${doneTaskCount} of ${tasks.length} project tasks are marked done.`
            : `${doneTaskCount} of ${tasks.length} project tasks are marked done.`,
    },
    {
      label: "Final amount",
      missingLabel: "final amount",
      complete: finalAmountReady,
      detail: finalAmountReady
        ? "A positive final amount is ready for the owner record."
        : "Enter the final amount or invoice total before submitting.",
    },
    {
      label: "Completion notes",
      missingLabel: "completion notes",
      complete: completionNotesReady,
      detail: completionNotesReady
        ? "Completion notes are ready for the owner handoff."
        : "Summarize what was completed and what the owner should review.",
    },
  ];
}

export function closeoutReadiness(input: CloseoutReadinessInput): CloseoutReadiness {
  const checks = closeoutReadinessChecks(input);
  const missing = checks
    .filter((check) => !check.complete)
    .map((check) => check.missingLabel);

  if (missing.length === 0) {
    return {
      ready: true,
      missing,
      detail:
        "After-photo proof, completed task scope, final amount, and completion notes are ready for owner review.",
      tone: "ready",
    };
  }

  return {
    ready: false,
    missing,
    detail: `Closeout needs ${missing.join(", ")} before it is ready for owner review.`,
    tone: missing.length > 1 ? "attention" : "progress",
  };
}
