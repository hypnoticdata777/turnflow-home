import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import {
  notificationDeliveryMetrics,
  notificationEntryGuidance,
  notificationTypeLabel,
} from "@/lib/notification-guidance";

export default async function NotificationsPage() {
  const session = await requireRole("owner");

  const entries = await db.query.notificationLog.findMany({
    where: (n, { eq }) => eq(n.ownerId, session.user.id),
    orderBy: (n, { desc }) => desc(n.createdAt),
  });
  const metrics = notificationDeliveryMetrics(entries);
  const metricClasses = (tone: (typeof metrics)[number]["tone"]) =>
    tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : tone === "attention"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : tone === "progress"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-gray-200 bg-white text-gray-950";

  return (
    <main>
      <div className="mb-6">
        <p className="text-sm font-semibold text-blue-700">Delivery log</p>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Track invite, status-change, and reminder email attempts. Failed
          attempts stay visible so owners can use in-app links or fix email
          setup before relying on outbound delivery.
        </p>
      </div>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-semibold text-blue-700">Notification health</p>
          <h2 className="text-2xl font-bold text-gray-950">
            Can owners trust outbound alerts?
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
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

      <section>
        <h2 className="mb-4 text-xl font-semibold">Delivery attempts</h2>
        {entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5">
            <p className="font-medium">No notifications yet.</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
              Invite sends, status-change emails, and reminder digests will be
              logged here after the first attempt.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const guidance = notificationEntryGuidance(entry);
              const statusClass =
                entry.status === "sent"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800";
              return (
                <article key={entry.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p>
                      <strong>{notificationTypeLabel(entry.type)}</strong> -{" "}
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
                  <div
                    className={`mt-3 rounded-lg border p-3 ${
                      guidance.tone === "ready"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                        : "border-blue-200 bg-blue-50 text-blue-950"
                    }`}
                  >
                    <p className="text-sm font-semibold">{guidance.label}</p>
                    <p className="mt-1 text-sm leading-6">{guidance.detail}</p>
                    <p className="mt-1 text-sm leading-6">{guidance.nextStep}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
