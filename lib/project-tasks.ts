export const REQUEST_TASK_STATUSES = ["todo", "in_progress", "blocked", "done"] as const;

export type RequestTaskStatus = (typeof REQUEST_TASK_STATUSES)[number];

export type RequestTaskInput = {
  id?: string;
  title: string;
  description?: string | null;
  status: RequestTaskStatus;
  estimatedCost?: string | number | null;
  finalCost?: string | number | null;
  acceptedAt?: string | Date | null;
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

function costValue(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

export function requestTaskMetrics(tasks: RequestTaskInput[]): RequestTaskMetric[] {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const accepted = tasks.filter((task) => task.acceptedAt).length;
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const estimatedTotal = tasks.reduce(
    (sum, task) => sum + costValue(task.estimatedCost),
    0
  );
  const finalTotal = tasks.reduce((sum, task) => sum + costValue(task.finalCost), 0);

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
      detail: `${done} of ${total} tasks are marked done; ${accepted} accepted by owner.`,
      tone: accepted === total ? "ready" : done > accepted ? "attention" : "progress",
    },
    {
      label: "Accepted",
      value: `${accepted}/${total}`,
      detail:
        accepted === total
          ? "All tasks are owner-accepted for closeout."
          : `${total - accepted} ${total - accepted === 1 ? "task still needs" : "tasks still need"} owner acceptance before final billing.`,
      tone: accepted === total ? "ready" : "attention",
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
      label: "Task costs",
      value: money(finalTotal || estimatedTotal),
      detail:
        finalTotal > 0
          ? `${money(finalTotal)} final task cost recorded against ${money(estimatedTotal)} estimated.`
          : estimatedTotal > 0
            ? `${money(estimatedTotal)} estimated across task scope; final task costs still need review.`
            : "Add estimated or final costs to make task-level billing review easier.",
      tone: finalTotal > 0 ? "ready" : estimatedTotal > 0 ? "progress" : "attention",
    },
  ];
}
