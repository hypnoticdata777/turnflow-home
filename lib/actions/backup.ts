"use server";

import { db } from "@/lib/db";
import { properties, requests } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";
import { REQUEST_CATEGORIES, REQUEST_URGENCIES, REQUEST_STATUSES } from "@/lib/utils";

/** Everything backup.html's "Download Backup (JSON)" and "Download History (CSV)" buttons need — properties + requests only, no photos/quotes/log (matches the original build's scope: a portable record of the core data, not a full deep export). */
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

export type RestoreResult = {
  importedProperties: number;
  importedRequests: number;
  errors: string[];
};

/** Imports properties + requests from a JSON backup file, re-owned by whoever is currently signed in — existing records are never overwritten. */
export async function restoreBackupAction(data: {
  properties: BackupProperty[];
  requests: BackupRequest[];
}): Promise<RestoreResult> {
  const session = await requireRole("owner");

  const propertyIdMap: Record<string, string> = {};
  let importedProperties = 0;
  let importedRequests = 0;
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
      await db.insert(requests).values({
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
      });
      importedRequests++;
    } catch (err) {
      console.error("Failed to import request:", req, err);
      errors.push(`request "${req.title || "(untitled)"}"`);
    }
  }

  return { importedProperties, importedRequests, errors };
}
