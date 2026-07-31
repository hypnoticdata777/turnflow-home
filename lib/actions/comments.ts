"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { requireAnyRole } from "@/lib/auth/dal";

/** A shared update thread on a request, postable by the owner, the assigned vendor, or the shared collaborator — separate from the decision log, which is system-generated. */
export async function createCommentAction(requestId: string, text: string) {
  const session = await requireAnyRole(["owner", "vendor", "collaborator"]);

  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });
  const isOwner = req?.ownerId === session.user.id;
  const isAssignedVendor = req?.assignedVendorId === session.user.id;
  const isCollaborator = req?.collaboratorId === session.user.id;
  if (!req || !(isOwner || isAssignedVendor || isCollaborator)) {
    throw new Error("Not authorized to comment on this request");
  }

  const trimmed = text.trim();
  if (!trimmed) return;

  await db.insert(comments).values({
    requestId,
    authorId: session.user.id,
    text: trimmed,
  });

  revalidatePath(`/owner/requests/${requestId}`);
  revalidatePath("/collaborator");
}
