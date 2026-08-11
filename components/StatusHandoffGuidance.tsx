import type { StatusHandoffGuidance as StatusHandoffGuidanceData } from "@/lib/status-handoff";

const toneClasses: Record<StatusHandoffGuidanceData["tone"], string> = {
  attention: "border-blue-200 bg-blue-50 text-blue-950",
  progress: "border-amber-200 bg-amber-50 text-amber-950",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-950",
};

export function StatusHandoffGuidance({
  guidance,
}: {
  guidance: StatusHandoffGuidanceData;
}) {
  return (
    <div className={`mt-3 rounded-lg border p-3 ${toneClasses[guidance.tone]}`}>
      <p className="text-xs font-semibold uppercase">{guidance.eyebrow}</p>
      <p className="mt-1 text-sm font-semibold">{guidance.title}</p>
      <p className="mt-1 text-sm leading-6">{guidance.detail}</p>
      <ul className="mt-2 space-y-1 text-xs leading-5">
        {guidance.reminders.map((reminder) => (
          <li key={reminder}>{reminder}</li>
        ))}
      </ul>
    </div>
  );
}
