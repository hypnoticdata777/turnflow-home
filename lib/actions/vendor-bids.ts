"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { decisionLog, quotes, requests } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";

export type SubmitVendorBidResult =
  | { ok: true; quoteId: string }
  | { error: string };

export async function submitVendorBidAction(
  requestId: string,
  formData: FormData
): Promise<SubmitVendorBidResult> {
  const session = await requireRole("vendor");
  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });

  if (!req || req.assignedVendorId !== session.user.id) {
    return { error: "Only the assigned vendor can submit a bid for this request." };
  }

  const amountRaw = String(formData.get("amount") ?? "");
  const amount = Number.parseFloat(amountRaw);
  const availabilityWindow = String(formData.get("availabilityWindow") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid bid amount greater than zero." };
  }

  const [vendor, profile, existingBid] = await Promise.all([
    db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, session.user.id),
      columns: { name: true, email: true },
    }),
    db.query.vendorProfiles.findFirst({
      where: (p, { eq }) => eq(p.userId, session.user.id),
      columns: { businessName: true },
    }),
    db.query.quotes.findFirst({
      where: (q, { and, eq }) =>
        and(eq(q.requestId, requestId), eq(q.submittedByVendorId, session.user.id)),
    }),
  ]);
  const vendorName = profile?.businessName || vendor?.name || vendor?.email || "Assigned vendor";
  const vendorContact = vendor?.email ?? null;
  const bidValues = {
    submittedByVendorId: session.user.id,
    vendorName,
    vendorContact,
    amount: amount.toFixed(2),
    availabilityWindow: availabilityWindow || null,
    notes: notes || null,
    status: "pending" as const,
    approvedById: null,
    approvedAt: null,
    updatedAt: new Date(),
  };

  const [savedBid] = existingBid
    ? await db
        .update(quotes)
        .set(bidValues)
        .where(
          and(
            eq(quotes.id, existingBid.id),
            eq(quotes.submittedByVendorId, session.user.id)
          )
        )
        .returning({ id: quotes.id })
    : await db
        .insert(quotes)
        .values({
          requestId,
          ...bidValues,
        })
        .returning({ id: quotes.id });

  await db.insert(decisionLog).values({
    requestId,
    actorId: session.user.id,
    action: existingBid ? "vendor_bid_updated" : "vendor_bid_submitted",
    details: {
      vendorName,
      amount: amount.toFixed(2),
      availabilityWindow: availabilityWindow || null,
    },
  });

  if (existingBid?.status === "approved") {
    await db
      .update(requests)
      .set({ quotedCost: null, updatedAt: new Date() })
      .where(eq(requests.id, requestId));
  }

  revalidatePath("/vendor");
  revalidatePath(`/owner/requests/${requestId}`);
  return { ok: true, quoteId: savedBid.id };
}
