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
  ownerSetupProgress,
  ownerSetupSteps,
  ownerSetupSummary,
} from "@/lib/owner-readiness";

function formatDate(date: Date | null) {
  if (!date) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
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
  const summaryClasses =
    setupSummary.tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : setupSummary.tone === "empty"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : "border-amber-200 bg-amber-50 text-amber-950";
  const summaryButtonClasses =
    setupSummary.tone === "ready"
      ? "bg-emerald-800"
      : setupSummary.tone === "empty"
        ? "bg-blue-800"
        : "bg-amber-800";

  return (
    <main className="max-w-6xl">
      <div className="mb-6">
        <p className="text-sm font-semibold text-blue-700">Account & sharing</p>
        <h1 className="text-3xl font-bold">Trust center</h1>
        <p className="mt-2 max-w-3xl text-gray-600">
          Review your owner account, launch-readiness signals, and the current
          sharing footprint before bringing vendors or helpers into a repair.
        </p>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Signed in as</p>
          <h2 className="mt-1 text-xl font-semibold">{displayName}</h2>
          <p className="mt-1 break-all text-sm text-gray-600">{displayEmail}</p>
          <OwnerProfileForm initialName={displayName} />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Shared requests</p>
          <h2 className="mt-1 text-3xl font-bold">{sharedRequestCount}</h2>
          <p className="mt-1 text-sm text-gray-600">
            Requests with an assigned helper or pending invite.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending invites</p>
          <h2 className="mt-1 text-3xl font-bold">{pendingInvites.length}</h2>
          <p className="mt-1 text-sm text-gray-600">
            Open invite links that can still be claimed.
          </p>
        </div>
      </section>

      <section className={`mb-6 rounded-lg border p-5 shadow-sm ${summaryClasses}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold">
              Owner readiness: {completedCount} of {totalCount} complete ({progress}%)
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              {setupSummary.headline}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6">
              {setupSummary.detail}
            </p>
          </div>
          {nextStep && (
            <Link
              href={nextStep.href}
              className={`inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium text-white ${summaryButtonClasses}`}
            >
              {nextStep.cta}
            </Link>
          )}
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Launch-readiness checklist</h2>
            <p className="text-sm text-gray-600">
              These signals help confirm the owner workflow has enough substance
              for early users to understand the value.
            </p>
          </div>
          <Link
            href="/owner/onboarding"
            className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            Continue setup
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {readinessItems.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 rounded border border-gray-100 bg-gray-50 p-3"
            >
              <span
                className={`mt-0.5 rounded-full px-2 py-1 text-xs font-semibold ${
                  item.complete ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {item.complete ? "Ready" : "Needs work"}
              </span>
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-gray-600">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">What gets shared</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded border border-gray-100 bg-gray-50 p-4">
            <h3 className="font-semibold">Vendors</h3>
            <p className="mt-2 text-sm text-gray-600">
              Vendors see only requests assigned to them, including request
              details, property label/address, access notes, status, and photo
              proof upload tools.
            </p>
          </div>
          <div className="rounded border border-gray-100 bg-gray-50 p-4">
            <h3 className="font-semibold">Collaborators</h3>
            <p className="mt-2 text-sm text-gray-600">
              Collaborators see only requests shared with them, including
              status, notes, cost context, and the request update thread.
            </p>
          </div>
          <div className="rounded border border-gray-100 bg-gray-50 p-4">
            <h3 className="font-semibold">Owner-only areas</h3>
            <p className="mt-2 text-sm text-gray-600">
              Properties, backup exports, vault documents, reminders, and
              notification history stay in the owner portal.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Active shared access</h2>
          <p className="text-sm text-gray-600">
            Remove request access after a vendor or trusted helper has accepted
            an invite.
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
              Review who has been invited and whether those links are still open.
            </p>
          </div>
          <Link
            href={ownerRequests[0] ? `/owner/requests/${ownerRequests[0].id}` : "/owner/requests/new"}
            className="inline-flex items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium"
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
