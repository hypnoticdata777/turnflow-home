"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { REQUEST_STATUSES, requestStatusBadgeClasses, meetsCompletionRequirements } from "@/lib/utils";
import { updateRequestStatusAction, recordRequestPhotoAction } from "@/lib/actions/requests";
import { requestPhotoPath } from "@/lib/blob-paths";

const PHOTO_TYPES = ["before", "after", "receipt", "other"] as const;
type PhotoType = (typeof PHOTO_TYPES)[number];

type VendorRequest = {
  id: string;
  title: string;
  category: string;
  urgency: string;
  status: string;
  location: string | null;
  accessInstructions: string | null;
  contactMethod: string | null;
  assignedVendorId: string | null;
  finalCost: string | null;
  property: { address: string; nickname: string | null } | null;
  photos: { type: string }[];
};

export function VendorPortal({ requests, userId }: { requests: VendorRequest[]; userId: string }) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  async function handleStatusChange(requestId: string, newStatus: string) {
    const req = requests.find((r) => r.id === requestId);

    let waiverReason: string | undefined;
    if (newStatus === "Complete" && req && !meetsCompletionRequirements(req, req.photos)) {
      const reason = window.prompt(
        'This request is missing required proof to mark it Complete (a final cost and an "after" photo — ask the owner to enter the final cost if needed). ' +
          "Enter a reason to complete it anyway, or cancel to go back."
      );
      if (!reason || !reason.trim()) return;
      waiverReason = reason.trim();
    }

    setSavingId(requestId);
    try {
      await updateRequestStatusAction(requestId, newStatus, waiverReason);
      router.refresh();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setSavingId(null);
    }
  }

  async function handleUpload(type: PhotoType, file: File | undefined) {
    if (!file || !selectedRequestId) return;
    setUploadStatus(`Uploading ${type}…`);
    try {
      const pathname = requestPhotoPath(selectedRequestId, type, userId, file.name);
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/blob-upload",
      });
      await recordRequestPhotoAction(selectedRequestId, type, blob.url, blob.pathname);
      setUploadStatus(`Uploaded ${type} ✓`);
    } catch (err) {
      console.error(`Failed to upload ${type}:`, err);
      setUploadStatus(`Failed to upload ${type}.`);
    }
  }

  return (
    <div className="space-y-6">
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-3">My Requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-500">No requests assigned to you yet.</p>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => {
              const propertyLabel = r.property
                ? r.property.nickname
                  ? `${r.property.nickname} — ${r.property.address}`
                  : r.property.address
                : "(property not found)";
              return (
                <div key={r.id} className="bg-white border rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold mb-1">{r.title}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${requestStatusBadgeClasses(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm">
                    <strong>Property:</strong> {propertyLabel}
                  </p>
                  <p className="text-sm">
                    <strong>Category:</strong> {r.category} &nbsp; <strong>Urgency:</strong> {r.urgency}
                  </p>
                  <p className="text-sm">
                    <strong>Location:</strong> {r.location || "—"}
                  </p>
                  <p className="text-sm">
                    <strong>Access Instructions:</strong> {r.accessInstructions || "—"}
                  </p>
                  <p className="text-sm mb-2">
                    <strong>Preferred Contact:</strong> {r.contactMethod || "—"}
                  </p>
                  <label className="block text-sm mt-2">
                    <strong>Status:</strong>
                    <select
                      value={r.status}
                      disabled={savingId === r.id}
                      onChange={(e) => handleStatusChange(r.id, e.target.value)}
                      className="border rounded p-1 ml-1"
                    >
                      {REQUEST_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Upload Photos</h2>
        <label className="block mb-4">
          Request
          <select
            value={selectedRequestId}
            onChange={(e) => setSelectedRequestId(e.target.value)}
            className="w-full border p-2 rounded bg-white"
          >
            <option value="">— select a request —</option>
            {requests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>

        {selectedRequestId && (
          <div className="grid md:grid-cols-4 gap-4">
            {PHOTO_TYPES.map((type) => (
              <div key={type} className="border p-3 rounded">
                <h3 className="font-medium mb-2 capitalize">{type}</h3>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="mb-2 text-sm w-full"
                  onChange={(e) => handleUpload(type, e.target.files?.[0])}
                />
              </div>
            ))}
          </div>
        )}
        <p className="text-sm mt-3 text-gray-600">{uploadStatus}</p>
      </section>
    </div>
  );
}
