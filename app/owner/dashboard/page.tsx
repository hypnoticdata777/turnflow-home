import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { invites, properties, reminders, requests, vaultDocuments } from "@/lib/db/schema";
import {
  ownerDashboardGuidance,
  ownerLaneMetrics,
  ownerRequestCardSignal,
  ownerRequestUpdateSignal,
  ownerSetupProgress,
  ownerSetupSteps,
  ownerValueMetrics,
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
      with: { property: true, photos: true, comments: true },
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
  const valueMetrics = ownerValueMetrics({
    properties: ownerProperties,
    requests: allOwnerRequests,
    invites: ownerInvites,
    vaultDocuments: ownerVaultDocs,
    reminders: ownerReminders,
  });
  const laneMetrics = ownerLaneMetrics({
    properties: ownerProperties,
    requests: allOwnerRequests,
    invites: ownerInvites,
    vaultDocuments: ownerVaultDocs,
    reminders: ownerReminders,
  });
  const guidanceClasses =
    guidance.tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : guidance.tone === "empty"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : "border-cyan-200 bg-cyan-50 text-cyan-950";
  const chipClasses = (isActive: boolean) =>
    `rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-transform duration-150 hover:scale-105 active:scale-95 ${
      isActive
        ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-100"
    }`;
  const valueMetricClasses = (tone: (typeof valueMetrics)[number]["tone"]) =>
    tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : tone === "attention"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : tone === "progress"
          ? "border-cyan-200 bg-cyan-50 text-cyan-950"
          : "border-gray-200 bg-white text-gray-950";
  const valueMetricButtonClasses = (tone: (typeof valueMetrics)[number]["tone"]) =>
    tone === "ready"
      ? "bg-emerald-800 hover:bg-emerald-900"
      : tone === "attention"
        ? "bg-blue-800 hover:bg-blue-900"
        : tone === "progress"
          ? "bg-cyan-800 hover:bg-cyan-900"
          : "bg-gray-800 hover:bg-gray-900";
  const laneMetricClasses = (tone: (typeof laneMetrics)[number]["tone"]) =>
    tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : tone === "attention"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : tone === "progress"
          ? "border-cyan-200 bg-cyan-50 text-cyan-950"
          : "border-gray-200 bg-white text-gray-950";
  const laneMetricButtonClasses = (tone: (typeof laneMetrics)[number]["tone"]) =>
    tone === "ready"
      ? "bg-emerald-800 hover:bg-emerald-900"
      : tone === "attention"
        ? "bg-blue-800 hover:bg-blue-900"
        : tone === "progress"
          ? "bg-cyan-800 hover:bg-cyan-900"
          : "bg-gray-800 hover:bg-gray-900";
  const requestSignalClasses = (tone: ReturnType<typeof ownerRequestCardSignal>["tone"]) =>
    tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : tone === "attention"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : "border-cyan-200 bg-cyan-50 text-cyan-950";
  const requestSignalButtonClasses = (tone: ReturnType<typeof ownerRequestCardSignal>["tone"]) =>
    tone === "ready"
      ? "bg-emerald-800 hover:bg-emerald-900"
      : tone === "attention"
        ? "bg-blue-800 hover:bg-blue-900"
        : "bg-cyan-800 hover:bg-cyan-900";
  const requestUpdateClasses = (tone: ReturnType<typeof ownerRequestUpdateSignal>["tone"]) =>
    tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : tone === "attention"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : "border-cyan-200 bg-cyan-50 text-cyan-950";
  const requestUpdateButtonClasses = (tone: ReturnType<typeof ownerRequestUpdateSignal>["tone"]) =>
    tone === "ready"
      ? "bg-emerald-800 hover:bg-emerald-900"
      : tone === "attention"
        ? "bg-blue-800 hover:bg-blue-900"
        : "bg-cyan-800 hover:bg-cyan-900";
  const attentionRequests = allOwnerRequests
    .map((request) => ({
      request,
      signal: ownerRequestCardSignal(request),
      updateSignal: ownerRequestUpdateSignal(request),
    }))
    .filter(({ signal, updateSignal }) => signal.tone === "attention" || updateSignal.tone === "attention");
  const featuredRequest = attentionRequests[0]?.request ?? allOwnerRequests[0] ?? null;
  const featuredSignal = featuredRequest ? ownerRequestCardSignal(featuredRequest) : null;
  const featuredUpdateSignal = featuredRequest ? ownerRequestUpdateSignal(featuredRequest) : null;
  const featuredPropertyLabel = featuredRequest?.property
    ? featuredRequest.property.nickname
      ? `${featuredRequest.property.nickname} - ${featuredRequest.property.address}`
      : featuredRequest.property.address
    : "No property selected";
  const protectedMetric = valueMetrics.find((metric) => metric.label === "Proof-backed records");
  const sharedMetric = valueMetrics.find((metric) => metric.label === "Shared help");
  const careMetric = valueMetrics.find((metric) => metric.label === "Preventive care");
  const commandStats = [
    {
      label: "Launch readiness",
      value: `${progress}%`,
      detail: `${completedCount} of ${setupStepCount} core owner steps are ready.`,
    },
    {
      label: "Owner attention",
      value: attentionRequests.length,
      detail:
        attentionRequests.length > 0
          ? `${attentionRequests.length} request${attentionRequests.length === 1 ? "" : "s"} need a decision, proof, or shared-thread update.`
          : "No repair record is asking for owner action right now.",
    },
    {
      label: "Proof protected",
      value: protectedMetric?.value ?? 0,
      detail: protectedMetric?.detail ?? "Proof metrics appear after the first request.",
    },
    {
      label: "Scoped help",
      value: sharedMetric?.value ?? 0,
      detail: sharedMetric?.detail ?? "Access stays request-specific.",
    },
  ];
  const demoPath = [
    {
      label: "Owner",
      detail: `${totalCount} repair record${totalCount === 1 ? "" : "s"} anchored to the homeowner account.`,
    },
    {
      label: "Vendor",
      detail: `${laneMetrics.find((metric) => metric.lane === "Vendor")?.value ?? 0} jobs have assigned or invited vendor flow.`,
    },
    {
      label: "Collaborator",
      detail: `${laneMetrics.find((metric) => metric.lane === "Collaborator")?.value ?? 0} jobs have scoped helper visibility.`,
    },
    {
      label: "System",
      detail: `${careMetric?.value ?? 0} reminders plus vault/proof records preserve the history.`,
    },
  ];

  return (
    <main>
      <section className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <div className="bg-slate-950 p-5 text-white">
            <p className="text-sm font-semibold text-emerald-300">Owner command center</p>
            <h1 className="mt-2 text-3xl font-bold">My maintenance requests</h1>
            <p className="mt-3 text-lg font-semibold">{guidance.headline}</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">{guidance.detail}</p>
            <div className="mt-5" aria-label="Owner workspace progress">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase text-slate-300">
                <span>{guidance.eyebrow}</span>
                <span>
                  {completedCount}/{setupStepCount} ready
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-emerald-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={guidance.primaryHref}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors duration-150 hover:bg-emerald-400"
              >
                {guidance.primaryCta}
              </Link>
              <Link
                href={guidance.secondaryHref}
                className="inline-flex items-center justify-center rounded-lg border border-slate-500 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800"
              >
                {guidance.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="p-5">
            <p className="text-sm font-semibold text-blue-700">Next owner move</p>
            {featuredRequest && featuredSignal && featuredUpdateSignal ? (
              <div className="mt-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-950">{featuredRequest.title}</h2>
                    <p className="mt-1 text-sm text-gray-600">{featuredPropertyLabel}</p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-2 py-1 text-xs font-medium ${requestStatusBadgeClasses(
                      featuredRequest.status
                    )}`}
                  >
                    {featuredRequest.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className={`rounded-lg border p-3 ${requestSignalClasses(featuredSignal.tone)}`}>
                    <p className="text-sm font-semibold">{featuredSignal.label}</p>
                    <p className="mt-1 text-sm leading-6">{featuredSignal.detail}</p>
                  </div>
                  <div className={`rounded-lg border p-3 ${requestUpdateClasses(featuredUpdateSignal.tone)}`}>
                    <p className="text-sm font-semibold">{featuredUpdateSignal.label}</p>
                    <p className="mt-1 text-sm leading-6">{featuredUpdateSignal.detail}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={featuredSignal.href}
                    className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-white ${requestSignalButtonClasses(
                      featuredSignal.tone
                    )} whitespace-nowrap`}
                  >
                    {featuredSignal.cta}
                  </Link>
                  <Link
                    href={`/owner/requests/${featuredRequest.id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Open full record
                  </Link>
                </div>
              </div>
            ) : (
              <div className={`mt-3 rounded-lg border p-4 ${guidanceClasses}`}>
                <p className="text-lg font-semibold">Start the first record.</p>
                <p className="mt-1 text-sm leading-6">
                  A property and one repair request will give the owner workspace a useful center.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid border-t border-slate-200 bg-gray-50 md:grid-cols-2 xl:grid-cols-4">
          {commandStats.map((stat) => (
            <div key={stat.label} className="border-b border-slate-200 p-4 last:border-b-0 md:border-r md:last:border-r-0 xl:border-b-0">
              <p className="text-sm font-semibold text-gray-600">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-950">{stat.value}</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">{stat.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 grid gap-3 md:grid-cols-4">
          {demoPath.map((step, index) => (
            <div key={step.label} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Lane {index + 1}
              </p>
              <p className="mt-1 text-base font-bold text-gray-950">{step.label}</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">{step.detail}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">Homeowner value</p>
            <h2 className="text-2xl font-bold text-gray-950">
              What TurnFlow is protecting for this home
            </h2>
          </div>
          <Link
            href="/owner/onboarding"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-400 hover:bg-gray-100"
          >
            Open setup guide
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {valueMetrics.map((metric) => (
            <article
              key={metric.label}
              className={`rounded-lg border p-4 ${valueMetricClasses(metric.tone)}`}
            >
              <p className="text-sm font-semibold">{metric.label}</p>
              <p className="mt-2 text-3xl font-bold">{metric.value}</p>
              <p className="mt-2 min-h-20 text-sm leading-6">{metric.detail}</p>
              <Link
                href={metric.href}
                className={`mt-4 inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors duration-150 ${valueMetricButtonClasses(
                  metric.tone
                )}`}
              >
                {metric.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-semibold text-emerald-800">Workspace lanes</p>
          <h2 className="text-2xl font-bold text-gray-950">
            How this record is split and connected
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {laneMetrics.map((metric) => (
            <article
              key={metric.lane}
              className={`rounded-lg border p-4 ${laneMetricClasses(metric.tone)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{metric.lane}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
              </div>
              <p className="mt-3 min-h-20 text-sm leading-6">{metric.detail}</p>
              <Link
                href={metric.href}
                className={`mt-4 inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors duration-150 ${laneMetricButtonClasses(
                  metric.tone
                )}`}
              >
                {metric.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {totalCount > 0 && (
        <div className="mb-4 flex flex-wrap gap-2" id="owner-records">
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
            className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors duration-150 hover:bg-blue-800"
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
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium transition-colors duration-150 hover:border-gray-400 hover:bg-gray-100"
          >
            View all requests
          </Link>
        </div>
      ) : (
        <section className="space-y-4" aria-label="Owner repair action queue">
          <div>
            <p className="text-sm font-semibold text-blue-700">Owner action queue</p>
            <h2 className="text-2xl font-bold text-gray-950">Repair records ready for review</h2>
          </div>
          {ownerRequests.map((r) => {
            const cost = costForRequest(r);
            const costLabel = costLabelForRequest(r);
            const signal = ownerRequestCardSignal(r);
            const updateSignal = ownerRequestUpdateSignal(r);
            const proofCount = r.photos.length;
            const updateCount = r.comments.length;
            const accessCount = [
              r.assignedVendorId,
              r.collaboratorId,
              r.pendingVendorInviteId,
              r.pendingCollaboratorInviteId,
            ].filter(Boolean).length;
            const propertyLabel = r.property
              ? r.property.nickname
                ? `${r.property.nickname} - ${r.property.address}`
                : r.property.address
              : "No property";

            return (
              <article key={r.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <h2 className="text-xl font-semibold">{r.title}</h2>
                      <span
                        className={`w-fit rounded-full px-2 py-1 text-xs font-medium ${requestStatusBadgeClasses(
                          r.status
                        )}`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="font-semibold text-gray-950">Property</dt>
                        <dd className="text-gray-700">{propertyLabel}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-gray-950">Scope</dt>
                        <dd className="text-gray-700">
                          {r.category} / {r.urgency}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-gray-950">Cost</dt>
                        <dd className="text-gray-700">
                          {costLabel}: ${cost.toFixed(2)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center lg:w-64">
                    <div className="rounded border border-gray-200 bg-gray-50 p-2">
                      <p className="text-xs font-semibold text-gray-500">Proof</p>
                      <p className="mt-1 text-lg font-bold text-gray-950">{proofCount}</p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-2">
                      <p className="text-xs font-semibold text-gray-500">Updates</p>
                      <p className="mt-1 text-lg font-bold text-gray-950">{updateCount}</p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-2">
                      <p className="text-xs font-semibold text-gray-500">Access</p>
                      <p className="mt-1 text-lg font-bold text-gray-950">{accessCount}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div
                    className={`rounded-lg border p-3 sm:flex sm:items-start sm:justify-between sm:gap-4 ${requestSignalClasses(
                      signal.tone
                    )}`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{signal.label}</p>
                      <p className="mt-1 text-sm leading-6">{signal.detail}</p>
                    </div>
                    <Link
                      href={signal.href}
                      className={`mt-3 inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors duration-150 sm:mt-0 ${requestSignalButtonClasses(
                        signal.tone
                      )} whitespace-nowrap`}
                    >
                      {signal.cta}
                    </Link>
                  </div>

                  <div
                    className={`rounded-lg border p-3 sm:flex sm:items-start sm:justify-between sm:gap-4 ${requestUpdateClasses(
                      updateSignal.tone
                    )}`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{updateSignal.label}</p>
                      <p className="mt-1 text-sm leading-6">{updateSignal.detail}</p>
                    </div>
                    <Link
                      href={updateSignal.href}
                      className={`mt-3 inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors duration-150 sm:mt-0 ${requestUpdateButtonClasses(
                        updateSignal.tone
                      )} whitespace-nowrap`}
                    >
                      {updateSignal.cta}
                    </Link>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/owner/requests/${r.id}`}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-400 hover:bg-gray-100"
                  >
                    Open full record
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
