"use server";

import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requests, requestPhotos, decisionLog } from "@/lib/db/schema";
import { requireRole, requireAnyRole } from "@/lib/auth/dal";
import { sendNotification } from "@/lib/email";
import {
  REQUEST_CATEGORIES,
  REQUEST_STATUSES,
  REQUEST_URGENCIES,
  CONTACT_METHODS,
  meetsCompletionRequirements,
  type RequestStatus,
} from "@/lib/utils";

export type CreateRequestResult = { requestId: string } | { error: string };

/**
 * Creates a request and returns its id. Inline photo capture (Package 1)
 * happens in two steps from the client: this action creates the row
 * first (photo Blob paths need a real requestId to be scoped under),
 * then the client uploads each queued file via @vercel/blob/client and
 * calls recordRequestPhotoAction() per file — mirrors the Firebase
 * build's "create request, then loop uploadRequestPhoto()" sequencing.
 */
export async function createRequestAction(
  formData: FormData
): Promise<CreateRequestResult> {
  const session = await requireRole("owner");

  const propertyId = String(formData.get("propertyId") || "");
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "");
  const urgency = String(formData.get("urgency") || "");
  const location = String(formData.get("location") || "").trim();
  const contactMethod = String(formData.get("contactMethod") || "");
  const accessInstructions = String(formData.get("accessInstructions") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!propertyId || !title || !category || !urgency) {
    return { error: "Property, title, category, and urgency are required." };
  }
  if (!(REQUEST_CATEGORIES as readonly string[]).includes(category)) {
    return { error: "Invalid category." };
  }
  if (!(REQUEST_URGENCIES as readonly string[]).includes(urgency)) {
    return { error: "Invalid urgency." };
  }

  const property = await db.query.properties.findFirst({
    where: (p, { eq }) => eq(p.id, propertyId),
  });
  if (!property || property.ownerId !== session.user.id) {
    return { error: "Invalid property." };
  }

  const [created] = await db
    .insert(requests)
    .values({
      ownerId: session.user.id,
      propertyId,
      title,
      category,
      urgency,
      location: location || null,
      contactMethod: CONTACT_METHODS.includes(contactMethod as (typeof CONTACT_METHODS)[number])
        ? contactMethod
        : null,
      accessInstructions: accessInstructions || null,
      notes: notes || null,
      status: "Draft",
    })
    .returning({ id: requests.id });

  revalidatePath("/owner/dashboard");
  return { requestId: created.id };
}

/** Owner or the assigned vendor may attach photos — matches storage.rules' original write scoping. */
export async function recordRequestPhotoAction(
  requestId: string,
  type: "before" | "after" | "receipt" | "other",
  url: string,
  blobPath: string
) {
  const session = await requireAnyRole(["owner", "vendor"]);

  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });
  const isOwner = req?.ownerId === session.user.id;
  const isAssignedVendor = req?.assignedVendorId === session.user.id;
  if (!req || !(isOwner || isAssignedVendor)) {
    throw new Error("Not authorized to add a photo to this request");
  }

  await db.insert(requestPhotos).values({
    requestId,
    type,
    url,
    blobPath,
    uploadedById: session.user.id,
  });

  revalidatePath(`/owner/requests/${requestId}`);
  revalidatePath("/vendor");
}

export type UpdateRequestState = { error?: string } | undefined;

export async function updateRequestAction(
  requestId: string,
  _prevState: UpdateRequestState,
  formData: FormData
): Promise<UpdateRequestState> {
  const session = await requireRole("owner");

  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });
  if (!req || req.ownerId !== session.user.id) {
    return { error: "Not authorized to edit this request." };
  }

  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "");
  const urgency = String(formData.get("urgency") || "");
  if (!title || !category || !urgency) {
    return { error: "Title, category, and urgency are required." };
  }

  await db
    .update(requests)
    .set({
      title,
      category,
      urgency,
      location: String(formData.get("location") || "").trim() || null,
      contactMethod: String(formData.get("contactMethod") || "") || null,
      accessInstructions:
        String(formData.get("accessInstructions") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));

  revalidatePath("/owner/dashboard");
  revalidatePath(`/owner/requests/${requestId}`);
  redirect("/owner/dashboard");
}

export async function deleteRequestAction(requestId: string) {
  const session = await requireRole("owner");

  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });
  if (!req || req.ownerId !== session.user.id) {
    throw new Error("Not authorized to delete this request");
  }

  const photos = await db.query.requestPhotos.findMany({
    where: (p, { eq }) => eq(p.requestId, requestId),
    columns: { blobPath: true },
  });
  await Promise.allSettled(photos.map((p) => del(p.blobPath)));

  await db.delete(requests).where(eq(requests.id, requestId));
  revalidatePath("/owner/dashboard");
}

/** BRL3: three independent, owner-editable cost fields — costForRequest()/costLabelForRequest() in lib/utils.ts resolve which one is "current". Nothing here gates which field can be set when, matching the original build. */
export async function updateCostAction(
  requestId: string,
  costs: { estimatedCost: string; quotedCost: string; finalCost: string }
) {
  const session = await requireRole("owner");

  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });
  if (!req || req.ownerId !== session.user.id) {
    throw new Error("Not authorized to edit this request");
  }

  const toNumeric = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) return null;
    const num = Number.parseFloat(trimmed);
    return Number.isFinite(num) ? num.toFixed(2) : null;
  };

  await db
    .update(requests)
    .set({
      estimatedCost: toNumeric(costs.estimatedCost),
      quotedCost: toNumeric(costs.quotedCost),
      finalCost: toNumeric(costs.finalCost),
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));

  revalidatePath(`/owner/requests/${requestId}`);
  revalidatePath("/owner/dashboard");
}

/**
 * Owner or the assigned vendor may move a request's status — matches
 * firestore.rules' original two-way update rule. Every status change
 * writes an append-only decision-log entry (BRL2/BRL7); a transition to
 * Complete without the required proof on record (BRL2: final cost, an
 * "after" photo, an assigned vendor) is only permitted with an explicit
 * waiver reason. This action re-checks that server-side so callers cannot
 * bypass the client prompt.
 */
export async function updateRequestStatusAction(
  requestId: string,
  status: string,
  waiverReason?: string
) {
  const session = await requireAnyRole(["owner", "vendor"]);

  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });
  const isOwner = req?.ownerId === session.user.id;
  const isAssignedVendor = req?.assignedVendorId === session.user.id;
  if (!req || !(isOwner || isAssignedVendor)) {
    throw new Error("Not authorized to update this request");
  }

  if (!(REQUEST_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Invalid request status");
  }

  const nextStatus = status as RequestStatus;
  let completionWaiverReason: string | undefined;

  if (nextStatus === "Complete") {
    const photos = await db.query.requestPhotos.findMany({
      where: (p, { eq }) => eq(p.requestId, requestId),
      columns: { type: true },
    });

    if (!meetsCompletionRequirements(req, photos)) {
      const trimmedReason = waiverReason?.trim();
      if (!trimmedReason) {
        throw new Error(
          'Cannot mark Complete without final cost, an "after" photo, and an assigned vendor unless a waiver reason is provided.'
        );
      }
      completionWaiverReason = trimmedReason;
    }
  }

  const previousStatus = req.status;

  await db
    .update(requests)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(requests.id, requestId));

  await db.insert(decisionLog).values(
    completionWaiverReason
      ? {
          requestId,
          actorId: session.user.id,
          action: "completion_waived",
          details: {
            from: previousStatus,
            to: nextStatus,
            reason: completionWaiverReason,
          },
        }
      : {
          requestId,
          actorId: session.user.id,
          action: "status_changed",
          details: { from: previousStatus, to: nextStatus },
        }
  );

  if (previousStatus !== nextStatus) {
    const owner = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, req.ownerId),
      columns: { email: true },
    });
    await sendNotification({
      ownerId: req.ownerId,
      requestId,
      type: "status_change",
      recipientEmail: owner?.email ?? null,
      subject: `TurnFlow Home: "${req.title}" is now ${nextStatus}`,
      text: `Your maintenance request "${req.title}" changed status from ${previousStatus} to ${nextStatus}.`,
    });
  }

  revalidatePath("/owner/dashboard");
  revalidatePath(`/owner/requests/${requestId}`);
  revalidatePath("/vendor");
}
