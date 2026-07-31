"use server";

import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";

export type ActionState = { error?: string } | undefined;

export async function createProperty(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("owner");

  const address = String(formData.get("address") || "").trim();
  const unit = String(formData.get("unit") || "").trim() || null;
  const nickname = String(formData.get("nickname") || "").trim() || null;

  if (!address) {
    return { error: "Address is required." };
  }

  await db.insert(properties).values({
    ownerId: session.user.id,
    address,
    unit,
    nickname,
  });

  revalidatePath("/owner/properties");
  revalidatePath("/owner/requests/new");
}

/**
 * Deletes a property. DB rows cascade automatically (requests, photos,
 * quotes, decision log, comments, vault docs, reminders — every FK in
 * lib/db/schema.ts that points at this property or its requests is
 * `onDelete: "cascade"`), which is a genuine simplification over the
 * Firebase build's manual deletePhotosForRequest()/deleteQuotesForRequest()/
 * etc. cascade. Blob *files* aren't covered by SQL cascade though, so we
 * still clean those up explicitly before the row delete.
 */
export async function deletePropertyAction(propertyId: string) {
  const session = await requireRole("owner");

  const property = await db.query.properties.findFirst({
    where: (p, { eq }) => eq(p.id, propertyId),
  });
  if (!property || property.ownerId !== session.user.id) {
    throw new Error("Not authorized to delete this property");
  }

  const propertyRequests = await db.query.requests.findMany({
    where: (r, { eq }) => eq(r.propertyId, propertyId),
    columns: { id: true },
  });
  const requestIds = propertyRequests.map((r) => r.id);

  if (requestIds.length > 0) {
    const photos = await db.query.requestPhotos.findMany({
      where: (p, { inArray }) => inArray(p.requestId, requestIds),
      columns: { blobPath: true },
    });
    await Promise.allSettled(photos.map((p) => del(p.blobPath)));
  }

  const vaultDocs = await db.query.vaultDocuments.findMany({
    where: (v, { eq }) => eq(v.propertyId, propertyId),
    columns: { blobPath: true },
  });
  await Promise.allSettled(vaultDocs.map((v) => del(v.blobPath)));

  await db.delete(properties).where(eq(properties.id, propertyId));
  revalidatePath("/owner/properties");
  revalidatePath("/owner/dashboard");
}

/** Fields needed for the client-side property history PDF export (Package 7). */
export async function getPropertyRequestsForExportAction(propertyId: string) {
  const session = await requireRole("owner");

  const property = await db.query.properties.findFirst({
    where: (p, { eq }) => eq(p.id, propertyId),
  });
  if (!property || property.ownerId !== session.user.id) {
    throw new Error("Not authorized for this property");
  }

  return db.query.requests.findMany({
    where: (r, { eq }) => eq(r.propertyId, propertyId),
    orderBy: (r, { desc }) => desc(r.createdAt),
    columns: {
      title: true,
      category: true,
      status: true,
      estimatedCost: true,
      quotedCost: true,
      finalCost: true,
      createdAt: true,
    },
  });
}
