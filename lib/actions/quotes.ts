"use server";

import { eq, and } from "drizzle-orm";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { quotes, requests, decisionLog } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";

// Quotes are owner-only, both read and write — showing one vendor's price
// to another vendor (or to the assigned vendor at all) would leak
// competitive pricing, so unlike photos this is never scoped to vendor.

async function requireOwnedRequest(requestId: string, ownerId: string) {
  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });
  if (!req || req.ownerId !== ownerId) {
    throw new Error("Not authorized for this request");
  }
  return req;
}

export type CreateQuoteResult = { quoteId: string } | { error: string };

export async function createQuoteAction(
  requestId: string,
  formData: FormData
): Promise<CreateQuoteResult> {
  const session = await requireRole("owner");
  await requireOwnedRequest(requestId, session.user.id);

  const vendorName = String(formData.get("vendorName") || "").trim();
  const vendorContact = String(formData.get("vendorContact") || "").trim();
  const amountRaw = String(formData.get("amount") || "");
  const notes = String(formData.get("notes") || "").trim();
  const attachmentUrl = String(formData.get("attachmentUrl") || "").trim();
  const attachmentBlobPath = String(formData.get("attachmentBlobPath") || "").trim();

  const amount = Number.parseFloat(amountRaw);
  if (!vendorName || !Number.isFinite(amount)) {
    return { error: "Vendor name and a valid amount are required." };
  }

  const [created] = await db
    .insert(quotes)
    .values({
      requestId,
      vendorName,
      vendorContact: vendorContact || null,
      amount: amount.toFixed(2),
      notes: notes || null,
      attachmentUrl: attachmentUrl || null,
      attachmentBlobPath: attachmentBlobPath || null,
    })
    .returning({ id: quotes.id });

  revalidatePath(`/owner/requests/${requestId}`);
  return { quoteId: created.id };
}

/** Approves a quote and copies its amount onto the request's quotedCost — the direct replacement for the Firebase build's two-step approveQuote() + updateRequest() call. */
export async function approveQuoteAction(requestId: string, quoteId: string) {
  const session = await requireRole("owner");
  await requireOwnedRequest(requestId, session.user.id);

  const quote = await db.query.quotes.findFirst({
    where: (q, { eq }) => eq(q.id, quoteId),
  });
  if (!quote || quote.requestId !== requestId) {
    throw new Error("Quote not found");
  }

  await db
    .update(quotes)
    .set({ status: "approved", approvedById: session.user.id, approvedAt: new Date(), updatedAt: new Date() })
    .where(eq(quotes.id, quoteId));

  await db
    .update(requests)
    .set({ quotedCost: quote.amount, updatedAt: new Date() })
    .where(eq(requests.id, requestId));

  await db.insert(decisionLog).values({
    requestId,
    actorId: session.user.id,
    action: "quote_approved",
    details: { vendorName: quote.vendorName, amount: quote.amount },
  });

  revalidatePath(`/owner/requests/${requestId}`);
}

export async function declineQuoteAction(requestId: string, quoteId: string) {
  const session = await requireRole("owner");
  await requireOwnedRequest(requestId, session.user.id);

  const quote = await db.query.quotes.findFirst({
    where: (q, { eq }) => eq(q.id, quoteId),
  });
  if (!quote || quote.requestId !== requestId) {
    throw new Error("Quote not found");
  }

  await db
    .update(quotes)
    .set({ status: "declined", updatedAt: new Date() })
    .where(and(eq(quotes.id, quoteId), eq(quotes.requestId, requestId)));

  await db.insert(decisionLog).values({
    requestId,
    actorId: session.user.id,
    action: "quote_declined",
    details: { vendorName: quote.vendorName, amount: quote.amount },
  });

  revalidatePath(`/owner/requests/${requestId}`);
}

export async function deleteQuoteAction(requestId: string, quoteId: string) {
  const session = await requireRole("owner");
  await requireOwnedRequest(requestId, session.user.id);

  const quote = await db.query.quotes.findFirst({
    where: (q, { eq }) => eq(q.id, quoteId),
  });
  if (!quote || quote.requestId !== requestId) {
    throw new Error("Quote not found");
  }

  if (quote.attachmentBlobPath) {
    await del(quote.attachmentBlobPath).catch(() => {});
  }

  await db.delete(quotes).where(eq(quotes.id, quoteId));
  revalidatePath(`/owner/requests/${requestId}`);
}
