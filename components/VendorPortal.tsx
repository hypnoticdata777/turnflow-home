"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFileToBlob } from "@/lib/blob-upload-client";
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
import { BillingRecordPanel, type BillingRecordData } from "@/components/BillingRecordPanel";
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
import {
  vendorNextAction,
  vendorWorkQueueMetrics,
  type VendorNextAction,
  type VendorWorkQueueMetric,
} from "@/lib/vendor-lifecycle";
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
  billingRecords: BillingRecordData[];
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

const NEXT_ACTION_CLASSES: Record<VendorNextAction["tone"], string> = {
  attention: "border-rose-200 bg-rose-50 text-rose-950",
  progress: "border-cyan-200 bg-cyan-50 text-cyan-950",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-950",
};

const WORK_QUEUE_CLASSES: Record<VendorWorkQueueMetric["tone"], string> = {
  attention: "border-rose-200 bg-rose-50 text-rose-950",
  progress: "border-cyan-200 bg-cyan-50 text-cyan-950",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-950",
  empty: "border-gray-200 bg-white text-gray-950",
};

function VendorNextActionPanel({
  action,
  requestId,
  onAction,
}: {
  action: VendorNextAction;
  requestId: string;
  onAction?: () => void;
}) {
  return (
    <section
      id={`vendor-next-action-${requestId}`}
      className={`mt-4 rounded-lg border p-3 ${NEXT_ACTION_CLASSES[action.tone]}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Next vendor action</p>
          <h4 className="mt-1 text-base font-semibold">{action.label}</h4>
          <p className="mt-1 text-sm leading-6">{action.detail}</p>
        </div>
        {onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-lg border border-current bg-white/80 px-4 py-2 text-sm font-semibold transition duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
          >
            {action.cta}
          </button>
        ) : (
          <a
            href={action.href}
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-lg border border-current bg-white/80 px-4 py-2 text-sm font-semibold transition duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
          >
            {action.cta}
          </a>
        )}
      </div>
    </section>
  );
}

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
  const [expandedRequestId, setExpandedRequestId] = useState("");
  const guidance = helperWorkspaceGuidance("vendor", requests);
  const onboardingItems = helperOnboardingItems("vendor", requests);
  const closeoutMetrics = vendorCloseoutMetrics(requests);
  const workQueueMetrics = vendorWorkQueueMetrics(requests);
  const selectedRequest = requests.find((r) => r.id === selectedRequestId);
  const uploadPrompt = vendorUploadPrompt(selectedRequest);
  const closeoutMetricClasses = (tone: (typeof closeoutMetrics)[number]["tone"]) =>
    tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
        : tone === "attention"
          ? "border-blue-200 bg-blue-50 text-blue-950"
        : tone === "progress"
          ? "border-cyan-200 bg-cyan-50 text-cyan-950"
          : "border-gray-200 bg-white text-gray-950";
  const scopeTiles = [
    {
      label: "Assigned jobs",
      value: requests.length,
      detail: "Only this vendor account's work queue appears.",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
    },
    {
      label: "Owner-only areas",
      value: "Private",
      detail:
        "Owner-only areas like documents, backups, reminders, and other properties stay outside this view.",
      classes: "border-slate-200 bg-slate-50 text-slate-950",
    },
    {
      label: "Proof lane",
      value: requests.reduce((count, request) => count + request.photos.length, 0),
      detail: "Photos and receipts attach to the exact repair.",
      classes: "border-blue-200 bg-blue-50 text-blue-950",
    },
  ];

  function focusUploadForRequest(request: VendorRequest) {
    setSelectedRequestId(request.id);
    setUploadStatus(`Ready to upload proof for ${request.title}.`);
    requestAnimationFrame(() => {
      document.getElementById("helper-upload")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  function focusRequestWorkflow(requestId: string, targetHref?: string) {
    setExpandedRequestId(requestId);
    window.setTimeout(() => {
      const targetId = targetHref?.startsWith("#")
        ? targetHref.slice(1)
        : `vendor-workflow-${requestId}`;
      document
        .getElementById(targetId || `vendor-workflow-${requestId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function handleReadinessAction(request: VendorRequest, state: HelperRequestCardState) {
    if (state.actionHref === "#helper-upload") {
      focusUploadForRequest(request);
      return;
    }

    focusRequestWorkflow(request.id, `#request-updates-${request.id}`);
  }

  function handleVendorNextAction(request: VendorRequest, action: VendorNextAction) {
    if (action.href === "#helper-upload") {
      focusUploadForRequest(request);
      return;
    }

    focusRequestWorkflow(request.id, action.href);
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
      setExpandedRequestId(requestId);
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
      const blob = await uploadFileToBlob(pathname, file);
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

      <nav
        aria-label="Vendor workspace shortcuts"
        className="grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 shadow-sm sm:grid-cols-5"
      >
        {[
          ["Queue", "#vendor-work-queue"],
          ["Profile", "#vendor-profile"],
          ["Scope", "#helper-scope"],
          ["Jobs", "#helper-requests"],
          ["Upload", "#helper-upload"],
        ].map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="inline-flex min-h-12 items-center justify-center bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition duration-150 hover:bg-slate-950 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-900 active:bg-slate-800"
          >
            {label}
          </a>
        ))}
      </nav>

      <section
        id="vendor-work-queue"
        className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-950 p-5 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-200">Vendor command center</p>
            <h2 className="text-xl font-semibold text-white">Where assigned jobs need attention</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">
              Bid, work, closeout, and owner-wait states stay visible before the
              vendor opens an individual repair record.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="#helper-requests"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition duration-150 hover:-translate-y-0.5 hover:bg-white/15 active:translate-y-0 active:scale-[0.99]"
            >
              Review jobs
            </a>
            <a
              href="#helper-upload"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
            >
              Upload proof
            </a>
          </div>
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">Vendor work queue</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {workQueueMetrics.map((metric) => (
                <article
                  key={metric.label}
                  className={`rounded-lg border p-3 ${WORK_QUEUE_CLASSES[metric.tone]}`}
                >
                  <p className="text-sm font-semibold">{metric.label}</p>
                  <p className="mt-1 text-2xl font-bold">{metric.value}</p>
                  <p className="mt-2 text-sm leading-6">{metric.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <div id="vendor-closeout">
            <p className="mb-2 text-sm font-semibold text-gray-700">Closeout snapshot</p>
            <p className="mb-3 text-sm leading-6 text-gray-600">
              What needs to happen before owner review
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {closeoutMetrics.map((metric) => (
                <article
                  key={metric.label}
                  className={`rounded-lg border p-3 ${closeoutMetricClasses(metric.tone)}`}
                >
                  <p className="text-sm font-semibold">{metric.label}</p>
                  <p className="mt-1 text-2xl font-bold">{metric.value}</p>
                  <p className="mt-2 text-sm leading-6">{metric.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <VendorProfilePanel profile={profile} />
        <HelperOnboardingChecklist role="vendor" items={onboardingItems} />
      </div>

      <section
        id="helper-scope"
        className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-200">Vendor scope</p>
            <h2 className="mt-1 text-xl font-semibold">What you can see</h2>
          </div>
          <a
            href="#helper-requests"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
          >
            Assigned jobs
          </a>
        </div>
        <div className="grid gap-px bg-slate-200 md:grid-cols-3">
          {scopeTiles.map((tile) => (
            <div key={tile.label} className={`border-t p-4 md:border-t-0 ${tile.classes}`}>
              <p className="text-sm font-semibold">{tile.label}</p>
              <p className="mt-2 text-3xl font-bold">{tile.value}</p>
              <p className="mt-2 text-sm leading-6">{tile.detail}</p>
            </div>
          ))}
        </div>
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
              const nextAction = vendorNextAction(r);
              const isExpanded = expandedRequestId === r.id;
              const activeTaskCount = r.tasks.filter((task) => task.status !== "done").length;
              const proofCount = r.photos.length;
              const updateCount = r.comments.length;
              const closeoutCount = r.closeoutSubmissions.length;
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

                  <VendorNextActionPanel
                    action={nextAction}
                    requestId={r.id}
                    onAction={() => handleVendorNextAction(r, nextAction)}
                  />

                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-4">
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="font-semibold text-gray-700">Proof</p>
                      <p className="mt-1 text-lg font-bold text-gray-950">{proofCount}</p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="font-semibold text-gray-700">Open tasks</p>
                      <p className="mt-1 text-lg font-bold text-gray-950">{activeTaskCount}</p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="font-semibold text-gray-700">Updates</p>
                      <p className="mt-1 text-lg font-bold text-gray-950">{updateCount}</p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="font-semibold text-gray-700">Closeouts</p>
                      <p className="mt-1 text-lg font-bold text-gray-950">{closeoutCount}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-gray-600">
                      Bid, task, proof, closeout, billing, and update controls
                    </p>
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={`vendor-workflow-${r.id}`}
                      onClick={() => setExpandedRequestId(isExpanded ? "" : r.id)}
                      className="inline-flex w-fit items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      {isExpanded ? "Hide workflow controls" : "Open workflow controls"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div
                      id={`vendor-workflow-${r.id}`}
                      className="mt-4 scroll-mt-6 space-y-4 border-t border-gray-100 pt-4"
                    >
                      <VendorLifecycleTracker request={r} />

                      <div id={`vendor-bid-${r.id}`} className="scroll-mt-6">
                        <VendorBidPanel requestId={r.id} request={r} bid={r.vendorBid} />
                      </div>

                      <RequestTaskChecklist
                        id={`vendor-tasks-${r.id}`}
                        requestId={r.id}
                        tasks={r.tasks}
                        mode="vendor"
                      />

                      <WorkSessionPanel
                        id={`vendor-work-${r.id}`}
                        requestId={r.id}
                        requestStatus={r.status}
                        events={r.workSessions}
                        userId={userId}
                        tasks={r.tasks}
                      />

                      <CloseoutSubmissionPanel
                        request={{
                          id: r.id,
                          finalCost: r.finalCost,
                          photos: r.photos,
                          tasks: r.tasks,
                        }}
                        submissions={r.closeoutSubmissions}
                        mode="vendor"
                        id={`vendor-closeout-${r.id}`}
                      />

                      <BillingRecordPanel
                        requestId={r.id}
                        records={r.billingRecords}
                        mode="vendor"
                        id={`vendor-billing-${r.id}`}
                      />

                      <label className="block text-sm">
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
                        <p className="text-sm font-medium text-red-700">{statusError}</p>
                      )}

                      {completionReviewRequestId === r.id && (
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
                      )}

                      <div id={`request-updates-${r.id}`} className="scroll-mt-6 border-t pt-3">
                        <CommentThread
                          requestId={r.id}
                          comments={r.comments}
                          userId={userId}
                          assignedVendorId={r.assignedVendorId}
                          guidance={commentThreadGuidance("vendor", r)}
                        />
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section
        id="helper-upload"
        className="scroll-mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-200">Proof lane</p>
            <h2 className="mt-1 text-xl font-semibold">Upload photos</h2>
          </div>
          <span className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
            Before / After / Receipt / Other
          </span>
        </div>

        <div className="p-4">
          <label className="mb-4 block text-sm font-medium">
            Request
            <select
              value={selectedRequestId}
              onChange={(e) => setSelectedRequestId(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm transition duration-150 hover:border-slate-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            >
              <option value="">Select a request</option>
              {requests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </label>

          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-950">
            <p className="text-sm font-bold">{uploadPrompt.title}</p>
            <p className="mt-1 text-sm leading-6">{uploadPrompt.detail}</p>
            {selectedRequest && uploadPrompt.recommendedPhotoTypes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {uploadPrompt.recommendedPhotoTypes.map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-blue-200 bg-white px-2 py-1 text-xs font-semibold capitalize text-blue-950"
                  >
                    {type}
                  </span>
                ))}
              </div>
            )}
          </div>

          {selectedRequest && (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {PHOTO_TYPES.map((type) => (
                <label
                  key={type}
                  className="block cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-3 transition duration-150 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white hover:shadow-sm active:translate-y-0"
                >
                  <span className="block text-sm font-bold capitalize text-slate-950">
                    {type}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">
                    Attach image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="mt-3 w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-black"
                    onChange={(e) => handleUpload(type, e.target.files?.[0])}
                  />
                </label>
              ))}
            </div>
          )}
          {uploadStatus && <p className="mt-3 text-sm font-medium text-slate-700">{uploadStatus}</p>}
        </div>
      </section>
    </div>
  );
}
