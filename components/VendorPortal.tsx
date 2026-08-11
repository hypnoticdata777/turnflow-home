"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  REQUEST_STATUSES,
  requestStatusBadgeClasses,
} from "@/lib/utils";
import {
  recordRequestPhotoAction,
  updateRequestStatusAction,
} from "@/lib/actions/requests";
import { requestPhotoPath } from "@/lib/blob-paths";
import { CommentThread, type CommentData } from "@/components/CommentThread";
import { CompletionWaiverReview } from "@/components/CompletionWaiverReview";
import { HelperOnboardingChecklist } from "@/components/HelperOnboardingChecklist";
import { HelperRequestReadiness } from "@/components/HelperRequestReadiness";
import { HelperWorkspaceOverview } from "@/components/HelperWorkspaceOverview";
import { StatusHandoffGuidance } from "@/components/StatusHandoffGuidance";
import { VendorLifecycleTracker } from "@/components/VendorLifecycleTracker";
import { VendorProfilePanel } from "@/components/VendorProfilePanel";
import { VendorBidPanel, type VendorBidData } from "@/components/VendorBidPanel";
import { WorkSessionPanel } from "@/components/WorkSessionPanel";
import type { WorkSessionData } from "@/components/WorkSessionTimeline";
import { RequestTaskChecklist, type RequestTaskData } from "@/components/RequestTaskChecklist";
import {
  CloseoutSubmissionPanel,
  type CloseoutSubmissionData,
} from "@/components/CloseoutSubmissionPanel";
import { commentThreadGuidance } from "@/lib/comment-guidance";
import { statusHandoffGuidance } from "@/lib/status-handoff";
import {
  helperOnboardingItems,
  helperRequestCardState,
  helperWorkspaceGuidance,
  vendorCloseoutMetrics,
  vendorUploadPrompt,
  type HelperRequestCardState,
} from "@/lib/helper-workspace";
import { missingCompletionProof } from "@/lib/request-guidance";

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
  quotedCost: string | null;
  finalCost: string | null;
  property: { address: string; nickname: string | null } | null;
  photos: { type: string }[];
  comments: CommentData[];
  workSessions: WorkSessionData[];
  tasks: RequestTaskData[];
  closeoutSubmissions: CloseoutSubmissionData[];
  vendorBid: VendorBidData | null;
};

type VendorProfileData = {
  businessName: string | null;
  trades: string[];
  serviceArea: string | null;
  availability: string | null;
  notificationPreference: string | null;
  licenseInsuranceNotes: string | null;
};

export function VendorPortal({
  requests,
  userId,
  profile,
}: {
  requests: VendorRequest[];
  userId: string;
  profile: VendorProfileData | null;
}) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [completionReviewRequestId, setCompletionReviewRequestId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState("");
  const guidance = helperWorkspaceGuidance("vendor", requests);
  const onboardingItems = helperOnboardingItems("vendor", requests);
  const closeoutMetrics = vendorCloseoutMetrics(requests);
  const selectedRequest = requests.find((r) => r.id === selectedRequestId);
  const uploadPrompt = vendorUploadPrompt(selectedRequest);
  const closeoutMetricClasses = (tone: (typeof closeoutMetrics)[number]["tone"]) =>
    tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : tone === "attention"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : tone === "progress"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-gray-200 bg-white text-gray-950";

  function focusUploadForRequest(request: VendorRequest) {
    setSelectedRequestId(request.id);
    setUploadStatus(`Ready to upload proof for ${request.title}.`);
    requestAnimationFrame(() => {
      document.getElementById("helper-upload")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  function handleReadinessAction(request: VendorRequest, state: HelperRequestCardState) {
    if (state.actionHref === "#helper-upload") {
      focusUploadForRequest(request);
      return;
    }

    document
      .getElementById(`request-updates-${request.id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function applyStatusChange(requestId: string, newStatus: string, waiverReason?: string) {
    setStatusError("");
    setSavingId(requestId);
    try {
      await updateRequestStatusAction(requestId, newStatus, waiverReason);
      setCompletionReviewRequestId(null);
      router.refresh();
    } catch (err) {
      console.error("Failed to update status:", err);
      setStatusError("Failed to update status. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleStatusChange(requestId: string, newStatus: string) {
    const req = requests.find((r) => r.id === requestId);
    if (newStatus === "Complete" && req && missingCompletionProof(req).length > 0) {
      setStatusError("");
      setCompletionReviewRequestId(requestId);
      return;
    }

    await applyStatusChange(requestId, newStatus);
  }

  async function handleUpload(type: PhotoType, file: File | undefined) {
    if (!file || !selectedRequestId) return;
    setUploadStatus(`Uploading ${type}...`);
    try {
      const pathname = requestPhotoPath(selectedRequestId, type, userId, file.name);
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/blob-upload",
      });
      await recordRequestPhotoAction(selectedRequestId, type, blob.url, blob.pathname);
      setUploadStatus(`Uploaded ${type}.`);
      router.refresh();
    } catch (err) {
      console.error(`Failed to upload ${type}:`, err);
      setUploadStatus(`Failed to upload ${type}.`);
    }
  }

  return (
    <div className="space-y-6">
      <HelperWorkspaceOverview
        guidance={guidance}
        labels={{
          total: "Assigned",
          active: "Active",
          attention: "Need proof",
          complete: "Complete",
        }}
      />

      <VendorProfilePanel profile={profile} />

      <section
        id="vendor-closeout"
        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">Closeout snapshot</p>
            <h2 className="text-xl font-semibold">What needs to happen before owner review</h2>
          </div>
          <a
            href="#helper-upload"
            className="inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Upload proof
          </a>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {closeoutMetrics.map((metric) => (
            <article
              key={metric.label}
              className={`rounded-lg border p-4 ${closeoutMetricClasses(metric.tone)}`}
            >
              <p className="text-sm font-semibold">{metric.label}</p>
              <p className="mt-2 text-3xl font-bold">{metric.value}</p>
              <p className="mt-2 min-h-20 text-sm leading-6">{metric.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <HelperOnboardingChecklist role="vendor" items={onboardingItems} />

      <section
        id="helper-scope"
        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-xl font-semibold">What you can see</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          This workspace only shows requests assigned to this vendor account.
          Owner-only areas like documents, backups, reminders, and other
          properties stay outside this view.
        </p>
      </section>

      <section
        id="helper-requests"
        className="scroll-mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">My requests</h2>
            <p className="text-sm text-gray-500">
              You can only see repair records assigned to this vendor account.
            </p>
          </div>
          <p className="text-sm font-medium text-gray-700">
            {requests.length} assigned
          </p>
        </div>

        {requests.length === 0 ? (
          <p className="text-gray-500">No requests are assigned to you yet.</p>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => {
              const propertyLabel = r.property
                ? r.property.nickname
                  ? `${r.property.nickname} - ${r.property.address}`
                  : r.property.address
                : "Property not found";
              const missingProof = missingCompletionProof(r);
              const readiness = helperRequestCardState("vendor", r);
              return (
                <article key={r.id} className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-lg font-semibold">{r.title}</h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${requestStatusBadgeClasses(
                        r.status
                      )}`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold">Property</dt>
                      <dd>{propertyLabel}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Category / urgency</dt>
                      <dd>
                        {r.category} / {r.urgency}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Location</dt>
                      <dd>{r.location || "Not recorded"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Preferred contact</dt>
                      <dd>{r.contactMethod || "Not recorded"}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-semibold">Access instructions</dt>
                      <dd>{r.accessInstructions || "Not recorded"}</dd>
                    </div>
                  </dl>

                  <HelperRequestReadiness
                    state={readiness}
                    onAction={() => handleReadinessAction(r, readiness)}
                  />

                  <VendorLifecycleTracker request={r} />

                  <VendorBidPanel requestId={r.id} request={r} bid={r.vendorBid} />

                  <div className="mt-4">
                    <RequestTaskChecklist requestId={r.id} tasks={r.tasks} mode="vendor" />
                  </div>

                  <WorkSessionPanel
                    requestId={r.id}
                    requestStatus={r.status}
                    events={r.workSessions}
                    userId={userId}
                    tasks={r.tasks}
                  />

                  <div className="mt-4">
                    <CloseoutSubmissionPanel
                      request={{
                        id: r.id,
                        finalCost: r.finalCost,
                        photos: r.photos,
                        tasks: r.tasks,
                      }}
                      submissions={r.closeoutSubmissions}
                      mode="vendor"
                    />
                  </div>

                  <label className="mt-4 block text-sm">
                    <span className="font-semibold">Status</span>
                    <select
                      value={r.status}
                      disabled={savingId === r.id}
                      onChange={(e) => handleStatusChange(r.id, e.target.value)}
                      className="mt-1 w-full rounded border bg-white p-2 sm:max-w-xs"
                    >
                      {REQUEST_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <StatusHandoffGuidance
                    guidance={statusHandoffGuidance("vendor", r)}
                  />
                  {statusError && savingId === null && completionReviewRequestId === r.id && (
                    <p className="mt-2 text-sm font-medium text-red-700">{statusError}</p>
                  )}

                  {completionReviewRequestId === r.id && (
                    <div className="mt-4">
                      <CompletionWaiverReview
                        missingProof={missingProof}
                        guidance="You can complete this request with a written reason, but ask the owner to add final cost details when they are missing. The waiver is saved in the decision log."
                        submitting={savingId === r.id}
                        onCancel={() => {
                          setCompletionReviewRequestId(null);
                          setStatusError("");
                        }}
                        onConfirm={(reason) => applyStatusChange(r.id, "Complete", reason)}
                      />
                    </div>
                  )}

                  <div id={`request-updates-${r.id}`} className="mt-4 scroll-mt-6 border-t pt-3">
                    <CommentThread
                      requestId={r.id}
                      comments={r.comments}
                      userId={userId}
                      assignedVendorId={r.assignedVendorId}
                      guidance={commentThreadGuidance("vendor", r)}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section
        id="helper-upload"
        className="scroll-mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <h2 className="mb-1 text-xl font-semibold">Upload photos</h2>
        <p className="mb-4 text-sm text-gray-500">
          Add before, after, receipt, or other proof to the assigned request.
        </p>

        <label className="mb-4 block text-sm font-medium">
          Request
          <select
            value={selectedRequestId}
            onChange={(e) => setSelectedRequestId(e.target.value)}
            className="mt-1 w-full rounded border bg-white p-2"
          >
            <option value="">Select a request</option>
            {requests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>

        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm font-semibold text-gray-950">{uploadPrompt.title}</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">{uploadPrompt.detail}</p>
          {selectedRequest && uploadPrompt.recommendedPhotoTypes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {uploadPrompt.recommendedPhotoTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-medium capitalize text-gray-700"
                >
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>

        {selectedRequest && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
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
        )}
        {uploadStatus && <p className="mt-3 text-sm text-gray-600">{uploadStatus}</p>}
      </section>
    </div>
  );
}
