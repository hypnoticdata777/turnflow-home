import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { CommentThread } from "@/components/CommentThread";
import { HelperPortalShell } from "@/components/HelperPortalShell";
import { HelperOnboardingChecklist } from "@/components/HelperOnboardingChecklist";
import { HelperRequestReadiness } from "@/components/HelperRequestReadiness";
import { HelperWorkspaceOverview } from "@/components/HelperWorkspaceOverview";
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

export default async function CollaboratorPage() {
  const session = await requireRole("collaborator");

  const sharedRequests = await db.query.requests.findMany({
    where: (r, { eq }) => eq(r.collaboratorId, session.user.id),
    orderBy: (r, { desc }) => desc(r.createdAt),
    with: { property: { columns: { address: true, nickname: true } }, comments: true },
  });
  const guidance = helperWorkspaceGuidance("collaborator", sharedRequests);
  const onboardingItems = helperOnboardingItems("collaborator", sharedRequests);

  return (
    <HelperPortalShell
      eyebrow="Collaborator workspace"
      title="Shared requests"
      description="See only the maintenance requests an owner shared with you, review the current status, and post helpful updates back to the record."
    >
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
          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-xl font-semibold">What you can see</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            This workspace only shows requests the owner shared with this
            collaborator account. You can review status and add updates, while
            owner-only areas stay private.
          </p>
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
                <section key={r.id} className="rounded-lg border bg-white p-4 shadow-sm">
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
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold">Property</dt>
                      <dd>{propertyLabel}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Category / urgency</dt>
                      <dd>
                        {r.category} / {r.urgency}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Cost ({costLabelForRequest(r)})</dt>
                      <dd>${costForRequest(r).toFixed(2)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Notes</dt>
                      <dd>{r.notes || "Not recorded"}</dd>
                    </div>
                  </dl>

                  <HelperRequestReadiness state={readiness} />

                  <div className="mt-4 border-t pt-3">
                    <CommentThread
                      requestId={r.id}
                      comments={r.comments}
                      userId={session.user.id}
                      assignedVendorId={r.assignedVendorId}
                      collaboratorId={r.collaboratorId}
                    />
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
