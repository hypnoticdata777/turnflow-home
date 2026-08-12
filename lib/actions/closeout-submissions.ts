"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  billingRecords,
  closeoutSubmissions,
  decisionLog,
  requests,
  requestTasks,
} from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";
import {
  closeoutReadiness,
  isCloseoutReviewDecision,
  normalizeCloseoutNotes,
  parseCloseoutAmount,
  type CloseoutReviewDecision,
} from "@/lib/closeout-submissions";
import { sendNotification } from "@/lib/email";

export type SubmitCloseoutResult = { ok: true; closeoutId: string } | { error: string };
export type ReviewCloseoutResult = { ok: true; decision: CloseoutReviewDecision } | { error: string };

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

  const photos = await db.query.requestPhotos.findMany({
    where: (photo, { eq }) => eq(photo.requestId, requestId),
    columns: { type: true },
  });
  const tasks = await db.query.requestTasks.findMany({
    where: (task, { eq }) => eq(task.requestId, requestId),
    columns: { status: true },
  });
  const readiness = closeoutReadiness({ photos, tasks, finalAmount, completionNotes });
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

export async function reviewCloseoutSubmissionAction(
  requestId: string,
  closeoutId: string,
  decision: string,
  formData: FormData
): Promise<ReviewCloseoutResult> {
  const session = await requireRole("owner");
  if (!isCloseoutReviewDecision(decision)) {
    return { error: "Choose a valid closeout decision." };
  }

  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });
  if (!req || req.ownerId !== session.user.id) {
    return { error: "Only the owner can review this closeout." };
  }

  const closeout = await db.query.closeoutSubmissions.findFirst({
    where: (submission, { eq }) => eq(submission.id, closeoutId),
  });
  if (!closeout || closeout.requestId !== requestId) {
    return { error: "Closeout submission not found." };
  }

  const reviewNotes = normalizeCloseoutNotes(String(formData.get("reviewNotes") ?? ""), 800);
  if (decision === "changes_requested" && !reviewNotes) {
    return { error: "Add a note explaining what needs to change." };
  }

  const reviewedAt = new Date();
  await db
    .update(closeoutSubmissions)
    .set({
      status: decision,
      reviewNotes: reviewNotes || null,
      reviewedById: session.user.id,
      reviewedAt,
      updatedAt: reviewedAt,
    })
    .where(and(eq(closeoutSubmissions.id, closeoutId), eq(closeoutSubmissions.requestId, requestId)));

  if (decision === "approved") {
    await db
      .update(requests)
      .set({
        finalCost: closeout.finalAmount,
        status: "Complete",
        updatedAt: reviewedAt,
      })
      .where(eq(requests.id, requestId));
    await db
      .update(requestTasks)
      .set({
        acceptedById: session.user.id,
        acceptedAt: reviewedAt,
        updatedAt: reviewedAt,
      })
      .where(
        and(
          eq(requestTasks.requestId, requestId),
          eq(requestTasks.status, "done"),
          isNull(requestTasks.acceptedAt)
        )
      );
    const existingBillingRecord = await db.query.billingRecords.findFirst({
      where: (record, { eq }) => eq(record.closeoutSubmissionId, closeout.id),
      columns: { id: true },
    });
    if (!existingBillingRecord) {
      await db.insert(billingRecords).values({
        requestId,
        ownerId: req.ownerId,
        vendorId: closeout.vendorId,
        closeoutSubmissionId: closeout.id,
        amount: closeout.finalAmount,
        notes: "Generated from approved vendor closeout.",
      });
    }
  }

  await db.insert(decisionLog).values({
    requestId,
    actorId: session.user.id,
    action:
      decision === "approved"
        ? "closeout_approved"
        : "closeout_changes_requested",
    details: {
      closeoutId,
      finalAmount: closeout.finalAmount,
      reviewNotes: reviewNotes || null,
    },
  });

  const vendor = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, closeout.vendorId),
    columns: { email: true },
  });
  await sendNotification({
    ownerId: req.ownerId,
    requestId,
    type: decision === "approved" ? "closeout_approved" : "closeout_changes_requested",
    recipientEmail: vendor?.email ?? null,
    subject:
      decision === "approved"
        ? `TurnFlow Home: closeout approved for "${req.title}"`
        : `TurnFlow Home: closeout changes requested for "${req.title}"`,
    text:
      decision === "approved"
        ? `The owner approved closeout for "${req.title}" and marked the request complete.`
        : `The owner requested closeout changes for "${req.title}"${
            reviewNotes ? `: ${reviewNotes}` : "."
          }`,
  });

  revalidatePath("/vendor");
  revalidatePath(`/owner/requests/${requestId}`);
  revalidatePath("/owner/dashboard");
  return { ok: true, decision };
}
