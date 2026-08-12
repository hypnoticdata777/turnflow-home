import { describe, expect, it } from "vitest";
import { backupPreview, backupScopeItems } from "@/lib/backup-guidance";

describe("backupPreview", () => {
  it("rejects non-object backup data", () => {
    expect(backupPreview(null)).toEqual({
      valid: false,
      propertyCount: 0,
      requestCount: 0,
      billingRecordCount: 0,
      errors: ["Backup file must be a JSON object."],
      warnings: [],
    });
  });

  it("counts current backup arrays", () => {
    expect(
      backupPreview({
        properties: [{ id: "property-1" }],
        requests: [{ id: "request-1" }],
        billingRecords: [{ id: "billing-1" }, { id: "billing-2" }],
      })
    ).toEqual({
      valid: true,
      propertyCount: 1,
      requestCount: 1,
      billingRecordCount: 2,
      errors: [],
      warnings: [],
    });
  });

  it("allows older backups without billing records but warns the owner", () => {
    expect(
      backupPreview({
        properties: [],
        requests: [],
      })
    ).toMatchObject({
      valid: true,
      billingRecordCount: 0,
      errors: [],
      warnings: [
        'No "billingRecords" array found. This may be an older backup; properties and requests can still restore.',
      ],
    });
  });

  it("requires property and request arrays", () => {
    expect(backupPreview({ billingRecords: [] })).toMatchObject({
      valid: false,
      errors: ['Missing "properties" array.', 'Missing "requests" array.'],
    });
  });
});

describe("backupScopeItems", () => {
  it("uses included labels before a restore file is selected", () => {
    expect(backupScopeItems(null).map((item) => item.value)).toEqual([
      "Included",
      "Included",
      "Included",
    ]);
  });

  it("summarizes preview counts for the UI", () => {
    expect(
      backupScopeItems({
        valid: true,
        propertyCount: 2,
        requestCount: 5,
        billingRecordCount: 3,
        errors: [],
        warnings: [],
      }).map((item) => [item.label, item.value])
    ).toEqual([
      ["Properties", "2"],
      ["Requests", "5"],
      ["Billing", "3"],
    ]);
  });
});
