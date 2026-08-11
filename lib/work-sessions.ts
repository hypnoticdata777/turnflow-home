export const WORK_SESSION_EVENTS = ["started", "paused", "resumed", "stopped"] as const;

export type WorkSessionEvent = (typeof WORK_SESSION_EVENTS)[number];

export type WorkSessionInput = {
  event: WorkSessionEvent;
  taskLabel?: string | null;
  notes?: string | null;
  createdAt?: string | Date | null;
  proofPhotoId?: string | null;
};

export type WorkSessionProofRequirement = {
  required: boolean;
  photoType: "before" | "after" | null;
  label: string;
  detail: string;
};

export type WorkSessionGuidance = {
  label: string;
  detail: string;
  tone: "attention" | "progress" | "ready";
  primaryEvent: WorkSessionEvent;
  primaryAction: string;
};

export const WORK_SESSION_EVENT_LABELS: Record<WorkSessionEvent, string> = {
  started: "Started work",
  paused: "Paused work",
  resumed: "Resumed work",
  stopped: "Stopped work",
};

export function isWorkSessionEvent(value: string): value is WorkSessionEvent {
  return (WORK_SESSION_EVENTS as readonly string[]).includes(value);
}

export function describeWorkSessionEvent(event: WorkSessionEvent, notes?: string | null) {
  const base = WORK_SESSION_EVENT_LABELS[event];
  const trimmed = notes?.trim();
  return trimmed ? `${base}: ${trimmed}` : `${base}.`;
}

export function normalizeWorkSessionTaskLabel(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 80) : "Main repair";
}

export function workSessionProofRequirement(
  event: WorkSessionEvent
): WorkSessionProofRequirement {
  if (event === "started") {
    return {
      required: true,
      photoType: "before",
      label: "Before photo required",
      detail:
        "Take a photo of the repair or replacement area before starting so the owner record shows what work began.",
    };
  }

  if (event === "stopped") {
    return {
      required: true,
      photoType: "after",
      label: "Completion photo required",
      detail:
        "Take an after photo before stopping work so the owner can review what changed.",
    };
  }

  return {
    required: false,
    photoType: null,
    label: "Photo optional",
    detail:
      "Add a note for this event. Use the proof uploader if the owner needs a visual update.",
  };
}

function latestWorkSession(events: WorkSessionInput[]) {
  return [...events].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  )[0];
}

export function workSessionGuidance(
  events: WorkSessionInput[],
  requestStatus: string
): WorkSessionGuidance {
  if (requestStatus === "Complete") {
    return {
      label: "Work complete",
      detail: "This request is complete. Add more session events only if the record needs correction.",
      tone: "ready",
      primaryEvent: "stopped",
      primaryAction: "Record stop",
    };
  }

  const latest = latestWorkSession(events);
  if (!latest) {
    return {
      label: "Work not started",
      detail: "Start a work session when you arrive or begin the job so the owner record has a real timeline.",
      tone: "attention",
      primaryEvent: "started",
      primaryAction: "Start work",
    };
  }

  if (latest.event === "paused") {
    return {
      label: "Work paused",
      detail: "Resume when work continues, or stop when the job is ready for owner review.",
      tone: "progress",
      primaryEvent: "resumed",
      primaryAction: "Resume work",
    };
  }

  if (latest.event === "stopped") {
    return {
      label: "Work stopped",
      detail: "The owner can review proof, costs, and notes before marking the request complete.",
      tone: "ready",
      primaryEvent: "started",
      primaryAction: "Start another session",
    };
  }

  return {
    label: "Work in progress",
    detail: "Pause if work is blocked, or stop when the visit is finished and ready for owner review.",
    tone: "progress",
    primaryEvent: "stopped",
    primaryAction: "Stop work",
  };
}

export function workSessionCounts(events: WorkSessionInput[]) {
  return WORK_SESSION_EVENTS.map((event) => ({
    event,
    label: WORK_SESSION_EVENT_LABELS[event],
    count: events.filter((item) => item.event === event).length,
  }));
}
