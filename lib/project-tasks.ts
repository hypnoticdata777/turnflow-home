export const REQUEST_TASK_STATUSES = ["todo", "in_progress", "blocked", "done"] as const;

export type RequestTaskStatus = (typeof REQUEST_TASK_STATUSES)[number];

export type RequestTaskInput = {
  id?: string;
  title: string;
  description?: string | null;
  status: RequestTaskStatus;
  requiredPhotoTypes?: string[] | null;
};

export type RequestTaskMetric = {
  label: string;
  value: string;
  detail: string;
  tone: "attention" | "progress" | "ready";
};

export const REQUEST_TASK_STATUS_LABELS: Record<RequestTaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export function isRequestTaskStatus(value: string): value is RequestTaskStatus {
  return (REQUEST_TASK_STATUSES as readonly string[]).includes(value);
}

export function normalizeRequestTaskTitle(value: string) {
  return value.trim().slice(0, 120);
}

export function requestTaskMetrics(tasks: RequestTaskInput[]): RequestTaskMetric[] {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;
  const proofReady = tasks.filter((task) => (task.requiredPhotoTypes ?? []).length > 0).length;

  if (total === 0) {
    return [
      {
        label: "Project tasks",
        value: "0",
        detail:
          "Add tasks for multi-step jobs so vendors can track each phase with time and proof.",
        tone: "attention",
      },
    ];
  }

  return [
    {
      label: "Project tasks",
      value: `${done}/${total}`,
      detail: `${done} of ${total} tasks are marked done.`,
      tone: done === total ? "ready" : "progress",
    },
    {
      label: "In motion",
      value: String(inProgress),
      detail:
        inProgress > 0
          ? `${inProgress} task ${inProgress === 1 ? "is" : "are"} currently in progress.`
          : "No task is actively in progress right now.",
      tone: inProgress > 0 ? "progress" : "attention",
    },
    {
      label: "Blocked",
      value: String(blocked),
      detail:
        blocked > 0
          ? `${blocked} task ${blocked === 1 ? "needs" : "need"} owner/vendor follow-up.`
          : "No tasks are blocked.",
      tone: blocked > 0 ? "attention" : "ready",
    },
    {
      label: "Proof planned",
      value: `${proofReady}/${total}`,
      detail:
        proofReady > 0
          ? "Some tasks already name expected proof types."
          : "Add expected proof types when a task needs before, after, receipt, or other evidence.",
      tone: proofReady > 0 ? "ready" : "attention",
    },
  ];
}
