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
        : "border-cyan-200 bg-cyan-50 text-cyan-950";
  const signalButtonClasses = (tone: ReturnType<typeof ownerPropertyCareSignal>["tone"]) =>
    tone === "ready"
      ? "bg-emerald-800 hover:bg-emerald-900"
      : tone === "attention"
        ? "bg-blue-800 hover:bg-blue-900"
        : "bg-cyan-800 hover:bg-cyan-900";

  const portfolioStats = [
    { label: "Properties", value: ownerProperties.length },
    { label: "Requests", value: ownerRequests.length },
    { label: "Documents", value: ownerVaultDocs.length },
    { label: "Reminders", value: ownerReminders.length },
  ];

  return (
    <main className="max-w-6xl">
      <section className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-5 text-white">
          <p className="text-sm font-semibold text-emerald-300">Home records</p>
          <h1 className="mt-2 text-3xl font-bold">Properties</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
            Each property anchors its own requests, proof, documents, reminders, and
            exportable maintenance history.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-slate-200 bg-slate-200 md:grid-cols-4">
          {portfolioStats.map((stat) => (
            <div key={stat.label} className="bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-600">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-950">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Add a property</h2>
        <PropertyForm />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Your properties</h2>
        {ownerProperties.length === 0 ? (
          <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50 p-5">
            <p className="font-semibold text-blue-950">Start with the home itself.</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-900">
              Add the property you want to keep organized first. After that,
              every request, photo, receipt, warranty, and reminder has a clear
              place to live.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {ownerProperties.map((p) => {
              const signal = ownerPropertyCareSignal({
                propertyId: p.id,
                requests: ownerRequests,
                documents: ownerVaultDocs,
                reminders: ownerReminders,
              });
              const facts = [
                {
                  label: "Requests",
                  value: ownerRequests.filter((request) => request.propertyId === p.id).length,
                },
                {
                  label: "Documents",
                  value: ownerVaultDocs.filter((document) => document.propertyId === p.id).length,
                },
                {
                  label: "Reminders",
                  value: ownerReminders.filter((reminder) => reminder.propertyId === p.id).length,
                },
              ];

              return (
                <article
                  key={p.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-lg font-semibold">
                        {p.nickname || p.address}
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

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {facts.map((fact) => (
                      <div
                        key={fact.label}
                        className="rounded border border-gray-200 bg-gray-50 p-2"
                      >
                        <p className="text-xs font-semibold text-gray-500">{fact.label}</p>
                        <p className="mt-1 text-lg font-bold text-gray-950">{fact.value}</p>
                      </div>
                    ))}
                  </div>

                  <div
                    className={`mt-4 rounded-lg border p-3 sm:flex sm:items-start sm:justify-between sm:gap-4 ${signalClasses(
                      signal.tone
                    )}`}
                  >
                    <div>
                      <p className="text-sm font-bold">{signal.label}</p>
                      <p className="mt-1 text-sm leading-6">{signal.detail}</p>
                    </div>
                    <Link
                      href={signal.href}
                      className={`mt-3 inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 sm:mt-0 ${signalButtonClasses(
                        signal.tone
                      )}`}
                    >
                      {signal.cta}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
