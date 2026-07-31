"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  createQuoteAction,
  approveQuoteAction,
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
  const [quotes, setQuotes] = useState(
    [...initialQuotes].sort((a, b) => Number(a.amount) - Number(b.amount))
  );

  // router.refresh() re-renders this component's server-side parent with
  // fresh data but doesn't reset local state, so re-sync whenever the
  // parent hands down a new quotes array (new create/approve/decline).
  useEffect(() => {
    setQuotes([...initialQuotes].sort((a, b) => Number(a.amount) - Number(b.amount)));
  }, [initialQuotes]);
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
    setFormStatus("Saving…");
    try {
      const formData = new FormData();
      formData.set("vendorName", vendorName.trim());
      formData.set("vendorContact", vendorContact.trim());
      formData.set("amount", amount);
      formData.set("notes", notes.trim());

      if (attachment) {
        setFormStatus("Uploading attachment…");
        const pathname = requestPhotoPath(requestId, "quote", userId, attachment.name);
        const blob = await upload(pathname, attachment, {
          access: "public",
          handleUploadUrl: "/api/blob-upload",
        });
        formData.set("attachmentUrl", blob.url);
        formData.set("attachmentBlobPath", blob.pathname);
      }

      setFormStatus("Saving…");
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
      setFormStatus("Quote added ✓");
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
      setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
      router.refresh();
    } catch (err) {
      console.error("Failed to delete quote:", err);
      alert("Failed to delete quote. Please try again.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Quotes</h2>

      <div className="space-y-3 mb-4">
        {quotes.length === 0 ? (
          <p className="text-gray-500 text-sm">No quotes recorded yet.</p>
        ) : (
          quotes.map((q) => (
            <div
              key={q.id}
              className={`border p-3 rounded ${q.status === "approved" ? "border-green-400" : ""}`}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{q.vendorName || "(unnamed vendor)"}</h3>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    QUOTE_STATUS_CLASSES[q.status] || QUOTE_STATUS_CLASSES.pending
                  }`}
                >
                  {q.status}
                </span>
              </div>
              {q.vendorContact && <p className="text-sm text-gray-600">{q.vendorContact}</p>}
              <p className="text-lg font-semibold mt-1">${Number(q.amount).toFixed(2)}</p>
              {q.notes && <p className="text-sm text-gray-600 mt-1">{q.notes}</p>}
              {q.attachmentUrl && (
                <p className="text-sm mt-1">
                  <a href={q.attachmentUrl} target="_blank" rel="noopener" className="text-blue-600 underline">
                    View attachment
                  </a>
                </p>
              )}
              <div className="mt-2 flex gap-2 text-sm">
                {q.status !== "approved" && (
                  <button
                    onClick={() => handleApprove(q.id)}
                    disabled={actingId === q.id}
                    className="bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
                {q.status !== "declined" && (
                  <button
                    onClick={() => handleDecline(q.id)}
                    disabled={actingId === q.id}
                    className="bg-gray-500 text-white px-2 py-1 rounded disabled:opacity-50"
                  >
                    Decline
                  </button>
                )}
                <button
                  onClick={() => handleDelete(q.id)}
                  disabled={actingId === q.id}
                  className="bg-red-600 text-white px-2 py-1 rounded disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t pt-4 space-y-2">
        <h3 className="font-medium text-sm">Add a quote</h3>
        <div className="grid md:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Vendor name"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            className="p-2 border rounded text-sm"
          />
          <input
            type="text"
            placeholder="Vendor contact (optional)"
            value={vendorContact}
            onChange={(e) => setVendorContact(e.target.value)}
            className="p-2 border rounded text-sm"
          />
        </div>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded text-sm"
        />
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-2 border rounded text-sm"
          rows={2}
        />
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setAttachment(e.target.files?.[0] || null)}
          className="text-sm"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Add Quote"}
          </button>
          {formStatus && <p className="text-sm text-gray-600">{formStatus}</p>}
        </div>
      </form>
    </div>
  );
}
