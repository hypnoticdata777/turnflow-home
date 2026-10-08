// Storage path conventions — mirrors the original Firebase Storage layout
// closely enough that the authorization logic reads the same way:
//   turnflow/{requestId}/{type}/{uid}/{filename}          — request photos + quote attachments
//   turnflow-property/{propertyId}/{uid}/{filename}       — vault documents
//
// P0 security (2026-09-28): the server never trusts a blob path or URL sent
// by the browser. Every action that records a file re-validates the path
// with the scope helpers below (right record, right uploader), derives the
// URL itself with fileUrlForPath(), and every delete re-checks that the
// stored path belongs to the record being deleted. See
// docs/04-algorithms/02-file-upload-and-access.md.

export const UPLOAD_PHOTO_TYPES = ["before", "after", "receipt", "other"] as const;
export const REQUEST_UPLOAD_TYPES = [...UPLOAD_PHOTO_TYPES, "quote"] as const;

export type RequestUploadType = (typeof REQUEST_UPLOAD_TYPES)[number];

const MAX_FILENAME_LENGTH = 120;

/** Keeps filenames to a safe, readable subset so a path can never smuggle extra segments. */
export function sanitizeFilename(filename: string) {
  const cleaned = filename
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9._-]/g, "")
    .replace(/^\.+/, "")
    .slice(-MAX_FILENAME_LENGTH);
  return cleaned || "file";
}

export function requestPhotoPath(requestId: string, type: string, uid: string, filename: string) {
  return `turnflow/${requestId}/${type}/${uid}/${Date.now()}_${sanitizeFilename(filename)}`;
}

export function vaultDocumentPath(propertyId: string, uid: string, filename: string) {
  return `turnflow-property/${propertyId}/${uid}/${Date.now()}_${sanitizeFilename(filename)}`;
}

export type ParsedUploadPath =
  | { kind: "request"; requestId: string; type: string; uid: string; filename: string }
  | { kind: "property"; propertyId: string; uid: string; filename: string }
  | { kind: "unknown" };

function hasUnsafeSegment(parts: string[]) {
  return parts.some((part) => part === "" || part === "." || part === ".." || part.includes("\\"));
}

/**
 * Parses a blob pathname into its scope. Paths must have exactly the
 * expected number of segments — no extra nesting, no empty or dot segments —
 * so "turnflow/<request>/after/<uid>/x" cannot be confused with anything else.
 */
export function parseUploadPath(pathname: string): ParsedUploadPath {
  if (typeof pathname !== "string" || pathname.length === 0 || pathname.length > 512) {
    return { kind: "unknown" };
  }
  const parts = pathname.split("/");
  if (hasUnsafeSegment(parts)) return { kind: "unknown" };

  if (parts[0] === "turnflow" && parts.length === 5) {
    return {
      kind: "request",
      requestId: parts[1],
      type: parts[2],
      uid: parts[3],
      filename: parts[4],
    };
  }
  if (parts[0] === "turnflow-property" && parts.length === 4) {
    return { kind: "property", propertyId: parts[1], uid: parts[2], filename: parts[3] };
  }
  return { kind: "unknown" };
}

/** True when the path lives under this request's folder (any uploader, any type). */
export function isRequestScopedPath(pathname: string | null | undefined, requestId: string) {
  if (!pathname) return false;
  const parsed = parseUploadPath(pathname);
  return parsed.kind === "request" && parsed.requestId === requestId;
}

/** True when the path lives under this property's vault folder. */
export function isPropertyScopedPath(pathname: string | null | undefined, propertyId: string) {
  if (!pathname) return false;
  const parsed = parseUploadPath(pathname);
  return parsed.kind === "property" && parsed.propertyId === propertyId;
}

/**
 * The check every "record this uploaded file" action runs: the path must be
 * for this exact request, this exact upload type, and uploaded by the
 * signed-in user. Anything else is rejected before a row is written.
 */
export function validateRequestUploadPath(
  pathname: string,
  expected: { requestId: string; uid: string; type: RequestUploadType }
): { ok: true } | { ok: false; reason: string } {
  const parsed = parseUploadPath(pathname);
  if (parsed.kind !== "request") return { ok: false, reason: "File path is not a request upload." };
  if (parsed.requestId !== expected.requestId) {
    return { ok: false, reason: "File was uploaded for a different request." };
  }
  if (parsed.uid !== expected.uid) {
    return { ok: false, reason: "File was uploaded by a different account." };
  }
  if (parsed.type !== expected.type) {
    return { ok: false, reason: "File type folder does not match this upload." };
  }
  return { ok: true };
}

export function validatePropertyUploadPath(
  pathname: string,
  expected: { propertyId: string; uid: string }
): { ok: true } | { ok: false; reason: string } {
  const parsed = parseUploadPath(pathname);
  if (parsed.kind !== "property") return { ok: false, reason: "File path is not a vault upload." };
  if (parsed.propertyId !== expected.propertyId) {
    return { ok: false, reason: "File was uploaded for a different property." };
  }
  if (parsed.uid !== expected.uid) {
    return { ok: false, reason: "File was uploaded by a different account." };
  }
  return { ok: true };
}

/**
 * The only URL the app stores for new uploads: a same-origin route that
 * re-checks access on every read (app/api/files/route.ts). The raw Blob URL
 * never reaches the browser.
 */
export function fileUrlForPath(pathname: string) {
  return `/api/files?path=${encodeURIComponent(pathname)}`;
}

export type BlobAccessMode = "private" | "public";

/**
 * Which Blob store access mode the server writes with. Fails closed (Phase 0,
 * 2026-10-08): only an explicit BLOB_ACCESS=public selects a public store.
 * Unset, empty, or unrecognized values (including a typo like "pubic") all
 * mean "private", so a forgotten or mistyped variable can never silently
 * publish uploads. A deployment that still uses a legacy public store must now
 * say so with BLOB_ACCESS=public (poc:ready blocks that on a hosted APP_URL).
 */
export function blobAccessMode(value: string | undefined): BlobAccessMode {
  return value?.trim().toLowerCase() === "public" ? "public" : "private";
}
