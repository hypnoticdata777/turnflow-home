import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { NewRequestForm } from "@/components/NewRequestForm";

export default async function NewRequestPage() {
  const session = await requireRole("owner");

  const ownerProperties = await db.query.properties.findMany({
    where: (p, { eq }) => eq(p.ownerId, session.user.id),
    orderBy: (p, { desc }) => desc(p.createdAt),
    columns: { id: true, address: true, nickname: true },
  });

  return (
    <main className="space-y-6">
      <header className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-800">
          Owner intake
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-950">
          New maintenance request
        </h1>
        <p className="mt-3 text-base leading-7 text-gray-600">
          Save the repair as a private owner record first, then add enough
          location, access, contact, notes, and photo context to make vendor
          handoff smoother when you are ready to share it.
        </p>
      </header>
      <NewRequestForm properties={ownerProperties} userId={session.user.id} />
    </main>
  );
}
