import { describe, expect, it } from "vitest";
import {
  BILLING_RECORD_STATUS_LABELS,
  billingStatusDetail,
  isBillingRecordStatus,
  normalizeBillingText,
  parseBillingAmount,
} from "@/lib/billing-records";

describe("isBillingRecordStatus", () => {
  it("accepts known billing states", () => {
    expect(isBillingRecordStatus("recorded")).toBe(true);
    expect(isBillingRecordStatus("paid")).toBe(true);
    expect(isBillingRecordStatus("missing")).toBe(false);
  });

  it("labels billing states for owner-facing UI", () => {
    expect(BILLING_RECORD_STATUS_LABELS.recorded).toBe("Recorded");
    expect(BILLING_RECORD_STATUS_LABELS.paid).toBe("Paid outside TurnFlow");
    expect(BILLING_RECORD_STATUS_LABELS.disputed).toBe("Needs review");
    expect(BILLING_RECORD_STATUS_LABELS.void).toBe("Voided");
  });
});

describe("parseBillingAmount", () => {
  it("normalizes non-negative billing amounts", () => {
    expect(parseBillingAmount("250")).toBe("250.00");
    expect(parseBillingAmount("0")).toBe("0.00");
  });

  it("rejects invalid amounts", () => {
    expect(parseBillingAmount("")).toBeNull();
    expect(parseBillingAmount("-5")).toBeNull();
    expect(parseBillingAmount("invoice")).toBeNull();
  });
});

describe("normalizeBillingText", () => {
  it("trims and limits text", () => {
    expect(normalizeBillingText("  INV-100  ")).toBe("INV-100");
    expect(normalizeBillingText("x".repeat(12), 5)).toBe("xxxxx");
  });
});

describe("billingStatusDetail", () => {
  it("explains that TurnFlow does not process payments", () => {
    expect(billingStatusDetail("recorded")).toContain("payment is not processed");
    expect(billingStatusDetail("paid")).toContain("paid outside TurnFlow");
  });
});
