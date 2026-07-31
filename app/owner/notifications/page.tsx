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
      <h1 className="text-3xl font-bold mb-2">🔔 Notifications</h1>
      <p className="text-sm text-gray-500 mb-6">
        Delivery history for status-change, reminder, and invite emails.
      </p>

      <div className="bg-white p-4 rounded-xl shadow">
        {entries.length === 0 ? (
          <p className="text-gray-500">No notifications yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const statusClass =
                entry.status === "sent" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
              return (
                <div key={entry.id} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <p>
                      <strong>{TYPE_LABELS[entry.type] || entry.type}</strong> — {entry.subject || ""}
                    </p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusClass}`}>
                      {entry.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    To: {entry.recipientEmail || "—"} · {new Date(entry.createdAt).toLocaleString()}
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
