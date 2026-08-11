"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { closeoutSubmissions, decisionLog, requests } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";
import {
  closeoutReadiness,
  normalizeCloseoutNotes,
  parseCloseoutAmount,
} from "@/lib/closeout-submissions";
import { sendNotification } from "@/lib/email";

export type SubmitCloseoutResult = { ok: true; closeoutId: string } | { error: string };

export async function submitCloseoutAction(
  requestId: string,
  formData: FormData
): Promise<SubmitCloseoutResult> {
  const session = await requireRole("vendor");
  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });
  if (!req || req.assignedVendorId !== session.user.id) {
    return { error: "Only the assigned vendor can submit closeout." };
  }

  const completionNotes = normalizeCloseoutNotes(
    String(formData.get("completionNotes") ?? "")
  );
  const materialsNotes = normalizeCloseoutNotes(
    String(formData.get("materialsNotes") ?? ""),
    800
  );
  const finalAmount = parseCloseoutAmount(formData.get("finalAmount"));
  if (!completionNotes) {
    return { error: "Add completion notes before submitting closeout." };
  }

  const photos = await db.query.requestPhotos.findMany({
    where: (photo, { eq }) => eq(photo.requestId, requestId),
    columns: { type: true },
  });
  const tasks = await db.query.requestTasks.findMany({
    where: (task, { eq }) => eq(task.requestId, requestId),
    columns: { status: true },
  });
  const readiness = closeoutReadiness({ photos, tasks, finalAmount });
  if (!finalAmount || !readiness.ready) {
    return { error: readiness.detail };
  }

  const [created] = await db
    .insert(closeoutSubmissions)
    .values({
      requestId,
      vendorId: session.user.id,
      completionNotes,
      materialsNotes: materialsNotes || null,
      finalAmount,
    })
    .returning({ id: closeoutSubmissions.id });

  const nextStatus =
    req.status === "Complete" || req.status === "Archived" ? req.status : "Needs Review";
  await db
    .update(requests)
    .set({
      finalCost: finalAmount,
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));

  await db.insert(decisionLog).values({
    requestId,
    actorId: session.user.id,
    action: "closeout_submitted",
    details: {
      closeoutId: created.id,
      finalAmount,
      summary: completionNotes,
      from: req.status,
      to: nextStatus,
    },
  });

  const owner = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, req.ownerId),
    columns: { email: true },
  });
  await sendNotification({
    ownerId: req.ownerId,
    requestId,
    type: "closeout_submitted",
    recipientEmail: owner?.email ?? null,
    subject: `TurnFlow Home: closeout submitted for "${req.title}"`,
    text: `The assigned vendor submitted closeout for "${req.title}" with a final amount of $${Number(
      finalAmount
    ).toFixed(2)}. Review the proof, task acceptance, and notes before marking complete.`,
  });

  revalidatePath("/vendor");
  revalidatePath(`/owner/requests/${requestId}`);
  revalidatePath("/owner/dashboard");
  return { ok: true, closeoutId: created.id };
}
