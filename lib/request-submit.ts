export type PhotoUploadStatus = "none" | "complete" | "partial" | "failed";

export type RequestCreatedNotice = {
  headline: string;
  detail: string;
  tone: "success" | "warning";
};

export function photoUploadStatus(queuedCount: number, failedCount: number): PhotoUploadStatus {
  if (queuedCount <= 0) return "none";
  if (failedCount <= 0) return "complete";
  if (failedCount >= queuedCount) return "failed";
  return "partial";
}

export function requestDetailPathAfterCreate(
  requestId: string,
  uploadStatus: PhotoUploadStatus
) {
  const params = new URLSearchParams({ created: "1", uploads: uploadStatus });
  return `/owner/requests/${requestId}?${params.toString()}`;
}

export function requestCreatedNotice(
  created: string | string[] | undefined,
  uploads: string | string[] | undefined
): RequestCreatedNotice | null {
  const wasCreated = Array.isArray(created) ? created[0] === "1" : created === "1";
  if (!wasCreated) return null;

  const uploadStatus = Array.isArray(uploads) ? uploads[0] : uploads;

  if (uploadStatus === "complete") {
    return {
      headline: "Request saved with initial proof.",
      detail:
        "Review the record below, then add cost context or invite help when you are ready.",
      tone: "success",
    };
  }

  if (uploadStatus === "partial") {
    return {
      headline: "Request saved, but some photos did not upload.",
      detail:
        "The repair record exists. Review the photos below and attach any missing proof from this page.",
      tone: "warning",
    };
  }

  if (uploadStatus === "failed") {
    return {
      headline: "Request saved, but photos did not upload.",
      detail:
        "The repair record exists. Add the missing proof from the photo section when you are ready.",
      tone: "warning",
    };
  }

  return {
    headline: "Request saved.",
    detail:
      "Review the new repair record below, then add proof, cost context, or sharing as needed.",
    tone: "success",
  };
}
