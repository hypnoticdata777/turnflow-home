import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { ownerCalendarValueMetrics } from "@/lib/owner-readiness";
import { ReminderManager } from "@/components/ReminderManager";

export default async function CalendarPage() {
  const session = await requireRole("owner");

  const ownerProperties = await db.query.properties.findMany({
    where: (p, { eq }) => eq(p.ownerId, session.user.id),
    orderBy: (p, { desc }) => desc(p.createdAt),
  });

  if (ownerProperties.length === 0) {
    return (
      <main className="max-w-5xl">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-950 p-5 text-white">
            <p className="text-sm font-semibold text-emerald-300">Preventive care</p>
            <h1 className="mt-2 text-3xl font-bold">Maintenance calendar</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
              A property has to exist before you can schedule recurring home care.
            </p>
            <Link
              href="/owner/properties"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-md active:translate-y-0"
            >
              Add a property
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const propertyIds = ownerProperties.map((p) => p.id);
  const ownerReminders = await db.query.reminders.findMany({
    where: (r, { inArray }) => inArray(r.propertyId, propertyIds),
    orderBy: (r, { asc }) => asc(r.nextDueAt),
  });

  const properties = ownerProperties.map((p) => ({
    id: p.id,
    label: p.nickname ? `${p.nickname} - ${p.address}` : p.address,
  }));
  const valueMetrics = ownerCalendarValueMetrics({
    properties: ownerProperties,
    reminders: ownerReminders,
  });
  const metricClasses = (tone: (typeof valueMetrics)[number]["tone"]) =>
    tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : tone === "attention"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : tone === "progress"
          ? "border-cyan-200 bg-cyan-50 text-cyan-950"
          : "border-gray-200 bg-white text-gray-950";

  return (
    <main className="max-w-6xl">
      <section className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-5 text-white">
          <p className="text-sm font-semibold text-emerald-300">Preventive care</p>
          <h1 className="mt-2 text-3xl font-bold">Maintenance calendar</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
            Turn repeat home care into a visible routine before small issues become
            expensive repairs.
          </p>
          <Link
            href="#reminders"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-md active:translate-y-0"
          >
            Add a reminder
          </Link>
        </div>
        <div className="grid gap-3 border-t border-slate-200 p-5 md:grid-cols-2 xl:grid-cols-4">
          {valueMetrics.map((metric) => (
            <article
              key={metric.label}
              className={`rounded-lg border p-4 ${metricClasses(metric.tone)}`}
            >
              <p className="text-sm font-semibold">{metric.label}</p>
              <p className="mt-2 text-3xl font-bold">{metric.value}</p>
              <p className="mt-2 min-h-20 text-sm leading-6">{metric.detail}</p>
            </article>
          ))}
        </div>
      </section>
      <div id="reminders" className="scroll-mt-6">
        <ReminderManager properties={properties} reminders={ownerReminders} />
      </div>
    </main>
  );
}
