import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { RequestDetailView } from "@/components/RequestDetailView";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("owner");
  const { id } = await params;

  const request = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, id),
    with: { property: true, photos: true, quotes: true, log: true, comments: true },
  });

  if (!request || request.ownerId !== session.user.id) {
    notFound();
  }

  return (
    <main>
      <RequestDetailView
        request={request}
        photos={request.photos}
        quotes={request.quotes}
        log={request.log}
        comments={request.comments}
        property={request.property}
        userId={session.user.id}
      />
    </main>
  );
}
