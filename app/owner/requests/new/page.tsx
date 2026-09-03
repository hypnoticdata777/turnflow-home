import Link from "next/link";
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
    <main className="space-y-6">
      <section className="max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-5 text-white">
          <p className="text-sm font-semibold text-emerald-300">Owner intake</p>
          <h1 className="mt-2 text-3xl font-bold">New maintenance request</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
            Save the repair as a private owner record first, then add enough
            location, access, contact, notes, and photo context to make vendor
            handoff smoother when you are ready to share it.
          </p>
          <Link
            href="#request-property"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-md active:translate-y-0"
          >
            Start the draft
          </Link>
        </div>
      </section>
      <NewRequestForm properties={ownerProperties} userId={session.user.id} />
    </main>
  );
}
