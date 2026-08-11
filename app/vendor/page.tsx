import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { HelperPortalShell } from "@/components/HelperPortalShell";
import { VendorPortal } from "@/components/VendorPortal";

export default async function VendorPage() {
  const session = await requireRole("vendor");

  const assignedRequests = await db.query.requests.findMany({
    where: (r, { eq }) => eq(r.assignedVendorId, session.user.id),
    orderBy: (r, { desc }) => desc(r.createdAt),
    with: {
      property: { columns: { address: true, nickname: true } },
      photos: { columns: { type: true } },
      comments: true,
    },
    columns: {
      id: true,
      title: true,
      category: true,
      urgency: true,
      status: true,
      location: true,
      accessInstructions: true,
      contactMethod: true,
      assignedVendorId: true,
      quotedCost: true,
      finalCost: true,
    },
  });

  return (
    <HelperPortalShell
      eyebrow="Vendor workspace"
      title="Assigned requests"
      description="Review the repair details the owner shared with you, update status, and add proof photos for the assigned work."
    >
      <VendorPortal requests={assignedRequests} userId={session.user.id} />
    </HelperPortalShell>
  );
}
