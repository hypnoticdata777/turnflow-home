import {
  WORK_SESSION_EVENT_LABELS,
  workSessionCounts,
  type WorkSessionEvent,
  type WorkSessionInput,
} from "@/lib/work-sessions";

export type WorkSessionData = WorkSessionInput & {
  id: string;
  event: WorkSessionEvent;
  notes: string | null;
  createdAt: string | Date;
};

const EVENT_CLASSES: Record<WorkSessionEvent, string> = {
  started: "border-emerald-200 bg-emerald-50 text-emerald-950",
  paused: "border-amber-200 bg-amber-50 text-amber-950",
  resumed: "border-sky-200 bg-sky-50 text-sky-950",
  stopped: "border-blue-200 bg-blue-50 text-blue-950",
};

export function WorkSessionTimeline({
  events,
  id = "work-sessions",
}: {
  events: WorkSessionData[];
  id?: string;
}) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const counts = workSessionCounts(events);

  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Work timeline</p>
          <h2 className="text-xl font-semibold">Vendor work sessions</h2>
        </div>
        <p className="text-sm font-medium text-gray-700">{events.length} events</p>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map((item) => (
          <div key={item.event} className={`rounded-lg border p-3 ${EVENT_CLASSES[item.event]}`}>
            <p className="text-xs font-semibold uppercase">{item.label}</p>
            <p className="mt-1 text-2xl font-bold">{item.count}</p>
          </div>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <p className="font-semibold">No work sessions yet</p>
          <p className="mt-1 leading-6">
            Start, pause, resume, and stop events will appear here once the
            assigned vendor records job activity.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((event) => (
            <article key={event.id} className={`rounded-lg border p-3 ${EVENT_CLASSES[event.event]}`}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <p className="font-semibold">{WORK_SESSION_EVENT_LABELS[event.event]}</p>
                <time className="text-xs font-medium">
                  {new Date(event.createdAt).toLocaleString()}
                </time>
              </div>
              <p className="mt-1 text-sm leading-6">
                {event.notes || "No notes recorded for this event."}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
