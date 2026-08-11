"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBillingRecordAction } from "@/lib/actions/billing-records";
import {
  BILLING_RECORD_STATUSES,
  BILLING_RECORD_STATUS_LABELS,
  billingStatusDetail,
  type BillingRecordStatus,
} from "@/lib/billing-records";

export type BillingRecordData = {
  id: string;
  amount: string;
  status: BillingRecordStatus;
  invoiceReference: string | null;
  notes: string | null;
  recordedAt: string | Date;
  paidAt: string | Date | null;
};

const STATUS_CLASSES: Record<BillingRecordStatus, string> = {
  recorded: "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800",
  disputed: "bg-amber-100 text-amber-800",
  void: "bg-gray-100 text-gray-700",
};

function money(value: string | number) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
}

export function BillingRecordPanel({
  requestId,
  records,
  mode,
}: {
  requestId: string;
  records: BillingRecordData[];
  mode: "owner" | "vendor";
}) {
  const router = useRouter();
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );
  const latest = sortedRecords[0];
  const [amount, setAmount] = useState(latest?.amount ?? "");
  const [billingStatus, setBillingStatus] = useState<BillingRecordStatus>(
    latest?.status ?? "recorded"
  );
  const [invoiceReference, setInvoiceReference] = useState(
    latest?.invoiceReference ?? ""
  );
  const [notes, setNotes] = useState(latest?.notes ?? "");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveBillingRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!latest) return;
    setSaving(true);
    setStatus("Saving billing record...");
    const formData = new FormData();
    formData.set("amount", amount);
    formData.set("status", billingStatus);
    formData.set("invoiceReference", invoiceReference);
    formData.set("notes", notes);
    const result = await updateBillingRecordAction(requestId, latest.id, formData);
    if ("error" in result) {
      setStatus(result.error);
      setSaving(false);
      return;
    }
    setStatus("Billing record saved.");
    setSaving(false);
    router.refresh();
  }

  return (
    <section id="billing" className="scroll-mt-6">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Billing record</p>
          <h2 className="text-xl font-semibold">Final charge history</h2>
        </div>
        <p className="text-sm font-medium text-gray-700">
          {records.length} {records.length === 1 ? "record" : "records"}
        </p>
      </div>

      {latest ? (
        <article className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold">{money(latest.amount)}</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {billingStatusDetail(latest.status)}
              </p>
            </div>
            <span
              className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${STATUS_CLASSES[latest.status]}`}
            >
              {BILLING_RECORD_STATUS_LABELS[latest.status]}
            </span>
          </div>
          {latest.invoiceReference && (
            <p className="mt-2 text-sm text-gray-700">
              Invoice/reference: {latest.invoiceReference}
            </p>
          )}
          {latest.notes && (
            <p className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-2 text-sm leading-6 text-gray-700">
              {latest.notes}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Recorded {new Date(latest.recordedAt).toLocaleString()}
            {latest.paidAt ? `; paid ${new Date(latest.paidAt).toLocaleString()}` : ""}
          </p>
        </article>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm leading-6 text-gray-700">
          No billing record yet. Approving a vendor closeout creates one
          automatically for owner history.
        </div>
      )}

      {mode === "owner" && latest && (
        <form onSubmit={saveBillingRecord} className="mt-3 space-y-3 rounded-lg border p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Amount
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                type="number"
                min="0"
                step="0.01"
                className="mt-1 w-full rounded border p-2 text-sm"
              />
            </label>
            <label className="block text-sm font-medium">
              Status
              <select
                value={billingStatus}
                onChange={(event) =>
                  setBillingStatus(event.target.value as BillingRecordStatus)
                }
                className="mt-1 w-full rounded border bg-white p-2 text-sm"
              >
                {BILLING_RECORD_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {BILLING_RECORD_STATUS_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium">
            Invoice or reference
            <input
              value={invoiceReference}
              onChange={(event) => setInvoiceReference(event.target.value)}
              maxLength={120}
              placeholder="Invoice number, receipt reference, check memo..."
              className="mt-1 w-full rounded border p-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium">
            Billing notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Optional payment context, dispute note, or owner reminder."
              className="mt-1 w-full rounded border p-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save billing record"}
          </button>
        </form>
      )}

      <p className="mt-3 text-sm leading-6 text-gray-600">
        TurnFlow stores the billing record for homeowner history. It does not
        process payments.
      </p>
      {status && <p className="mt-2 text-sm font-medium text-gray-700">{status}</p>}
    </section>
  );
}
