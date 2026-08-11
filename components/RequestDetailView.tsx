"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  REQUEST_STATUSES,
  costForRequest,
  costLabelForRequest,
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
import { CompletionWaiverReview } from "@/components/CompletionWaiverReview";
import { RequestCreatedNoticeBanner } from "@/components/RequestCreatedNoticeBanner";
import { commentThreadGuidance } from "@/lib/comment-guidance";
import {
  missingCompletionProof,
  requestGuidance,
  requestRecordValueMetrics,
} from "@/lib/request-guidance";
import type { RequestCreatedNotice } from "@/lib/request-submit";

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
    <section id="cost" className="scroll-mt-6">
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
  creationNotice,
}: {
  request: RequestData;
  photos: Photo[];
  quotes: QuoteData[];
  log: LogEntryData[];
  comments: CommentData[];
  property: Property;
  userId: string;
  creationNotice: RequestCreatedNotice | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(request.status);
  const [statusSaving, setStatusSaving] = useState(false);
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploadStatus, setUploadStatus] = useState("");
  const [statusError, setStatusError] = useState("");
  const [showCompletionReview, setShowCompletionReview] = useState(false);
  const propertyLabel = property
    ? property.nickname
      ? `${property.nickname} - ${property.address}`
      : property.address
    : "Property not found";
  const guidance = requestGuidance({ ...request, photos });
  const recordValueMetrics = requestRecordValueMetrics({
    ...request,
    photos,
    quotes,
    log,
    comments,
  });
  const guidanceClasses =
    guidance.tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : guidance.tone === "attention"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : "border-amber-200 bg-amber-50 text-amber-950";
  const guidanceButtonClasses =
    guidance.tone === "ready"
      ? "bg-emerald-800"
      : guidance.tone === "attention"
        ? "bg-blue-800"
      : "bg-amber-800";
  const recordValueClasses = (tone: (typeof recordValueMetrics)[number]["tone"]) =>
    tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : tone === "attention"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : "border-amber-200 bg-amber-50 text-amber-950";
  const recordValueButtonClasses = (tone: (typeof recordValueMetrics)[number]["tone"]) =>
    tone === "ready"
      ? "bg-emerald-800 hover:bg-emerald-900"
      : tone === "attention"
        ? "bg-blue-800 hover:bg-blue-900"
        : "bg-amber-800 hover:bg-amber-900";
  const missingProof = missingCompletionProof({ ...request, photos });

  async function applyStatusChange(newStatus: string, waiverReason?: string) {
    const previousStatus = status;

    setStatusError("");
    setStatus(newStatus);
    setStatusSaving(true);
    try {
      await updateRequestStatusAction(request.id, newStatus, waiverReason);
      setShowCompletionReview(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to update status:", err);
      setStatus(previousStatus);
      setStatusError("Failed to update status. Please try again.");
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;

    if (newStatus === "Complete" && missingProof.length > 0) {
      setStatusError("");
      setShowCompletionReview(true);
      return;
    }

    await applyStatusChange(newStatus);
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
      {creationNotice && <RequestCreatedNoticeBanner notice={creationNotice} />}

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

        <section className={`mt-5 rounded-lg border p-4 ${guidanceClasses}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold">
                {`${guidance.eyebrow}: ${guidance.completedCount} of ${guidance.totalCount} ready (${guidance.progress}%)`}
              </p>
              <h2 className="mt-1 text-xl font-semibold">{guidance.headline}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6">{guidance.detail}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={guidance.primaryHref}
                className={`inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium text-white ${guidanceButtonClasses}`}
              >
                {guidance.primaryCta}
              </a>
              <a
                href={guidance.secondaryHref}
                className="inline-flex items-center justify-center rounded border border-current bg-white/75 px-4 py-2 text-sm font-medium"
              >
                {guidance.secondaryCta}
              </a>
            </div>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/70">
            <div className="h-full bg-current" style={{ width: `${guidance.progress}%` }} />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {guidance.items.map((item) => (
              <div key={item.label} className="rounded border border-current/20 bg-white/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold">
                    {item.complete ? "Ready" : "Needs work"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">Record value</p>
              <h2 className="text-xl font-semibold text-gray-950">
                What this repair record gives you
              </h2>
            </div>
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export proof packet
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {recordValueMetrics.map((metric) => (
              <article
                key={metric.label}
                className={`rounded-lg border p-3 ${recordValueClasses(metric.tone)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{metric.label}</p>
                    <p className="mt-1 text-2xl font-bold">{metric.value}</p>
                  </div>
                  <a
                    href={metric.href}
                    className={`inline-flex items-center justify-center rounded px-3 py-2 text-sm font-medium text-white ${recordValueButtonClasses(
                      metric.tone
                    )}`}
                  >
                    {metric.cta}
                  </a>
                </div>
                <p className="mt-2 text-sm leading-6">{metric.detail}</p>
              </article>
            ))}
          </div>
        </section>

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
        </div>
        {statusError && <p className="mt-2 text-sm font-medium text-red-700">{statusError}</p>}
      </section>

      <hr className="my-4" />

      {showCompletionReview && (
        <>
          <CompletionWaiverReview
            missingProof={missingProof}
            guidance="You can still mark this complete with a written reason. The waiver is saved in the decision log so the record explains why proof was missing."
            submitting={statusSaving}
            onCancel={() => {
              setShowCompletionReview(false);
              setStatusError("");
            }}
            onConfirm={(reason) => applyStatusChange("Complete", reason)}
          />

          <hr className="my-4" />
        </>
      )}

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

      <section id="quotes" className="scroll-mt-6">
        <QuoteWorkspace requestId={request.id} quotes={quotes} userId={userId} />
      </section>

      <hr className="my-4" />

      <section id="sharing" className="scroll-mt-6">
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
      </section>

      <hr className="my-4" />

      <section id="photos" className="scroll-mt-6">
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

      <section id="decision-log" className="scroll-mt-6">
        <DecisionLog entries={log} userId={userId} assignedVendorId={request.assignedVendorId} />
      </section>

      <hr className="my-4" />

      <section id="comments" className="scroll-mt-6">
        <CommentThread
          requestId={request.id}
          comments={comments}
          userId={userId}
          assignedVendorId={request.assignedVendorId}
          collaboratorId={request.collaboratorId}
          guidance={commentThreadGuidance("owner", {
            ...request,
            photos,
            comments,
          })}
        />
      </section>

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
