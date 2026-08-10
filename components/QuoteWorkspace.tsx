"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  approveQuoteAction,
  createQuoteAction,
  declineQuoteAction,
  deleteQuoteAction,
} from "@/lib/actions/quotes";
import { requestPhotoPath } from "@/lib/blob-paths";

const QUOTE_STATUS_CLASSES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
};

export type QuoteData = {
  id: string;
  vendorName: string;
  vendorContact: string | null;
  amount: string;
  notes: string | null;
  attachmentUrl: string | null;
  status: string;
};

export function QuoteWorkspace({
  requestId,
  quotes: initialQuotes,
  userId,
}: {
  requestId: string;
  quotes: QuoteData[];
  userId: string;
}) {
  const router = useRouter();
  const vendorNameId = useId();
  const vendorContactId = useId();
  const amountId = useId();
  const notesId = useId();
  const attachmentId = useId();
  const [deletedQuoteIds, setDeletedQuoteIds] = useState<string[]>([]);
  const quotes = useMemo(
    () =>
      initialQuotes
        .filter((quote) => !deletedQuoteIds.includes(quote.id))
        .sort((a, b) => Number(a.amount) - Number(b.amount)),
    [initialQuotes, deletedQuoteIds]
  );
  const [vendorName, setVendorName] = useState("");
  const [vendorContact, setVendorContact] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [formStatus, setFormStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number.parseFloat(amount);
    if (!vendorName.trim() || !Number.isFinite(parsedAmount)) {
      setFormStatus("Vendor name and a valid amount are required.");
      return;
    }

    setSubmitting(true);
    setFormStatus("Saving...");
    try {
      const formData = new FormData();
      formData.set("vendorName", vendorName.trim());
      formData.set("vendorContact", vendorContact.trim());
      formData.set("amount", amount);
      formData.set("notes", notes.trim());

      if (attachment) {
        setFormStatus("Uploading attachment...");
        const pathname = requestPhotoPath(requestId, "quote", userId, attachment.name);
        const blob = await upload(pathname, attachment, {
          access: "public",
          handleUploadUrl: "/api/blob-upload",
        });
        formData.set("attachmentUrl", blob.url);
        formData.set("attachmentBlobPath", blob.pathname);
      }

      setFormStatus("Saving...");
      const result = await createQuoteAction(requestId, formData);
      if ("error" in result) {
        setFormStatus(result.error);
        return;
      }

      setVendorName("");
      setVendorContact("");
      setAmount("");
      setNotes("");
      setAttachment(null);
      setFormStatus("Quote added.");
      router.refresh();
    } catch (err) {
      console.error("Failed to add quote:", err);
      setFormStatus("Failed to add quote. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(quoteId: string) {
    setActingId(quoteId);
    try {
      await approveQuoteAction(requestId, quoteId);
      router.refresh();
    } catch (err) {
      console.error("Failed to approve quote:", err);
      alert("Failed to approve quote. Please try again.");
    } finally {
      setActingId(null);
    }
  }

  async function handleDecline(quoteId: string) {
    setActingId(quoteId);
    try {
      await declineQuoteAction(requestId, quoteId);
      router.refresh();
    } catch (err) {
      console.error("Failed to decline quote:", err);
      alert("Failed to decline quote. Please try again.");
    } finally {
      setActingId(null);
    }
  }

  async function handleDelete(quoteId: string) {
    if (!confirm("Delete this quote? This cannot be undone.")) return;
    setActingId(quoteId);
    try {
      await deleteQuoteAction(requestId, quoteId);
      setDeletedQuoteIds((prev) => (prev.includes(quoteId) ? prev : [...prev, quoteId]));
      router.refresh();
    } catch (err) {
      console.error("Failed to delete quote:", err);
      alert("Failed to delete quote. Please try again.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Quotes</h2>

      <div className="mb-4 space-y-3">
        {quotes.length === 0 ? (
          <p className="text-sm text-gray-500">No quotes recorded yet.</p>
        ) : (
          quotes.map((q) => (
            <article
              key={q.id}
              className={`rounded border p-3 ${q.status === "approved" ? "border-green-400" : ""}`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h3 className="font-medium">{q.vendorName || "Unnamed vendor"}</h3>
                <span
                  className={`w-fit rounded-full px-2 py-1 text-xs font-medium ${
                    QUOTE_STATUS_CLASSES[q.status] || QUOTE_STATUS_CLASSES.pending
                  }`}
                >
                  {q.status}
                </span>
              </div>
              {q.vendorContact && <p className="text-sm text-gray-600">{q.vendorContact}</p>}
              <p className="mt-1 text-lg font-semibold">${Number(q.amount).toFixed(2)}</p>
              {q.notes && <p className="mt-1 text-sm text-gray-600">{q.notes}</p>}
              {q.attachmentUrl && (
                <p className="mt-1 text-sm">
                  <a
                    href={q.attachmentUrl}
                    target="_blank"
                    rel="noopener"
                    className="text-blue-600 underline"
                  >
                    View attachment
                  </a>
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {q.status !== "approved" && (
                  <button
                    onClick={() => handleApprove(q.id)}
                    disabled={actingId === q.id}
                    className="rounded bg-green-600 px-2 py-1 text-white disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
                {q.status !== "declined" && (
                  <button
                    onClick={() => handleDecline(q.id)}
                    disabled={actingId === q.id}
                    className="rounded bg-gray-500 px-2 py-1 text-white disabled:opacity-50"
                  >
                    Decline
                  </button>
                )}
                <button
                  onClick={() => handleDelete(q.id)}
                  disabled={actingId === q.id}
                  className="rounded bg-red-600 px-2 py-1 text-white disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
        <h3 className="text-sm font-medium">Add a quote</h3>
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <label htmlFor={vendorNameId} className="mb-1 block text-sm font-medium">
              Vendor name
            </label>
            <input
              id={vendorNameId}
              type="text"
              placeholder="Vendor name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full rounded border p-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor={vendorContactId} className="mb-1 block text-sm font-medium">
              Vendor contact
            </label>
            <input
              id={vendorContactId}
              type="text"
              placeholder="Optional"
              value={vendorContact}
              onChange={(e) => setVendorContact(e.target.value)}
              className="w-full rounded border p-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor={amountId} className="mb-1 block text-sm font-medium">
            Amount
          </label>
          <input
            id={amountId}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded border p-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor={notesId} className="mb-1 block text-sm font-medium">
            Notes
          </label>
          <textarea
            id={notesId}
            placeholder="Optional"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded border p-2 text-sm"
            rows={2}
          />
        </div>
        <div>
          <label htmlFor={attachmentId} className="mb-1 block text-sm font-medium">
            Attachment
          </label>
          <input
            id={attachmentId}
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            className="text-sm"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Add quote"}
          </button>
          {formStatus && <p className="text-sm text-gray-600">{formStatus}</p>}
        </div>
      </form>
    </section>
  );
}
