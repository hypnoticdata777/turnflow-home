export type OwnerReadinessRequest = {
  id?: string;
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
