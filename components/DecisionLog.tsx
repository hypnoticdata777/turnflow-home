const LOG_ACTION_TEXT: Record<string, (d: Record<string, unknown>) => string> = {
  status_changed: (d) => `Status changed${d.from ? ` from ${d.from}` : ""} to ${d.to}.`,
  completion_waived: (d) =>
    `Marked Complete without full proof on record - waived: "${d.reason}"`,
  quote_approved: (d) =>
    `Approved quote from ${d.vendorName || "a vendor"} ($${Number(d.amount || 0).toFixed(2)}).`,
  quote_declined: (d) =>
    `Declined quote from ${d.vendorName || "a vendor"} ($${Number(d.amount || 0).toFixed(2)}).`,
  vendor_bid_submitted: (d) =>
    `Vendor bid submitted by ${d.vendorName || "assigned vendor"} ($${Number(d.amount || 0).toFixed(2)}).`,
  vendor_bid_updated: (d) =>
    `Vendor bid updated by ${d.vendorName || "assigned vendor"} ($${Number(d.amount || 0).toFixed(2)}).`,
  work_session_event: (d) =>
    `${d.label || "Work session updated"}${d.taskLabel ? ` (${d.taskLabel})` : ""}${d.notes ? `: ${d.notes}` : "."}`,
  request_task_created: (d) => `Added project task "${d.title || "Untitled task"}".`,
  request_task_deleted: (d) => `Deleted project task "${d.title || "Untitled task"}".`,
  request_task_status_changed: (d) =>
    `Changed project task "${d.title || "Untitled task"}" from ${d.from || "unknown"} to ${d.to || "unknown"}.`,
  request_task_cost_updated: (d) =>
    `Updated project task "${d.title || "Untitled task"}" costs: estimated $${Number(d.estimatedCost || 0).toFixed(2)}, final $${Number(d.finalCost || 0).toFixed(2)}.`,
  request_task_accepted: (d) =>
    `Accepted project task "${d.title || "Untitled task"}" for closeout.`,
  closeout_submitted: (d) =>
    `Vendor submitted closeout for owner review ($${Number(d.finalAmount || 0).toFixed(2)}).`,
  closeout_approved: (d) =>
    `Owner approved vendor closeout ($${Number(d.finalAmount || 0).toFixed(2)}).`,
  closeout_changes_requested: (d) =>
    `Owner requested closeout changes${d.reviewNotes ? `: ${d.reviewNotes}` : "."}`,
  shared_access_removed: (d) => {
    const role = d.role === "collaborator" ? "collaborator" : "vendor";
    return d.removedUserEmail
      ? `Removed ${role} access for ${d.removedUserEmail} from this request.`
      : `Removed ${role} access from this request.`;
  },
};

export type LogEntryData = {
  id: string;
  actorId: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string | Date;
};

export function actorLabel(actorId: string, userId: string, assignedVendorId: string | null) {
  if (actorId === userId) return "You";
  if (assignedVendorId && actorId === assignedVendorId) return "Assigned vendor";
  return `User (${actorId.slice(0, 6)}...)`;
}

export function describeLogAction(action: string, details: Record<string, unknown> | null) {
  const describe = LOG_ACTION_TEXT[action];
  return describe ? describe(details || {}) : action;
}

export function DecisionLog({
  entries,
  userId,
  assignedVendorId,
}: {
  entries: LogEntryData[];
  userId: string;
  assignedVendorId: string | null;
}) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Decision Log</h2>
      {sorted.length === 0 ? (
        <p className="text-gray-500 text-sm">No log entries yet.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((entry) => {
            const text = describeLogAction(entry.action, entry.details);
            const when = new Date(entry.createdAt).toLocaleString();
            return (
              <div key={entry.id} className="border-l-2 border-gray-300 pl-3">
                <p className="text-sm">{text}</p>
                <p className="text-xs text-gray-500">
                  {actorLabel(entry.actorId, userId, assignedVendorId)} - {when}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
