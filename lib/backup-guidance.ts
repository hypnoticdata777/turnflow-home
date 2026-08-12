export type BackupPreview = {
  valid: boolean;
  propertyCount: number;
  requestCount: number;
  billingRecordCount: number;
  errors: string[];
  warnings: string[];
};

export function backupPreview(data: unknown): BackupPreview {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== "object") {
    return {
      valid: false,
      propertyCount: 0,
      requestCount: 0,
      billingRecordCount: 0,
      errors: ["Backup file must be a JSON object."],
      warnings,
    };
  }

  const candidate = data as {
    properties?: unknown;
    requests?: unknown;
    billingRecords?: unknown;
  };
  const properties = Array.isArray(candidate.properties) ? candidate.properties : null;
  const requests = Array.isArray(candidate.requests) ? candidate.requests : null;
  const billingRecords = Array.isArray(candidate.billingRecords)
    ? candidate.billingRecords
    : null;

  if (!properties) errors.push('Missing "properties" array.');
  if (!requests) errors.push('Missing "requests" array.');
  if (!billingRecords) {
    warnings.push(
      'No "billingRecords" array found. This may be an older backup; properties and requests can still restore.'
    );
  }

  return {
    valid: errors.length === 0,
    propertyCount: properties?.length ?? 0,
    requestCount: requests?.length ?? 0,
    billingRecordCount: billingRecords?.length ?? 0,
    errors,
    warnings,
  };
}

export function backupScopeItems(preview: BackupPreview | null) {
  return [
    {
      label: "Properties",
      value: preview ? String(preview.propertyCount) : "Included",
      detail: "Addresses, units, and nicknames owned by the signed-in homeowner.",
    },
    {
      label: "Requests",
      value: preview ? String(preview.requestCount) : "Included",
      detail: "Core maintenance records, status, cost fields, access notes, and context.",
    },
    {
      label: "Billing",
      value: preview ? String(preview.billingRecordCount) : "Included",
      detail: "Final charge history linked back to restored requests when available.",
    },
  ];
}
