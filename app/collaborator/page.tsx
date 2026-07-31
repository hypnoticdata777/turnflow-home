import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { logoutAction } from "@/lib/actions/auth";
import { requestStatusBadgeClasses, costForRequest, costLabelForRequest } from "@/lib/utils";
import { CommentThread } from "@/components/CommentThread";

export default async function CollaboratorPage() {
  const session = await requireRole("collaborator");

  const sharedRequests = await db.query.requests.findMany({
    where: (r, { eq }) => eq(r.collaboratorId, session.user.id),
    orderBy: (r, { desc }) => desc(r.createdAt),
    with: { property: { columns: { address: true, nickname: true } }, comments: true },
  });

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">Shared Requests</h1>
        <form action={logoutAction}>
          <button className="px-3 py-1 border rounded">Logout</button>
        </form>
      </div>
      <p className="text-gray-500 mb-6">
        Maintenance requests shared with you — status, details, and a place
        to post updates.
      </p>

      {sharedRequests.length === 0 ? (
        <p className="text-gray-500">No requests have been shared with you yet.</p>
      ) : (
        <div className="space-y-4">
          {sharedRequests.map((r) => {
            const propertyLabel = r.property
              ? r.property.nickname
                ? `${r.property.nickname} — ${r.property.address}`
                : r.property.address
              : "(property not found)";
            return (
              <div key={r.id} className="border p-4 rounded bg-white shadow">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold">{r.title}</h2>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${requestStatusBadgeClasses(r.status)}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-sm mt-1">
                  <strong>Property:</strong> {propertyLabel}
                </p>
                <p className="text-sm">
                  <strong>Category:</strong> {r.category} &nbsp; <strong>Urgency:</strong> {r.urgency}
                </p>
                <p className="text-sm">
                  <strong>Cost ({costLabelForRequest(r)}):</strong> ${costForRequest(r).toFixed(2)}
                </p>
                <p className="text-sm">
                  <strong>Notes:</strong> {r.notes || "—"}
                </p>

                <div className="mt-3 border-t pt-2">
                  <CommentThread
                    requestId={r.id}
                    comments={r.comments}
                    userId={session.user.id}
                    assignedVendorId={r.assignedVendorId}
                    collaboratorId={r.collaboratorId}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
