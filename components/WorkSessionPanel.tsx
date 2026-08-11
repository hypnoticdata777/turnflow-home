"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordWorkSessionEventAction } from "@/lib/actions/work-sessions";
import {
  WORK_SESSION_EVENT_LABELS,
  WORK_SESSION_EVENTS,
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
}: {
  requestId: string;
  requestStatus: string;
  events: WorkSessionData[];
}) {
  const router = useRouter();
  const guidance = workSessionGuidance(events, requestStatus);
  const [notes, setNotes] = useState("");
  const [savingEvent, setSavingEvent] = useState<WorkSessionEvent | null>(null);
  const [status, setStatus] = useState("");

  async function recordEvent(event: WorkSessionEvent) {
    setSavingEvent(event);
    setStatus(`Recording ${WORK_SESSION_EVENT_LABELS[event].toLowerCase()}...`);
    try {
      const result = await recordWorkSessionEventAction(requestId, event, notes);
      if ("error" in result) {
        setStatus(result.error);
        return;
      }
      setNotes("");
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
