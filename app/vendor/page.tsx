import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { and, inArray, eq } from "drizzle-orm";
import { HelperPortalShell } from "@/components/HelperPortalShell";
import { VendorPortal } from "@/components/VendorPortal";
import { quotes } from "@/lib/db/schema";

export default async function VendorPage() {
  const session = await requireRole("vendor");

  const assignedRequests = await db.query.requests.findMany({
    where: (r, { eq }) => eq(r.assignedVendorId, session.user.id),
    orderBy: (r, { desc }) => desc(r.createdAt),
    with: {
      property: { columns: { address: true, nickname: true } },
      photos: { columns: { type: true } },
      comments: true,
      workSessions: {
        orderBy: (w, { desc }) => desc(w.createdAt),
        with: {
          proofPhoto: { columns: { type: true, url: true } },
        },
      },
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
  const profile = await db.query.vendorProfiles.findFirst({
    where: (p, { eq }) => eq(p.userId, session.user.id),
    columns: {
      businessName: true,
      trades: true,
      serviceArea: true,
      availability: true,
      notificationPreference: true,
      licenseInsuranceNotes: true,
    },
  });
  const requestIds = assignedRequests.map((request) => request.id);
  const vendorBids = requestIds.length
    ? await db.query.quotes.findMany({
        where: and(
          inArray(quotes.requestId, requestIds),
          eq(quotes.submittedByVendorId, session.user.id)
        ),
        columns: {
          id: true,
          requestId: true,
          amount: true,
          status: true,
          availabilityWindow: true,
          notes: true,
        },
      })
    : [];
  const vendorBidByRequestId = new Map(
    vendorBids.map((bid) => [bid.requestId, bid])
  );
  const assignedRequestsWithBids = assignedRequests.map((request) => ({
    ...request,
    vendorBid: vendorBidByRequestId.get(request.id) ?? null,
  }));

  return (
    <HelperPortalShell
      eyebrow="Vendor workspace"
      title="Assigned requests"
      description="Review the repair details the owner shared with you, update status, and add proof photos for the assigned work."
    >
      <VendorPortal
        requests={assignedRequestsWithBids}
        userId={session.user.id}
        profile={profile ?? null}
      />
    </HelperPortalShell>
  );
}
