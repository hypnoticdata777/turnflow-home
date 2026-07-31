// Pure, framework-free helpers — ported from the original Firebase
// build's public/js/utils.js (see docs/DEVLOG.md in the sibling
// turnflow-mvp-main/ repo). escHtml was dropped: JSX escapes text content
// by default, so the manual-innerHTML-escaping helper has no equivalent
// need here. Login-lockout logic was dropped too — Auth.js owns the
// credentials flow now instead of a hand-rolled localStorage deterrent.

/**
 * CSV helpers (Package 7 — history export, NFR4/CON6/QA6). RFC 4180-ish:
 * wraps a field in quotes if it contains a comma, quote, or newline, and
 * doubles any inner quotes.
 */
export function csvEscape(value: unknown): string {
  const str = value == null ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function toCsvRow(values: unknown[]): string {
  return values.map(csvEscape).join(",");
}

/**
 * Recurring maintenance reminders (Package 8 — FEAT4/FR8/EXT3). A
 * reminder's nextDueAt is computed and stored on the row itself (not
 * recomputed on every read) whenever it's created or marked done — these
 * are the pure pieces of that: interval presets, due-soon/overdue
 * classification, and ICS calendar export.
 */
export const REMINDER_INTERVAL_PRESETS = [
  { label: "Monthly", days: 30 },
  { label: "Quarterly", days: 90 },
  { label: "Semi-annual", days: 182 },
  { label: "Annual", days: 365 },
] as const;

export type ReminderStatus = "overdue" | "upcoming" | "ok";

/** 'overdue' | 'upcoming' (due within 14 days) | 'ok'. */
export function reminderStatus(nextDueAtMillis: number, nowMillis: number = Date.now()): ReminderStatus {
  if (!nextDueAtMillis) return "ok";
  const diffDays = (nextDueAtMillis - nowMillis) / 86_400_000;
  if (diffDays < 0) return "overdue";
  if (diffDays <= 14) return "upcoming";
  return "ok";
}

/** Tailwind classes for a reminder-status badge, paired with reminderStatus(). */
export function reminderStatusBadgeClasses(status: ReminderStatus): string {
  switch (status) {
    case "overdue":
      return "bg-red-100 text-red-800";
    case "upcoming":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-green-100 text-green-800";
  }
}

function icsEscape(str: string | null | undefined): string {
  return String(str || "")
    .replace(/[\\,;]/g, (m) => "\\" + m)
    .replace(/\n/g, "\\n");
}

function icsDateStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

/** Builds a static .ics calendar (no third-party API) from a list of reminders. */
export function buildRemindersICS(
  reminders: Array<{ id: string; title: string; nextDueAt: Date; notes?: string | null }>
): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//TurnFlow Home//Maintenance Reminders//EN"];
  for (const r of reminders) {
    if (!r.nextDueAt) continue;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${r.id}@turnflow-home`);
    lines.push(`DTSTART;VALUE=DATE:${icsDateStamp(r.nextDueAt)}`);
    lines.push(`SUMMARY:${icsEscape(r.title)}`);
    if (r.notes) lines.push(`DESCRIPTION:${icsEscape(r.notes)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/** Document categories for the property record vault (Package 6/FEAT5). */
export const VAULT_DOCUMENT_CATEGORIES = [
  "Receipt",
  "Warranty",
  "Manual",
  "Invoice",
  "Inspection Report",
  "Other",
] as const;

export const REQUEST_STATUSES = [
  "Draft",
  "Needs Quote",
  "Waiting",
  "Scheduled",
  "In Progress",
  "Needs Review",
  "Complete",
  "Archived",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export function requestStatusBadgeClasses(status: string | null | undefined): string {
  switch (status) {
    case "Needs Quote":
      return "bg-yellow-100 text-yellow-800";
    case "Waiting":
      return "bg-orange-100 text-orange-800";
    case "Scheduled":
      return "bg-blue-100 text-blue-800";
    case "In Progress":
      return "bg-indigo-100 text-indigo-800";
    case "Needs Review":
      return "bg-purple-100 text-purple-800";
    case "Complete":
      return "bg-green-100 text-green-800";
    case "Archived":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-gray-100 text-gray-800"; // Draft / anything else
  }
}

export const REQUEST_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Appliance",
  "Roof",
  "Structural",
  "Pest Control",
  "Landscaping",
  "Safety",
  "Other",
] as const;
export type RequestCategory = (typeof REQUEST_CATEGORIES)[number];

export const REQUEST_URGENCIES = ["Low", "Medium", "High", "Emergency"] as const;
export const CONTACT_METHODS = ["Email", "Phone", "Text"] as const;

/** Recommended next steps / evidence to collect per category, shown as soon as a homeowner picks a category — before they call a vendor. */
export const CATEGORY_CHECKLISTS: Record<string, string[]> = {
  Plumbing: [
    "Shut off the water supply to the affected fixture if it's actively leaking.",
    "Photograph the leak or damage and any visible shutoff valve.",
    "Note how long the issue has been happening and whether it's constant or intermittent.",
  ],
  Electrical: [
    "Turn off power at the breaker if you see sparking, a burning smell, or exposed wiring.",
    "Photograph the outlet, fixture, or panel involved.",
    "Note which breaker (if any) controls the affected circuit.",
  ],
  HVAC: [
    "Check and note the thermostat setting and current indoor temperature.",
    "Photograph the unit's model/serial plate if it's easily accessible.",
    "Note the last filter-change date if you know it.",
  ],
  Appliance: [
    "Note the appliance's make, model, and approximate age.",
    "Photograph any error codes, leaks, or visible damage.",
    "Unplug the appliance if you smell burning or see sparking.",
  ],
  Roof: [
    "Photograph the affected area from the ground — avoid climbing onto the roof.",
    "Note whether there's active interior water intrusion.",
    "Check the attic or ceiling below the area for staining if it's safe to do so.",
  ],
  Structural: [
    "Photograph the crack or damage with something for scale, like a coin or ruler.",
    "Note whether the issue appears to be new or getting worse.",
    "Avoid entering the area if there's any risk of collapse.",
  ],
  "Pest Control": [
    "Photograph any visible pests, droppings, or damage.",
    "Note where you're seeing activity and at what time of day.",
    "Avoid using store-bought pesticides near the source until the issue is scoped.",
  ],
  Landscaping: [
    "Photograph the affected area, including any drainage or erosion.",
    "Note whether the issue affects a neighboring property line.",
    "Check for recent irrigation or sprinkler malfunctions nearby.",
  ],
  Safety: [
    "Photograph the hazard, such as a loose railing, broken step, or smoke detector.",
    "Note who has access to the area and any immediate steps you've already taken.",
    "If this is a fire, gas leak, or other life-safety emergency, contact emergency services first.",
  ],
  Other: [
    "Describe the issue in as much detail as possible in the Notes field.",
    "Photograph the issue from multiple angles.",
    "Note any relevant history, like when it started or prior repairs.",
  ],
};

export function checklistForCategory(category: string | null | undefined): string[] {
  if (!category) return [];
  return CATEGORY_CHECKLISTS[category] ?? [];
}

/**
 * Resolves the single "current cost" of a request from its three cost
 * fields, and labels which one it came from (BRL3: costs remain
 * estimates until a vendor quote, invoice, or final cost is attached).
 * finalCost wins over quotedCost wins over estimatedCost.
 *
 * Postgres `numeric` columns come back from Drizzle as strings (to avoid
 * float precision loss), so every input here is string | number | null.
 */
export type CostFields = {
  estimatedCost?: string | number | null;
  quotedCost?: string | number | null;
  finalCost?: string | number | null;
};

function isSetCost(v: string | number | null | undefined): v is string | number {
  return v !== undefined && v !== null && v !== "";
}

function firstDefinedCost(reqData: CostFields): string | number {
  if (isSetCost(reqData?.finalCost)) return reqData.finalCost;
  if (isSetCost(reqData?.quotedCost)) return reqData.quotedCost;
  if (isSetCost(reqData?.estimatedCost)) return reqData.estimatedCost;
  return 0;
}

export function costForRequest(reqData: CostFields): number {
  const value = firstDefinedCost(reqData);
  const num = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(num) ? num : 0;
}

export function costLabelForRequest(reqData: CostFields): "Final" | "Quoted" | "Estimated" | "No cost recorded" {
  if (isSetCost(reqData?.finalCost)) return "Final";
  if (isSetCost(reqData?.quotedCost)) return "Quoted";
  if (isSetCost(reqData?.estimatedCost)) return "Estimated";
  return "No cost recorded";
}

/**
 * Whether a request has the minimum proof fields to move to Complete
 * (BRL2): a final cost, at least one "after" photo, and a vendor on
 * record. If false, the caller must record an explicit waiver reason in
 * the decision log rather than silently allowing the transition.
 */
export function meetsCompletionRequirements(
  reqData: CostFields & { assignedVendorId?: string | null },
  photos: Array<{ type: string }> = []
): boolean {
  const hasFinalCost = isSetCost(reqData?.finalCost);
  const hasAfterPhoto = photos.some((p) => p.type === "after");
  const hasVendor = !!reqData?.assignedVendorId;
  return hasFinalCost && hasAfterPhoto && hasVendor;
}
