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
          : "border-amber-200 bg-amber-50 text-amber-950";
  const buttonClasses =
    guidance.tone === "ready"
      ? "bg-emerald-800"
      : guidance.tone === "empty"
        ? "bg-gray-800"
        : guidance.tone === "attention"
          ? "bg-blue-800"
          : "bg-amber-800";
  const stats = [
    { label: labels.total, value: guidance.stats.totalCount },
    { label: labels.active, value: guidance.stats.activeCount },
    { label: labels.attention, value: guidance.attentionCount },
    { label: labels.complete, value: guidance.stats.completeCount },
  ];

  return (
    <section id="helper-workspace" className={`rounded-lg border p-5 shadow-sm ${toneClasses}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold">{guidance.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold">{guidance.headline}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6">{guidance.detail}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={guidance.primaryHref}
            className={`inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium text-white ${buttonClasses}`}
          >
            {guidance.primaryCta}
          </a>
          <a
            href={guidance.secondaryHref}
            className="inline-flex items-center justify-center rounded border border-current bg-white/75 px-4 py-2 text-sm font-medium"
          >
            {guidance.secondaryCta}
          </a>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border border-current/20 bg-white/75 p-3">
            <p className="text-xs font-medium uppercase text-current/70">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
