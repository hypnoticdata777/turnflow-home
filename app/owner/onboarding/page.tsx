import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { invites, properties, reminders, requests, vaultDocuments } from "@/lib/db/schema";

type SetupStep = {
  title: string;
  detail: string;
  complete: boolean;
  href: string;
  cta: string;
};

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

  const hasProperty = ownerProperties.length > 0;
  const hasRequest = ownerRequests.length > 0;
  const hasPhoto = ownerRequests.some((request) => request.photos.length > 0);
  const hasHelper =
    ownerInvites.length > 0 ||
    ownerRequests.some((request) => request.assignedVendorId || request.collaboratorId);
  const hasVaultDoc = ownerVaultDocs.length > 0;
  const hasReminder = ownerReminders.length > 0;

  const steps: SetupStep[] = [
    {
      title: "Create your first property",
      detail: "Anchor every repair, receipt, and reminder to the home it belongs to.",
      complete: hasProperty,
      href: "/owner/properties",
      cta: hasProperty ? "Review properties" : "Add property",
    },
    {
      title: "Log one active maintenance issue",
      detail: "Capture the problem while the details are still fresh.",
      complete: hasRequest,
      href: "/owner/requests/new",
      cta: hasRequest ? "Review requests" : "Create request",
    },
    {
      title: "Attach proof or context",
      detail: "Add a photo, receipt, or note that would help another person understand the work.",
      complete: hasPhoto,
      href: ownerRequests[0] ? `/owner/requests/${ownerRequests[0].id}` : "/owner/requests/new",
      cta: hasPhoto ? "Review evidence" : "Add evidence",
    },
    {
      title: "Bring in the right person",
      detail: "Invite a vendor or helper when the repair needs someone outside the household.",
      complete: hasHelper,
      href: ownerRequests[0] ? `/owner/requests/${ownerRequests[0].id}` : "/owner/requests/new",
      cta: hasHelper ? "Review helpers" : "Open request",
    },
    {
      title: "Preserve the repair history",
      detail: "Store one useful document so the record survives beyond the job.",
      complete: hasVaultDoc,
      href: "/owner/vault",
      cta: hasVaultDoc ? "Review vault" : "Add document",
    },
    {
      title: "Set one recurring reminder",
      detail: "Turn an easy-to-forget task into a scheduled homeowner routine.",
      complete: hasReminder,
      href: "/owner/calendar",
      cta: hasReminder ? "Review reminders" : "Add reminder",
    },
  ];

  const completedCount = steps.filter((step) => step.complete).length;
  const progress = Math.round((completedCount / steps.length) * 100);

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

      <section className="mb-6 border border-gray-200 bg-white p-5 rounded-lg shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">First-run progress</p>
            <p className="text-3xl font-bold">{progress}%</p>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 md:max-w-xl">
            <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm font-medium text-gray-700">
            {completedCount} of {steps.length} done
          </p>
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
              className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              {step.cta}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
