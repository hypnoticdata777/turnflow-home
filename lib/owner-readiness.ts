export type OwnerReadinessRequest = {
  id?: string;
  propertyId?: string | null;
  status?: string;
  finalCost?: string | number | null;
  photos?: Array<unknown>;
  assignedVendorId?: string | null;
  collaboratorId?: string | null;
  pendingVendorInviteId?: string | null;
  pendingCollaboratorInviteId?: string | null;
};

export type OwnerReadinessInput = {
  properties: Array<unknown>;
  requests: OwnerReadinessRequest[];
  invites: Array<unknown>;
  vaultDocuments: Array<unknown>;
  reminders: Array<unknown>;
};

export type OwnerSetupStep = {
  title: string;
  detail: string;
  complete: boolean;
  href: string;
  cta: string;
};

export type OwnerReadinessItem = {
  label: string;
  detail: string;
  complete: boolean;
};

export type OwnerSetupSummary = {
  headline: string;
  detail: string;
  tone: "empty" | "in_progress" | "ready";
};

export type OwnerDashboardGuidance = OwnerSetupSummary & {
  eyebrow: string;
  primaryHref: string;
  primaryCta: string;
  secondaryHref: string;
  secondaryCta: string;
};

export type OwnerValueMetric = {
  label: string;
  value: number;
  detail: string;
  tone: "attention" | "progress" | "ready" | "empty";
  href: string;
  cta: string;
};

export type OwnerCareMetric = {
  label: string;
  value: number;
  detail: string;
  tone: "attention" | "progress" | "ready" | "empty";
};

export type OwnerRequestCardSignal = {
  label: string;
  detail: string;
  tone: "attention" | "progress" | "ready";
  href: string;
  cta: string;
};

export type OwnerCareProperty = {
  id?: string | null;
};

export type OwnerCareVaultDocument = {
  propertyId?: string | null;
  requestId?: string | null;
  category?: string | null;
};

export type OwnerCareReminder = {
  propertyId?: string | null;
  nextDueAt?: string | Date | null;
  intervalDays?: number | null;
};

export type OwnerPropertyCareSignal = {
  label: string;
  detail: string;
  tone: "attention" | "progress" | "ready";
  href: string;
  cta: string;
};

function hasAfterPhoto(request: OwnerReadinessRequest) {
  return (request.photos ?? []).some((photo) => {
    if (typeof photo !== "object" || photo === null) return false;
    return "type" in photo && photo.type === "after";
  });
}

function hasFinalCost(request: OwnerReadinessRequest) {
  return request.finalCost !== undefined && request.finalCost !== null && request.finalCost !== "";
}

function plural(count: number, singular: string, pluralLabel = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralLabel}`;
}

function isAre(count: number) {
  return count === 1 ? "is" : "are";
}

function needNeeds(count: number) {
  return count === 1 ? "needs" : "need";
}

function joinSentenceParts(parts: string[]) {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}`;
}

function requestHelperCount(request: OwnerReadinessRequest) {
  return [
    request.assignedVendorId,
    request.collaboratorId,
    request.pendingVendorInviteId,
    request.pendingCollaboratorInviteId,
  ].filter(Boolean).length;
}

export function ownerReadinessFlags(input: OwnerReadinessInput) {
  return {
    hasProperty: input.properties.length > 0,
    hasRequest: input.requests.length > 0,
    hasEvidence: input.requests.some((request) => (request.photos ?? []).length > 0),
    hasHelper:
      input.invites.length > 0 ||
      input.requests.some((request) => request.assignedVendorId || request.collaboratorId),
    hasVaultDoc: input.vaultDocuments.length > 0,
    hasReminder: input.reminders.length > 0,
    sharedRequestCount: input.requests.filter(
      (request) =>
        request.assignedVendorId ||
        request.collaboratorId ||
        request.pendingVendorInviteId ||
        request.pendingCollaboratorInviteId
    ).length,
  };
}

export function ownerValueMetrics(input: OwnerReadinessInput): OwnerValueMetric[] {
  const needsReviewCount = input.requests.filter(
    (request) => request.status === "Needs Review"
  ).length;
  const needsQuoteCount = input.requests.filter(
    (request) => request.status === "Needs Quote"
  ).length;
  const decisionCount = needsReviewCount + needsQuoteCount;
  const pendingInviteCount = input.invites.length;
  const proofProtectedCount = input.requests.filter(
    (request) => hasAfterPhoto(request) && hasFinalCost(request)
  ).length;
  const evidenceCount = input.requests.filter(
    (request) => (request.photos ?? []).length > 0
  ).length;
  const sharedRequestCount = ownerReadinessFlags(input).sharedRequestCount;
  const savedHistoryCount = input.vaultDocuments.length;
  const reminderCount = input.reminders.length;
  const requestCount = input.requests.length;
  const decisionParts = [
    needsReviewCount > 0
      ? `${plural(needsReviewCount, "request")} ${needNeeds(needsReviewCount)} review`
      : null,
    needsQuoteCount > 0
      ? `${plural(needsQuoteCount, "request")} ${needNeeds(needsQuoteCount)} quotes`
      : null,
    pendingInviteCount > 0
      ? `${plural(pendingInviteCount, "invite")} ${isAre(pendingInviteCount)} pending`
      : null,
  ].filter((part): part is string => Boolean(part));

  return [
    {
      label: "Decisions to make",
      value: decisionCount,
      detail:
        decisionCount > 0
          ? `${joinSentenceParts(decisionParts)}.`
        : pendingInviteCount > 0
            ? `${plural(pendingInviteCount, "invite")} ${isAre(pendingInviteCount)} pending, but no request is waiting on a quote or review.`
            : "No request is waiting on a quote or review right now.",
      tone: decisionCount > 0 ? "attention" : pendingInviteCount > 0 ? "progress" : "ready",
      href:
        needsReviewCount > 0
          ? "/owner/dashboard?status=Needs%20Review"
          : needsQuoteCount > 0
            ? "/owner/dashboard?status=Needs%20Quote"
            : "/owner/dashboard",
      cta: decisionCount > 0 ? "Review decisions" : "View requests",
    },
    {
      label: "Proof-backed records",
      value: proofProtectedCount,
      detail:
        requestCount > 0
          ? `${proofProtectedCount} of ${requestCount} requests have final cost and after photo proof. ${evidenceCount} have at least one proof item.`
          : "Create a request and add proof so the home has a record before work starts.",
      tone:
        proofProtectedCount > 0
          ? "ready"
          : evidenceCount > 0
            ? "progress"
            : requestCount > 0
              ? "attention"
              : "empty",
      href: input.requests[0]?.id ? `/owner/requests/${input.requests[0].id}#photos` : "/owner/requests/new",
      cta: proofProtectedCount > 0 ? "Review proof" : "Add proof",
    },
    {
      label: "Shared help",
      value: sharedRequestCount,
      detail:
        sharedRequestCount > 0
          ? `${plural(sharedRequestCount, "request")} ${sharedRequestCount === 1 ? "includes" : "include"} scoped vendor or helper access.`
          : "Invite a vendor or trusted helper only when a repair needs outside help.",
      tone: sharedRequestCount > 0 ? "ready" : requestCount > 0 ? "progress" : "empty",
      href: input.requests[0]?.id ? `/owner/requests/${input.requests[0].id}#sharing` : "/owner/requests/new",
      cta: sharedRequestCount > 0 ? "Review access" : "Invite help",
    },
    {
      label: "Preventive care",
      value: reminderCount,
      detail:
        reminderCount > 0
          ? `${plural(reminderCount, "reminder")} ${isAre(reminderCount)} keeping repeat maintenance from being forgotten. ${plural(savedHistoryCount, "document")} ${isAre(savedHistoryCount)} saved in the vault.`
          : savedHistoryCount > 0
            ? `${plural(savedHistoryCount, "document")} ${isAre(savedHistoryCount)} saved, but no recurring reminders are scheduled yet.`
            : "Add reminders and saved documents so the record helps after the repair is done.",
      tone: reminderCount > 0 ? "ready" : savedHistoryCount > 0 ? "progress" : "empty",
      href: reminderCount > 0 ? "/owner/calendar" : "/owner/onboarding",
      cta: reminderCount > 0 ? "Review reminders" : "Add reminder",
    },
  ];
}

export function ownerVaultValueMetrics({
  properties,
  documents,
  selectedPropertyId,
}: {
  properties: OwnerCareProperty[];
  documents: OwnerCareVaultDocument[];
  selectedPropertyId?: string | null;
}): OwnerCareMetric[] {
  const selectedDocuments = selectedPropertyId
    ? documents.filter((document) => document.propertyId === selectedPropertyId)
    : documents;
  const savedRecordCount = selectedDocuments.length;
  const coveredPropertyCount = new Set(
    documents.map((document) => document.propertyId).filter(Boolean)
  ).size;
  const linkedDocumentCount = selectedDocuments.filter((document) => document.requestId).length;
  const savedCategories = Array.from(
    new Set(selectedDocuments.map((document) => document.category).filter(Boolean))
  ).sort();

  return [
    {
      label: "Saved records",
      value: savedRecordCount,
      detail:
        savedRecordCount > 0
          ? `${plural(savedRecordCount, "document")} saved for this property so warranties, invoices, manuals, and inspections stay findable.`
          : "Add the first document so future repairs start with the home's real history.",
      tone: savedRecordCount > 0 ? "ready" : "empty",
    },
    {
      label: "Properties covered",
      value: coveredPropertyCount,
      detail:
        properties.length > 0
          ? `${coveredPropertyCount} of ${properties.length} properties have at least one saved document.`
          : "Add a property before building a homeowner document record.",
      tone:
        properties.length === 0
          ? "empty"
          : coveredPropertyCount === properties.length
            ? "ready"
            : coveredPropertyCount > 0
              ? "progress"
              : "empty",
    },
    {
      label: "Repair-linked docs",
      value: linkedDocumentCount,
      detail:
        linkedDocumentCount > 0
          ? `${plural(linkedDocumentCount, "document")} can be traced back to a repair request.`
          : savedRecordCount > 0
            ? "Documents are saved; link future receipts or invoices to the repair they came from."
            : "Request-linked receipts and invoices will make the vault more useful during disputes or resale.",
      tone:
        linkedDocumentCount > 0 ? "ready" : savedRecordCount > 0 ? "progress" : "empty",
    },
    {
      label: "Categories saved",
      value: savedCategories.length,
      detail:
        savedCategories.length > 0
          ? `Saved categories: ${savedCategories.join(", ")}.`
          : "Start with the document type a homeowner is most likely to hunt for later.",
      tone:
        savedCategories.length >= 3
          ? "ready"
          : savedCategories.length > 0
            ? "progress"
            : "empty",
    },
  ];
}

export function ownerCalendarValueMetrics(
  {
    properties,
    reminders,
  }: {
    properties: OwnerCareProperty[];
    reminders: OwnerCareReminder[];
  },
  now = new Date()
): OwnerCareMetric[] {
  const nowMillis = now.getTime();
  const dueSoonLimitMillis = nowMillis + 14 * 24 * 60 * 60 * 1000;
  const dueReminders = reminders
    .map((reminder) => ({
      ...reminder,
      dueMillis: reminder.nextDueAt ? new Date(reminder.nextDueAt).getTime() : Number.NaN,
    }))
    .filter((reminder) => Number.isFinite(reminder.dueMillis));
  const overdueCount = dueReminders.filter((reminder) => reminder.dueMillis < nowMillis).length;
  const dueSoonCount = dueReminders.filter(
    (reminder) => reminder.dueMillis >= nowMillis && reminder.dueMillis <= dueSoonLimitMillis
  ).length;
  const coveredPropertyCount = new Set(
    reminders.map((reminder) => reminder.propertyId).filter(Boolean)
  ).size;
  const cadenceCount = new Set(reminders.map((reminder) => reminder.intervalDays).filter(Boolean))
    .size;

  return [
    {
      label: "Overdue care",
      value: overdueCount,
      detail:
        overdueCount > 0
          ? `${plural(overdueCount, "routine")} should be handled before it turns into a repair.`
          : reminders.length > 0
            ? "No recurring maintenance is overdue right now."
            : "Add one recurring task so the calendar can watch for overdue care.",
      tone: overdueCount > 0 ? "attention" : reminders.length > 0 ? "ready" : "empty",
    },
    {
      label: "Due soon",
      value: dueSoonCount,
      detail:
        dueSoonCount > 0
          ? `${plural(dueSoonCount, "routine")} ${isAre(dueSoonCount)} due in the next 14 days.`
          : reminders.length > 0
            ? "No saved routine is due in the next 14 days."
            : "Upcoming work will appear here once reminders are scheduled.",
      tone: dueSoonCount > 0 ? "progress" : reminders.length > 0 ? "ready" : "empty",
    },
    {
      label: "Properties covered",
      value: coveredPropertyCount,
      detail:
        properties.length > 0
          ? `${coveredPropertyCount} of ${properties.length} properties have at least one recurring reminder.`
          : "Add a property before creating a maintenance calendar.",
      tone:
        properties.length === 0
          ? "empty"
          : coveredPropertyCount === properties.length
            ? "ready"
            : coveredPropertyCount > 0
              ? "progress"
              : "empty",
    },
    {
      label: "Recurring routines",
      value: reminders.length,
      detail:
        reminders.length > 0
          ? `${plural(reminders.length, "reminder")} saved across ${plural(cadenceCount, "cadence")}.`
          : "Start with one repeatable task like HVAC filters, gutters, or water heater care.",
      tone: reminders.length > 0 ? "ready" : "empty",
    },
  ];
}

export function ownerPropertyCareSignal({
  propertyId,
  requests,
  documents,
  reminders,
}: {
  propertyId: string;
  requests: OwnerReadinessRequest[];
  documents: OwnerCareVaultDocument[];
  reminders: OwnerCareReminder[];
}): OwnerPropertyCareSignal {
  const propertyRequests = requests.filter((request) => request.propertyId === propertyId);
  const propertyDocuments = documents.filter((document) => document.propertyId === propertyId);
  const propertyReminders = reminders.filter((reminder) => reminder.propertyId === propertyId);
  const activeRequests = propertyRequests.filter(
    (request) => request.status !== "Complete" && request.status !== "Archived"
  );
  const proofBackedRequests = propertyRequests.filter(
    (request) => hasAfterPhoto(request) && hasFinalCost(request)
  );
  const selectedVaultHref = `/owner/vault?propertyId=${propertyId}`;

  if (propertyRequests.length === 0) {
    return {
      label: "Needs first repair record",
      detail:
        propertyDocuments.length > 0 || propertyReminders.length > 0
          ? "The property has history or reminders. Log the next repair so issues, proof, and costs have one place to land."
          : "Start this property with one real maintenance issue so TurnFlow can build a useful home record.",
      tone: "attention",
      href: "/owner/requests/new",
      cta: "Log first issue",
    };
  }

  if (activeRequests.length > 0) {
    return {
      label: "Work in motion",
      detail: `${plural(activeRequests.length, "request")} ${isAre(
        activeRequests.length
      )} active for this property. Keep status, cost, and proof current as work moves.`,
      tone: "attention",
      href: "/owner/dashboard",
      cta: "Review requests",
    };
  }

  if (propertyDocuments.length === 0) {
    return {
      label: "History gap",
      detail:
        "Requests exist, but the property vault has no saved documents yet. Add the warranty, receipt, manual, or invoice you would want later.",
      tone: "progress",
      href: selectedVaultHref,
      cta: "Add document",
    };
  }

  if (propertyReminders.length === 0) {
    return {
      label: "Prevention gap",
      detail:
        "The property has repair history and saved documents. Add one recurring care task so maintenance is easier to stay ahead of.",
      tone: "progress",
      href: "/owner/calendar",
      cta: "Add reminder",
    };
  }

  return {
    label: "Care record ready",
    detail: `${plural(propertyRequests.length, "request")} logged, ${plural(
      proofBackedRequests.length,
      "proof-backed record"
    )}, ${plural(propertyDocuments.length, "vault document")}, and ${plural(
      propertyReminders.length,
      "reminder"
    )} saved for this property.`,
    tone: "ready",
    href: selectedVaultHref,
    cta: "Review history",
  };
}

export function ownerRequestCardSignal(
  request: OwnerReadinessRequest
): OwnerRequestCardSignal {
  const requestHref = request.id ? `/owner/requests/${request.id}` : "/owner/dashboard";
  const photos = request.photos ?? [];
  const hasProof = photos.length > 0;
  const proofReady = hasAfterPhoto(request) && hasFinalCost(request);
  const helpers = requestHelperCount(request);

  if (request.status === "Needs Review") {
    return {
      label: "Decision needed",
      detail: proofReady
        ? "Proof and final cost are ready. Review the record before closing this out."
        : "Review the record before closing this out; the proof packet still has gaps.",
      tone: "attention",
      href: requestHref,
      cta: "Review request",
    };
  }

  if (request.status === "Needs Quote") {
    return {
      label: "Quote needed",
      detail: "Add a quote or estimate so the owner decision has cost context.",
      tone: "attention",
      href: `${requestHref}#quotes`,
      cta: "Add quote",
    };
  }

  if (request.status === "Complete" && !proofReady) {
    return {
      label: "Closed with proof gap",
      detail: "This is complete, but final cost or after-photo proof is still missing.",
      tone: "attention",
      href: `${requestHref}#photos`,
      cta: "Fix proof",
    };
  }

  if (proofReady) {
    return {
      label: "Proof-backed",
      detail: "Final cost and after-photo proof are saved for this repair.",
      tone: "ready",
      href: `${requestHref}#decision-log`,
      cta: "Review history",
    };
  }

  if (!hasProof) {
    return {
      label: "Needs first proof",
      detail: "Add a photo or receipt so this repair has a useful record.",
      tone: "attention",
      href: `${requestHref}#photos`,
      cta: "Add proof",
    };
  }

  if (!hasFinalCost(request)) {
    return {
      label: "Needs cost context",
      detail: "Proof has started. Add estimated, quoted, or final cost next.",
      tone: "progress",
      href: `${requestHref}#cost`,
      cta: "Add cost",
    };
  }

  if (helpers === 0) {
    return {
      label: "Owner-only record",
      detail: "Add scoped help if a vendor or trusted helper needs to see this repair.",
      tone: "progress",
      href: `${requestHref}#sharing`,
      cta: "Invite help",
    };
  }

  return {
    label: "In motion",
    detail: "Cost, proof, and helper context are started. Keep updates current.",
    tone: "progress",
    href: requestHref,
    cta: "Open record",
  };
}

export function ownerSetupSteps(
  input: OwnerReadinessInput,
  firstRequestId?: string
): OwnerSetupStep[] {
  const flags = ownerReadinessFlags(input);
  const requestHref = firstRequestId ? `/owner/requests/${firstRequestId}` : "/owner/requests/new";

  return [
    {
      title: "Create your first property",
      detail: "Anchor every repair, receipt, and reminder to the home it belongs to.",
      complete: flags.hasProperty,
      href: "/owner/properties",
      cta: flags.hasProperty ? "Review properties" : "Add property",
    },
    {
      title: "Log one active maintenance issue",
      detail: "Capture the problem while the details are still fresh.",
      complete: flags.hasRequest,
      href: "/owner/requests/new",
      cta: flags.hasRequest ? "Review requests" : "Create request",
    },
    {
      title: "Attach proof or context",
      detail: "Add a photo, receipt, or note that would help another person understand the work.",
      complete: flags.hasEvidence,
      href: requestHref,
      cta: flags.hasEvidence ? "Review evidence" : "Add evidence",
    },
    {
      title: "Bring in the right person",
      detail: "Invite a vendor or helper when the repair needs someone outside the household.",
      complete: flags.hasHelper,
      href: requestHref,
      cta: flags.hasHelper ? "Review helpers" : "Open request",
    },
    {
      title: "Preserve the repair history",
      detail: "Store one useful document so the record survives beyond the job.",
      complete: flags.hasVaultDoc,
      href: "/owner/vault",
      cta: flags.hasVaultDoc ? "Review vault" : "Add document",
    },
    {
      title: "Set one recurring reminder",
      detail: "Turn an easy-to-forget task into a scheduled homeowner routine.",
      complete: flags.hasReminder,
      href: "/owner/calendar",
      cta: flags.hasReminder ? "Review reminders" : "Add reminder",
    },
  ];
}

export function ownerSetupProgress(steps: OwnerSetupStep[]) {
  const completedCount = steps.filter((step) => step.complete).length;
  const progress = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;
  return { completedCount, totalCount: steps.length, progress };
}

export function ownerNextSetupStep(steps: OwnerSetupStep[]) {
  return steps.find((step) => !step.complete) ?? null;
}

export function ownerSetupSummary(steps: OwnerSetupStep[]): OwnerSetupSummary {
  const { completedCount, totalCount } = ownerSetupProgress(steps);
  const nextStep = ownerNextSetupStep(steps);

  if (completedCount === 0 && nextStep) {
    return {
      headline: "Start with the home itself.",
      detail:
        "Add the property first so every request, photo, receipt, and reminder has a clear place to live.",
      tone: "empty",
    };
  }

  if (!nextStep) {
    return {
      headline: "This owner workspace is ready for a serious walkthrough.",
      detail:
        "The core record now includes property context, a request, evidence, shared help, saved history, and a reminder.",
      tone: "ready",
    };
  }

  return {
    headline: `${completedCount} of ${totalCount} launch-readiness steps are complete.`,
    detail: `Next best action: ${nextStep.cta.toLowerCase()} so the repair record keeps becoming more useful.`,
    tone: "in_progress",
  };
}

export function ownerDashboardGuidance(steps: OwnerSetupStep[]): OwnerDashboardGuidance {
  const summary = ownerSetupSummary(steps);
  const nextStep = ownerNextSetupStep(steps);

  if (!nextStep) {
    return {
      eyebrow: "Workspace ready",
      headline: "Your repair record is ready for day-to-day use.",
      detail:
        "Keep logging new maintenance work as it comes up, and review sharing whenever someone else needs scoped access.",
      tone: "ready",
      primaryHref: "/owner/requests/new",
      primaryCta: "Log another request",
      secondaryHref: "/owner/account",
      secondaryCta: "Review sharing",
    };
  }

  return {
    ...summary,
    eyebrow: summary.tone === "empty" ? "First repair record" : "Owner workspace progress",
    primaryHref: nextStep.href,
    primaryCta: nextStep.cta,
    secondaryHref: "/owner/onboarding",
    secondaryCta: "Open setup guide",
  };
}

export function ownerAccountReadinessItems(
  input: OwnerReadinessInput,
  ownerEmail: string | null | undefined
): OwnerReadinessItem[] {
  const requestsWithEvidence = input.requests.filter(
    (request) => (request.photos ?? []).length > 0
  );

  return [
    {
      label: "Owner account",
      detail: ownerEmail || "Signed-in owner profile",
      complete: true,
    },
    {
      label: "Property record",
      detail: `${input.properties.length} ${input.properties.length === 1 ? "property" : "properties"}`,
      complete: input.properties.length > 0,
    },
    {
      label: "Maintenance history",
      detail: `${input.requests.length} ${input.requests.length === 1 ? "request" : "requests"} logged`,
      complete: input.requests.length > 0,
    },
    {
      label: "Evidence trail",
      detail: `${requestsWithEvidence.length} ${requestsWithEvidence.length === 1 ? "request has" : "requests have"} photos or receipts`,
      complete: requestsWithEvidence.length > 0,
    },
    {
      label: "Saved documents",
      detail: `${input.vaultDocuments.length} ${input.vaultDocuments.length === 1 ? "vault item" : "vault items"}`,
      complete: input.vaultDocuments.length > 0,
    },
    {
      label: "Recurring care",
      detail: `${input.reminders.length} ${input.reminders.length === 1 ? "reminder" : "reminders"}`,
      complete: input.reminders.length > 0,
    },
  ];
}
