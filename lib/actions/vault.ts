"use server";

import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { vaultDocuments } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";
import { VAULT_DOCUMENT_CATEGORIES } from "@/lib/utils";

async function requireOwnedProperty(propertyId: string, ownerId: string) {
  const property = await db.query.properties.findFirst({
    where: (p, { eq }) => eq(p.id, propertyId),
  });
  if (!property || property.ownerId !== ownerId) {
    throw new Error("Not authorized for this property");
  }
  return property;
}

export type CreateVaultDocumentResult = { documentId: string } | { error: string };

export async function createVaultDocumentAction(
  propertyId: string,
  formData: FormData
): Promise<CreateVaultDocumentResult> {
  const session = await requireRole("owner");
  await requireOwnedProperty(propertyId, session.user.id);

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "");
  const requestId = String(formData.get("requestId") || "").trim() || null;
  const url = String(formData.get("url") || "").trim();
  const blobPath = String(formData.get("blobPath") || "").trim();

  if (!name || !url || !blobPath) {
    return { error: "Name and a file are required." };
  }

  if (requestId) {
    const request = await db.query.requests.findFirst({
      where: (r, { eq }) => eq(r.id, requestId),
      columns: { ownerId: true, propertyId: true },
    });
    if (
      !request ||
      request.ownerId !== session.user.id ||
      request.propertyId !== propertyId
    ) {
      return { error: "Selected request does not belong to this property." };
    }
  }

  const [created] = await db
    .insert(vaultDocuments)
    .values({
      propertyId,
      name,
      category: (VAULT_DOCUMENT_CATEGORIES as readonly string[]).includes(category)
        ? (category as (typeof VAULT_DOCUMENT_CATEGORIES)[number])
        : "Other",
      requestId,
      url,
      blobPath,
      uploadedById: session.user.id,
    })
    .returning({ id: vaultDocuments.id });

  revalidatePath("/owner/vault");
  return { documentId: created.id };
}

export async function deleteVaultDocumentAction(propertyId: string, documentId: string) {
  const session = await requireRole("owner");
  await requireOwnedProperty(propertyId, session.user.id);

  const document = await db.query.vaultDocuments.findFirst({
    where: (v, { eq }) => eq(v.id, documentId),
  });
  if (!document || document.propertyId !== propertyId) {
    throw new Error("Document not found");
  }

  await del(document.blobPath).catch(() => {});
  await db.delete(vaultDocuments).where(eq(vaultDocuments.id, documentId));
  revalidatePath("/owner/vault");
}
