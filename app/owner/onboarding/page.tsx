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

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.8 7.8a1 1 0 0 1-1.4 0l-3.8-3.8a1 1 0 1 1 1.4-1.4l3.1 3.09 7.1-7.09a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

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
  const primary = nextStep
    ? { href: nextStep.href, label: nextStep.cta }
    : { href: "/owner/requests/new", label: "Log another request" };

  return (
    <main className="max-w-5xl">
      <section className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-5 text-white">
          <p className="text-sm font-semibold text-emerald-300">Homeowner setup</p>
          <h1 className="mt-2 text-3xl font-bold">Build your first repair record</h1>
          <p className="mt-3 text-lg font-semibold">{summary.headline}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">{summary.detail}</p>

          <div className="mt-5" aria-label="Owner setup progress">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase text-slate-300">
              <span>First-run progress</span>
              <span>
                {completedCount}/{totalCount} ready
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-emerald-400"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={primary.href}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-md active:translate-y-0"
            >
              {primary.label}
            </Link>
            <Link
              href="/owner/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-500 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition duration-150 hover:bg-slate-800"
            >
              Open owner dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px bg-slate-200 sm:grid-cols-6">
          {steps.map((step, index) => (
            <div key={step.title} className="bg-white p-3 text-center">
              <p className="text-xs font-semibold uppercase text-gray-400">
                Step {index + 1}
              </p>
              <p
                className={`mt-1 inline-flex items-center gap-1 text-sm font-bold ${
                  step.complete ? "text-emerald-700" : "text-cyan-700"
                }`}
              >
                {step.complete ? (
                  <>
                    <CheckIcon /> Done
                  </>
                ) : (
                  "To do"
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className={`flex flex-col rounded-lg border p-5 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md ${
              step.complete ? "border-emerald-200 bg-emerald-50" : "border-cyan-200 bg-cyan-50"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Step {index + 1}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-gray-950">{step.title}</h2>
              </div>
              <span
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-white ${
                  step.complete ? "bg-emerald-600" : "bg-cyan-600"
                }`}
              >
                {step.complete ? (
                  <>
                    <CheckIcon /> Done
                  </>
                ) : (
                  "Needs work"
                )}
              </span>
            </div>
            <p className="mt-3 flex-1 text-sm leading-6 text-gray-700">{step.detail}</p>
            <Link
              href={step.href}
              className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${
                step.complete ? "bg-gray-800 hover:bg-gray-900" : "bg-cyan-800 hover:bg-cyan-900"
              }`}
            >
              {step.cta}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
