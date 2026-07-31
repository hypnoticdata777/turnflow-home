"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  REQUEST_CATEGORIES,
  REQUEST_URGENCIES,
  CONTACT_METHODS,
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
      setPhotoStatus(`Uploading ${type}…`);
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
    <div className="max-w-2xl bg-white p-6 rounded-xl shadow">
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {properties.length === 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm font-medium mb-2">
            Let&apos;s add your first property before your first request — it
            only takes a second.
          </p>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              placeholder="Address"
              value={quickAddress}
              onChange={(e) => setQuickAddress(e.target.value)}
              className="flex-1 p-2 border rounded text-sm"
            />
            <input
              type="text"
              placeholder="Nickname (optional)"
              value={quickNickname}
              onChange={(e) => setQuickNickname(e.target.value)}
              className="flex-1 p-2 border rounded text-sm"
            />
            <button
              type="button"
              onClick={handleQuickAddProperty}
              disabled={quickAddPending}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm whitespace-nowrap disabled:opacity-50"
            >
              {quickAddPending ? "Saving…" : "Add Property"}
            </button>
          </div>
          {quickAddError && (
            <p className="text-xs text-red-600 mt-1">{quickAddError}</p>
          )}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Property</label>
          <select name="propertyId" required className="w-full p-2 border rounded bg-white">
            <option value="">
              {properties.length === 0 ? "— add a property first —" : "— select a property —"}
            </option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nickname ? `${p.nickname} — ${p.address}` : p.address}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Short Title</label>
          <input
            name="title"
            type="text"
            required
            placeholder="e.g. Kitchen faucet leaking"
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              name="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border rounded bg-white"
            >
              <option value="">— select a category —</option>
              {REQUEST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Urgency</label>
            <select
              name="urgency"
              required
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full p-2 border rounded bg-white"
            >
              <option value="">— select urgency —</option>
              {REQUEST_URGENCIES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {urgency === "Emergency" && (
          <p className="text-sm bg-red-50 border border-red-200 text-red-700 rounded p-3">
            ⚠️ TurnFlow Home is not an emergency dispatch service. If this is
            a genuine emergency (fire, gas leak, flooding, electrical
            hazard), contact emergency services or a licensed professional
            directly — use this request only to track and document it.
          </p>
        )}

        {checklist.length > 0 && (
          <div className="text-sm bg-blue-50 border border-blue-200 text-blue-800 rounded p-3">
            <p className="font-medium mb-1">Before you go further</p>
            <ul className="list-disc list-inside space-y-1">
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Room / Location</label>
          <input
            name="location"
            type="text"
            placeholder="e.g. Kitchen, 2nd floor bathroom"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Preferred Contact Method</label>
          <select name="contactMethod" className="w-full p-2 border rounded bg-white">
            <option value="">— preferred contact method —</option>
            {CONTACT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Access Instructions</label>
          <textarea
            name="accessInstructions"
            rows={2}
            placeholder="e.g. Lockbox code, gate access, pets on site"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Describe the issue"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Photos (optional)</label>
          <p className="text-xs text-gray-500 mb-2">
            Attach photos now, or add them later from the request page.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PHOTO_TYPES.map((type) => (
              <div key={type} className="border p-3 rounded">
                <h3 className="font-medium mb-2 text-sm capitalize">{type}</h3>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="mb-1 text-sm w-full"
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
          {photoStatus && <p className="text-sm text-gray-600 mt-2">{photoStatus}</p>}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {saving ? "Saving…" : "💾 Save Request"}
          </button>
          <a href="/owner/dashboard" className="bg-gray-600 text-white px-6 py-2 rounded inline-block">
            ⬅ Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
