import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { invites, properties, reminders, requests, vaultDocuments } from "@/lib/db/schema";
import {
  ownerNextSetupStep,
  ownerSetupProgress,
  ownerSetupSteps,
  ownerSetupSummary,
} from "@/lib/owner-readiness";

export default async function OwnerOnboardingPage() {
  const session = await requireRole("owner");

  const [ownerProperties, ownerRequests, ownerInvites] = await Promise.all([
    db.query.properties.findMany({
      where: eq(properties.ownerId, session.user.id),
      orderBy: (p, { desc }) => desc(p.createdAt),
    }),
    db.query.requests.findMany({
      where: eq(requests.ownerId, session.user.id),
      orderBy: (r, { desc }) => desc(r.createdAt),
      with: { photos: true },
    }),
    db.query.invites.findMany({
      where: eq(invites.ownerId, session.user.id),
      orderBy: (i, { desc }) => desc(i.createdAt),
    }),
  ]);

  const propertyIds = ownerProperties.map((property) => property.id);
  const [ownerVaultDocs, ownerReminders] = propertyIds.length
    ? await Promise.all([
        db.query.vaultDocuments.findMany({
          where: inArray(vaultDocuments.propertyId, propertyIds),
        }),
        db.query.reminders.findMany({
          where: inArray(reminders.propertyId, propertyIds),
        }),
      ])
    : [[], []];

  const readinessInput = {
    properties: ownerProperties,
    requests: ownerRequests,
    invites: ownerInvites,
    vaultDocuments: ownerVaultDocs,
    reminders: ownerReminders,
  };
  const steps = ownerSetupSteps(readinessInput, ownerRequests[0]?.id);
  const { completedCount, totalCount, progress } = ownerSetupProgress(steps);
  const nextStep = ownerNextSetupStep(steps);
  const summary = ownerSetupSummary(steps);
  const summaryClasses =
    summary.tone === "ready"
      ? "border-green-200 bg-green-50 text-green-950"
      : summary.tone === "empty"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : "border-amber-200 bg-amber-50 text-amber-950";

  return (
    <main className="max-w-5xl">
      <div className="mb-6">
        <p className="text-sm font-semibold text-blue-700">Homeowner setup</p>
        <h1 className="text-3xl font-bold">Build your first repair record</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Walk one real scenario from property setup to proof, help, history, and
          reminders. This is the core path to test with homeowners.
        </p>
      </div>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">First-run progress</p>
            <p className="text-3xl font-bold">{progress}%</p>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 md:max-w-xl">
            <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm font-medium text-gray-700">
            {completedCount} of {totalCount} done
          </p>
        </div>
      </section>

      <section className={`mb-6 rounded-lg border p-5 ${summaryClasses}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{summary.headline}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6">{summary.detail}</p>
          </div>
          {nextStep && (
            <Link
              href={nextStep.href}
              className="inline-flex items-center justify-center rounded-lg bg-gray-950 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-black"
            >
              {nextStep.cta}
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className="border border-gray-200 bg-white p-5 rounded-lg shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Step {index + 1}
                </p>
                <h2 className="mt-1 text-lg font-semibold">{step.title}</h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  step.complete
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {step.complete ? "Done" : "Needs work"}
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-600">{step.detail}</p>
            <Link
              href={step.href}
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-800"
            >
              {step.cta}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
