export const BILLING_RECORD_STATUSES = ["recorded", "paid", "disputed", "void"] as const;
export type BillingRecordStatus = (typeof BILLING_RECORD_STATUSES)[number];

export const BILLING_RECORD_STATUS_LABELS: Record<BillingRecordStatus, string> = {
  recorded: "Recorded",
  paid: "Paid outside TurnFlow",
  disputed: "Needs review",
  void: "Voided",
};

export function isBillingRecordStatus(value: string): value is BillingRecordStatus {
  return (BILLING_RECORD_STATUSES as readonly string[]).includes(value);
}

export function parseBillingAmount(value: FormDataEntryValue | string | number | null) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const amount = Number.parseFloat(trimmed);
  return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : null;
}

export function normalizeBillingText(value: string, maxLength = 500) {
  return value.trim().slice(0, maxLength);
}

export function billingStatusDetail(status: BillingRecordStatus) {
  if (status === "paid") {
    return "Owner marked this invoice or final charge paid outside TurnFlow.";
  }
  if (status === "disputed") {
    return "Owner flagged this billing record for follow-up before treating it as settled.";
  }
  if (status === "void") {
    return "Owner voided this billing record so it stays in history without counting as settled.";
  }
  return "Final charge is recorded in the maintenance history; payment is not processed in TurnFlow.";
}

export function billingRecordPdfRow(record: {
  amount: string | number;
  status: BillingRecordStatus;
  invoiceReference?: string | null;
  notes?: string | null;
  recordedAt: string | Date;
  paidAt?: string | Date | null;
}) {
  return [
    `$${Number(record.amount || 0).toFixed(2)}`,
    BILLING_RECORD_STATUS_LABELS[record.status] || record.status,
    record.invoiceReference || "",
    new Date(record.recordedAt).toLocaleDateString(),
    record.paidAt ? new Date(record.paidAt).toLocaleDateString() : "",
    record.notes || "",
  ];
}
