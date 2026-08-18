"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  CONTACT_METHODS,
  REQUEST_CATEGORIES,
  REQUEST_URGENCIES,
  checklistForCategory,
} from "@/lib/utils";
import {
  createRequestAction,
  recordRequestPhotoAction,
} from "@/lib/actions/requests";
import { createProperty } from "@/lib/actions/properties";
import { requestPhotoPath } from "@/lib/blob-paths";
import {
  requestIntakeHandoffChecks,
  requestIntakeHandoffSummary,
  requestIntakeNextStep,
  requestIntakeProgress,
  requestIntakeSteps,
  requestIntakeSummary,
} from "@/lib/request-intake";
import { photoUploadStatus, requestDetailPathAfterCreate } from "@/lib/request-submit";

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
  const propertyId = useId();
  const titleId = useId();
  const categoryId = useId();
  const urgencyId = useId();
  const locationId = useId();
  const contactMethodId = useId();
  const accessInstructionsId = useId();
  const notesId = useId();
  const quickAddressId = useId();
  const quickNicknameId = useId();

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [urgency, setUrgency] = useState("");
  const [location, setLocation] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [accessInstructions, setAccessInstructions] = useState("");
  const [notes, setNotes] = useState("");
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
    let failedPhotoUploads = 0;
    for (const type of queued) {
      const file = queuedPhotos[type]!;
      setPhotoStatus(`Uploading ${type}...`);
      try {
        const pathname = requestPhotoPath(requestId, type, userId, file.name);
        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/blob-upload",
        });
        await recordRequestPhotoAction(requestId, type, blob.url, blob.pathname);
      } catch (err) {
        console.error(`Failed to upload ${type} photo:`, err);
        failedPhotoUploads++;
      }
    }

    const uploadStatus = photoUploadStatus(queued.length, failedPhotoUploads);
    router.push(requestDetailPathAfterCreate(requestId, uploadStatus));
  }

  const checklist = checklistForCategory(category);
  const queuedPhotoCount = PHOTO_TYPES.filter((type) => queuedPhotos[type]).length;
  const intakeSteps = requestIntakeSteps({
    propertyId: selectedPropertyId,
    title,
    category,
    urgency,
    location,
    contactMethod,
    accessInstructions,
    notes,
    photoCount: queuedPhotoCount,
  });
  const intakeSummary = requestIntakeSummary(intakeSteps);
  const nextStep = requestIntakeNextStep(intakeSteps);
  const { completedCount, totalCount, progress } = requestIntakeProgress(intakeSteps);
  const handoffChecks = requestIntakeHandoffChecks({
    propertyId: selectedPropertyId,
    title,
    category,
    urgency,
    location,
    contactMethod,
    accessInstructions,
    notes,
    photoCount: queuedPhotoCount,
  });
  const handoffSummary = requestIntakeHandoffSummary(handoffChecks);
  const handoffCompleteCount = handoffChecks.filter((check) => check.complete).length;
  const summaryClasses =
    intakeSummary.tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : intakeSummary.tone === "empty"
        ? "border-blue-200 bg-blue-50 text-blue-950"
        : "border-amber-200 bg-amber-50 text-amber-950";
  const summaryButtonClasses =
    intakeSummary.tone === "ready"
      ? "bg-emerald-800 hover:bg-emerald-900"
      : intakeSummary.tone === "empty"
        ? "bg-blue-800 hover:bg-blue-900"
        : "bg-amber-800 hover:bg-amber-900";
  const handoffClasses =
    handoffSummary.tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : handoffSummary.tone === "empty"
        ? "border-gray-200 bg-white text-gray-900"
        : "border-blue-200 bg-blue-50 text-blue-950";

  return (
    <div className="grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:items-start">
      <div className="rounded-xl bg-white p-4 shadow sm:p-6">
        {error && (
          <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {properties.length === 0 && (
          <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3">
            <p className="mb-2 text-sm font-medium">
              Let&apos;s add your first property before your first request. It only
              takes a second.
            </p>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="flex-1">
                <label htmlFor={quickAddressId} className="mb-1 block text-xs font-medium">
                  Address
                </label>
                <input
                  id={quickAddressId}
                  type="text"
                  placeholder="123 Main St"
                  value={quickAddress}
                  onChange={(e) => setQuickAddress(e.target.value)}
                  className="w-full rounded border p-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label htmlFor={quickNicknameId} className="mb-1 block text-xs font-medium">
                  Nickname
                </label>
                <input
                  id={quickNicknameId}
                  type="text"
                  placeholder="Optional"
                  value={quickNickname}
                  onChange={(e) => setQuickNickname(e.target.value)}
                  className="w-full rounded border p-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleQuickAddProperty}
                disabled={quickAddPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white whitespace-nowrap transition-transform duration-150 hover:scale-105 hover:bg-blue-800 active:scale-95 disabled:opacity-50 md:self-end"
              >
                {quickAddPending ? "Saving..." : "Add property"}
              </button>
            </div>
            {quickAddError && (
              <p className="mt-1 text-xs text-red-600">{quickAddError}</p>
            )}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <section className={`rounded-lg border p-4 ${summaryClasses}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold">
                Request draft: {completedCount} of {totalCount} ready ({progress}%)
              </p>
              <h2 className="mt-1 text-xl font-semibold">{intakeSummary.headline}</h2>
              <p className="mt-2 text-sm leading-6">{intakeSummary.detail}</p>
            </div>
            {nextStep && (
              <a
                href={nextStep.href}
                className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors duration-150 ${summaryButtonClasses}`}
              >
                {nextStep.cta}
              </a>
            )}
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/70">
            <div className="h-full bg-current" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {intakeSteps.map((step) => (
              <div key={step.label} className="rounded border border-current/20 bg-white/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{step.label}</p>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold">
                    {step.complete ? "Ready" : "Needs work"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <div id="request-property" className="scroll-mt-6">
          <label htmlFor={propertyId} className="mb-1 block text-sm font-medium">
            Property
          </label>
          <select
            id={propertyId}
            name="propertyId"
            required
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="w-full rounded border bg-white p-2"
          >
            <option value="">
              {properties.length === 0 ? "Add a property first" : "Select a property"}
            </option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nickname ? `${p.nickname} - ${p.address}` : p.address}
              </option>
            ))}
          </select>
        </div>

        <div id="request-title" className="scroll-mt-6">
          <label htmlFor={titleId} className="mb-1 block text-sm font-medium">
            Short title
          </label>
          <input
            id={titleId}
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Kitchen faucet leaking"
            className="w-full rounded border p-2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div id="request-category" className="scroll-mt-6">
            <label htmlFor={categoryId} className="mb-1 block text-sm font-medium">
              Category
            </label>
            <select
              id={categoryId}
              name="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded border bg-white p-2"
            >
              <option value="">Select a category</option>
              {REQUEST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div id="request-urgency" className="scroll-mt-6">
            <label htmlFor={urgencyId} className="mb-1 block text-sm font-medium">
              Urgency
            </label>
            <select
              id={urgencyId}
              name="urgency"
              required
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full rounded border bg-white p-2"
            >
              <option value="">Select urgency</option>
              {REQUEST_URGENCIES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {urgency === "Emergency" && (
          <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            TurnFlow Home is not an emergency dispatch service. If this is a
            genuine emergency (fire, gas leak, flooding, electrical hazard),
            contact emergency services or a licensed professional directly. Use
            this request only to track and document it.
          </p>
        )}

        {checklist.length > 0 && (
          <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <p className="mb-1 font-medium">Before you go further</p>
            <ul className="list-inside list-disc space-y-1">
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label htmlFor={locationId} className="mb-1 block text-sm font-medium">
            Room / location
          </label>
          <input
            id={locationId}
            name="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Kitchen, 2nd floor bathroom"
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label htmlFor={contactMethodId} className="mb-1 block text-sm font-medium">
            Preferred contact method
          </label>
          <select
            id={contactMethodId}
            name="contactMethod"
            value={contactMethod}
            onChange={(e) => setContactMethod(e.target.value)}
            className="w-full rounded border bg-white p-2"
          >
            <option value="">Preferred contact method</option>
            {CONTACT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={accessInstructionsId} className="mb-1 block text-sm font-medium">
            Access instructions
          </label>
          <textarea
            id={accessInstructionsId}
            name="accessInstructions"
            rows={2}
            value={accessInstructions}
            onChange={(e) => setAccessInstructions(e.target.value)}
            placeholder="e.g. Lockbox code, gate access, pets on site"
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label htmlFor={notesId} className="mb-1 block text-sm font-medium">
            Notes
          </label>
          <textarea
            id={notesId}
            name="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the issue"
            className="w-full rounded border p-2"
          />
        </div>

        <div id="request-photos" className="scroll-mt-6">
          <label className="mb-1 block text-sm font-medium">Photos (optional)</label>
          <p className="mb-2 text-xs text-gray-500">
            Attach photos now, or add them later from the request page.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {PHOTO_TYPES.map((type) => (
              <div key={type} className="rounded border p-3">
                <h3 className="mb-2 text-sm font-medium capitalize">{type}</h3>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="mb-1 w-full text-sm"
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
          {photoStatus && <p className="mt-2 text-sm text-gray-600">{photoStatus}</p>}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-green-700 px-6 py-2 text-white transition-colors duration-150 hover:bg-green-900 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save draft request"}
          </button>
          <a
            href="/owner/dashboard"
            className="inline-block rounded-lg bg-gray-600 px-6 py-2 text-center text-white transition-colors duration-150 hover:bg-gray-800"
          >
            Cancel
          </a>
        </div>
        </form>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6">
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-800">
            What gets saved
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-950">Owner-controlled draft</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Saving creates a private owner record first. Vendors or helpers only
            see this request after you invite or assign them.
          </p>
          <div className="mt-4 grid gap-2 text-sm">
            <p className="rounded border border-gray-200 bg-gray-50 p-3">
              <strong>Required:</strong> property, short title, category, and
              urgency.
            </p>
            <p className="rounded border border-gray-200 bg-gray-50 p-3">
              <strong>Helpful:</strong> location, contact path, access notes,
              issue history, and first photos.
            </p>
          </div>
        </section>

        <section className={`rounded-lg border p-4 shadow-sm ${handoffClasses}`}>
          <p className="text-sm font-semibold uppercase tracking-normal">
            Vendor handoff readiness
          </p>
          <h2 className="mt-2 text-xl font-semibold">{handoffSummary.headline}</h2>
          <p className="mt-2 text-sm leading-6">{handoffSummary.detail}</p>
          <p className="mt-3 text-sm font-semibold">
            {handoffCompleteCount} of {handoffChecks.length} optional details ready
          </p>
          <div className="mt-3 space-y-2">
            {handoffChecks.map((check) => (
              <div key={check.label} className="rounded border border-current/20 bg-white/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{check.label}</p>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold">
                    {check.complete ? "Ready" : "Optional"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5">{check.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
