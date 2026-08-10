"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  REQUEST_STATUSES,
  costForRequest,
  costLabelForRequest,
  meetsCompletionRequirements,
  requestStatusBadgeClasses,
} from "@/lib/utils";
import {
  recordRequestPhotoAction,
  updateCostAction,
  updateRequestStatusAction,
} from "@/lib/actions/requests";
import { createCollaboratorInviteAction, createVendorInviteAction } from "@/lib/actions/invites";
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
      setCostStatus("Saved.");
      router.refresh();
    } catch (err) {
      console.error("Failed to save costs:", err);
      setCostStatus("Failed to save. Please try again.");
    } finally {
      setCostSaving(false);
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Cost</h2>
      <div className="mb-2 grid gap-2 md:grid-cols-3">
        <label className="text-sm">
          Estimated
          <input
            type="number"
            step="0.01"
            min="0"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            className="mt-1 w-full rounded border p-2"
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
            className="mt-1 w-full rounded border p-2"
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
            className="mt-1 w-full rounded border p-2"
          />
        </label>
      </div>
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          onClick={handleSaveCosts}
          disabled={costSaving}
          className="rounded bg-gray-800 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {costSaving ? "Saving..." : "Save costs"}
        </button>
        {costStatus && <p className="text-sm text-gray-600">{costStatus}</p>}
      </div>
      <p className="mb-4 text-sm text-gray-600">
        Current ({costLabelForRequest(request)}): ${costForRequest(request).toFixed(2)}
      </p>
    </section>
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
      ? `${property.nickname} - ${property.address}`
      : property.address
    : "Property not found";

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    const previousStatus = status;

    let waiverReason: string | undefined;
    if (newStatus === "Complete" && !meetsCompletionRequirements(request, photos)) {
      const reason = window.prompt(
        'This request is missing required proof to mark it Complete: a final cost, an "after" photo, and an assigned vendor. Enter a reason to complete it anyway, or cancel to go back.'
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
    setUploadStatus(`Uploading ${type}...`);
    try {
      const pathname = requestPhotoPath(request.id, type, userId, file.name);
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/blob-upload",
      });
      await recordRequestPhotoAction(request.id, type, blob.url, blob.pathname);
      setPhotos((prev) => [...prev, { id: blob.pathname, type, url: blob.url }]);
      setUploadStatus(`Uploaded ${type}.`);
    } catch (err) {
      console.error(`Failed to upload ${type}:`, err);
      setUploadStatus(`Failed to upload ${type}.`);
    }
  }

  return (
    <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow">
      <section className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">Repair record</p>
            <h1 className="text-3xl font-bold">{request.title}</h1>
          </div>
          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${requestStatusBadgeClasses(
              status
            )}`}
          >
            {status}
          </span>
        </div>

        <dl className="mt-4 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Property</dt>
            <dd>{propertyLabel}</dd>
          </div>
          <div>
            <dt className="font-semibold">Category / urgency</dt>
            <dd>
              {request.category} / {request.urgency}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Location</dt>
            <dd>{request.location || "Not recorded"}</dd>
          </div>
          <div>
            <dt className="font-semibold">Preferred contact</dt>
            <dd>{request.contactMethod || "Not recorded"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold">Access instructions</dt>
            <dd>{request.accessInstructions || "Not recorded"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold">Notes</dt>
            <dd>{request.notes || "Not recorded"}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block text-sm">
            <span className="font-semibold">Status</span>
            <select
              value={status}
              onChange={handleStatusChange}
              disabled={statusSaving}
              className="mt-1 w-full rounded border bg-white p-2 sm:w-64"
            >
              {REQUEST_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={handleDownloadPdf}
            className="rounded bg-gray-700 px-4 py-2 text-sm text-white"
          >
            Download proof packet (PDF)
          </button>
        </div>
      </section>

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

      <section>
        <h2 className="mb-3 text-xl font-semibold">Photos</h2>
        <p className="mb-3 text-sm text-gray-500">
          Add before, after, receipt, or other proof to keep the repair record
          complete.
        </p>
        <div className="mb-3 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {PHOTO_TYPES.map((type) => (
            <div key={type} className="rounded border p-3">
              <h3 className="mb-2 font-medium capitalize">{type}</h3>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="mb-2 w-full text-sm"
                onChange={(e) => handleUpload(type, e.target.files?.[0])}
              />
            </div>
          ))}
        </div>
        {uploadStatus && <p className="mb-4 text-sm text-gray-600">{uploadStatus}</p>}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {photos.length === 0 ? (
            <p className="col-span-full text-gray-500">No photos yet.</p>
          ) : (
            photos.map((p) => (
              <figure key={p.id} className="rounded border p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={`${p.type} photo`}
                  className="h-36 w-full rounded object-cover"
                />
                <figcaption className="mt-1 text-center text-sm capitalize">
                  {p.type}
                </figcaption>
              </figure>
            ))
          )}
        </div>
      </section>

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

      <a
        href="/owner/dashboard"
        className="inline-block rounded bg-gray-600 px-4 py-2 text-white"
      >
        Back to dashboard
      </a>
    </div>
  );
}
