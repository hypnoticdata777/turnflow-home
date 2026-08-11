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
  workSessionProofRequirement,
  workSessionGuidance,
  type WorkSessionEvent,
} from "@/lib/work-sessions";
import { WorkSessionTimeline, type WorkSessionData } from "@/components/WorkSessionTimeline";

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
}: {
  requestId: string;
  requestStatus: string;
  events: WorkSessionData[];
  userId: string;
}) {
  const router = useRouter();
  const guidance = workSessionGuidance(events, requestStatus);
  const [taskLabel, setTaskLabel] = useState("Main repair");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [savingEvent, setSavingEvent] = useState<WorkSessionEvent | null>(null);
  const [status, setStatus] = useState("");

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
        proofPhotoId
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
    <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className={`mb-4 rounded-lg border p-3 ${GUIDANCE_CLASSES[guidance.tone]}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Work session</p>
            <h4 className="mt-1 text-base font-semibold">{guidance.label}</h4>
            <p className="mt-1 text-sm leading-6">{guidance.detail}</p>
          </div>
          <button
            type="button"
            disabled={savingEvent !== null}
            onClick={() => recordEvent(guidance.primaryEvent)}
            className="inline-flex w-fit items-center justify-center rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {guidance.primaryAction}
          </button>
        </div>
      </div>

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

      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        {WORK_SESSION_EVENTS.map((event) => (
          <button
            key={event}
            type="button"
            disabled={savingEvent !== null}
            onClick={() => recordEvent(event)}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {savingEvent === event ? "Recording..." : WORK_SESSION_EVENT_LABELS[event]}
          </button>
        ))}
      </div>

      {status && <p className="mt-3 text-sm font-medium text-gray-700">{status}</p>}

      <div className="mt-4 border-t pt-4">
        <WorkSessionTimeline events={events} id={`work-sessions-${requestId}`} />
      </div>
    </section>
  );
}
