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
    <main>
      <h1 className="mb-6 text-3xl font-bold">New maintenance request</h1>
      <NewRequestForm properties={ownerProperties} userId={session.user.id} />
    </main>
  );
}
