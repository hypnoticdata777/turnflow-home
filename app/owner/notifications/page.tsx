import { requireRole } from "@/lib/auth/dal";
import { sendTestNotificationAction } from "@/lib/actions/notifications";
import { db } from "@/lib/db";
import {
  notificationDeliveryMetrics,
  notificationEntryGuidance,
  notificationOpsChecks,
  notificationTypeLabel,
} from "@/lib/notification-guidance";

export default async function NotificationsPage() {
  const session = await requireRole("owner");

  const entries = await db.query.notificationLog.findMany({
    where: (n, { eq }) => eq(n.ownerId, session.user.id),
    orderBy: (n, { desc }) => desc(n.createdAt),
  });
  const metrics = notificationDeliveryMetrics(entries);
  const opsChecks = notificationOpsChecks(
    {
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      NOTIFICATIONS_FROM_EMAIL: process.env.NOTIFICATIONS_FROM_EMAIL,
      CRON_SECRET: process.env.CRON_SECRET,
    },
    entries
  );
  const sentCount = entries.filter((entry) => entry.status === "sent").length;
  const failedCount = entries.filter((entry) => entry.status === "failed").length;
  const visibleEntries = entries.slice(0, 20);
  const hiddenEntryCount = Math.max(0, entries.length - visibleEntries.length);
  const metricClasses = (tone: (typeof metrics)[number]["tone"]) =>
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
          <p className="text-sm font-semibold text-emerald-300">Notification health</p>
          <h1 className="mt-2 text-3xl font-bold">Notifications</h1>
          <p className="mt-3 text-lg font-semibold">Can owners trust outbound alerts?</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
            Every invite, status-change, and reminder email attempt is logged. Failed
            attempts stay visible so owners can fall back to in-app links or fix email
            setup before relying on outbound delivery.
          </p>
          <form action={sendTestNotificationAction} className="mt-5">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-md active:translate-y-0"
            >
              Send test email
            </button>
          </form>
        </div>
        <div className="grid gap-3 border-t border-slate-200 p-5 md:grid-cols-2 xl:grid-cols-4">
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

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-normal text-blue-800">
            Launch checks
          </p>
          <h2 className="mt-1 text-xl font-semibold">Email and reminder automation</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            These checks read environment posture and logged attempts without showing
            secret values. Use the test email after Resend is configured.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {opsChecks.map((check) => (
            <article
              key={check.label}
              className={`rounded-lg border p-4 ${metricClasses(check.tone)}`}
            >
              <p className="text-sm font-semibold">{check.label}</p>
              <p className="mt-2 text-2xl font-bold">{check.value}</p>
              <p className="mt-2 min-h-20 text-sm leading-6">{check.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-xl font-semibold">Delivery attempts</h2>
          {entries.length > 0 && (
            <p className="text-sm text-gray-600">
              {sentCount} delivered &middot; {failedCount} failed
              {hiddenEntryCount > 0 ? ` - showing latest ${visibleEntries.length}` : ""}
            </p>
          )}
        </div>
        {entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5">
            <p className="font-semibold">No notifications yet.</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
              Invite sends, status-change emails, and reminder digests will be
              logged here after the first attempt.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleEntries.map((entry) => {
              const guidance = notificationEntryGuidance(entry);
              const delivered = entry.status === "sent";
              const statusClass = delivered
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800";
              return (
                <article
                  key={entry.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p className="font-semibold text-gray-950">
                      {notificationTypeLabel(entry.type)}
                      {entry.subject ? (
                        <span className="font-normal text-gray-600"> &middot; {entry.subject}</span>
                      ) : null}
                    </p>
                    <span
                      className={`w-fit rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusClass}`}
                    >
                      {entry.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    To: {entry.recipientEmail || "Not recorded"} &middot;{" "}
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                  {entry.error && <p className="mt-1 text-sm text-rose-600">{entry.error}</p>}
                  <div
                    className={`mt-3 rounded-lg border p-3 ${
                      guidance.tone === "ready"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                        : "border-blue-200 bg-blue-50 text-blue-950"
                    }`}
                  >
                    <p className="text-sm font-bold">{guidance.label}</p>
                    <p className="mt-1 text-sm leading-6">{guidance.detail}</p>
                    <p className="mt-1 text-sm leading-6">{guidance.nextStep}</p>
                  </div>
                </article>
              );
            })}
            {hiddenEntryCount > 0 && (
              <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                {hiddenEntryCount} older delivery attempts are hidden from this view.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
