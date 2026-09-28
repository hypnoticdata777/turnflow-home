import { describe, expect, it } from "vitest";
import { parseUploadPath } from "@/lib/blob-paths";
import { canReadUpload } from "@/lib/file-access";

const requestPath = parseUploadPath("turnflow/req-1/after/vendor-1/1_x.jpg");
const vaultPath = parseUploadPath("turnflow-property/prop-1/owner-1/1_x.pdf");
const requestRecord = {
  kind: "request" as const,
  ownerId: "owner-1",
  assignedVendorId: "vendor-1",
  collaboratorId: "helper-1",
};

describe("canReadUpload", () => {
  it("lets the owner, assigned vendor, and collaborator read request files", () => {
    for (const userId of ["owner-1", "vendor-1", "helper-1"]) {
      expect(canReadUpload(requestPath, userId, requestRecord)).toBe(true);
    }
  });

  it("blocks everyone else, including a vendor whose access was removed", () => {
    expect(canReadUpload(requestPath, "stranger", requestRecord)).toBe(false);
    expect(
      canReadUpload(requestPath, "vendor-1", { ...requestRecord, assignedVendorId: null })
    ).toBe(false);
  });

  it("keeps the property vault owner-only", () => {
    const property = { kind: "property" as const, ownerId: "owner-1" };
    expect(canReadUpload(vaultPath, "owner-1", property)).toBe(true);
    expect(canReadUpload(vaultPath, "vendor-1", property)).toBe(false);
  });

  it("fails closed for missing records, unknown paths, and kind mismatches", () => {
    expect(canReadUpload(requestPath, "owner-1", null)).toBe(false);
    expect(canReadUpload({ kind: "unknown" }, "owner-1", requestRecord)).toBe(false);
    expect(canReadUpload(vaultPath, "owner-1", requestRecord)).toBe(false);
    expect(canReadUpload(requestPath, "", requestRecord)).toBe(false);
  });
});
