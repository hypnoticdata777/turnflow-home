"use client";

import { useId, useState } from "react";

export function CompletionWaiverReview({
  missingProof,
  guidance,
  submitting,
  onCancel,
  onConfirm,
}: {
  missingProof: string[];
  guidance: string;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const reasonId = useId();
  const titleId = useId();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function handleConfirm() {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError("Add a short reason before completing with proof gaps.");
      return;
    }
    setError("");
    await onConfirm(trimmedReason);
  }

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold">Completion review</p>
          <h2 id={titleId} className="mt-1 text-xl font-semibold">
            This request is missing proof.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6">{guidance}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="inline-flex items-center justify-center rounded border border-current bg-white/75 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Keep current status
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="rounded border border-amber-200 bg-white/75 p-3">
          <p className="text-sm font-semibold">Missing before clean completion</p>
          <ul className="mt-2 space-y-1 text-sm">
            {missingProof.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <label htmlFor={reasonId} className="block text-sm font-semibold">
            Waiver reason
          </label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-amber-300 bg-white p-2 text-sm text-gray-900"
            placeholder="Example: Work was emergency-only and after photo will be added later."
          />
          {error && <p className="mt-2 text-sm font-medium text-red-700">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded bg-amber-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? "Completing..." : "Complete with waiver"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded border border-amber-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
