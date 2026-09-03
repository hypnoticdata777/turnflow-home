import type { HelperOnboardingItem, HelperRole } from "@/lib/helper-workspace";

const statusCopy: Record<HelperOnboardingItem["status"], string> = {
  available: "Available",
  focus: "Focus",
  waiting: "Waiting",
};

const statusClasses: Record<HelperOnboardingItem["status"], string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-900",
  focus: "border-blue-200 bg-blue-50 text-blue-900",
  waiting: "border-gray-200 bg-gray-50 text-gray-600",
};

export function HelperOnboardingChecklist({
  role,
  items,
}: {
  role: HelperRole;
  items: HelperOnboardingItem[];
}) {
  const roleLabel = role === "vendor" ? "vendor" : "collaborator";

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-950 p-5 text-white sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-200">
            First run checklist
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Work like a trusted {roleLabel}.
          </h2>
        </div>
        <a
          href="#helper-requests"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
        >
          Go to work
        </a>
      </div>

      <ol className="grid gap-px bg-slate-200 md:grid-cols-3">
        {items.map((item, index) => (
          <li key={item.title} className="bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700">
                {index + 1}
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClasses[item.status]}`}
              >
                {statusCopy[item.status]}
              </span>
            </div>
            <h3 className="mt-4 font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-1 min-h-12 text-sm leading-6 text-slate-600">{item.detail}</p>
            <a
              href={item.href}
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition duration-150 hover:-translate-y-0.5 hover:bg-black active:translate-y-0 active:scale-[0.99]"
            >
              {item.cta}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
