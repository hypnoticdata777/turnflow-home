"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  CONTACT_METHODS,
  REQUEST_CATEGORIES,
  REQUEST_URGENCIES,
  checklistForCategory,
} from "@/lib/utils";
import {
  createRequestAction,
  recordRequestPhotoAction,
} from "@/lib/actions/requests";
import { createProperty } from "@/lib/actions/properties";
import { requestPhotoPath } from "@/lib/blob-paths";

type Property = { id: string; address: string; nickname: string | null };

const PHOTO_TYPES = ["before", "after", "receipt", "other"] as const;
type PhotoType = (typeof PHOTO_TYPES)[number];

export function NewRequestForm({
  properties,
  userId,
}: {
  properties: Property[];
  userId: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [category, setCategory] = useState("");
  const [urgency, setUrgency] = useState("");
  const [queuedPhotos, setQueuedPhotos] = useState<Record<PhotoType, File | null>>({
    before: null,
    after: null,
    receipt: null,
    other: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState("");

  const [quickAddress, setQuickAddress] = useState("");
  const [quickNickname, setQuickNickname] = useState("");
  const [quickAddPending, setQuickAddPending] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);

  async function handleQuickAddProperty() {
    if (!quickAddress.trim()) {
      setQuickAddError("Address is required.");
      return;
    }
    setQuickAddPending(true);
    setQuickAddError(null);
    const fd = new FormData();
    fd.set("address", quickAddress.trim());
    fd.set("nickname", quickNickname.trim());
    const result = await createProperty(undefined, fd);
    setQuickAddPending(false);
    if (result?.error) {
      setQuickAddError(result.error);
      return;
    }
    setQuickAddress("");
    setQuickNickname("");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const result = await createRequestAction(formData);

    if ("error" in result) {
      setError(result.error);
      setSaving(false);
      return;
    }

    const requestId = result.requestId;
    const queued = PHOTO_TYPES.filter((t) => queuedPhotos[t]);
    for (const type of queued) {
      const file = queuedPhotos[type]!;
      setPhotoStatus(`Uploading ${type}...`);
      try {
        const pathname = requestPhotoPath(requestId, type, userId, file.name);
        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/blob-upload",
        });
        await recordRequestPhotoAction(requestId, type, blob.url, blob.pathname);
      } catch (err) {
        console.error(`Failed to upload ${type} photo:`, err);
      }
    }

    router.push("/owner/dashboard");
  }

  const checklist = checklistForCategory(category);

  return (
    <div className="max-w-2xl rounded-xl bg-white p-6 shadow">
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {properties.length === 0 && (
        <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3">
          <p className="mb-2 text-sm font-medium">
            Let&apos;s add your first property before your first request. It only
            takes a second.
          </p>
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              type="text"
              placeholder="Address"
              value={quickAddress}
              onChange={(e) => setQuickAddress(e.target.value)}
              className="flex-1 rounded border p-2 text-sm"
            />
            <input
              type="text"
              placeholder="Nickname (optional)"
              value={quickNickname}
              onChange={(e) => setQuickNickname(e.target.value)}
              className="flex-1 rounded border p-2 text-sm"
            />
            <button
              type="button"
              onClick={handleQuickAddProperty}
              disabled={quickAddPending}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white whitespace-nowrap disabled:opacity-50"
            >
              {quickAddPending ? "Saving..." : "Add property"}
            </button>
          </div>
          {quickAddError && (
            <p className="mt-1 text-xs text-red-600">{quickAddError}</p>
          )}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Property</label>
          <select name="propertyId" required className="w-full rounded border bg-white p-2">
            <option value="">
              {properties.length === 0 ? "Add a property first" : "Select a property"}
            </option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nickname ? `${p.nickname} - ${p.address}` : p.address}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Short title</label>
          <input
            name="title"
            type="text"
            required
            placeholder="e.g. Kitchen faucet leaking"
            className="w-full rounded border p-2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              name="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded border bg-white p-2"
            >
              <option value="">Select a category</option>
              {REQUEST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Urgency</label>
            <select
              name="urgency"
              required
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full rounded border bg-white p-2"
            >
              <option value="">Select urgency</option>
              {REQUEST_URGENCIES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {urgency === "Emergency" && (
          <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            TurnFlow Home is not an emergency dispatch service. If this is a
            genuine emergency (fire, gas leak, flooding, electrical hazard),
            contact emergency services or a licensed professional directly. Use
            this request only to track and document it.
          </p>
        )}

        {checklist.length > 0 && (
          <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <p className="mb-1 font-medium">Before you go further</p>
            <ul className="list-inside list-disc space-y-1">
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Room / location</label>
          <input
            name="location"
            type="text"
            placeholder="e.g. Kitchen, 2nd floor bathroom"
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Preferred contact method
          </label>
          <select name="contactMethod" className="w-full rounded border bg-white p-2">
            <option value="">Preferred contact method</option>
            {CONTACT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Access instructions</label>
          <textarea
            name="accessInstructions"
            rows={2}
            placeholder="e.g. Lockbox code, gate access, pets on site"
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Describe the issue"
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Photos (optional)</label>
          <p className="mb-2 text-xs text-gray-500">
            Attach photos now, or add them later from the request page.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {PHOTO_TYPES.map((type) => (
              <div key={type} className="rounded border p-3">
                <h3 className="mb-2 text-sm font-medium capitalize">{type}</h3>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="mb-1 w-full text-sm"
                  onChange={(e) =>
                    setQueuedPhotos((prev) => ({
                      ...prev,
                      [type]: e.target.files?.[0] ?? null,
                    }))
                  }
                />
                <p className="text-xs text-gray-500">{queuedPhotos[type]?.name ?? ""}</p>
              </div>
            ))}
          </div>
          {photoStatus && <p className="mt-2 text-sm text-gray-600">{photoStatus}</p>}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-green-600 px-6 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save request"}
          </button>
          <a
            href="/owner/dashboard"
            className="inline-block rounded bg-gray-600 px-6 py-2 text-center text-white"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
