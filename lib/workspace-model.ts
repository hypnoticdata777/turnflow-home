export const WORKSPACE_PLAN_LABELS = {
  poc: "POC",
  homeowner: "Homeowner",
  team: "Team",
  enterprise: "Enterprise",
} as const;

export const BILLING_ACCOUNT_STATUS_LABELS = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past due",
  paused: "Paused",
  canceled: "Canceled",
} as const;

export type WorkspacePlan = keyof typeof WORKSPACE_PLAN_LABELS;
export type BillingAccountStatus = keyof typeof BILLING_ACCOUNT_STATUS_LABELS;
export type WorkspaceSignalTone = "ready" | "progress" | "attention" | "empty";

export type WorkspaceArchitectureInput = {
  workspace?: {
    id?: string | null;
    name?: string | null;
    kind?: string | null;
  } | null;
  memberships?: Array<{
    role?: string | null;
    status?: string | null;
  }>;
  billingAccount?: {
    plan?: string | null;
    status?: string | null;
    billingEmail?: string | null;
    externalCustomerId?: string | null;
    externalSubscriptionId?: string | null;
  } | null;
  records?: {
    properties?: number;
    workspaceProperties?: number;
    requests?: number;
    workspaceRequests?: number;
    billingRecords?: number;
    workspaceBillingRecords?: number;
  };
};

export type WorkspaceArchitectureFlags = {
  hasWorkspace: boolean;
  hasOwnerMembership: boolean;
  hasBillingAccount: boolean;
  hasPaidBillingIntegration: boolean;
  propertyScopeReady: boolean;
  requestScopeReady: boolean;
  billingScopeReady: boolean;
  foundationReady: boolean;
};

export type WorkspaceArchitectureCard = {
  label: string;
  value: string | number;
  detail: string;
  tone: WorkspaceSignalTone;
};

function count(value: number | undefined) {
  return Math.max(0, value ?? 0);
}

function scopedCount(total: number | undefined, scoped: number | undefined) {
  const safeTotal = count(total);
  return Math.min(safeTotal, count(scoped));
}

function allExistingRecordsAreScoped(total: number | undefined, scoped: number | undefined) {
  const safeTotal = count(total);
  return safeTotal === 0 || scopedCount(total, scoped) === safeTotal;
}

function planLabel(plan: string | null | undefined) {
  return WORKSPACE_PLAN_LABELS[plan as WorkspacePlan] ?? "Unselected";
}

function billingStatusLabel(status: string | null | undefined) {
  return BILLING_ACCOUNT_STATUS_LABELS[status as BillingAccountStatus] ?? "Not configured";
}

export function workspaceArchitectureFlags(
  input: WorkspaceArchitectureInput
): WorkspaceArchitectureFlags {
  const hasWorkspace = Boolean(input.workspace?.id);
  const memberships = input.memberships ?? [];
  const hasOwnerMembership = memberships.some(
    (membership) => membership.role === "owner" && membership.status === "active"
  );
  const hasBillingAccount = Boolean(input.billingAccount);
  const hasPaidBillingIntegration = Boolean(
    input.billingAccount?.externalCustomerId || input.billingAccount?.externalSubscriptionId
  );
  const records = input.records ?? {};
  const propertyScopeReady = allExistingRecordsAreScoped(
    records.properties,
    records.workspaceProperties
  );
  const requestScopeReady = allExistingRecordsAreScoped(
    records.requests,
    records.workspaceRequests
  );
  const billingScopeReady = allExistingRecordsAreScoped(
    records.billingRecords,
    records.workspaceBillingRecords
  );

  return {
    hasWorkspace,
    hasOwnerMembership,
    hasBillingAccount,
    hasPaidBillingIntegration,
    propertyScopeReady,
    requestScopeReady,
    billingScopeReady,
    foundationReady:
      hasWorkspace &&
      hasOwnerMembership &&
      hasBillingAccount &&
      propertyScopeReady &&
      requestScopeReady &&
      billingScopeReady,
  };
}

export function workspaceArchitectureSummary(input: WorkspaceArchitectureInput) {
  const flags = workspaceArchitectureFlags(input);

  if (!flags.hasWorkspace || !flags.hasOwnerMembership) {
    return {
      headline: "Workspace foundation needs setup.",
      detail:
        "Create the owner workspace and active owner membership before adding team seats or paid plans.",
      tone: "attention" as WorkspaceSignalTone,
    };
  }

  if (!flags.hasBillingAccount) {
    return {
      headline: "Workspace exists; billing account is next.",
      detail:
        "The account can hold properties and requests, but plan state is not tracked yet.",
      tone: "progress" as WorkspaceSignalTone,
    };
  }

  if (!flags.propertyScopeReady || !flags.requestScopeReady || !flags.billingScopeReady) {
    return {
      headline: "Workspace foundation exists; older records need scope.",
      detail:
        "New records can attach to the workspace. Backfill existing properties, requests, and billing records before team access expands.",
      tone: "progress" as WorkspaceSignalTone,
    };
  }

  if (!flags.hasPaidBillingIntegration) {
    return {
      headline: "Workspace model is ready for payment wiring.",
      detail:
        "The owner has a workspace, active ownership, scoped records, and a tracked plan. Payment provider IDs are intentionally still empty.",
      tone: "ready" as WorkspaceSignalTone,
    };
  }

  return {
    headline: "Workspace and billing foundation are live.",
    detail:
      "This account has workspace ownership, scoped records, billing state, and external payment references.",
    tone: "ready" as WorkspaceSignalTone,
  };
}

export function workspaceArchitectureCards(
  input: WorkspaceArchitectureInput
): WorkspaceArchitectureCard[] {
  const flags = workspaceArchitectureFlags(input);
  const records = input.records ?? {};
  const totalProperties = count(records.properties);
  const workspaceProperties = scopedCount(records.properties, records.workspaceProperties);
  const totalRequests = count(records.requests);
  const workspaceRequests = scopedCount(records.requests, records.workspaceRequests);
  const totalBillingRecords = count(records.billingRecords);
  const workspaceBillingRecords = scopedCount(
    records.billingRecords,
    records.workspaceBillingRecords
  );

  return [
    {
      label: "Workspace",
      value: input.workspace?.name || "Not created",
      detail: flags.hasOwnerMembership
        ? "Active owner membership is in place for future team and household seats."
        : "No active owner membership is recorded yet.",
      tone: flags.hasWorkspace && flags.hasOwnerMembership ? "ready" : "attention",
    },
    {
      label: "Record scope",
      value: `${workspaceProperties}/${totalProperties}`,
      detail:
        totalProperties === 0
          ? "No properties exist yet; the next property can start in the workspace."
          : `${workspaceProperties} of ${totalProperties} properties are attached to the workspace.`,
      tone: flags.propertyScopeReady ? "ready" : "attention",
    },
    {
      label: "Request scope",
      value: `${workspaceRequests}/${totalRequests}`,
      detail:
        totalRequests === 0
          ? "No requests exist yet; the next request can inherit the workspace."
          : `${workspaceRequests} of ${totalRequests} requests are attached to the workspace.`,
      tone: flags.requestScopeReady ? "ready" : "attention",
    },
    {
      label: "Plan state",
      value: planLabel(input.billingAccount?.plan),
      detail: `${billingStatusLabel(input.billingAccount?.status)} billing account; ${
        flags.hasPaidBillingIntegration
          ? "payment provider references are stored."
          : "payment provider wiring is still intentionally empty."
      }`,
      tone: flags.hasBillingAccount ? "progress" : "attention",
    },
    {
      label: "Billing records",
      value: `${workspaceBillingRecords}/${totalBillingRecords}`,
      detail:
        totalBillingRecords === 0
          ? "No billing records exist yet; approved closeout records can inherit the workspace."
          : `${workspaceBillingRecords} of ${totalBillingRecords} billing records are attached to the workspace.`,
      tone: flags.billingScopeReady ? "ready" : "attention",
    },
  ];
}
