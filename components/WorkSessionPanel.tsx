"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { recordWorkSessionEventAction } from "@/lib/actions/work-sessions";
import { recordRequestPhotoAction } from "@/lib/actions/requests";
import { requestPhotoPath } from "@/lib/blob-paths";
import {
  WORK_SESSION_EVENT_LABELS,
  WORK_SESSION_EVENTS,
  workSessionEventReadiness,
  workSessionProofRequirement,
  workSessionGuidance,
  type WorkSessionEvent,
} from "@/lib/work-sessions";
import { WorkSessionTimeline, type WorkSessionData } from "@/components/WorkSessionTimeline";
import type { RequestTaskData } from "@/components/RequestTaskChecklist";

const GUIDANCE_CLASSES = {
  attention: "border-blue-200 bg-blue-50 text-blue-950",
  progress: "border-amber-200 bg-amber-50 text-amber-950",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-950",
};

export function WorkSessionPanel({
  requestId,
  requestStatus,
  events,
  userId,
  tasks,
  id,
}: {
  requestId: string;
  requestStatus: string;
  events: WorkSessionData[];
  userId: string;
  tasks: RequestTaskData[];
  id?: string;
}) {
  const router = useRouter();
  const guidance = workSessionGuidance(events, requestStatus);
  const [taskLabel, setTaskLabel] = useState("Main repair");
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [savingEvent, setSavingEvent] = useState<WorkSessionEvent | null>(null);
  const [status, setStatus] = useState("");
  const eventReadiness = WORK_SESSION_EVENTS.map((event) =>
    workSessionEventReadiness({ event, hasProofFile: Boolean(proofFile) })
  );
  const primaryReadiness = eventReadiness.find(
    (item) => item.event === guidance.primaryEvent
  );

  async function recordEvent(event: WorkSessionEvent) {
    const proofRequirement = workSessionProofRequirement(event);
    if (proofRequirement.required && !proofFile) {
      setStatus(`${proofRequirement.label}. Add the required photo before recording this event.`);
      return;
    }

    setSavingEvent(event);
    setStatus(`Recording ${WORK_SESSION_EVENT_LABELS[event].toLowerCase()}...`);
    try {
      let proofPhotoId: string | null = null;
      if (proofFile) {
        const photoType = proofRequirement.photoType ?? "other";
        setStatus(`Uploading ${photoType} proof...`);
        const pathname = requestPhotoPath(requestId, photoType, userId, proofFile.name);
        const blob = await upload(pathname, proofFile, {
          access: "public",
          handleUploadUrl: "/api/blob-upload",
        });
        const photo = await recordRequestPhotoAction(
          requestId,
          photoType,
          blob.url,
          blob.pathname
        );
        proofPhotoId = photo.photoId;
      }

      setStatus(`Recording ${WORK_SESSION_EVENT_LABELS[event].toLowerCase()}...`);
      const result = await recordWorkSessionEventAction(
        requestId,
        event,
        notes,
        taskLabel,
        proofPhotoId,
        taskId || null
      );
      if ("error" in result) {
        setStatus(result.error);
        return;
      }
      setNotes("");
      setProofFile(null);
      setStatus(`${WORK_SESSION_EVENT_LABELS[event]} recorded.`);
      router.refresh();
    } catch (error) {
      console.error("Failed to record work session event:", error);
      setStatus("Failed to record work event. Please try again.");
    } finally {
      setSavingEvent(null);
    }
  }

  return (
    <section id={id} className="mt-4 scroll-mt-6 rounded-lg border border-gray-200 bg-white p-4">
      <div className={`mb-4 rounded-lg border p-3 ${GUIDANCE_CLASSES[guidance.tone]}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Work session</p>
            <h4 className="mt-1 text-base font-semibold">{guidance.label}</h4>
            <p className="mt-1 text-sm leading-6">{guidance.detail}</p>
          </div>
          <button
            type="button"
            disabled={savingEvent !== null || primaryReadiness?.blocked}
            onClick={() => recordEvent(guidance.primaryEvent)}
            title={primaryReadiness?.blocked ? primaryReadiness.detail : undefined}
            className="inline-flex w-fit items-center justify-center rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guidance.primaryAction}
          </button>
        </div>
      </div>

      {tasks.length > 0 ? (
        <label className="block text-sm font-medium">
          Project task
          <select
            value={taskId}
            onChange={(event) => {
              setTaskId(event.target.value);
              const selectedTask = tasks.find((task) => task.id === event.target.value);
              setTaskLabel(selectedTask?.title ?? "Main repair");
            }}
            className="mt-1 mb-3 w-full rounded border bg-white p-2 text-sm"
          >
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="block text-sm font-medium">
          Task or area
          <input
            type="text"
            value={taskLabel}
            onChange={(event) => setTaskLabel(event.target.value)}
            maxLength={80}
            placeholder="Main repair, demo, plumbing, paint touch-up..."
            className="mt-1 mb-3 w-full rounded border p-2 text-sm"
          />
        </label>
      )}

      <label className="block text-sm font-medium">
        Session note
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Optional: what started, why it paused, what changed, or what the owner should review."
          className="mt-1 w-full rounded border p-2 text-sm"
        />
      </label>

      <label className="mt-3 block text-sm font-medium">
        Session proof photo
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm"
        />
      </label>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        Starting work requires a before photo. Stopping work requires an after
        photo. Pause and resume notes can include a photo when useful.
      </p>
      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="text-sm font-semibold text-gray-950">Proof gate</p>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          {proofFile
            ? `Selected proof: ${proofFile.name}. Start will save it as before proof; stop will save it as after proof.`
            : "Select a proof photo before using Start work or Stop work. Pause and resume can be recorded with notes only."}
        </p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        {eventReadiness.map((readiness) => (
          <div key={readiness.event} className="rounded border border-gray-200 bg-white p-2">
            <button
              type="button"
              disabled={savingEvent !== null || readiness.blocked}
              onClick={() => recordEvent(readiness.event)}
              title={readiness.blocked ? readiness.detail : undefined}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingEvent === readiness.event ? "Recording..." : readiness.label}
            </button>
            <p className="mt-2 text-xs leading-5 text-gray-600">{readiness.detail}</p>
          </div>
        ))}
      </div>

      {status && <p className="mt-3 text-sm font-medium text-gray-700">{status}</p>}

      <div className="mt-4 border-t pt-4">
        <WorkSessionTimeline events={events} id={`work-sessions-${requestId}`} />
      </div>
    </section>
  );
}
