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
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            First run checklist
          </p>
          <h2 className="mt-1 text-xl font-semibold text-gray-950">
            Work like a trusted {roleLabel}.
          </h2>
        </div>
        <a
          href="#helper-requests"
          className="inline-flex items-center justify-center rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Go to work
        </a>
      </div>

      <ol className="mt-4 divide-y divide-gray-100 border-y border-gray-100">
        {items.map((item, index) => (
          <li key={item.title} className="grid gap-3 py-4 sm:grid-cols-[2rem_1fr_auto]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-sm font-semibold text-gray-700">
              {index + 1}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-gray-950">{item.title}</h3>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClasses[item.status]}`}
                >
                  {statusCopy[item.status]}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-gray-600">{item.detail}</p>
            </div>
            <a
              href={item.href}
              className="inline-flex items-center justify-center self-start rounded bg-gray-950 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              {item.cta}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
