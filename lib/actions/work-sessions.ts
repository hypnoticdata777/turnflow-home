"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { decisionLog, requestTasks, requests, workSessions } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";
import {
  WORK_SESSION_EVENT_LABELS,
  isWorkSessionEvent,
  normalizeWorkSessionTaskLabel,
  workSessionProofRequirement,
  type WorkSessionEvent,
} from "@/lib/work-sessions";
import { sendNotification } from "@/lib/email";
import type { RequestStatus } from "@/lib/utils";

export type RecordWorkSessionEventResult =
  | { ok: true; event: WorkSessionEvent }
  | { error: string };

function nextStatusForEvent(
  event: WorkSessionEvent,
  currentStatus: RequestStatus
): RequestStatus {
  if (currentStatus === "Complete" || currentStatus === "Archived") return currentStatus;
  if (event === "started" || event === "resumed") return "In Progress";
  if (event === "stopped") return "Needs Review";
  return currentStatus;
}

export async function recordWorkSessionEventAction(
  requestId: string,
  event: string,
  notes: string,
  taskLabel: string,
  proofPhotoId?: string | null,
  requestTaskId?: string | null
): Promise<RecordWorkSessionEventResult> {
  const session = await requireRole("vendor");
  if (!isWorkSessionEvent(event)) {
    return { error: "Choose a valid work event." };
  }

  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });
  if (!req || req.assignedVendorId !== session.user.id) {
    return { error: "Only the assigned vendor can record work sessions." };
  }

  const trimmedNotes = notes.trim().slice(0, 500);
  const requestTask = requestTaskId
    ? await db.query.requestTasks.findFirst({
        where: (task, { eq }) => eq(task.id, requestTaskId),
      })
    : null;
  if (requestTaskId && (!requestTask || requestTask.requestId !== requestId)) {
    return { error: "Choose a valid project task for this request." };
  }

  const normalizedTaskLabel = normalizeWorkSessionTaskLabel(requestTask?.title ?? taskLabel);
  const proofRequirement = workSessionProofRequirement(event);
  const proofPhoto = proofPhotoId
    ? await db.query.requestPhotos.findFirst({
        where: (photo, { eq }) => eq(photo.id, proofPhotoId),
      })
    : null;

  if (proofRequirement.required && !proofPhoto) {
    return { error: `${proofRequirement.label}. Upload the required proof photo first.` };
  }

  if (proofPhoto) {
    if (
      proofPhoto.requestId !== requestId ||
      proofPhoto.uploadedById !== session.user.id ||
      (proofRequirement.photoType && proofPhoto.type !== proofRequirement.photoType)
    ) {
      return {
        error: proofRequirement.photoType
          ? `Use a ${proofRequirement.photoType} photo captured for this work event.`
          : "Use a photo captured for this request.",
      };
    }
  }

  const nextStatus = nextStatusForEvent(event, req.status);

  await db.insert(workSessions).values({
    requestId,
    vendorId: session.user.id,
    proofPhotoId: proofPhoto?.id ?? null,
    requestTaskId: requestTask?.id ?? null,
    taskLabel: normalizedTaskLabel,
    event,
    notes: trimmedNotes || null,
  });

  if (nextStatus !== req.status) {
    await db
      .update(requests)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(requests.id, requestId));
  }

  if (requestTask) {
    const taskStatus =
      event === "stopped"
        ? "done"
        : event === "paused"
          ? "blocked"
          : "in_progress";
    await db
      .update(requestTasks)
      .set({ status: taskStatus, updatedAt: new Date() })
      .where(eq(requestTasks.id, requestTask.id));
  }

  await db.insert(decisionLog).values({
    requestId,
    actorId: session.user.id,
    action: "work_session_event",
    details: {
      event,
      label: WORK_SESSION_EVENT_LABELS[event],
      taskLabel: normalizedTaskLabel,
      requestTaskId: requestTask?.id ?? null,
      notes: trimmedNotes || null,
      proofPhotoId: proofPhoto?.id ?? null,
      proofPhotoType: proofPhoto?.type ?? null,
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
    type: "work_session_event",
    recipientEmail: owner?.email ?? null,
    subject: `TurnFlow Home: ${WORK_SESSION_EVENT_LABELS[event].toLowerCase()} for "${req.title}"`,
    text: `${WORK_SESSION_EVENT_LABELS[event]} for "${req.title}" (${normalizedTaskLabel})${
      trimmedNotes ? `: ${trimmedNotes}` : "."
    }`,
  });

  revalidatePath("/vendor");
  revalidatePath(`/owner/requests/${requestId}`);
  revalidatePath("/owner/dashboard");
  return { ok: true, event };
}
