import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";

const TYPE_LABELS: Record<string, string> = {
  status_change: "Status change",
  vendor_invite: "Vendor invite",
  reminder_due: "Maintenance reminder",
};

export default async function NotificationsPage() {
  const session = await requireRole("owner");

  const entries = await db.query.notificationLog.findMany({
    where: (n, { eq }) => eq(n.ownerId, session.user.id),
    orderBy: (n, { desc }) => desc(n.createdAt),
  });

  return (
    <main>
      <h1 className="mb-2 text-3xl font-bold">Notifications</h1>
      <p className="mb-6 text-sm text-gray-500">
        Delivery history for status-change, reminder, and invite emails.
      </p>

      <div className="rounded-xl bg-white p-4 shadow">
        {entries.length === 0 ? (
          <p className="text-gray-500">No notifications yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const statusClass =
                entry.status === "sent"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800";
              return (
                <div key={entry.id} className="rounded border p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p>
                      <strong>{TYPE_LABELS[entry.type] || entry.type}</strong> -{" "}
                      {entry.subject || ""}
                    </p>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass}`}>
                      {entry.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    To: {entry.recipientEmail || "Not recorded"} -{" "}
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                  {entry.error && <p className="text-sm text-red-600">{entry.error}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
