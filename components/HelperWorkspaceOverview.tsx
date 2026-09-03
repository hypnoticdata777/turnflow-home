import type { HelperWorkspaceGuidance } from "@/lib/helper-workspace";

export function HelperWorkspaceOverview({
  guidance,
  labels,
}: {
  guidance: HelperWorkspaceGuidance;
  labels: {
    total: string;
    active: string;
    attention: string;
    complete: string;
  };
}) {
  const toneClasses =
    guidance.tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : guidance.tone === "empty"
        ? "border-gray-200 bg-white text-gray-950"
        : guidance.tone === "attention"
          ? "border-blue-200 bg-blue-50 text-blue-950"
          : "border-sky-200 bg-sky-50 text-sky-950";
  const buttonClasses =
    guidance.tone === "ready"
      ? "bg-emerald-800 hover:bg-emerald-900"
      : guidance.tone === "empty"
        ? "bg-gray-900 hover:bg-black"
        : guidance.tone === "attention"
          ? "bg-blue-800 hover:bg-blue-900"
          : "bg-sky-800 hover:bg-sky-900";
  const stats = [
    { label: labels.total, value: guidance.stats.totalCount },
    { label: labels.active, value: guidance.stats.activeCount },
    { label: labels.attention, value: guidance.attentionCount },
    { label: labels.complete, value: guidance.stats.completeCount },
  ];

  return (
    <section
      id="helper-workspace"
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <div className={`border-b p-5 ${toneClasses}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold">{guidance.eyebrow}</p>
            <h2 className="mt-1 text-2xl font-bold">{guidance.headline}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6">{guidance.detail}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={guidance.primaryHref}
              className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99] ${buttonClasses}`}
            >
              {guidance.primaryCta}
            </a>
            <a
              href={guidance.secondaryHref}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-current bg-white/80 px-4 py-2 text-sm font-semibold transition duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
            >
              {guidance.secondaryCta}
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-950">{stat.value}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-950"
                style={{ width: stat.value > 0 ? "100%" : "12%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
