// Storage path conventions — mirrors the original Firebase Storage layout
// (docs/ARCHITECTURE.md in the sibling turnflow-mvp-main/ repo) closely
// enough that the authorization logic reads the same way:
//   turnflow/{requestId}/{type}/{uid}/{filename}          — request photos + quote attachments
//   turnflow-property/{propertyId}/{uid}/{filename}       — vault documents

export function requestPhotoPath(requestId: string, type: string, uid: string, filename: string) {
  return `turnflow/${requestId}/${type}/${uid}/${Date.now()}_${filename.replace(/\s+/g, "_")}`;
}

export function vaultDocumentPath(propertyId: string, uid: string, filename: string) {
  return `turnflow-property/${propertyId}/${uid}/${Date.now()}_${filename.replace(/\s+/g, "_")}`;
}

export type ParsedUploadPath =
  | { kind: "request"; requestId: string; type: string; uid: string }
  | { kind: "property"; propertyId: string; uid: string }
  | { kind: "unknown" };

export function parseUploadPath(pathname: string): ParsedUploadPath {
  const parts = pathname.split("/");
  if (parts[0] === "turnflow" && parts.length >= 4) {
    return { kind: "request", requestId: parts[1], type: parts[2], uid: parts[3] };
  }
  if (parts[0] === "turnflow-property" && parts.length >= 3) {
    return { kind: "property", propertyId: parts[1], uid: parts[2] };
  }
  return { kind: "unknown" };
}
