// Server-side upload proxy for Vercel Blob — the file is POSTed here as
// multipart/form-data and this route streams it to Blob with a read-write
// token. This replaced the @vercel/blob/client `upload()` browser->Blob
// flow, which is currently CORS-blocked on Vercel's own upload endpoints
// (both vercel.com/api/blob and blob.vercel-storage.com return no
// Access-Control-Allow-Origin for the cross-origin PUT). See docs/BUILD_LOG.md,
// 2026-09-02 "Blob Upload Proxy". The path-authorization checks mirror the
// original storage.rules: turnflow/{requestId}/{type}/{uid}/... and
// turnflow-property/{propertyId}/{uid}/...
//
// P0 security (2026-09-28): the store access mode comes from BLOB_ACCESS
// (private once a private store is configured), a random suffix makes blob
// names unguessable, files without a declared type are rejected, and the
// response carries only the same-origin /api/files URL — never the raw Blob
// URL. See docs/04-algorithms/02-file-upload-and-access.md.
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  REQUEST_UPLOAD_TYPES,
  blobAccessMode,
  fileUrlForPath,
  parseUploadPath,
} from "@/lib/blob-paths";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

// Vercel serverless functions cap the request body near 4.5 MB. The client
// helper (lib/blob-upload-client.ts) downscales large images before they get
// here; anything still larger is rejected with a clear message rather than a
// generic platform 413.
const MAX_SIZE_BYTES = 4 * 1024 * 1024;

// Thrown only for "you may not write here" decisions, so the catch can answer
// 403 for those and 502 for an actual storage/infra failure.
class UploadAccessError extends Error {}

export async function POST(request: Request): Promise<NextResponse> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    console.error(
      "[blob-upload] BLOB_READ_WRITE_TOKEN is not set on the server; cannot store uploads"
    );
    return NextResponse.json(
      { error: "File uploads are not configured on the server." },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Malformed upload request." },
      { status: 400 }
    );
  }

  const pathname = form.get("pathname");
  const file = form.get("file");
  if (typeof pathname !== "string" || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Upload request is missing the file or its target path." },
      { status: 400 }
    );
  }

  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type || "unknown"}` },
      { status: 415 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      {
        error:
          "This file is too large to upload here (limit ~4 MB). Try a smaller photo, or a JPEG instead of HEIC/PDF.",
      },
      { status: 413 }
    );
  }

  try {
    const session = await auth();
    if (!session?.user) {
      throw new UploadAccessError("Not signed in");
    }

    const parsed = parseUploadPath(pathname);
    if (parsed.kind === "unknown" || parsed.uid !== session.user.id) {
      throw new UploadAccessError("Not authorized to upload to this path");
    }

    if (
      parsed.kind === "request" &&
      !(REQUEST_UPLOAD_TYPES as readonly string[]).includes(parsed.type)
    ) {
      throw new UploadAccessError("Unknown upload folder");
    }

    if (parsed.kind === "request") {
      const req = await db.query.requests.findFirst({
        where: (r, { eq }) => eq(r.id, parsed.requestId),
      });
      const isOwner = req?.ownerId === session.user.id;
      const isAssignedVendor = req?.assignedVendorId === session.user.id;
      if (!req || !(isOwner || isAssignedVendor)) {
        throw new UploadAccessError("Not authorized to upload to this request");
      }
    }

    if (parsed.kind === "property") {
      const property = await db.query.properties.findFirst({
        where: (p, { eq }) => eq(p.id, parsed.propertyId),
      });
      if (!property || property.ownerId !== session.user.id) {
        throw new UploadAccessError("Not authorized to upload to this property");
      }
    }

    const blob = await put(pathname, file, {
      access: blobAccessMode(process.env.BLOB_ACCESS),
      token,
      addRandomSuffix: true,
      contentType: file.type,
    });

    return NextResponse.json({ url: fileUrlForPath(blob.pathname), pathname: blob.pathname });
  } catch (error) {
    if (error instanceof UploadAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("[blob-upload] server upload failed", error);
    return NextResponse.json(
      { error: "File storage rejected the upload. Try again shortly." },
      { status: 502 }
    );
  }
}
