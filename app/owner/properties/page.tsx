import Link from "next/link";
import { inArray } from "drizzle-orm";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { reminders, requests, vaultDocuments } from "@/lib/db/schema";
import { ownerPropertyCareSignal } from "@/lib/owner-readiness";
import { PropertyForm } from "@/components/PropertyForm";
import { DeletePropertyButton } from "@/components/DeletePropertyButton";
import { ExportHistoryButton } from "@/components/ExportHistoryButton";

export default async function PropertiesPage() {
  const session = await requireRole("owner");

  const ownerProperties = await db.query.properties.findMany({
    where: (p, { eq }) => eq(p.ownerId, session.user.id),
    orderBy: (p, { desc }) => desc(p.createdAt),
  });
  const propertyIds = ownerProperties.map((property) => property.id);
  const [ownerRequests, ownerVaultDocs, ownerReminders] = propertyIds.length
    ? await Promise.all([
        db.query.requests.findMany({
          where: inArray(requests.propertyId, propertyIds),
          with: { photos: true },
        }),
        db.query.vaultDocuments.findMany({
          where: inArray(vaultDocuments.propertyId, propertyIds),
        }),
        db.query.reminders.findMany({
          where: inArray(reminders.propertyId, propertyIds),
        }),
      ])
    : [[], [], []];
  const signalClasses = (tone: ReturnType<typeof ownerPropertyCareSignal>["tone"]) =>
    tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : tone === "attention"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : "border-amber-200 bg-amber-50 text-amber-950";
  const signalButtonClasses = (tone: ReturnType<typeof ownerPropertyCareSignal>["tone"]) =>
    tone === "ready"
      ? "bg-emerald-800 hover:bg-emerald-900"
      : tone === "attention"
        ? "bg-blue-800 hover:bg-blue-900"
        : "bg-amber-800 hover:bg-amber-900";

  return (
    <main>
      <div className="mb-6">
        <p className="text-sm font-semibold text-blue-700">Home records</p>
        <h1 className="text-3xl font-bold">Properties</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Each property is the anchor for its requests, proof, documents,
          reminders, and exportable maintenance history.
        </p>
      </div>

      <div className="mb-6 rounded-xl bg-white p-4 shadow">
        <h2 className="mb-4 text-xl font-semibold">Add a property</h2>
        <PropertyForm />
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Your properties</h2>
        {ownerProperties.length === 0 ? (
          <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50 p-5">
            <p className="font-medium text-blue-950">Start with the home itself.</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-900">
              Add the property you want to keep organized first. After that,
              every request, photo, receipt, warranty, and reminder has a clear
              place to live.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {ownerProperties.map((p) => (
              <article key={p.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold">
                      {p.nickname || p.address}
                      {p.nickname ? ` - ${p.address}` : ""}
                    </p>
                    {p.unit && <p className="text-sm text-gray-600">Unit {p.unit}</p>}
                    <dl className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-3">
                      <div>
                        <dt className="font-medium text-gray-900">Requests</dt>
                        <dd>
                          {ownerRequests.filter((request) => request.propertyId === p.id).length}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-900">Documents</dt>
                        <dd>
                          {
                            ownerVaultDocs.filter((document) => document.propertyId === p.id)
                              .length
                          }
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-900">Reminders</dt>
                        <dd>
                          {
                            ownerReminders.filter((reminder) => reminder.propertyId === p.id)
                              .length
                          }
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ExportHistoryButton
                      propertyId={p.id}
                      propertyLabel={p.nickname ? `${p.nickname} - ${p.address}` : p.address}
                    />
                    <DeletePropertyButton propertyId={p.id} />
                  </div>
                </div>

                {(() => {
                  const signal = ownerPropertyCareSignal({
                    propertyId: p.id,
                    requests: ownerRequests,
                    documents: ownerVaultDocs,
                    reminders: ownerReminders,
                  });

                  return (
                    <div
                      className={`mt-4 rounded-lg border p-3 sm:flex sm:items-start sm:justify-between sm:gap-4 ${signalClasses(
                        signal.tone
                      )}`}
                    >
                      <div>
                        <p className="text-sm font-semibold">{signal.label}</p>
                        <p className="mt-1 text-sm leading-6">{signal.detail}</p>
                      </div>
                      <Link
                        href={signal.href}
                        className={`mt-3 inline-flex items-center justify-center rounded px-3 py-2 text-sm font-medium text-white sm:mt-0 ${signalButtonClasses(
                          signal.tone
                        )}`}
                      >
                        {signal.cta}
                      </Link>
                    </div>
                  );
                })()}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
