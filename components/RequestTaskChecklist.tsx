"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  acceptRequestTaskAction,
  createRequestTaskAction,
  deleteRequestTaskAction,
  updateRequestTaskCostAction,
  updateRequestTaskStatusAction,
} from "@/lib/actions/request-tasks";
import {
  REQUEST_TASK_STATUSES,
  REQUEST_TASK_STATUS_LABELS,
  requestTaskMetrics,
  type RequestTaskStatus,
} from "@/lib/project-tasks";

export type RequestTaskData = {
  id: string;
  title: string;
  description: string | null;
  status: RequestTaskStatus;
  estimatedCost: string | null;
  finalCost: string | null;
  acceptedAt: string | Date | null;
  requiredPhotoTypes: string[];
};

const METRIC_CLASSES = {
  attention: "border-blue-200 bg-blue-50 text-blue-950",
  progress: "border-amber-200 bg-amber-50 text-amber-950",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-950",
};

const STATUS_CLASSES: Record<RequestTaskStatus, string> = {
  todo: "bg-gray-100 text-gray-700",
  in_progress: "bg-amber-100 text-amber-800",
  blocked: "bg-red-100 text-red-700",
  done: "bg-emerald-100 text-emerald-700",
};

const PHOTO_TYPES = ["before", "after", "receipt", "other"] as const;

export function RequestTaskChecklist({
  requestId,
  tasks,
  mode,
  id = "project-tasks",
}: {
  requestId: string;
  tasks: RequestTaskData[];
  mode: "owner" | "vendor";
  id?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [finalCost, setFinalCost] = useState("");
  const [selectedProof, setSelectedProof] = useState<string[]>(["before", "after"]);
  const [status, setStatus] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const metrics = requestTaskMetrics(tasks);
  const canEditScope = mode === "owner";

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Adding task...");
    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("estimatedCost", estimatedCost);
    formData.set("finalCost", finalCost);
    for (const proofType of selectedProof) {
      formData.set(`proof_${proofType}`, "on");
    }

    const result = await createRequestTaskAction(requestId, formData);
    if ("error" in result) {
      setStatus(result.error);
      return;
    }
    setTitle("");
    setDescription("");
    setEstimatedCost("");
    setFinalCost("");
    setSelectedProof(["before", "after"]);
    setStatus("Task added.");
    router.refresh();
  }

  async function updateStatus(taskId: string, nextStatus: RequestTaskStatus) {
    setActingId(taskId);
    setStatus("Updating task...");
    const result = await updateRequestTaskStatusAction(requestId, taskId, nextStatus);
    if ("error" in result) {
      setStatus(result.error);
      setActingId(null);
      return;
    }
    setStatus("Task updated.");
    setActingId(null);
    router.refresh();
  }

  async function updateCost(taskId: string, formData: FormData) {
    setActingId(taskId);
    setStatus("Saving task costs...");
    const result = await updateRequestTaskCostAction(requestId, taskId, formData);
    if ("error" in result) {
      setStatus(result.error);
      setActingId(null);
      return;
    }
    setStatus("Task costs saved.");
    setActingId(null);
    router.refresh();
  }

  async function acceptTask(taskId: string) {
    setActingId(taskId);
    setStatus("Accepting task...");
    const result = await acceptRequestTaskAction(requestId, taskId);
    if ("error" in result) {
      setStatus(result.error);
      setActingId(null);
      return;
    }
    setStatus("Task accepted for closeout.");
    setActingId(null);
    router.refresh();
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Delete this project task? Its past work-session history stays in the record.")) {
      return;
    }
    setActingId(taskId);
    setStatus("Deleting task...");
    const result = await deleteRequestTaskAction(requestId, taskId);
    if ("error" in result) {
      setStatus(result.error);
      setActingId(null);
      return;
    }
    setStatus("Task deleted.");
    setActingId(null);
    router.refresh();
  }

  function toggleProof(type: string) {
    setSelectedProof((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  }

  function formatCost(value: string | null) {
    if (value == null) return null;
    const amount = Number(value);
    return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : null;
  }

  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Project tasks</p>
          <h2 className="text-xl font-semibold">Task checklist</h2>
        </div>
        <p className="text-sm font-medium text-gray-700">{tasks.length} tasks</p>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className={`rounded-lg border p-3 ${METRIC_CLASSES[metric.tone]}`}
          >
            <p className="text-xs font-semibold uppercase">{metric.label}</p>
            <p className="mt-1 text-2xl font-bold">{metric.value}</p>
            <p className="mt-1 text-sm leading-6">{metric.detail}</p>
          </article>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <p className="font-semibold">No project tasks yet</p>
          <p className="mt-1 leading-6">
            Single repairs can stay as one main repair. Add tasks when the job
            has phases, rooms, trades, or proof checkpoints.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <article key={task.id} className="rounded-lg border border-gray-200 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold">{task.title}</h3>
                  {task.description && (
                    <p className="mt-1 text-sm leading-6 text-gray-600">{task.description}</p>
                  )}
                </div>
                <span
                  className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${STATUS_CLASSES[task.status]}`}
                >
                  {REQUEST_TASK_STATUS_LABELS[task.status]}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {formatCost(task.estimatedCost) && (
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800">
                    Est. {formatCost(task.estimatedCost)}
                  </span>
                )}
                {formatCost(task.finalCost) && (
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                    Final {formatCost(task.finalCost)}
                  </span>
                )}
                {task.acceptedAt && (
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                    Owner accepted
                  </span>
                )}
                {task.requiredPhotoTypes.length > 0 ? (
                  task.requiredPhotoTypes.map((type) => (
                    <span
                      key={type}
                      className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium capitalize text-gray-700"
                    >
                      {type} proof
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">No proof types planned</span>
                )}
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="text-sm font-medium">
                  Task status
                  <select
                    value={task.status}
                    disabled={actingId === task.id}
                    onChange={(event) =>
                      updateStatus(task.id, event.target.value as RequestTaskStatus)
                    }
                    className="mt-1 w-full rounded border bg-white p-2 sm:w-48"
                  >
                    {REQUEST_TASK_STATUSES.map((taskStatus) => (
                      <option key={taskStatus} value={taskStatus}>
                        {REQUEST_TASK_STATUS_LABELS[taskStatus]}
                      </option>
                    ))}
                  </select>
                </label>
                {canEditScope && (
                  <>
                    {task.status === "done" && !task.acceptedAt && (
                      <button
                        type="button"
                        disabled={actingId === task.id}
                        onClick={() => acceptTask(task.id)}
                        className="inline-flex w-fit items-center justify-center rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition-transform duration-150 hover:scale-105 hover:bg-emerald-800 active:scale-95 disabled:opacity-50"
                      >
                        Accept task
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={actingId === task.id}
                      onClick={() => deleteTask(task.id)}
                      className="inline-flex w-fit items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-transform duration-150 hover:scale-105 hover:border-red-300 hover:bg-red-100 active:scale-95 disabled:opacity-50"
                    >
                      Delete task
                    </button>
                  </>
                )}
              </div>

              {canEditScope && (
                <form
                  action={(formData) => updateCost(task.id, formData)}
                  className="mt-3 grid gap-2 rounded-md border border-gray-100 bg-gray-50 p-2 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <label className="text-sm font-medium">
                    Estimated
                    <input
                      name="estimatedCost"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={task.estimatedCost ?? ""}
                      className="mt-1 w-full rounded border bg-white p-2 text-sm"
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Final
                    <input
                      name="finalCost"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={task.finalCost ?? ""}
                      className="mt-1 w-full rounded border bg-white p-2 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={actingId === task.id}
                    className="self-end rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 transition-transform duration-150 hover:scale-105 hover:border-gray-400 hover:bg-gray-100 active:scale-95 disabled:opacity-50"
                  >
                    Save costs
                  </button>
                </form>
              )}
            </article>
          ))}
        </div>
      )}

      {canEditScope && (
        <form onSubmit={addTask} className="mt-4 space-y-3 rounded-lg border border-gray-200 p-3">
          <h3 className="text-sm font-semibold">Add project task</h3>
          <label className="block text-sm font-medium">
            Task title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="Example: Remove old vanity"
              className="mt-1 w-full rounded border p-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium">
            Task notes
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Optional scope, materials, or acceptance notes."
              className="mt-1 w-full rounded border p-2 text-sm"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Estimated cost
              <input
                value={estimatedCost}
                onChange={(event) => setEstimatedCost(event.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="mt-1 w-full rounded border p-2 text-sm"
              />
            </label>
            <label className="block text-sm font-medium">
              Final cost
              <input
                value={finalCost}
                onChange={(event) => setFinalCost(event.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="Optional after work is done"
                className="mt-1 w-full rounded border p-2 text-sm"
              />
            </label>
          </div>
          <fieldset>
            <legend className="text-sm font-medium">Expected proof</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {PHOTO_TYPES.map((type) => (
                <label key={type} className="inline-flex items-center gap-2 text-sm capitalize">
                  <input
                    type="checkbox"
                    checked={selectedProof.includes(type)}
                    onChange={() => toggleProof(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="submit"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-transform duration-150 hover:scale-105 hover:bg-blue-900 active:scale-95"
          >
            Add task
          </button>
        </form>
      )}

      {status && <p className="mt-3 text-sm font-medium text-gray-700">{status}</p>}
    </section>
  );
}
