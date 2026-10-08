import { describe, expect, it } from "vitest";
import {
  blobAccessMode,
  fileUrlForPath,
  isPropertyScopedPath,
  isRequestScopedPath,
  parseUploadPath,
  requestPhotoPath,
  sanitizeFilename,
  validatePropertyUploadPath,
  validateRequestUploadPath,
  vaultDocumentPath,
} from "@/lib/blob-paths";

const REQUEST = "req-1";
const PROPERTY = "prop-1";
const OWNER = "owner-1";
const OTHER = "owner-2";

describe("upload path building", () => {
  it("builds exactly-shaped request and vault paths with a safe filename", () => {
    const requestPath = requestPhotoPath(REQUEST, "after", OWNER, "../../evil name.jpg");
    expect(requestPath).toMatch(/^turnflow\/req-1\/after\/owner-1\/\d+_evil_name\.jpg$/);
    expect(parseUploadPath(requestPath)).toMatchObject({ kind: "request", requestId: REQUEST });

    const vaultPath = vaultDocumentPath(PROPERTY, OWNER, "Warranty (2024).pdf");
    expect(vaultPath).toMatch(/^turnflow-property\/prop-1\/owner-1\/\d+_Warranty_2024\.pdf$/);
  });

  it("never returns an empty filename", () => {
    expect(sanitizeFilename("///")).toBe("file");
    expect(sanitizeFilename("...hidden")).toBe("hidden");
  });
});

describe("parseUploadPath", () => {
  it("rejects extra nesting, empty segments, and dot segments", () => {
    for (const bad of [
      "turnflow/req-1/after/owner-1/x/y.jpg",
      "turnflow/req-1/after/owner-1",
      "turnflow//after/owner-1/x.jpg",
      "turnflow/../after/owner-1/x.jpg",
      "turnflow-property/prop-1/owner-1/nested/x.pdf",
      "https://store.public.blob.vercel-storage.com/turnflow/req-1/after/owner-1/x.jpg",
      "",
    ]) {
      expect(parseUploadPath(bad)).toEqual({ kind: "unknown" });
    }
  });
});

describe("validateRequestUploadPath", () => {
  const path = `turnflow/${REQUEST}/after/${OWNER}/1_x.jpg`;

  it("accepts the uploader's own path for this request and type", () => {
    expect(validateRequestUploadPath(path, { requestId: REQUEST, uid: OWNER, type: "after" })).toEqual({
      ok: true,
    });
  });

  it("rejects another request, another uploader, or another type folder", () => {
    expect(validateRequestUploadPath(path, { requestId: "req-2", uid: OWNER, type: "after" }).ok).toBe(false);
    expect(validateRequestUploadPath(path, { requestId: REQUEST, uid: OTHER, type: "after" }).ok).toBe(false);
    expect(validateRequestUploadPath(path, { requestId: REQUEST, uid: OWNER, type: "before" }).ok).toBe(false);
  });

  it("rejects a vault path or a raw URL posing as a request upload", () => {
    const vaultPath = `turnflow-property/${PROPERTY}/${OWNER}/1_x.pdf`;
    expect(validateRequestUploadPath(vaultPath, { requestId: REQUEST, uid: OWNER, type: "after" }).ok).toBe(false);
  });
});

describe("validatePropertyUploadPath", () => {
  const path = `turnflow-property/${PROPERTY}/${OWNER}/1_x.pdf`;

  it("accepts the owner's own vault path for this property", () => {
    expect(validatePropertyUploadPath(path, { propertyId: PROPERTY, uid: OWNER })).toEqual({ ok: true });
  });

  it("rejects another property or another uploader", () => {
    expect(validatePropertyUploadPath(path, { propertyId: "prop-2", uid: OWNER }).ok).toBe(false);
    expect(validatePropertyUploadPath(path, { propertyId: PROPERTY, uid: OTHER }).ok).toBe(false);
  });
});

describe("delete scoping", () => {
  it("only lets a record delete files under its own folder", () => {
    expect(isRequestScopedPath(`turnflow/${REQUEST}/after/${OTHER}/1_x.jpg`, REQUEST)).toBe(true);
    expect(isRequestScopedPath(`turnflow/req-9/after/${OWNER}/1_x.jpg`, REQUEST)).toBe(false);
    expect(isRequestScopedPath(null, REQUEST)).toBe(false);
    expect(isPropertyScopedPath(`turnflow-property/${PROPERTY}/${OWNER}/1_x.pdf`, PROPERTY)).toBe(true);
    expect(isPropertyScopedPath(`turnflow-property/prop-9/${OWNER}/1_x.pdf`, PROPERTY)).toBe(false);
  });
});

describe("file URLs and access mode", () => {
  it("stores a same-origin, encoded file route URL", () => {
    expect(fileUrlForPath("turnflow/r/after/u/1_a b.jpg")).toBe(
      "/api/files?path=turnflow%2Fr%2Fafter%2Fu%2F1_a%20b.jpg"
    );
  });

  it("defaults to private and only goes public on an explicit public value", () => {
    expect(blobAccessMode(undefined)).toBe("private");
    expect(blobAccessMode("")).toBe("private");
    expect(blobAccessMode(" Private ")).toBe("private");
    expect(blobAccessMode("public")).toBe("public");
    expect(blobAccessMode(" PUBLIC ")).toBe("public");
  });

  it("treats an unrecognized value as private, so a typo cannot publish uploads", () => {
    for (const typo of ["pubic", "publc", "true", "1", "off"]) {
      expect(blobAccessMode(typo)).toBe("private");
    }
  });
});
