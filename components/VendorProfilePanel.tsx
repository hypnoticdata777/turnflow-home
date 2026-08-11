"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateVendorProfileAction } from "@/lib/actions/vendor-profile";
import {
  VENDOR_NOTIFICATION_OPTIONS,
  VENDOR_TRADE_OPTIONS,
  vendorProfileReadiness,
  type VendorProfileInput,
} from "@/lib/vendor-profile";

const readinessClasses: Record<
  ReturnType<typeof vendorProfileReadiness>["tone"],
  string
> = {
  attention: "border-blue-200 bg-blue-50 text-blue-950",
  progress: "border-amber-200 bg-amber-50 text-amber-950",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-950",
};

export function VendorProfilePanel({
  profile,
}: {
  profile: VendorProfileInput | null;
}) {
  const router = useRouter();
  const readiness = vendorProfileReadiness(profile);
  const selectedTrades = new Set(profile?.trades ?? []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const result = await updateVendorProfileAction(new FormData(event.currentTarget));
    if ("error" in result) {
      setMessage(result.error);
      setSaving(false);
      return;
    }

    setMessage("Vendor profile saved.");
    setSaving(false);
    router.refresh();
  }

  return (
    <section id="vendor-profile" className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Vendor matching profile</p>
          <h2 className="text-xl font-semibold">Tell TurnFlow what work fits you</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            These details prepare the vendor account for future trade matching,
            opportunity notifications, bidding, and clean owner approvals.
          </p>
        </div>
        <div className={`rounded-lg border p-3 ${readinessClasses[readiness.tone]}`}>
          <p className="text-sm font-semibold">{readiness.label}</p>
          <p className="mt-1 text-sm leading-6">{readiness.detail}</p>
          <p className="mt-2 text-sm font-medium">
            {readiness.completedCount}/{readiness.totalCount} profile pieces
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
        <label className="block text-sm">
          <span className="font-semibold">Business name</span>
          <input
            name="businessName"
            defaultValue={profile?.businessName ?? ""}
            className="mt-1 w-full rounded border p-2"
            placeholder="Example: Brightside Plumbing"
          />
        </label>

        <label className="block text-sm">
          <span className="font-semibold">Service area</span>
          <input
            name="serviceArea"
            defaultValue={profile?.serviceArea ?? ""}
            className="mt-1 w-full rounded border p-2"
            placeholder="Example: Miami-Dade, Broward, 20-mile radius"
          />
        </label>

        <div className="lg:col-span-2">
          <p className="text-sm font-semibold">Trade categories</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {VENDOR_TRADE_OPTIONS.map((trade) => (
              <label
                key={trade}
                className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="trades"
                  value={trade}
                  defaultChecked={selectedTrades.has(trade)}
                  className="h-4 w-4"
                />
                <span>{trade}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="block text-sm">
          <span className="font-semibold">Availability</span>
          <textarea
            name="availability"
            defaultValue={profile?.availability ?? ""}
            className="mt-1 min-h-28 w-full rounded border p-2"
            placeholder="Example: Weekdays 8-5, emergency plumbing after hours"
          />
        </label>

        <label className="block text-sm">
          <span className="font-semibold">License / insurance notes</span>
          <textarea
            name="licenseInsuranceNotes"
            defaultValue={profile?.licenseInsuranceNotes ?? ""}
            className="mt-1 min-h-28 w-full rounded border p-2"
            placeholder="Example: License number, insurance expiration, or owner-visible credential notes"
          />
        </label>

        <label className="block text-sm">
          <span className="font-semibold">Preferred notification</span>
          <select
            name="notificationPreference"
            defaultValue={profile?.notificationPreference ?? ""}
            className="mt-1 w-full rounded border bg-white p-2"
          >
            <option value="">Select preference</option>
            {VENDOR_NOTIFICATION_OPTIONS.map((preference) => (
              <option key={preference} value={preference}>
                {preference}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-2 self-end sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
          {message && (
            <p className="text-sm font-medium text-gray-700" role="status">
              {message}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
