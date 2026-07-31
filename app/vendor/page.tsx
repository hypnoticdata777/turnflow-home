import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { logoutAction } from "@/lib/actions/auth";
import { VendorPortal } from "@/components/VendorPortal";

export default async function VendorPage() {
  const session = await requireRole("vendor");

  const assignedRequests = await db.query.requests.findMany({
    where: (r, { eq }) => eq(r.assignedVendorId, session.user.id),
    orderBy: (r, { desc }) => desc(r.createdAt),
    with: {
      property: { columns: { address: true, nickname: true } },
      photos: { columns: { type: true } },
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
      finalCost: true,
    },
  });

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🛠 Assigned Requests</h1>
        <form action={logoutAction}>
          <button className="px-3 py-1 border rounded">Logout</button>
        </form>
      </div>
      <VendorPortal requests={assignedRequests} userId={session.user.id} />
    </main>
  );
}
