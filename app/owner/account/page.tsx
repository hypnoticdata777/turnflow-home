import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { requireRole } from "@/lib/auth/dal";
import { OwnerProfileForm } from "@/components/OwnerProfileForm";
import { PendingInviteControls } from "@/components/PendingInviteControls";
import { SharedAccessControls } from "@/components/SharedAccessControls";
import { db } from "@/lib/db";
import { invites, properties, reminders, requests, users, vaultDocuments } from "@/lib/db/schema";
import {
  ownerAccountReadinessItems,
  ownerNextSetupStep,
  ownerReadinessFlags,
  ownerSharingMetrics,
  ownerSetupProgress,
  ownerSetupSteps,
  ownerSetupSummary,
} from "@/lib/owner-readiness";

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.8 7.8a1 1 0 0 1-1.4 0l-3.8-3.8a1 1 0 1 1 1.4-1.4l3.1 3.09 7.1-7.09a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function formatDate(date: Date | null) {
  if (!date) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function sharingMetricClasses(tone: "attention" | "progress" | "ready" | "empty") {
  switch (tone) {
    case "attention":
      return "border-rose-200 bg-rose-50 text-rose-950";
    case "progress":
      return "border-cyan-200 bg-cyan-50 text-cyan-950";
    case "ready":
      return "border-emerald-200 bg-emerald-50 text-emerald-950";
    default:
      return "border-gray-200 bg-white text-gray-900";
  }
}

export default async function OwnerAccountPage() {
  const session = await requireRole("owner");

  const [ownerProfile, ownerProperties, ownerRequests, ownerInvites] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true, email: true },
    }),
    db.query.properties.findMany({
      where: eq(properties.ownerId, session.user.id),
      orderBy: (p, { desc }) => desc(p.createdAt),
    }),
    db.query.requests.findMany({
      where: eq(requests.ownerId, session.user.id),
      orderBy: (r, { desc }) => desc(r.createdAt),
      with: { property: true, photos: true, assignedVendor: true, collaborator: true },
    }),
    db.query.invites.findMany({
      where: eq(invites.ownerId, session.user.id),
      orderBy: (i, { desc }) => desc(i.createdAt),
      with: { request: true },
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

  const readinessInput = {
    properties: ownerProperties,
    requests: ownerRequests,
    invites: ownerInvites,
    vaultDocuments: ownerVaultDocs,
    reminders: ownerReminders,
  };
  const pendingInvites = ownerInvites.filter((invite) => invite.status === "pending");
  const acceptedInvites = ownerInvites.filter((invite) => invite.status === "accepted");
  const activeSharedAccess = ownerRequests.flatMap((request) => {
    const rows = [];
    if (request.assignedVendorId) {
      rows.push({
        request,
        role: "vendor" as const,
        person: request.assignedVendor?.email || "Assigned vendor",
      });
    }
    if (request.collaboratorId) {
      rows.push({
        request,
        role: "collaborator" as const,
        person: request.collaborator?.email || "Shared collaborator",
      });
    }
    return rows;
  });
  const { sharedRequestCount } = ownerReadinessFlags(readinessInput);
  const displayName = ownerProfile?.name || session.user.name || "Owner";
  const displayEmail = ownerProfile?.email || session.user.email;
  const readinessItems = ownerAccountReadinessItems(readinessInput, displayEmail);
  const setupSteps = ownerSetupSteps(readinessInput, ownerRequests[0]?.id);
  const setupSummary = ownerSetupSummary(setupSteps);
  const nextStep = ownerNextSetupStep(setupSteps);
  const { completedCount, totalCount, progress } = ownerSetupProgress(setupSteps);
  const sharingMetrics = ownerSharingMetrics(readinessInput);
  const primary = nextStep
    ? { href: nextStep.href, label: nextStep.cta }
    : { href: "/owner/requests/new", label: "Log another request" };

  const trustStats = [
    { label: "Owner readiness", value: `${progress}%` },
    { label: "Shared requests", value: sharedRequestCount },
    { label: "Active access", value: activeSharedAccess.length },
    { label: "Pending invites", value: pendingInvites.length },
  ];

  const sharedScope = [
    {
      title: "Vendors",
      detail: "Only their assigned request: details, property, access notes, status, proof upload.",
    },
    {
      title: "Collaborators",
      detail: "Only requests shared with them: status, notes, cost context, update thread.",
    },
    {
      title: "Owner-only",
      detail: "Properties, backups, vault documents, reminders, notification history.",
    },
  ];

  return (
    <main className="max-w-6xl">
      <section className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-5 text-white">
          <p className="text-sm font-semibold text-emerald-300">Account &amp; sharing</p>
          <h1 className="mt-2 text-3xl font-bold">Trust center</h1>
          <p className="mt-3 text-lg font-semibold">{setupSummary.headline}</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">{setupSummary.detail}</p>
          <p className="mt-3 text-sm text-slate-300">
            Signed in as <span className="font-semibold text-white">{displayName}</span>
            <span className="break-all"> &middot; {displayEmail}</span>
          </p>

          <div className="mt-5" aria-label="Owner readiness progress">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase text-slate-300">
              <span>Launch readiness</span>
              <span>
                {completedCount}/{totalCount} ready
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
              href={primary.href}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-md active:translate-y-0"
            >
              {primary.label}
            </Link>
            <Link
              href="/owner/onboarding"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-500 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition duration-150 hover:bg-slate-800"
            >
              Open setup guide
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px border-t border-slate-200 bg-slate-200 md:grid-cols-4">
          {trustStats.map((stat) => (
            <div key={stat.label} className="bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-600">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-950">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Profile</h2>
          <p className="mt-1 text-sm text-gray-600">The name helpers and vendors see on shared requests.</p>
          <OwnerProfileForm initialName={displayName} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Launch-readiness checklist</h2>
              <p className="text-sm text-gray-600">Signals that the owner workflow has real substance.</p>
            </div>
            <Link
              href="/owner/onboarding"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md active:translate-y-0"
            >
              Continue setup
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {readinessItems.map((item) => (
              <div
                key={item.label}
                className={`rounded-lg border p-3 ${
                  item.complete
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-cyan-200 bg-cyan-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-white ${
                      item.complete ? "bg-emerald-600" : "bg-cyan-600"
                    }`}
                  >
                    {item.complete ? (
                      <>
                        <CheckIcon /> Ready
                      </>
                    ) : (
                      "Needs work"
                    )}
                  </span>
                  <p className="font-semibold text-gray-950">{item.label}</p>
                </div>
                <p className="mt-2 text-sm text-gray-700">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-800">
            Sharing boundary snapshot
          </p>
          <h2 className="mt-1 text-xl font-semibold">Who can see owner records?</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Requests start owner-only. Vendors and collaborators enter one specific
            repair after an invite is accepted or access is assigned, and every
            removal is written to the request decision log.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {sharingMetrics.map((metric) => (
            <article
              key={metric.label}
              className={`rounded-lg border p-4 ${sharingMetricClasses(metric.tone)}`}
            >
              <p className="text-sm font-semibold">{metric.label}</p>
              <p className="mt-2 text-3xl font-bold">{metric.value}</p>
              <p className="mt-2 text-sm leading-6">{metric.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">What each role sees</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {sharedScope.map((scope) => (
            <div key={scope.title} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-950">{scope.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{scope.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Active shared access</h2>
          <p className="text-sm text-gray-600">
            Remove request access once a vendor or trusted helper is done.
          </p>
        </div>

        {activeSharedAccess.length === 0 ? (
          <p className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-600">
            No active shared access yet. Accepted vendors and collaborators will
            appear here once they claim a request invite.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-2 pr-4 font-medium">Person</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 pr-4 font-medium">Request</th>
                  <th className="py-2 pr-4 font-medium">Property</th>
                  <th className="py-2 pr-4 font-medium">Controls</th>
                </tr>
              </thead>
              <tbody>
                {activeSharedAccess.map((access) => (
                  <tr
                    key={`${access.request.id}-${access.role}`}
                    className="border-b last:border-b-0"
                  >
                    <td className="py-3 pr-4">{access.person}</td>
                    <td className="py-3 pr-4 capitalize">{access.role}</td>
                    <td className="py-3 pr-4">{access.request.title}</td>
                    <td className="py-3 pr-4">
                      {access.request.property
                        ? access.request.property.nickname
                          ? `${access.request.property.nickname} - ${access.request.property.address}`
                          : access.request.property.address
                        : "Property removed"}
                    </td>
                    <td className="py-3 pr-4">
                      <SharedAccessControls
                        requestId={access.request.id}
                        role={access.role}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Invite activity</h2>
            <p className="text-sm text-gray-600">
              Who has been invited and whether those links are still open.
            </p>
          </div>
          <Link
            href={ownerRequests[0] ? `/owner/requests/${ownerRequests[0].id}` : "/owner/requests/new"}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold transition duration-150 hover:border-gray-400 hover:bg-gray-100"
          >
            Manage invites
          </Link>
        </div>

        {ownerInvites.length === 0 ? (
          <p className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-600">
            No invite activity yet. Invite a vendor or trusted helper from a
            request when you are ready to share that specific repair.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-2 pr-4 font-medium">Person</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 pr-4 font-medium">Request</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Expires</th>
                  <th className="py-2 pr-4 font-medium">Controls</th>
                </tr>
              </thead>
              <tbody>
                {[...pendingInvites, ...acceptedInvites].map((invite) => (
                  <tr key={invite.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4">{invite.email}</td>
                    <td className="py-3 pr-4 capitalize">{invite.role}</td>
                    <td className="py-3 pr-4">{invite.request?.title || "Request removed"}</td>
                    <td className="py-3 pr-4 capitalize">{invite.status}</td>
                    <td className="py-3 pr-4">{formatDate(invite.expiresAt)}</td>
                    <td className="py-3 pr-4">
                      {invite.status === "pending" ? (
                        <PendingInviteControls inviteId={invite.id} />
                      ) : (
                        <span className="text-xs text-gray-500">Accepted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
