import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
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
        <h1 className="text-3xl font-bold mb-2">📅 Maintenance Calendar</h1>
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
    label: p.nickname ? `${p.nickname} — ${p.address}` : p.address,
  }));

  return (
    <main>
      <ReminderManager properties={properties} reminders={ownerReminders} />
    </main>
  );
}
