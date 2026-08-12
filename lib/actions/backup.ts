"use server";

import { db } from "@/lib/db";
import { billingRecords, properties, requests } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";
import { REQUEST_CATEGORIES, REQUEST_URGENCIES, REQUEST_STATUSES } from "@/lib/utils";
import { BILLING_RECORD_STATUSES, type BillingRecordStatus } from "@/lib/billing-records";

/** Portable owner backup data for JSON restore and CSV history export. */
export async function getBackupDataAction() {
  const session = await requireRole("owner");

  const [ownerProperties, ownerRequests, ownerBillingRecords] = await Promise.all([
    db.query.properties.findMany({
      where: (p, { eq }) => eq(p.ownerId, session.user.id),
      columns: { id: true, address: true, unit: true, nickname: true },
    }),
    db.query.requests.findMany({
      where: (r, { eq }) => eq(r.ownerId, session.user.id),
      columns: {
        id: true,
        propertyId: true,
        title: true,
        category: true,
        urgency: true,
        location: true,
        contactMethod: true,
        accessInstructions: true,
        notes: true,
        status: true,
        estimatedCost: true,
        quotedCost: true,
        finalCost: true,
        createdAt: true,
      },
    }),
    db.query.billingRecords.findMany({
      where: (record, { eq }) => eq(record.ownerId, session.user.id),
      columns: {
        id: true,
        requestId: true,
        amount: true,
        status: true,
        invoiceReference: true,
        notes: true,
        recordedAt: true,
        paidAt: true,
      },
    }),
  ]);

  return {
    properties: ownerProperties,
    requests: ownerRequests,
    billingRecords: ownerBillingRecords,
  };
}

export type BackupProperty = {
  id?: string;
  address?: string;
  unit?: string | null;
  nickname?: string | null;
};
export type BackupRequest = {
  id?: string;
  propertyId?: string;
  title?: string;
  category?: string;
  urgency?: string;
  location?: string | null;
  contactMethod?: string | null;
  accessInstructions?: string | null;
  notes?: string | null;
  status?: string;
  estimatedCost?: string | null;
  quotedCost?: string | null;
  finalCost?: string | null;
};
export type BackupBillingRecord = {
  requestId?: string;
  amount?: string | number | null;
  status?: string | null;
  invoiceReference?: string | null;
  notes?: string | null;
  recordedAt?: string | Date | null;
  paidAt?: string | Date | null;
};

export type RestoreResult = {
  importedProperties: number;
  importedRequests: number;
  importedBillingRecords: number;
  errors: string[];
};

/** Imports backup records as new rows owned by the signed-in owner; existing records are never overwritten. */
export async function restoreBackupAction(data: {
  properties: BackupProperty[];
  requests: BackupRequest[];
  billingRecords?: BackupBillingRecord[];
}): Promise<RestoreResult> {
  const session = await requireRole("owner");

  const propertyIdMap: Record<string, string> = {};
  const requestIdMap: Record<string, string> = {};
  let importedProperties = 0;
  let importedRequests = 0;
  let importedBillingRecords = 0;
  const errors: string[] = [];

  for (const property of data.properties) {
    const address = String(property.address || "").trim();
    if (!address) {
      errors.push(`property "${property.address || "(no address)"}"`);
      continue;
    }
    try {
      const [created] = await db
        .insert(properties)
        .values({
          ownerId: session.user.id,
          address,
          unit: property.unit || null,
          nickname: property.nickname || null,
        })
        .returning({ id: properties.id });
      if (property.id) propertyIdMap[property.id] = created.id;
      importedProperties++;
    } catch (err) {
      console.error("Failed to import property:", property, err);
      errors.push(`property "${property.address || "(no address)"}"`);
    }
  }

  for (const req of data.requests) {
    const newPropertyId = req.propertyId ? propertyIdMap[req.propertyId] : undefined;
    const title = String(req.title || "").trim();
    const category = String(req.category || "");
    const urgency = String(req.urgency || "");
    const status = String(req.status || "Draft");

    if (
      !newPropertyId ||
      !title ||
      !(REQUEST_CATEGORIES as readonly string[]).includes(category) ||
      !(REQUEST_URGENCIES as readonly string[]).includes(urgency)
    ) {
      errors.push(`request "${req.title || "(untitled)"}"`);
      continue;
    }

    try {
      const [created] = await db.insert(requests).values({
        ownerId: session.user.id,
        propertyId: newPropertyId,
        title,
        category,
        urgency,
        location: req.location || null,
        contactMethod: req.contactMethod || null,
        accessInstructions: req.accessInstructions || null,
        notes: req.notes || null,
        status: (REQUEST_STATUSES as readonly string[]).includes(status)
          ? (status as (typeof REQUEST_STATUSES)[number])
          : "Draft",
        estimatedCost: req.estimatedCost || null,
        quotedCost: req.quotedCost || null,
        finalCost: req.finalCost || null,
      }).returning({ id: requests.id });
      if (req.id) requestIdMap[req.id] = created.id;
      importedRequests++;
    } catch (err) {
      console.error("Failed to import request:", req, err);
      errors.push(`request "${req.title || "(untitled)"}"`);
    }
  }

  for (const record of data.billingRecords ?? []) {
    const newRequestId = record.requestId ? requestIdMap[record.requestId] : undefined;
    const amount = Number.parseFloat(String(record.amount ?? ""));
    const status = String(record.status || "recorded");

    if (
      !newRequestId ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !(BILLING_RECORD_STATUSES as readonly string[]).includes(status)
    ) {
      errors.push(`billing record for request "${record.requestId || "(missing request)"}"`);
      continue;
    }

    try {
      await db.insert(billingRecords).values({
        requestId: newRequestId,
        ownerId: session.user.id,
        vendorId: null,
        closeoutSubmissionId: null,
        amount: amount.toFixed(2),
        status: status as BillingRecordStatus,
        invoiceReference: record.invoiceReference || null,
        notes: record.notes || null,
        recordedAt: record.recordedAt ? new Date(record.recordedAt) : new Date(),
        paidAt: record.paidAt ? new Date(record.paidAt) : null,
      });
      importedBillingRecords++;
    } catch (err) {
      console.error("Failed to import billing record:", record, err);
      errors.push(`billing record for request "${record.requestId || "(missing request)"}"`);
    }
  }

  return { importedProperties, importedRequests, importedBillingRecords, errors };
}
