// Browser-side upload helper. POSTs the file to /api/blob-upload as
// multipart/form-data; the route stores it in Vercel Blob server-side. This
// replaces `upload()` from @vercel/blob/client, whose browser->Blob PUT is
// currently CORS-blocked on Vercel's upload hosts.
//
// Because the request now goes through a serverless function (~4.5 MB body
// limit), large images are downscaled here first. HEIC and PDF cannot be
// downscaled in the browser without extra dependencies, so an oversized one
// surfaces as a clear error from the route.

export type UploadedBlob = { url: string; pathname: string };

const PROXY_MAX_BYTES = 4 * 1024 * 1024;
const DOWNSCALE_TRIGGER_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2000;
const DOWNSCALABLE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadFileToBlob(
  pathname: string,
  file: File
): Promise<UploadedBlob> {
  let body: File = file;
  let targetPathname = pathname;

  if (shouldDownscale(file)) {
    const downscaled = await downscaleImage(file).catch(() => null);
    if (downscaled && downscaled.size < file.size) {
      body = downscaled;
      targetPathname = `${pathname.replace(/\.[^./]+$/, "")}.jpg`;
    }
  }

  if (body.size > PROXY_MAX_BYTES) {
    throw new Error(
      "This file is too large to upload (limit ~4 MB). Try a smaller photo, or a JPEG instead of HEIC/PDF."
    );
  }

  const form = new FormData();
  form.set("pathname", targetPathname);
  form.set("file", body);

  const res = await fetch("/api/blob-upload", { method: "POST", body: form });
  if (!res.ok) {
    let message = "Upload failed. Please try again.";
    try {
      const parsed = (await res.json()) as { error?: string };
      if (parsed?.error) message = parsed.error;
    } catch {
      // keep the default message
    }
    throw new Error(message);
  }

  return (await res.json()) as UploadedBlob;
}

function shouldDownscale(file: File): boolean {
  return (
    file.size > DOWNSCALE_TRIGGER_BYTES && DOWNSCALABLE_TYPES.includes(file.type)
  );
}

async function downscaleImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(
      1,
      MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height)
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d canvas context");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    if (!blob) throw new Error("canvas encode failed");

    return new File([blob], "upload.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
