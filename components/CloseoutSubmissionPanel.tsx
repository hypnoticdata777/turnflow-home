"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  reviewCloseoutSubmissionAction,
  submitCloseoutAction,
} from "@/lib/actions/closeout-submissions";
import {
  CLOSEOUT_STATUS_LABELS,
  closeoutReadiness,
  type CloseoutReviewDecision,
  type CloseoutSubmissionStatus,
} from "@/lib/closeout-submissions";

export type CloseoutSubmissionData = {
  id: string;
  vendorId: string;
  completionNotes: string;
  materialsNotes: string | null;
  finalAmount: string;
  status: CloseoutSubmissionStatus;
  reviewNotes: string | null;
  reviewedAt: string | Date | null;
  submittedAt: string | Date;
};

export type CloseoutPanelRequestData = {
  id: string;
  finalCost: string | null;
  photos: Array<{ type: string }>;
  tasks: Array<{ status: string }>;
};

const TONE_CLASSES = {
  attention: "border-blue-200 bg-blue-50 text-blue-950",
  progress: "border-amber-200 bg-amber-50 text-amber-950",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-950",
};

function money(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
}

export function CloseoutSubmissionPanel({
  request,
  submissions,
  mode,
  id = "closeout",
}: {
  request: CloseoutPanelRequestData;
  submissions: CloseoutSubmissionData[];
  mode: "owner" | "vendor";
  id?: string;
}) {
  const router = useRouter();
  const [completionNotes, setCompletionNotes] = useState("");
  const [materialsNotes, setMaterialsNotes] = useState("");
  const [finalAmount, setFinalAmount] = useState(request.finalCost ?? "");
  const [reviewNotes, setReviewNotes] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState<CloseoutReviewDecision | null>(null);
  const readiness = closeoutReadiness({
    photos: request.photos,
    tasks: request.tasks,
    finalAmount,
  });
  const sortedSubmissions = [...submissions].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  const latest = sortedSubmissions[0];

  async function submitCloseout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("Submitting closeout...");
    const formData = new FormData();
    formData.set("completionNotes", completionNotes);
    formData.set("materialsNotes", materialsNotes);
    formData.set("finalAmount", finalAmount);
    const result = await submitCloseoutAction(request.id, formData);
    if ("error" in result) {
      setStatus(result.error);
      setSubmitting(false);
      return;
    }
    setCompletionNotes("");
    setMaterialsNotes("");
    setStatus("Closeout submitted for owner review.");
    setSubmitting(false);
    router.refresh();
  }

  async function reviewCloseout(decision: CloseoutReviewDecision) {
    if (!latest) return;
    setReviewing(decision);
    setStatus(
      decision === "approved" ? "Approving closeout..." : "Requesting changes..."
    );
    const formData = new FormData();
    formData.set("reviewNotes", reviewNotes);
    const result = await reviewCloseoutSubmissionAction(
      request.id,
      latest.id,
      decision,
      formData
    );
    if ("error" in result) {
      setStatus(result.error);
      setReviewing(null);
      return;
    }
    setReviewNotes("");
    setStatus(
      decision === "approved"
        ? "Closeout approved and request marked complete."
        : "Closeout changes requested."
    );
    setReviewing(null);
    router.refresh();
  }

  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Closeout</p>
          <h2 className="text-xl font-semibold">
            {mode === "vendor" ? "Submit owner handoff" : "Vendor handoff"}
          </h2>
        </div>
        <p className="text-sm font-medium text-gray-700">
          {submissions.length} {submissions.length === 1 ? "submission" : "submissions"}
        </p>
      </div>

      <div className={`rounded-lg border p-3 ${TONE_CLASSES[readiness.tone]}`}>
        <p className="text-sm font-semibold">
          {readiness.ready ? "Ready for closeout submission" : "Closeout needs work"}
        </p>
        <p className="mt-1 text-sm leading-6">{readiness.detail}</p>
      </div>

      {latest ? (
        <article className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Latest vendor closeout</p>
              <p className="mt-1 text-sm leading-6 text-gray-700">
                {latest.completionNotes}
              </p>
            </div>
            <span className="w-fit rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
              {CLOSEOUT_STATUS_LABELS[latest.status]} - {money(latest.finalAmount)}
            </span>
          </div>
          {latest.materialsNotes && (
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Materials/receipts: {latest.materialsNotes}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Submitted {new Date(latest.submittedAt).toLocaleString()}
          </p>
          {latest.reviewedAt && (
            <p className="mt-1 text-xs text-gray-500">
              Reviewed {new Date(latest.reviewedAt).toLocaleString()}
            </p>
          )}
          {latest.reviewNotes && (
            <p className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-2 text-sm leading-6 text-gray-700">
              Owner note: {latest.reviewNotes}
            </p>
          )}
        </article>
      ) : (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          No vendor closeout has been submitted yet.
        </div>
      )}

      {mode === "owner" && latest?.status === "pending" && (
        <div className="mt-3 space-y-3 rounded-lg border p-3">
          <label className="block text-sm font-medium">
            Owner review note
            <textarea
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              maxLength={800}
              rows={2}
              placeholder="Optional for approval. Required when requesting changes."
              className="mt-1 w-full rounded border p-2 text-sm"
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={reviewing !== null}
              onClick={() => reviewCloseout("approved")}
              className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {reviewing === "approved" ? "Approving..." : "Approve closeout"}
            </button>
            <button
              type="button"
              disabled={reviewing !== null}
              onClick={() => reviewCloseout("changes_requested")}
              className="rounded border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-50"
            >
              {reviewing === "changes_requested"
                ? "Sending..."
                : "Request changes"}
            </button>
          </div>
        </div>
      )}

      {mode === "vendor" && (
        <form onSubmit={submitCloseout} className="mt-3 space-y-3 rounded-lg border p-3">
          <label className="block text-sm font-medium">
            Completion notes
            <textarea
              value={completionNotes}
              onChange={(event) => setCompletionNotes(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Summarize what was completed and what the owner should review."
              className="mt-1 w-full rounded border p-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium">
            Materials or receipt notes
            <textarea
              value={materialsNotes}
              onChange={(event) => setMaterialsNotes(event.target.value)}
              maxLength={800}
              rows={2}
              placeholder="Optional: parts used, receipt note, invoice reference, or warranty detail."
              className="mt-1 w-full rounded border p-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium">
            Final amount
            <input
              value={finalAmount}
              onChange={(event) => setFinalAmount(event.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="mt-1 w-full rounded border p-2 text-sm sm:max-w-xs"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit closeout"}
          </button>
        </form>
      )}

      {status && <p className="mt-3 text-sm font-medium text-gray-700">{status}</p>}
    </section>
  );
}
