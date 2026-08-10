import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { invites, properties, reminders, requests, vaultDocuments } from "@/lib/db/schema";
import {
  ownerDashboardGuidance,
  ownerSetupProgress,
  ownerSetupSteps,
} from "@/lib/owner-readiness";
import {
  REQUEST_STATUSES,
  costForRequest,
  costLabelForRequest,
  requestStatusBadgeClasses,
  type RequestStatus,
} from "@/lib/utils";

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

  const [allOwnerRequests, ownerProperties, ownerInvites] = await Promise.all([
    db.query.requests.findMany({
      where: eq(requests.ownerId, session.user.id),
      orderBy: (r, { desc }) => desc(r.createdAt),
      with: { property: true, photos: true },
    }),
    db.query.properties.findMany({
      where: eq(properties.ownerId, session.user.id),
      orderBy: (p, { desc }) => desc(p.createdAt),
    }),
    db.query.invites.findMany({
      where: eq(invites.ownerId, session.user.id),
      orderBy: (i, { desc }) => desc(i.createdAt),
    }),
  ]);

  const propertyIds = ownerProperties.map((property) => property.id);
  const [ownerVaultDocs, ownerReminders] = propertyIds.length
    ? await Promise.all([
        db.query.vaultDocuments.findMany({
          where: inArray(vaultDocuments.propertyId, propertyIds),
        }),
        db.query.reminders.findMany({
          where: inArray(reminders.propertyId, propertyIds),
        }),
      ])
    : [[], []];

  const ownerRequests = activeStatus
    ? allOwnerRequests.filter((request) => request.status === activeStatus)
    : allOwnerRequests;
  const countByStatus = Object.fromEntries(
    REQUEST_STATUSES.map((requestStatus) => [
      requestStatus,
      allOwnerRequests.filter((request) => request.status === requestStatus).length,
    ])
  );
  const totalCount = allOwnerRequests.length;
  const steps = ownerSetupSteps(
    {
      properties: ownerProperties,
      requests: allOwnerRequests,
      invites: ownerInvites,
      vaultDocuments: ownerVaultDocs,
      reminders: ownerReminders,
    },
    allOwnerRequests[0]?.id
  );
  const guidance = ownerDashboardGuidance(steps);
  const { completedCount, totalCount: setupStepCount, progress } = ownerSetupProgress(steps);
  const guidanceClasses =
    guidance.tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : guidance.tone === "empty"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : "border-amber-200 bg-amber-50 text-amber-950";
  const guidanceButtonClasses =
    guidance.tone === "ready"
      ? "bg-emerald-800"
      : guidance.tone === "empty"
        ? "bg-blue-800"
        : "bg-amber-800";

  const chipClasses = (isActive: boolean) =>
    `rounded-full border px-3 py-1 text-sm whitespace-nowrap ${
      isActive
        ? "border-blue-600 bg-blue-600 text-white"
        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
    }`;

  return (
    <main>
      <section className={`mb-6 rounded-lg border p-5 ${guidanceClasses}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold">
              {guidance.eyebrow}: {completedCount} of {setupStepCount} ready ({progress}%)
            </p>
            <h1 className="mt-1 text-3xl font-bold">My maintenance requests</h1>
            <p className="mt-2 text-lg font-semibold">{guidance.headline}</p>
            <p className="mt-1 max-w-3xl text-sm leading-6">
              {guidance.detail}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={guidance.primaryHref}
              className={`inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium text-white ${guidanceButtonClasses}`}
            >
              {guidance.primaryCta}
            </Link>
            <Link
              href={guidance.secondaryHref}
              className="inline-flex items-center justify-center rounded border border-current bg-white/75 px-4 py-2 text-sm font-medium"
            >
              {guidance.secondaryCta}
            </Link>
          </div>
        </div>
      </section>

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
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5">
          <p className="font-medium">No {activeStatus} requests right now.</p>
          <p className="mt-1 text-sm text-gray-600">
            Try another status filter or return to the full request list.
          </p>
          <Link
            href="/owner/dashboard"
            className="mt-3 inline-flex items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium"
          >
            View all requests
          </Link>
        </div>
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
