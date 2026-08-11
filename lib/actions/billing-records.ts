"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { billingRecords, decisionLog } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";
import {
  isBillingRecordStatus,
  normalizeBillingText,
  parseBillingAmount,
  type BillingRecordStatus,
} from "@/lib/billing-records";

export type UpdateBillingRecordResult = { ok: true } | { error: string };

export async function updateBillingRecordAction(
  requestId: string,
  billingRecordId: string,
  formData: FormData
): Promise<UpdateBillingRecordResult> {
  const session = await requireRole("owner");
  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });
  if (!req || req.ownerId !== session.user.id) {
    return { error: "Only the owner can update this billing record." };
  }

  const record = await db.query.billingRecords.findFirst({
    where: (billing, { eq }) => eq(billing.id, billingRecordId),
  });
  if (!record || record.requestId !== requestId || record.ownerId !== session.user.id) {
    return { error: "Billing record not found." };
  }

  const statusValue = String(formData.get("status") ?? "");
  if (!isBillingRecordStatus(statusValue)) {
    return { error: "Choose a valid billing status." };
  }

  const amount = parseBillingAmount(formData.get("amount"));
  if (amount === null) {
    return { error: "Enter a valid billing amount." };
  }

  const invoiceReference = normalizeBillingText(
    String(formData.get("invoiceReference") ?? ""),
    120
  );
  const notes = normalizeBillingText(String(formData.get("notes") ?? ""), 500);
  const nextStatus = statusValue as BillingRecordStatus;
  const now = new Date();

  await db
    .update(billingRecords)
    .set({
      amount,
      status: nextStatus,
      invoiceReference: invoiceReference || null,
      notes: notes || null,
      paidAt: nextStatus === "paid" ? record.paidAt ?? now : null,
      updatedAt: now,
    })
    .where(
      and(
        eq(billingRecords.id, billingRecordId),
        eq(billingRecords.requestId, requestId)
      )
    );

  await db.insert(decisionLog).values({
    requestId,
    actorId: session.user.id,
    action: "billing_record_updated",
    details: {
      billingRecordId,
      from: record.status,
      to: nextStatus,
      amount,
      invoiceReference: invoiceReference || null,
    },
  });

  revalidatePath(`/owner/requests/${requestId}`);
  revalidatePath("/vendor");
  revalidatePath("/owner/dashboard");
  return { ok: true };
}
