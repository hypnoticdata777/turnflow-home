import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { CommentThread } from "@/components/CommentThread";
import { HelperPortalShell } from "@/components/HelperPortalShell";
import { HelperOnboardingChecklist } from "@/components/HelperOnboardingChecklist";
import { HelperRequestReadiness } from "@/components/HelperRequestReadiness";
import { HelperWorkspaceOverview } from "@/components/HelperWorkspaceOverview";
import { InviteAcceptedBanner } from "@/components/InviteAcceptedBanner";
import { commentThreadGuidance } from "@/lib/comment-guidance";
import {
  helperOnboardingItems,
  helperRequestCardState,
  helperWorkspaceGuidance,
} from "@/lib/helper-workspace";
import {
  costForRequest,
  costLabelForRequest,
  requestStatusBadgeClasses,
} from "@/lib/utils";

export default async function CollaboratorPage({
  searchParams,
}: {
  searchParams: Promise<{ accepted?: string | string[] }>;
}) {
  const session = await requireRole("collaborator");
  const { accepted } = await searchParams;
  const inviteAccepted = accepted === "1";

  const sharedRequests = await db.query.requests.findMany({
    where: (r, { eq }) => eq(r.collaboratorId, session.user.id),
    orderBy: (r, { desc }) => desc(r.createdAt),
    with: { property: { columns: { address: true, nickname: true } }, comments: true },
  });
  const guidance = helperWorkspaceGuidance("collaborator", sharedRequests);
  const onboardingItems = helperOnboardingItems("collaborator", sharedRequests);
  const scopeTiles = [
    {
      label: "Shared requests",
      value: sharedRequests.length,
      detail: "Only owner-shared repairs land here.",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
    },
    {
      label: "Owner privacy",
      value: "On",
      detail: "Documents, backups, and other homes stay out.",
      classes: "border-slate-200 bg-slate-50 text-slate-950",
    },
    {
      label: "Update lane",
      value: sharedRequests.reduce((count, request) => count + request.comments.length, 0),
      detail: "Helpful notes go back to the record.",
      classes: "border-blue-200 bg-blue-50 text-blue-950",
    },
  ];

  return (
    <HelperPortalShell
      eyebrow="Collaborator workspace"
      title="Shared requests"
      description="See only the maintenance requests an owner shared with you, review the current status, and post helpful updates back to the record."
    >
      {inviteAccepted && <InviteAcceptedBanner role="collaborator" />}
      <div className="space-y-6">
        <HelperWorkspaceOverview
          guidance={guidance}
          labels={{
            total: "Shared",
            active: "Active",
            attention: "Need updates",
            complete: "Complete",
          }}
        />

        <HelperOnboardingChecklist role="collaborator" items={onboardingItems} />

        <section
          id="helper-scope"
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-200">Collaborator scope</p>
              <h2 className="mt-1 text-xl font-semibold">What you can see</h2>
            </div>
            <a
              href="#helper-requests"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
            >
              Shared requests
            </a>
          </div>
          <div className="grid gap-px bg-slate-200 md:grid-cols-3">
            {scopeTiles.map((tile) => (
              <div key={tile.label} className={`border-t p-4 md:border-t-0 ${tile.classes}`}>
                <p className="text-sm font-semibold">{tile.label}</p>
                <p className="mt-2 text-3xl font-bold">{tile.value}</p>
                <p className="mt-2 text-sm leading-6">{tile.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {sharedRequests.length === 0 ? (
          <section
            id="helper-requests"
            className="scroll-mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-gray-600">No requests have been shared with you yet.</p>
          </section>
        ) : (
          <div id="helper-requests" className="scroll-mt-6 space-y-4">
            {sharedRequests.map((r) => {
              const propertyLabel = r.property
                ? r.property.nickname
                  ? `${r.property.nickname} - ${r.property.address}`
                  : r.property.address
                : "Property not found";
              const readiness = helperRequestCardState("collaborator", r);
              return (
                <section
                  key={r.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-3 bg-slate-950 p-4 text-white sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-cyan-200">Shared request</p>
                      <h2 className="mt-1 text-xl font-semibold">{r.title}</h2>
                    </div>
                    <span
                      className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${requestStatusBadgeClasses(
                        r.status
                      )}`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["Property", propertyLabel],
                      ["Scope", `${r.category} / ${r.urgency}`],
                      [costLabelForRequest(r), `$${costForRequest(r).toFixed(2)}`],
                      ["Updates", r.comments.length],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-white p-4">
                        <p className="text-xs font-semibold uppercase text-slate-500">
                          {label}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">Notes</p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {r.notes || "Not recorded"}
                      </p>
                    </div>

                    <HelperRequestReadiness state={readiness} />

                    <div
                      id={`request-updates-${r.id}`}
                      className="mt-4 scroll-mt-6 border-t border-slate-100 pt-3"
                    >
                      <CommentThread
                        requestId={r.id}
                        comments={r.comments}
                        userId={session.user.id}
                        assignedVendorId={r.assignedVendorId}
                        collaboratorId={r.collaboratorId}
                        guidance={commentThreadGuidance("collaborator", r)}
                      />
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </HelperPortalShell>
  );
}
