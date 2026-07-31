import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { VaultManager } from "@/components/VaultManager";

export default async function VaultPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const session = await requireRole("owner");
  const { propertyId } = await searchParams;

  const ownerProperties = await db.query.properties.findMany({
    where: (p, { eq }) => eq(p.ownerId, session.user.id),
    orderBy: (p, { desc }) => desc(p.createdAt),
  });

  const selectedPropertyId =
    propertyId && ownerProperties.some((p) => p.id === propertyId)
      ? propertyId
      : ownerProperties[0]?.id;

  const documents = selectedPropertyId
    ? await db.query.vaultDocuments.findMany({
        where: (v, { eq }) => eq(v.propertyId, selectedPropertyId),
        orderBy: (v, { desc }) => desc(v.createdAt),
      })
    : [];

  return (
    <main>
      <h1 className="text-3xl font-bold mb-2">🗄️ Property Vault</h1>
      <p className="text-sm text-gray-500 mb-4">
        Receipts, warranties, manuals, invoices, and inspection reports for a
        property — independent of any single request.
      </p>

      {ownerProperties.length === 0 ? (
        <p className="text-gray-500">
          No properties yet.{" "}
          <Link href="/owner/properties" className="text-blue-600 underline">
            Add one first
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Property</label>
            <div className="flex flex-wrap gap-2">
              {ownerProperties.map((p) => (
                <Link
                  key={p.id}
                  href={`/owner/vault?propertyId=${p.id}`}
                  className={`text-sm px-3 py-1 rounded-full border whitespace-nowrap ${
                    selectedPropertyId === p.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {p.nickname ? `${p.nickname} — ${p.address}` : p.address}
                </Link>
              ))}
            </div>
          </div>

          {selectedPropertyId && (
            <VaultManager
              propertyId={selectedPropertyId}
              documents={documents}
              userId={session.user.id}
            />
          )}
        </>
      )}
    </main>
  );
}
