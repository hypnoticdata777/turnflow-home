import Link from "next/link";
import { inArray } from "drizzle-orm";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { vaultDocuments } from "@/lib/db/schema";
import { ownerVaultValueMetrics } from "@/lib/owner-readiness";
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

  const propertyIds = ownerProperties.map((property) => property.id);
  const allDocuments = propertyIds.length
    ? await db.query.vaultDocuments.findMany({
        where: inArray(vaultDocuments.propertyId, propertyIds),
        orderBy: (v, { desc }) => desc(v.createdAt),
      })
    : [];
  const documents = selectedPropertyId
    ? allDocuments.filter((document) => document.propertyId === selectedPropertyId)
    : [];
  const valueMetrics = ownerVaultValueMetrics({
    properties: ownerProperties,
    documents: allDocuments,
    selectedPropertyId,
  });
  const metricClasses = (tone: (typeof valueMetrics)[number]["tone"]) =>
    tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : tone === "attention"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : tone === "progress"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-gray-200 bg-white text-gray-950";

  return (
    <main>
      <h1 className="mb-2 text-3xl font-bold">Property vault</h1>
      <p className="mb-4 text-sm text-gray-500">
        Receipts, warranties, manuals, invoices, and inspection reports for a
        property, independent of any single request.
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
            <label className="mb-1 block text-sm font-medium">Property</label>
            <div className="flex flex-wrap gap-2">
              {ownerProperties.map((p) => (
                <Link
                  key={p.id}
                  href={`/owner/vault?propertyId=${p.id}`}
                  className={`rounded-full border px-3 py-1 text-sm whitespace-nowrap ${
                    selectedPropertyId === p.id
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {p.nickname ? `${p.nickname} - ${p.address}` : p.address}
                </Link>
              ))}
            </div>
          </div>

          <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-semibold text-blue-700">Property history</p>
              <h2 className="text-2xl font-bold text-gray-950">
                What this vault protects after the work is done
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {valueMetrics.map((metric) => (
                <article
                  key={metric.label}
                  className={`rounded-lg border p-4 ${metricClasses(metric.tone)}`}
                >
                  <p className="text-sm font-semibold">{metric.label}</p>
                  <p className="mt-2 text-3xl font-bold">{metric.value}</p>
                  <p className="mt-2 min-h-20 text-sm leading-6">{metric.detail}</p>
                </article>
              ))}
            </div>
          </section>

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
