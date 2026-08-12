import { costForRequest, costLabelForRequest, type CostFields } from "@/lib/utils";
import type { BillingRecordStatus } from "@/lib/billing-records";
import type { CloseoutSubmissionStatus } from "@/lib/closeout-submissions";
import type { RequestTaskStatus } from "@/lib/project-tasks";

export type RequestWorkflowTone = "attention" | "progress" | "ready";

export type RequestWorkflowStep = {
  id: string;
  label: string;
  href: string;
  state: string;
  detail: string;
  tone: RequestWorkflowTone;
  cta: string;
};

export type RequestWorkflowInput = CostFields & {
  status: string;
  category: string;
  urgency: string;
  assignedVendorId?: string | null;
  collaboratorId?: string | null;
  pendingVendorInviteId?: string | null;
  pendingCollaboratorInviteId?: string | null;
  photos: Array<{ type: string }>;
  quotes?: Array<{ status: string }>;
  tasks?: Array<{ status: RequestTaskStatus | string; acceptedAt?: string | Date | null }>;
  closeoutSubmissions?: Array<{
    status: CloseoutSubmissionStatus | string;
    submittedAt?: string | Date;
  }>;
  billingRecords?: Array<{ status: BillingRecordStatus | string; recordedAt?: string | Date }>;
  workSessions?: Array<unknown>;
  comments?: Array<unknown>;
  log?: Array<unknown>;
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function hasPhoto(input: RequestWorkflowInput, type: string) {
  return input.photos.some((photo) => photo.type === type);
}

function helperCount(input: RequestWorkflowInput) {
  return [
    input.assignedVendorId,
    input.collaboratorId,
    input.pendingVendorInviteId,
    input.pendingCollaboratorInviteId,
  ].filter(Boolean).length;
}

function latestByDate<T extends { submittedAt?: string | Date; recordedAt?: string | Date }>(
  rows: T[] | undefined,
  field: "submittedAt" | "recordedAt"
) {
  if (!rows || rows.length === 0) return null;
  return [...rows].sort((a, b) => {
    const left = new Date(a[field] ?? 0).getTime();
    const right = new Date(b[field] ?? 0).getTime();
    return right - left;
  })[0];
}

function moneyForRequest(input: CostFields) {
  return `$${costForRequest(input).toFixed(2)}`;
}

export function requestWorkflowSteps(input: RequestWorkflowInput): RequestWorkflowStep[] {
  const costLabel = costLabelForRequest(input);
  const quoteCount = input.quotes?.length ?? 0;
  const approvedQuoteCount = input.quotes?.filter((quote) => quote.status === "approved").length ?? 0;
  const taskCount = input.tasks?.length ?? 0;
  const doneTaskCount = input.tasks?.filter((task) => task.status === "done").length ?? 0;
  const acceptedTaskCount = input.tasks?.filter((task) => task.acceptedAt).length ?? 0;
  const blockedTaskCount = input.tasks?.filter((task) => task.status === "blocked").length ?? 0;
  const helpers = helperCount(input);
  const hasAnyProof = input.photos.length > 0;
  const hasBefore = hasPhoto(input, "before");
  const hasAfter = hasPhoto(input, "after");
  const workSessionCount = input.workSessions?.length ?? 0;
  const latestCloseout = latestByDate(input.closeoutSubmissions, "submittedAt");
  const latestBilling = latestByDate(input.billingRecords, "recordedAt");
  const commentCount = input.comments?.length ?? 0;
  const logCount = input.log?.length ?? 0;

  return [
    {
      id: "record-summary",
      label: "Intake",
      href: "#record-summary",
      state: "Captured",
      detail: `${input.category || "Repair"} request is ${input.status}; urgency is ${
        input.urgency || "not set"
      }.`,
      tone: "ready",
      cta: "Review record",
    },
    {
      id: "project-tasks",
      label: "Scope",
      href: "#project-tasks",
      state:
        taskCount === 0
          ? "Single repair"
          : acceptedTaskCount === taskCount
            ? "Accepted"
            : blockedTaskCount > 0
              ? "Blocked"
              : `${doneTaskCount}/${taskCount} done`,
      detail:
        taskCount === 0
          ? "Use the main repair record for simple jobs; add task rows when work has phases, rooms, or proof checkpoints."
          : acceptedTaskCount === taskCount
            ? "Every project task is done and owner-accepted for closeout."
            : blockedTaskCount > 0
              ? `${pluralize(blockedTaskCount, "task")} needs owner or vendor follow-up.`
              : `${pluralize(doneTaskCount, "task")} done; ${pluralize(
                  acceptedTaskCount,
                  "task"
                )} owner-accepted.`,
      tone:
        taskCount === 0
          ? "progress"
          : acceptedTaskCount === taskCount
            ? "ready"
            : blockedTaskCount > 0
              ? "attention"
              : "progress",
      cta: taskCount === 0 ? "Plan scope" : "Review tasks",
    },
    {
      id: "cost",
      label: "Cost",
      href: "#cost",
      state:
        latestBilling || costLabel === "Final"
          ? "Finalized"
          : approvedQuoteCount > 0 || costLabel !== "No cost recorded"
            ? "In review"
            : "Missing",
      detail:
        latestBilling || costLabel === "Final"
          ? `${costLabel === "No cost recorded" ? "Final charge" : `${costLabel} cost`} is ${moneyForRequest(
              input
            )}.`
          : approvedQuoteCount > 0
            ? `${pluralize(approvedQuoteCount, "approved quote")} ready to copy into final cost.`
            : costLabel !== "No cost recorded"
              ? `${costLabel} cost is ${moneyForRequest(input)}; final cost can wait until closeout.`
              : "Add an estimate, quote, or final cost so the owner record has price context.",
      tone:
        latestBilling || costLabel === "Final"
          ? "ready"
          : approvedQuoteCount > 0 || costLabel !== "No cost recorded"
            ? "progress"
            : "attention",
      cta: costLabel === "No cost recorded" ? "Add cost" : "Review cost",
    },
    {
      id: "quotes",
      label: "Bids",
      href: "#quotes",
      state:
        approvedQuoteCount > 0 ? "Approved" : quoteCount > 0 ? "Comparing" : "Optional",
      detail:
        approvedQuoteCount > 0
          ? `${pluralize(approvedQuoteCount, "quote")} approved for the record.`
          : quoteCount > 0
            ? `${pluralize(quoteCount, "quote")} saved for comparison before approval.`
            : "Record quotes when the owner needs price comparison or vendor bid history.",
      tone: approvedQuoteCount > 0 ? "ready" : quoteCount > 0 ? "progress" : "progress",
      cta: quoteCount > 0 ? "Review bids" : "Add bid",
    },
    {
      id: "sharing",
      label: "Help",
      href: "#sharing",
      state: input.assignedVendorId
        ? "Assigned"
        : helpers > 0
          ? "Invited"
          : "Owner only",
      detail: input.assignedVendorId
        ? "A vendor is assigned and can work inside the scoped vendor portal."
        : helpers > 0
          ? `${pluralize(helpers, "person")} invited or shared into this request.`
          : "No vendor or collaborator can see this request until the owner shares it.",
      tone: input.assignedVendorId ? "ready" : helpers > 0 ? "progress" : "attention",
      cta: helpers > 0 ? "Review access" : "Invite help",
    },
    {
      id: "photos",
      label: "Proof",
      href: "#photos",
      state: hasBefore && hasAfter ? "Before/after" : hasAfter ? "After saved" : hasAnyProof ? "Started" : "Missing",
      detail:
        hasBefore && hasAfter
          ? `${pluralize(input.photos.length, "proof item")} saved, including before and after photos.`
          : hasAfter
            ? "After-photo proof is saved for closeout; add before or receipt proof when useful."
            : hasAnyProof
              ? `${pluralize(input.photos.length, "proof item")} saved; after photo is still needed for clean closeout.`
              : "Add before, after, receipt, or context proof before decisions get separated from the work.",
      tone: hasBefore && hasAfter ? "ready" : hasAnyProof || hasAfter ? "progress" : "attention",
      cta: hasAnyProof ? "Review proof" : "Add proof",
    },
    {
      id: "work-sessions",
      label: "Work",
      href: "#work-sessions",
      state: workSessionCount > 0 ? "Timed" : "Not started",
      detail:
        workSessionCount > 0
          ? `${pluralize(workSessionCount, "work event")} recorded for start, pause, resume, or stop history.`
          : "Vendor start/stop events will appear here with required proof when work begins.",
      tone: workSessionCount > 0 ? "ready" : "progress",
      cta: "Review work",
    },
    {
      id: "closeout",
      label: "Closeout",
      href: "#closeout",
      state:
        latestCloseout?.status === "approved"
          ? "Approved"
          : latestCloseout?.status === "pending"
            ? "Owner review"
            : latestCloseout?.status === "changes_requested"
              ? "Changes"
              : "Waiting",
      detail:
        latestCloseout?.status === "approved"
          ? "Owner approved the vendor handoff and preserved the closeout decision."
          : latestCloseout?.status === "pending"
            ? "Vendor handoff is waiting for owner approval or requested changes."
            : latestCloseout?.status === "changes_requested"
              ? "Owner requested closeout changes; vendor needs to revise the handoff."
              : "Closeout starts after the vendor submits completion notes, proof, and final amount.",
      tone:
        latestCloseout?.status === "approved"
          ? "ready"
          : latestCloseout?.status === "pending"
            ? "attention"
            : "progress",
      cta: "Review closeout",
    },
    {
      id: "billing",
      label: "Billing",
      href: "#billing",
      state:
        latestBilling?.status === "paid"
          ? "Paid"
          : latestBilling?.status === "disputed"
            ? "Needs review"
            : latestBilling
              ? "Recorded"
              : "Not created",
      detail:
        latestBilling?.status === "paid"
          ? "Owner marked the final charge paid outside TurnFlow."
          : latestBilling?.status === "disputed"
            ? "Owner flagged the billing record for follow-up before treating it as settled."
            : latestBilling
              ? "Final charge is recorded for maintenance history; TurnFlow does not process payment."
              : "Approving vendor closeout creates the billing record automatically.",
      tone:
        latestBilling?.status === "paid"
          ? "ready"
          : latestBilling?.status === "disputed"
            ? "attention"
            : "progress",
      cta: "Review billing",
    },
    {
      id: "comments",
      label: "Updates",
      href: "#comments",
      state: commentCount > 0 ? "Active" : "Quiet",
      detail:
        commentCount > 0
          ? `${pluralize(commentCount, "update")} in the shared owner, vendor, or helper thread.`
          : "Add updates when scope, access, timing, proof, or owner decisions need context.",
      tone: commentCount > 0 ? "ready" : "progress",
      cta: "Review updates",
    },
    {
      id: "decision-log",
      label: "History",
      href: "#decision-log",
      state: logCount > 0 ? `${logCount} logged` : "Not yet",
      detail:
        logCount > 0
          ? `${pluralize(logCount, "decision")} preserved for status, bids, access, work, closeout, or billing.`
          : "Decision history will preserve important changes as this repair moves forward.",
      tone: logCount > 0 ? "ready" : "progress",
      cta: "Review history",
    },
  ];
}
