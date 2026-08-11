import {
  vendorLifecycleStages,
  vendorLifecycleSummary,
  type VendorLifecycleRequest,
  type VendorLifecycleStageStatus,
} from "@/lib/vendor-lifecycle";

const summaryClasses: Record<ReturnType<typeof vendorLifecycleSummary>["tone"], string> = {
  attention: "border-red-200 bg-red-50 text-red-950",
  progress: "border-blue-200 bg-blue-50 text-blue-950",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-950",
};

const stageClasses: Record<VendorLifecycleStageStatus, string> = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-950",
  current: "border-blue-200 bg-blue-50 text-blue-950",
  blocked: "border-red-200 bg-red-50 text-red-950",
  upcoming: "border-gray-200 bg-gray-50 text-gray-600",
};

const statusLabels: Record<VendorLifecycleStageStatus, string> = {
  done: "Done",
  current: "Current",
  blocked: "Blocked",
  upcoming: "Queued",
};

export function VendorLifecycleTracker({
  request,
}: {
  request: VendorLifecycleRequest;
}) {
  const stages = vendorLifecycleStages(request);
  const summary = vendorLifecycleSummary(request);

  return (
    <section className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
      <div
        className={`rounded-lg border p-3 ${summaryClasses[summary.tone]}`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Vendor lifecycle</p>
            <p className="mt-1 text-sm leading-6">{summary.detail}</p>
          </div>
          <div className="shrink-0 text-sm font-semibold">
            {summary.completedCount}/{summary.totalCount} steps
          </div>
        </div>
        <p className="mt-2 text-sm font-medium">Next: {summary.nextAction}</p>
      </div>

      <ol className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {stages.map((stage) => (
          <li
            key={stage.key}
            className={`rounded-lg border p-3 ${stageClasses[stage.status]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold">{stage.label}</p>
              <span className="rounded-full border border-current px-2 py-0.5 text-xs font-medium">
                {statusLabels[stage.status]}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5">{stage.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
