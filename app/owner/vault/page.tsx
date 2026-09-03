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
          ? "border-cyan-200 bg-cyan-50 text-cyan-950"
          : "border-gray-200 bg-white text-gray-950";

  return (
    <main className="max-w-6xl">
      <section className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-5 text-white">
          <p className="text-sm font-semibold text-emerald-300">Property history</p>
          <h1 className="mt-2 text-3xl font-bold">Property vault</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
            Receipts, warranties, manuals, invoices, and inspection reports for a
            property, independent of any single request.
          </p>
          {ownerProperties.length > 0 && (
            <Link
              href="#vault-manager"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-md active:translate-y-0"
            >
              Add a document
            </Link>
          )}
        </div>
        {ownerProperties.length > 0 && (
          <div className="grid gap-3 border-t border-slate-200 p-5 md:grid-cols-2 xl:grid-cols-4">
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
        )}
      </section>

      {ownerProperties.length === 0 ? (
        <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50 p-5">
          <p className="font-semibold text-blue-950">Add a property first.</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-900">
            The vault is organized per property. Add the home you want to keep
            records for, then receipts, warranties, and manuals have a place to
            live.
          </p>
          <Link
            href="/owner/properties"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-md active:translate-y-0"
          >
            Add a property
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="mb-2 text-sm font-semibold text-gray-700">Property</p>
            <div className="flex flex-wrap gap-2">
              {ownerProperties.map((p) => (
                <Link
                  key={p.id}
                  href={`/owner/vault?propertyId=${p.id}`}
                  className={`max-w-full truncate rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-transform duration-150 hover:scale-105 active:scale-95 ${
                    selectedPropertyId === p.id
                      ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {p.nickname ? `${p.nickname} - ${p.address}` : p.address}
                </Link>
              ))}
            </div>
          </div>

          {selectedPropertyId && (
            <div id="vault-manager" className="scroll-mt-6">
              <VaultManager
                propertyId={selectedPropertyId}
                documents={documents}
                userId={session.user.id}
              />
            </div>
          )}
        </>
      )}
    </main>
  );
}
