import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { PropertyForm } from "@/components/PropertyForm";
import { DeletePropertyButton } from "@/components/DeletePropertyButton";
import { ExportHistoryButton } from "@/components/ExportHistoryButton";

export default async function PropertiesPage() {
  const session = await requireRole("owner");

  const ownerProperties = await db.query.properties.findMany({
    where: (p, { eq }) => eq(p.ownerId, session.user.id),
    orderBy: (p, { desc }) => desc(p.createdAt),
  });

  return (
    <main>
      <h1 className="mb-6 text-3xl font-bold">Properties</h1>

      <div className="mb-6 rounded-xl bg-white p-4 shadow">
        <h2 className="mb-4 text-xl font-semibold">Add a property</h2>
        <PropertyForm />
      </div>

      <div className="rounded-xl bg-white p-4 shadow">
        <h2 className="mb-4 text-xl font-semibold">Your properties</h2>
        {ownerProperties.length === 0 ? (
          <p className="text-gray-500">
            No properties yet. Add one above to start creating requests.
          </p>
        ) : (
          <div className="space-y-3">
            {ownerProperties.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p>
                    <strong>{p.nickname || p.address}</strong>
                    {p.nickname ? ` - ${p.address}` : ""}
                  </p>
                  {p.unit && <p className="text-sm text-gray-600">Unit {p.unit}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <ExportHistoryButton
                    propertyId={p.id}
                    propertyLabel={p.nickname ? `${p.nickname} - ${p.address}` : p.address}
                  />
                  <DeletePropertyButton propertyId={p.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
