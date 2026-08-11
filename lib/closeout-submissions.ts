export type CloseoutReadinessInput = {
  photos?: Array<{ type: string }> | null;
  tasks?: Array<{ status: string }> | null;
  finalAmount?: string | number | null;
};

export type CloseoutReadiness = {
  ready: boolean;
  missing: string[];
  detail: string;
  tone: "attention" | "progress" | "ready";
};

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

export function closeoutReadiness(input: CloseoutReadinessInput): CloseoutReadiness {
  const missing = [];
  if (!hasAfterPhoto(input)) missing.push("after photo");
  if (!allTasksDone(input)) missing.push("done tasks");
  if (!parseCloseoutAmount(input.finalAmount ?? null)) missing.push("final amount");

  if (missing.length === 0) {
    return {
      ready: true,
      missing,
      detail:
        "After-photo proof, completed task scope, and final amount are ready for owner review.",
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
