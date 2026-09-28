import type { ParsedUploadPath } from "@/lib/blob-paths";

// Pure read-authorization rule for stored files, shared by
// app/api/files/route.ts and its unit tests. The route loads the request or
// property named by the path; this function decides.
//
//   request files  -> owner, assigned vendor, or shared collaborator
//   property files -> owner only (the vault is never shared)

export type FileAccessRecord =
  | {
      kind: "request";
      ownerId: string;
      assignedVendorId: string | null;
      collaboratorId: string | null;
    }
  | { kind: "property"; ownerId: string }
  | null;

export function canReadUpload(
  parsed: ParsedUploadPath,
  userId: string,
  record: FileAccessRecord
): boolean {
  if (!userId || !record || parsed.kind === "unknown") return false;
  if (parsed.kind !== record.kind) return false;

  if (record.kind === "request") {
    return (
      record.ownerId === userId ||
      record.assignedVendorId === userId ||
      record.collaboratorId === userId
    );
  }

  return record.ownerId === userId;
}
