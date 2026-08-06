"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  REQUEST_STATUSES,
  requestStatusBadgeClasses,
  costForRequest,
  costLabelForRequest,
  meetsCompletionRequirements,
} from "@/lib/utils";
import {
  recordRequestPhotoAction,
  updateRequestStatusAction,
  updateCostAction,
} from "@/lib/actions/requests";
import { createVendorInviteAction, createCollaboratorInviteAction } from "@/lib/actions/invites";
import { requestPhotoPath } from "@/lib/blob-paths";
import { QuoteWorkspace, type QuoteData } from "@/components/QuoteWorkspace";
import { DecisionLog, actorLabel, type LogEntryData } from "@/components/DecisionLog";
import { downloadProofPacketPdf } from "@/lib/pdf/proofPacket";
import { InviteSection } from "@/components/InviteSection";
import { CommentThread, type CommentData } from "@/components/CommentThread";

const PHOTO_TYPES = ["before", "after", "receipt", "other"] as const;
type PhotoType = (typeof PHOTO_TYPES)[number];

type RequestData = {
  id: string;
  title: string;
  category: string;
  urgency: string;
  status: string;
  location: string | null;
  contactMethod: string | null;
  accessInstructions: string | null;
  notes: string | null;
  assignedVendorId: string | null;
  pendingVendorInviteId: string | null;
  collaboratorId: string | null;
  pendingCollaboratorInviteId: string | null;
  estimatedCost: string | null;
  quotedCost: string | null;
  finalCost: string | null;
};
type Photo = { id: string; type: string; url: string };
type Property = { address: string; nickname: string | null } | null;

function CostEditor({ request }: { request: RequestData }) {
  const router = useRouter();
  const [estimatedCost, setEstimatedCost] = useState(request.estimatedCost ?? "");
  const [quotedCost, setQuotedCost] = useState(request.quotedCost ?? "");
  const [finalCost, setFinalCost] = useState(request.finalCost ?? "");
  const [costSaving, setCostSaving] = useState(false);
  const [costStatus, setCostStatus] = useState("");

  async function handleSaveCosts() {
    setCostSaving(true);
    setCostStatus("Saving...");
    try {
      await updateCostAction(request.id, { estimatedCost, quotedCost, finalCost });
      setCostStatus("Saved");
      router.refresh();
    } catch (err) {
      console.error("Failed to save costs:", err);
      setCostStatus("Failed to save. Please try again.");
    } finally {
      setCostSaving(false);
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-3">Cost</h2>
      <div className="grid md:grid-cols-3 gap-2 mb-2">
        <label className="text-sm">
          Estimated
          <input
            type="number"
            step="0.01"
            min="0"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            className="w-full p-2 border rounded mt-1"
          />
        </label>
        <label className="text-sm">
          Quoted
          <input
            type="number"
            step="0.01"
            min="0"
            value={quotedCost}
            onChange={(e) => setQuotedCost(e.target.value)}
            className="w-full p-2 border rounded mt-1"
          />
        </label>
        <label className="text-sm">
          Final
          <input
            type="number"
            step="0.01"
            min="0"
            value={finalCost}
            onChange={(e) => setFinalCost(e.target.value)}
            className="w-full p-2 border rounded mt-1"
          />
        </label>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={handleSaveCosts}
          disabled={costSaving}
          className="bg-gray-800 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {costSaving ? "Saving..." : "Save Costs"}
        </button>
        {costStatus && <p className="text-sm text-gray-600">{costStatus}</p>}
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Current ({costLabelForRequest(request)}): ${costForRequest(request).toFixed(2)}
      </p>
    </>
  );
}

export function RequestDetailView({
  request,
  photos: initialPhotos,
  quotes,
  log,
  comments,
  property,
  userId,
}: {
  request: RequestData;
  photos: Photo[];
  quotes: QuoteData[];
  log: LogEntryData[];
  comments: CommentData[];
  property: Property;
  userId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(request.status);
  const [statusSaving, setStatusSaving] = useState(false);
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploadStatus, setUploadStatus] = useState("");
  const propertyLabel = property
    ? property.nickname
      ? `${property.nickname} — ${property.address}`
      : property.address
    : "(property not found)";

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    const previousStatus = status;

    let waiverReason: string | undefined;
    if (newStatus === "Complete" && !meetsCompletionRequirements(request, photos)) {
      const reason = window.prompt(
        'This request is missing required proof to mark it Complete (a final cost, an "after" photo, and an assigned vendor). ' +
          "Enter a reason to complete it anyway, or cancel to go back."
      );
      if (!reason || !reason.trim()) {
        e.target.value = previousStatus;
        return;
      }
      waiverReason = reason.trim();
    }

    setStatus(newStatus);
    setStatusSaving(true);
    try {
      await updateRequestStatusAction(request.id, newStatus, waiverReason);
      router.refresh();
    } catch (err) {
      console.error("Failed to update status:", err);
      setStatus(previousStatus);
    } finally {
      setStatusSaving(false);
    }
  }

  function handleDownloadPdf() {
    downloadProofPacketPdf({
      request,
      propertyLabel,
      quotes,
      photos,
      log,
      actorLabel: (actorId) => actorLabel(actorId, userId, request.assignedVendorId),
    });
  }

  async function handleUpload(type: PhotoType, file: File | undefined) {
    if (!file) return;
    setUploadStatus(`Uploading ${type}…`);
    try {
      const pathname = requestPhotoPath(request.id, type, userId, file.name);
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/blob-upload",
      });
      await recordRequestPhotoAction(request.id, type, blob.url, blob.pathname);
      setPhotos((prev) => [...prev, { id: blob.pathname, type, url: blob.url }]);
      setUploadStatus(`Uploaded ${type} ✓`);
    } catch (err) {
      console.error(`Failed to upload ${type}:`, err);
      setUploadStatus(`Failed to upload ${type}.`);
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow">
      <div className="mb-6 text-gray-700 space-y-1">
        <p>
          <strong>Title:</strong> {request.title}
        </p>
        <p>
          <strong>Property:</strong> {propertyLabel}
        </p>
        <p>
          <strong>Category:</strong> {request.category} &nbsp;
          <strong>Urgency:</strong> {request.urgency}
        </p>
        <p>
          <strong>Location:</strong> {request.location || "—"}
        </p>
        <p>
          <strong>Preferred Contact:</strong> {request.contactMethod || "—"}
        </p>
        <p>
          <strong>Access Instructions:</strong> {request.accessInstructions || "—"}
        </p>
        <p>
          <strong>Notes:</strong> {request.notes || "—"}
        </p>
        <label className="block mt-2 text-sm">
          <strong>Status:</strong>
          <select
            value={status}
            onChange={handleStatusChange}
            disabled={statusSaving}
            className="border rounded p-1 ml-1"
          >
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span
            className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${requestStatusBadgeClasses(
              status
            )}`}
          >
            {status}
          </span>
        </label>
        <button
          onClick={handleDownloadPdf}
          className="mt-3 bg-gray-700 text-white px-4 py-2 rounded text-sm"
        >
          📄 Download Proof Packet (PDF)
        </button>
      </div>

      <hr className="my-4" />

      <CostEditor
        key={[
          request.id,
          request.estimatedCost ?? "",
          request.quotedCost ?? "",
          request.finalCost ?? "",
        ].join(":")}
        request={request}
      />

      <hr className="my-4" />

      <QuoteWorkspace requestId={request.id} quotes={quotes} userId={userId} />

      <hr className="my-4" />

      <InviteSection
        requestId={request.id}
        label="Vendor"
        assigneeId={request.assignedVendorId}
        pendingInviteId={request.pendingVendorInviteId}
        createInvite={createVendorInviteAction}
      />
      <InviteSection
        requestId={request.id}
        label="Collaborator"
        assigneeId={request.collaboratorId}
        pendingInviteId={request.pendingCollaboratorInviteId}
        createInvite={createCollaboratorInviteAction}
      />

      <hr className="my-4" />

      <h2 className="text-xl font-semibold mb-3">Photos</h2>
      <div className="grid md:grid-cols-4 gap-4 mb-3">
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
      <p className="text-sm text-gray-600 mb-4">{uploadStatus}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {photos.length === 0 ? (
          <p className="text-gray-500 col-span-full">No photos yet.</p>
        ) : (
          photos.map((p) => (
            <figure key={p.id} className="border rounded p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`${p.type} photo`} className="w-full h-36 object-cover rounded" />
              <figcaption className="text-center text-sm capitalize mt-1">{p.type}</figcaption>
            </figure>
          ))
        )}
      </div>

      <hr className="my-4" />

      <DecisionLog entries={log} userId={userId} assignedVendorId={request.assignedVendorId} />

      <hr className="my-4" />

      <CommentThread
        requestId={request.id}
        comments={comments}
        userId={userId}
        assignedVendorId={request.assignedVendorId}
        collaboratorId={request.collaboratorId}
      />

      <hr className="my-4" />

      <a href="/owner/dashboard" className="bg-gray-600 text-white px-4 py-2 rounded inline-block">
        ⬅ Back to Dashboard
      </a>
    </div>
  );
}
