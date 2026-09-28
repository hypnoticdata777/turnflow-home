"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFileToBlob } from "@/lib/blob-upload-client";
import {
  REQUEST_STATUSES,
  costForRequest,
  costLabelForRequest,
  requestStatusBadgeClassesOnDark,
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
import { StatusHandoffGuidance } from "@/components/StatusHandoffGuidance";
import { VendorFitPanel } from "@/components/VendorFitPanel";
import { WorkSessionTimeline, type WorkSessionData } from "@/components/WorkSessionTimeline";
import { RequestTaskChecklist, type RequestTaskData } from "@/components/RequestTaskChecklist";
import {
  CloseoutSubmissionPanel,
  type CloseoutSubmissionData,
} from "@/components/CloseoutSubmissionPanel";
import { BillingRecordPanel, type BillingRecordData } from "@/components/BillingRecordPanel";
import { commentThreadGuidance } from "@/lib/comment-guidance";
import { statusHandoffGuidance } from "@/lib/status-handoff";
import {
  missingCompletionProof,
  requestGuidance,
  requestRecordValueMetrics,
} from "@/lib/request-guidance";
import {
  requestWorkflowSteps,
  type RequestWorkflowStep,
  type RequestWorkflowTone,
} from "@/lib/request-workflow";
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
type AssignedVendor = {
  name: string | null;
  email: string;
  profile: {
    businessName: string | null;
    trades: string[];
    serviceArea: string | null;
    availability: string | null;
    notificationPreference: string | null;
    licenseInsuranceNotes: string | null;
  } | null;
} | null;

const WORKFLOW_TONE_CLASSES: Record<RequestWorkflowTone, string> = {
  attention: "border-rose-200 bg-rose-50 text-rose-950",
  progress: "border-cyan-200 bg-cyan-50 text-cyan-950",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-950",
};

const WORKFLOW_CTA_CLASSES: Record<RequestWorkflowTone, string> = {
  attention: "bg-rose-900 text-white group-hover:bg-rose-950",
  progress: "bg-cyan-900 text-white group-hover:bg-cyan-950",
  ready: "bg-emerald-900 text-white group-hover:bg-emerald-950",
};

const DETAIL_NAV_ITEMS = [
  { href: "#cost", label: "Cost" },
  { href: "#quotes", label: "Bids" },
  { href: "#sharing", label: "Access" },
  { href: "#photos", label: "Proof" },
  { href: "#decision-log", label: "Decisions" },
  { href: "#project-tasks", label: "Tasks" },
  { href: "#closeout", label: "Closeout" },
  { href: "#billing", label: "Billing" },
  { href: "#work-sessions", label: "Timeline" },
  { href: "#comments", label: "Updates" },
];

const PROOF_UPLOAD_COPY: Record<PhotoType, { label: string; detail: string }> = {
  before: { label: "Before", detail: "Start the trail" },
  after: { label: "After", detail: "Show the fix" },
  receipt: { label: "Receipt", detail: "Lock the cost" },
  other: { label: "Other", detail: "Add context" },
};

function RequestWorkflowRail({ steps }: { steps: RequestWorkflowStep[] }) {
  return (
    <section id="workflow" className="scroll-mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-700">Record workflow</p>
          <h2 className="text-xl font-semibold text-slate-950">Click the next checkpoint</h2>
        </div>
        <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
          {steps.length} lanes
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step, index) => (
          <a
            key={step.id}
            href={step.href}
            className={`group flex min-h-44 flex-col justify-between rounded-lg border p-4 shadow-sm transition duration-150 hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 active:translate-y-0 active:scale-[0.99] ${WORKFLOW_TONE_CLASSES[step.tone]}`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full border border-current/20 bg-white/80 px-2 py-1 text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="rounded-full border border-current/20 bg-white/80 px-2 py-1 text-xs font-semibold">
                  {step.state}
                </span>
              </div>
              <p className="mt-4 text-base font-bold leading-tight">{step.label}</p>
              <p className="mt-2 text-sm leading-6">{step.detail}</p>
            </div>
            <span
              className={`mt-4 inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors ${WORKFLOW_CTA_CLASSES[step.tone]}`}
            >
              {step.cta}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

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
    <section id="cost" className="scroll-mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-700">Cost lane</p>
          <h2 className="text-xl font-semibold text-slate-950">Money trail</h2>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase text-slate-500">Current</p>
          <p className="text-2xl font-bold text-slate-950">
            ${costForRequest(request).toFixed(2)}
          </p>
          <p className="text-xs font-medium text-slate-600">{costLabelForRequest(request)}</p>
        </div>
      </div>
      <div className="mb-3 grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          Estimated
          <input
            type="number"
            step="0.01"
            min="0"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 p-3 text-base focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-100"
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
            className="mt-1 w-full rounded border border-slate-300 p-3 text-base focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-100"
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
            className="mt-1 w-full rounded border border-slate-300 p-3 text-base focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-100"
          />
        </label>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          onClick={handleSaveCosts}
          disabled={costSaving}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:translate-y-0 active:scale-[0.99] disabled:opacity-50"
        >
          {costSaving ? "Saving..." : "Save costs"}
        </button>
        {costStatus && <p className="text-sm text-gray-600">{costStatus}</p>}
      </div>
    </section>
  );
}

export function RequestDetailView({
  request,
  photos: initialPhotos,
  quotes,
  log,
  comments,
  workSessions,
  tasks,
  closeoutSubmissions,
  billingRecords,
  property,
  userId,
  creationNotice,
  assignedVendor,
}: {
  request: RequestData;
  photos: Photo[];
  quotes: QuoteData[];
  log: LogEntryData[];
  comments: CommentData[];
  workSessions: WorkSessionData[];
  tasks: RequestTaskData[];
  closeoutSubmissions: CloseoutSubmissionData[];
  billingRecords: BillingRecordData[];
  property: Property;
  userId: string;
  creationNotice: RequestCreatedNotice | null;
  assignedVendor: AssignedVendor;
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
  const workflowSteps = requestWorkflowSteps({
    ...request,
    photos,
    quotes,
    tasks,
    closeoutSubmissions,
    billingRecords,
    workSessions,
    comments,
    log,
  });
  const statusGuidance = statusHandoffGuidance("owner", {
    ...request,
    status,
    photos,
  });
  const guidanceClasses =
    guidance.tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : guidance.tone === "attention"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : "border-cyan-200 bg-cyan-50 text-cyan-950";
  const recordValueClasses = (tone: (typeof recordValueMetrics)[number]["tone"]) =>
    tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : tone === "attention"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : "border-cyan-200 bg-cyan-50 text-cyan-950";
  const recordValueButtonClasses = (tone: (typeof recordValueMetrics)[number]["tone"]) =>
    tone === "ready"
      ? "bg-emerald-800 hover:bg-emerald-900"
      : tone === "attention"
        ? "bg-blue-800 hover:bg-blue-900"
        : "bg-cyan-800 hover:bg-cyan-900";
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
      billingRecords,
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
      const blob = await uploadFileToBlob(pathname, file);
      await recordRequestPhotoAction(request.id, type, blob.pathname);
      setPhotos((prev) => [...prev, { id: blob.pathname, type, url: blob.url }]);
      setUploadStatus(`Uploaded ${type}.`);
    } catch (err) {
      console.error(`Failed to upload ${type}:`, err);
      setUploadStatus(`Failed to upload ${type}.`);
    }
  }

  const sharedAccessCount = [
    request.assignedVendorId,
    request.pendingVendorInviteId,
    request.collaboratorId,
    request.pendingCollaboratorInviteId,
  ].filter(Boolean).length;
  const summaryCards = [
    { label: "Property", value: propertyLabel, href: "#record-summary" },
    { label: "Priority", value: `${request.category} / ${request.urgency}`, href: "#workflow" },
    { label: "Proof", value: `${photos.length} items`, href: "#photos" },
    { label: "Access", value: `${sharedAccessCount} active`, href: "#sharing" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {creationNotice && <RequestCreatedNoticeBanner notice={creationNotice} />}

      <section
        id="record-summary"
        className="scroll-mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
          <div className="bg-slate-950 p-5 text-white sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Repair command center</p>
                <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{request.title}</h1>
              </div>
              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${requestStatusBadgeClassesOnDark(
                  status
                )}`}
              >
                {status}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {summaryCards.map((card) => (
                <a
                  key={card.label}
                  href={card.href}
                  className="rounded-lg border border-white/15 bg-white/10 p-3 transition duration-150 hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-200 active:translate-y-0 active:scale-[0.99]"
                >
                  <p className="text-xs font-semibold uppercase text-cyan-100">{card.label}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-white">{card.value}</p>
                </a>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={guidance.primaryHref}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-cyan-200 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
              >
                {guidance.primaryCta}
              </a>
              <a
                href={guidance.secondaryHref}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition duration-150 hover:-translate-y-0.5 hover:bg-white/15 active:translate-y-0 active:scale-[0.99]"
              >
                {guidance.secondaryCta}
              </a>
              <button
                onClick={handleDownloadPdf}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition duration-150 hover:-translate-y-0.5 hover:bg-white/15 active:translate-y-0 active:scale-[0.99]"
              >
                Export proof packet
              </button>
            </div>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <div className={`rounded-lg border p-4 ${guidanceClasses}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {`${guidance.completedCount} of ${guidance.totalCount} ready`}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">{guidance.headline}</h2>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold">
                  {guidance.progress}%
                </span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/80">
                <div className="h-full bg-current" style={{ width: `${guidance.progress}%` }} />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {guidance.items.map((item) => (
                  <div key={item.label} className="rounded border border-current/20 bg-white/75 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold">
                        {item.complete ? "Ready" : "Next"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <label className="block text-sm">
                <span className="font-semibold text-slate-900">Status</span>
                <select
                  value={status}
                  onChange={handleStatusChange}
                  disabled={statusSaving}
                  className="mt-2 w-full rounded border border-slate-300 bg-white p-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                >
                  {REQUEST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <StatusHandoffGuidance guidance={statusGuidance} />
              {statusError && <p className="mt-2 text-sm font-medium text-red-700">{statusError}</p>}
            </div>
          </div>
        </div>

        <nav
          aria-label="Repair record sections"
          className="grid grid-cols-2 gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-5 lg:grid-cols-10"
        >
          {DETAIL_NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex min-h-14 items-center justify-center bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 transition duration-150 hover:bg-slate-950 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-900 active:bg-slate-800"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </section>

      <RequestWorkflowRail steps={workflowSteps} />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-700">Record value</p>
            <h2 className="text-xl font-semibold text-slate-950">Owner proof packet</h2>
          </div>
          <button
            onClick={handleDownloadPdf}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
          >
            Export proof packet
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recordValueMetrics.map((metric) => (
            <article
              key={metric.label}
              className={`flex min-h-36 flex-col justify-between rounded-lg border p-3 ${recordValueClasses(
                metric.tone
              )}`}
            >
              <div>
                <p className="text-sm font-semibold">{metric.label}</p>
                <p className="mt-1 text-2xl font-bold">{metric.value}</p>
                <p className="mt-2 text-sm leading-6">{metric.detail}</p>
              </div>
              <a
                href={metric.href}
                className={`mt-4 inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99] ${recordValueButtonClasses(
                  metric.tone
                )}`}
              >
                {metric.cta}
              </a>
            </article>
          ))}
        </div>
      </section>

      {showCompletionReview && (
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

      <section id="quotes" className="scroll-mt-6">
        <QuoteWorkspace requestId={request.id} quotes={quotes} userId={userId} />
      </section>

      <section id="sharing" className="scroll-mt-6">
        <VendorFitPanel request={request} assignedVendor={assignedVendor} />
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

      <section id="photos" className="scroll-mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-700">Proof lane</p>
            <h2 className="text-xl font-semibold text-slate-950">Evidence board</h2>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
            {photos.length} items
          </span>
        </div>
        <div className="mb-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {PHOTO_TYPES.map((type) => (
            <label
              key={type}
              className="group flex min-h-32 cursor-pointer flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-white hover:shadow-md focus-within:ring-2 focus-within:ring-cyan-200 active:translate-y-0 active:scale-[0.99]"
            >
              <span>
                <span className="block text-base font-bold text-slate-950">
                  {PROOF_UPLOAD_COPY[type].label}
                </span>
                <span className="mt-1 block text-sm font-medium text-slate-600">
                  {PROOF_UPLOAD_COPY[type].detail}
                </span>
              </span>
              <span className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-cyan-900">
                Add proof
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => handleUpload(type, e.target.files?.[0])}
              />
            </label>
          ))}
        </div>
        {uploadStatus && <p className="mb-4 text-sm text-gray-600">{uploadStatus}</p>}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {photos.length === 0 ? (
            <p className="col-span-full rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-600">
              No proof on this record yet.
            </p>
          ) : (
            photos.map((p) => (
              <figure key={p.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={`${p.type} photo`}
                  className="h-36 w-full object-cover"
                />
                <figcaption className="p-2 text-center text-sm font-semibold capitalize text-slate-700">
                  {p.type}
                </figcaption>
              </figure>
            ))
          )}
        </div>
      </section>

      <section id="decision-log" className="scroll-mt-6">
        <DecisionLog entries={log} userId={userId} assignedVendorId={request.assignedVendorId} />
      </section>

      <RequestTaskChecklist requestId={request.id} tasks={tasks} mode="owner" />

      <CloseoutSubmissionPanel
        request={{
          id: request.id,
          finalCost: request.finalCost,
          photos,
          tasks,
        }}
        submissions={closeoutSubmissions}
        mode="owner"
      />

      <BillingRecordPanel
        requestId={request.id}
        records={billingRecords}
        mode="owner"
      />

      <section id="work-sessions" className="scroll-mt-6">
        <WorkSessionTimeline events={workSessions} />
      </section>

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

      <a
        href="/owner/dashboard"
        className="inline-flex min-h-11 w-fit items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
      >
        Back to dashboard
      </a>
    </div>
  );
}
