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
      <main>
        <h1 className="mb-2 text-3xl font-bold">Maintenance calendar</h1>
        <p className="text-gray-500">
          Add a property before creating reminders.{" "}
          <Link href="/owner/properties" className="text-blue-600 underline">
            Add one now
          </Link>
          .
        </p>
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
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-gray-200 bg-white text-gray-950";

  return (
    <main>
      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-semibold text-blue-700">Preventive care</p>
          <h1 className="text-3xl font-bold text-gray-950">Maintenance calendar</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Turn repeat home care into a visible routine before small issues become
            expensive repairs.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
      <ReminderManager properties={properties} reminders={ownerReminders} />
    </main>
  );
}
