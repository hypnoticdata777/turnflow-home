// Client-upload token issuer for Vercel Blob — the direct replacement for
// storage.rules' write checks. The browser calls @vercel/blob/client's
// upload(), which POSTs here first to get a short-lived token; we decide
// whether the signed-in user may write to that exact path before issuing
// one, mirroring the original turnflow/{requestId}/{type}/{uid}/... and
// turnflow-property/{propertyId}/{uid}/... rules.
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { parseUploadPath } from "@/lib/blob-paths";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];
const MAX_SIZE_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth();
        if (!session?.user) {
          throw new Error("Not signed in");
        }

        const parsed = parseUploadPath(pathname);
        if (parsed.kind === "unknown" || parsed.uid !== session.user.id) {
          throw new Error("Not authorized to upload to this path");
        }

        if (parsed.kind === "request") {
          const req = await db.query.requests.findFirst({
            where: (r, { eq }) => eq(r.id, parsed.requestId),
          });
          const isOwner = req?.ownerId === session.user.id;
          const isAssignedVendor = req?.assignedVendorId === session.user.id;
          if (!req || !(isOwner || isAssignedVendor)) {
            throw new Error("Not authorized to upload to this request");
          }
        }

        if (parsed.kind === "property") {
          const property = await db.query.properties.findFirst({
            where: (p, { eq }) => eq(p.id, parsed.propertyId),
          });
          if (!property || property.ownerId !== session.user.id) {
            throw new Error("Not authorized to upload to this property");
          }
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_SIZE_BYTES,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      // Deliberately no onUploadCompleted: each Server Action records the
      // resulting blob URL in the DB itself once the client-side upload()
      // call resolves (same sequencing the Firebase build used — upload,
      // then addDoc). Vercel Blob can't reach this callback on localhost
      // anyway (no public URL to call back to during local dev), and
      // registering the callback without a resolvable URL was observed to
      // stall the client upload — omitting it avoids that entirely rather
      // than fighting VERCEL_BLOB_CALLBACK_URL for a callback we don't use.
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
