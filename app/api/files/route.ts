// Authorized file reads (P0 security, 2026-09-28). New uploads are stored
// with url = /api/files?path=<blob pathname>; every read comes through here,
// re-checks who may see the file (lib/file-access.ts), then streams it from
// Vercel Blob with the server's token. With BLOB_ACCESS=private the raw Blob
// URL is never usable without that token, so removing a vendor's access also
// removes their ability to open the files. See
// docs/04-algorithms/02-file-upload-and-access.md.
import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { blobAccessMode, parseUploadPath } from "@/lib/blob-paths";
import { canReadUpload, type FileAccessRecord } from "@/lib/file-access";

export const dynamic = "force-dynamic";

function denied(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return denied(401, "Sign in to view this file.");

  const pathname = new URL(request.url).searchParams.get("path") || "";
  const parsed = parseUploadPath(pathname);
  if (parsed.kind === "unknown") return denied(400, "Unknown file.");

  let record: FileAccessRecord = null;
  if (parsed.kind === "request") {
    const req = await db.query.requests.findFirst({
      where: (r, { eq }) => eq(r.id, parsed.requestId),
      columns: { ownerId: true, assignedVendorId: true, collaboratorId: true },
    });
    record = req ? { kind: "request", ...req } : null;
  } else {
    const property = await db.query.properties.findFirst({
      where: (p, { eq }) => eq(p.id, parsed.propertyId),
      columns: { ownerId: true },
    });
    record = property ? { kind: "property", ...property } : null;
  }

  // Same answer for "missing" and "not yours" so file names cannot be probed.
  if (!canReadUpload(parsed, session.user.id, record)) {
    return denied(404, "File not found.");
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return denied(503, "File storage is not configured on the server.");

  try {
    const result = await get(pathname, {
      access: blobAccessMode(process.env.BLOB_ACCESS),
      token,
    });
    if (!result || result.statusCode !== 200) return denied(404, "File not found.");

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        "Content-Type": result.blob.contentType || "application/octet-stream",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[files] blob read failed", error);
    return denied(502, "File storage could not return this file.");
  }
}
