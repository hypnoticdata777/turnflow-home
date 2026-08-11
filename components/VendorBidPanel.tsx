"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { submitVendorBidAction } from "@/lib/actions/vendor-bids";
import { vendorBidGuidance, type VendorBidRequest } from "@/lib/vendor-bid";

export type VendorBidData = {
  id: string;
  amount: string;
  status: string;
  availabilityWindow: string | null;
  notes: string | null;
};

const guidanceClasses: Record<ReturnType<typeof vendorBidGuidance>["tone"], string> = {
  attention: "border-blue-200 bg-blue-50 text-blue-950",
  progress: "border-amber-200 bg-amber-50 text-amber-950",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-950",
};

export function VendorBidPanel({
  requestId,
  request,
  bid,
}: {
  requestId: string;
  request: VendorBidRequest;
  bid: VendorBidData | null;
}) {
  const router = useRouter();
  const guidance = vendorBidGuidance({ request, bid });
  const [amount, setAmount] = useState(bid?.amount ?? "");
  const [availabilityWindow, setAvailabilityWindow] = useState(
    bid?.availabilityWindow ?? ""
  );
  const [notes, setNotes] = useState(bid?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const result = await submitVendorBidAction(requestId, new FormData(event.currentTarget));
    if ("error" in result) {
      setMessage(result.error);
      setSaving(false);
      return;
    }

    setMessage("Bid saved for owner review.");
    setSaving(false);
    router.refresh();
  }

  return (
    <section className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
      <div className={`rounded-lg border p-3 ${guidanceClasses[guidance.tone]}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Private owner bid</p>
            <h4 className="mt-1 text-base font-semibold">{guidance.label}</h4>
            <p className="mt-1 text-sm leading-6">{guidance.detail}</p>
          </div>
          {bid && (
            <span className="rounded-full border border-current px-2 py-1 text-xs font-semibold">
              {bid.status}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-3 grid gap-3 lg:grid-cols-2">
        <label className="block text-sm">
          <span className="font-semibold">Bid amount</span>
          <input
            type="number"
            step="0.01"
            min="0"
            name="amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-1 w-full rounded border p-2"
            placeholder="0.00"
          />
        </label>

        <label className="block text-sm">
          <span className="font-semibold">Availability window</span>
          <input
            name="availabilityWindow"
            value={availabilityWindow}
            onChange={(event) => setAvailabilityWindow(event.target.value)}
            className="mt-1 w-full rounded border p-2"
            placeholder="Example: Tuesday morning or this week"
          />
        </label>

        <label className="block text-sm lg:col-span-2">
          <span className="font-semibold">Scope notes</span>
          <textarea
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-1 min-h-24 w-full rounded border p-2"
            placeholder="What is included, assumptions, materials, or anything the owner should approve."
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : guidance.cta}
          </button>
          {message && (
            <p className="text-sm font-medium text-gray-700" role="status">
              {message}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
