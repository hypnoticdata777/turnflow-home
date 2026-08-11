import {
  vendorFitGuidance,
  type VendorFitRequest,
} from "@/lib/vendor-fit";
import type { VendorProfileInput } from "@/lib/vendor-profile";

type AssignedVendor = {
  name: string | null;
  email: string;
  profile: VendorProfileInput | null;
} | null;

const panelClasses: Record<ReturnType<typeof vendorFitGuidance>["tone"], string> = {
  attention: "border-blue-200 bg-blue-50 text-blue-950",
  progress: "border-amber-200 bg-amber-50 text-amber-950",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-950",
};

export function VendorFitPanel({
  request,
  assignedVendor,
}: {
  request: VendorFitRequest;
  assignedVendor: AssignedVendor;
}) {
  const guidance = vendorFitGuidance({
    request,
    profile: assignedVendor?.profile ?? null,
  });
  const vendorLabel =
    assignedVendor?.name || assignedVendor?.email || "Assigned vendor";

  return (
    <section className={`mb-4 rounded-lg border p-4 ${panelClasses[guidance.tone]}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Assigned vendor fit</p>
          <h2 className="mt-1 text-xl font-semibold">{guidance.label}</h2>
          <p className="mt-2 text-sm leading-6">{guidance.detail}</p>
          {assignedVendor && (
            <p className="mt-2 text-sm font-medium">Vendor: {vendorLabel}</p>
          )}
        </div>
        <div className="shrink-0 rounded border border-current/30 bg-white/70 px-3 py-2 text-sm font-semibold">
          {guidance.nextAction}
        </div>
      </div>

      {assignedVendor?.profile?.businessName && (
        <p className="mt-3 text-sm">
          Business: <span className="font-semibold">{assignedVendor.profile.businessName}</span>
        </p>
      )}

      {guidance.items.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {guidance.items.map((item) => (
            <div
              key={item.label}
              className="rounded border border-current/20 bg-white/75 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{item.label}</p>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold">
                  {item.complete ? "Ready" : "Check"}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5">{item.detail}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
