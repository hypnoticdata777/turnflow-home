import { describe, expect, it } from "vitest";
import {
  photoUploadStatus,
  requestCreatedNotice,
  requestDetailPathAfterCreate,
} from "@/lib/request-submit";

describe("photoUploadStatus", () => {
  it("summarizes queued photo upload outcomes", () => {
    expect(photoUploadStatus(0, 0)).toBe("none");
    expect(photoUploadStatus(2, 0)).toBe("complete");
    expect(photoUploadStatus(2, 1)).toBe("partial");
    expect(photoUploadStatus(2, 2)).toBe("failed");
    expect(photoUploadStatus(2, 3)).toBe("failed");
  });
});

describe("requestDetailPathAfterCreate", () => {
  it("routes the owner to the new request record with creation context", () => {
    expect(requestDetailPathAfterCreate("request-1", "complete")).toBe(
      "/owner/requests/request-1?created=1&uploads=complete"
    );
  });
});

describe("requestCreatedNotice", () => {
  it("does not show a creation notice without the created flag", () => {
    expect(requestCreatedNotice(undefined, "complete")).toBeNull();
    expect(requestCreatedNotice("0", "complete")).toBeNull();
  });

  it("explains a successful create with complete uploads", () => {
    expect(requestCreatedNotice("1", "complete")).toMatchObject({
      headline: "Request saved with initial proof.",
      tone: "success",
    });
  });

  it("explains partial and failed upload outcomes", () => {
    expect(requestCreatedNotice("1", "partial")).toMatchObject({
      headline: "Request saved, but some photos did not upload.",
      tone: "warning",
    });
    expect(requestCreatedNotice("1", "failed")).toMatchObject({
      headline: "Request saved, but photos did not upload.",
      tone: "warning",
    });
  });

  it("falls back to a plain saved notice when no photos were queued", () => {
    expect(requestCreatedNotice(["1"], ["none"])).toMatchObject({
      headline: "Request saved.",
      tone: "success",
    });
  });
});
