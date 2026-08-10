import Link from "next/link";
import { and, eq, sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { requests } from "@/lib/db/schema";
import {
  REQUEST_STATUSES,
  costForRequest,
  costLabelForRequest,
  requestStatusBadgeClasses,
  type RequestStatus,
} from "@/lib/utils";

// Package 2 (status filtering) is genuinely simpler here than in the
// original Firestore build: Firestore couldn't cheaply combine an equality
// filter with the existing orderBy without a composite index, so that version
// had to fall back to "fetch everything, filter/count in JS" whenever a status
// filter was active. Postgres has no such limitation: the filter and the
// per-status counts are both just plain SQL, and the active filter lives in
// the URL (?status=...) instead of client state.
export default async function OwnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireRole("owner");
  const { status } = await searchParams;
  const activeStatus: RequestStatus | null =
    status && (REQUEST_STATUSES as readonly string[]).includes(status)
      ? (status as RequestStatus)
      : null;

  const whereClause = activeStatus
    ? and(eq(requests.ownerId, session.user.id), eq(requests.status, activeStatus))
    : eq(requests.ownerId, session.user.id);

  const [ownerRequests, statusCounts] = await Promise.all([
    db.query.requests.findMany({
      where: whereClause,
      orderBy: (r, { desc }) => desc(r.createdAt),
      with: { property: true },
    }),
    db
      .select({ status: requests.status, count: sql<number>`count(*)`.mapWith(Number) })
      .from(requests)
      .where(eq(requests.ownerId, session.user.id))
      .groupBy(requests.status),
  ]);

  const countByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s.count]));
  const totalCount = statusCounts.reduce((sum, s) => sum + s.count, 0);

  const chipClasses = (isActive: boolean) =>
    `rounded-full border px-3 py-1 text-sm whitespace-nowrap ${
      isActive
        ? "border-blue-600 bg-blue-600 text-white"
        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
    }`;

  return (
    <main>
      <section className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-800">
              First homeowner repair record
            </p>
            <p className="mt-1 max-w-2xl text-sm text-gray-700">
              Use the setup guide to test the serious owner path: property,
              request, evidence, shared help, history, and reminders.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/owner/onboarding"
              className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              Open setup guide
            </Link>
            <Link
              href="/owner/account"
              className="inline-flex items-center justify-center rounded border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-800"
            >
              Review sharing
            </Link>
          </div>
        </div>
      </section>

      <h1 className="mb-6 text-3xl font-bold">My maintenance requests</h1>

      {totalCount > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Link href="/owner/dashboard" className={chipClasses(!activeStatus)}>
            All ({totalCount})
          </Link>
          {REQUEST_STATUSES.map((s) => (
            <Link
              key={s}
              href={`/owner/dashboard?status=${encodeURIComponent(s)}`}
              className={chipClasses(activeStatus === s)}
            >
              {s} ({countByStatus[s] ?? 0})
            </Link>
          ))}
        </div>
      )}

      {totalCount === 0 ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <p className="mb-1 font-medium">Welcome to TurnFlow Home.</p>
          <p className="text-sm text-gray-700">
            Document a maintenance issue as soon as it comes up, so you&apos;ve
            got photos, notes, and a record of what happened before you even call
            anyone.
          </p>
          <Link
            href="/owner/requests/new"
            className="mt-3 inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white"
          >
            Create your first request
          </Link>
        </div>
      ) : ownerRequests.length === 0 ? (
        <p className="text-gray-500">No requests with status &quot;{activeStatus}&quot;.</p>
      ) : (
        <div className="space-y-4">
          {ownerRequests.map((r) => {
            const cost = costForRequest(r);
            const costLabel = costLabelForRequest(r);
            const propertyLabel = r.property
              ? r.property.nickname
                ? `${r.property.nickname} - ${r.property.address}`
                : r.property.address
              : "No property";

            return (
              <div key={r.id} className="rounded border bg-white p-4 shadow">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h2 className="text-xl font-semibold">{r.title}</h2>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${requestStatusBadgeClasses(
                      r.status
                    )}`}
                  >
                    {r.status}
                  </span>
                </div>
                <p>
                  <strong>Property:</strong> {propertyLabel}
                </p>
                <p>
                  <strong>Category:</strong> {r.category} &nbsp;{" "}
                  <strong>Urgency:</strong> {r.urgency}
                </p>
                <p>
                  <strong>Cost ({costLabel}):</strong> ${cost.toFixed(2)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/owner/requests/${r.id}`}
                    className="rounded bg-blue-600 px-3 py-1 text-white"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
