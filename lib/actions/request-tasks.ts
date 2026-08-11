"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { decisionLog, requestTasks } from "@/lib/db/schema";
import { requireAnyRole, requireRole } from "@/lib/auth/dal";
import {
  REQUEST_TASK_STATUS_LABELS,
  isRequestTaskStatus,
  normalizeRequestTaskTitle,
  type RequestTaskStatus,
} from "@/lib/project-tasks";

export type CreateRequestTaskResult = { ok: true; taskId: string } | { error: string };
export type UpdateRequestTaskResult = { ok: true } | { error: string };

const PHOTO_TYPES = ["before", "after", "receipt", "other"] as const;

async function requireOwnedRequest(requestId: string, ownerId: string) {
  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });
  if (!req || req.ownerId !== ownerId) {
    throw new Error("Not authorized for this request");
  }
  return req;
}

async function requireTaskAccess(requestId: string, userId: string) {
  const req = await db.query.requests.findFirst({
    where: (r, { eq }) => eq(r.id, requestId),
  });
  const isOwner = req?.ownerId === userId;
  const isAssignedVendor = req?.assignedVendorId === userId;
  if (!req || !(isOwner || isAssignedVendor)) {
    throw new Error("Not authorized for this task");
  }
  return req;
}

function parseRequiredPhotoTypes(formData: FormData) {
  return PHOTO_TYPES.filter((type) => formData.get(`proof_${type}`) === "on");
}

function parseMoney(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const amount = Number.parseFloat(trimmed);
  return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : null;
}

export async function createRequestTaskAction(
  requestId: string,
  formData: FormData
): Promise<CreateRequestTaskResult> {
  const session = await requireRole("owner");
  await requireOwnedRequest(requestId, session.user.id);

  const title = normalizeRequestTaskTitle(String(formData.get("title") ?? ""));
  const description = String(formData.get("description") ?? "").trim().slice(0, 500);
  const estimatedCost = parseMoney(formData.get("estimatedCost"));
  const finalCost = parseMoney(formData.get("finalCost"));
  if (!title) {
    return { error: "Task title is required." };
  }

  const existingCount = await db.query.requestTasks.findMany({
    where: (task, { eq }) => eq(task.requestId, requestId),
    columns: { id: true },
  });
  const [created] = await db
    .insert(requestTasks)
    .values({
      requestId,
      title,
      description: description || null,
      estimatedCost,
      finalCost,
      requiredPhotoTypes: parseRequiredPhotoTypes(formData),
      sortOrder: existingCount.length,
      createdById: session.user.id,
    })
    .returning({ id: requestTasks.id });

  await db.insert(decisionLog).values({
    requestId,
    actorId: session.user.id,
    action: "request_task_created",
    details: { title },
  });

  revalidatePath(`/owner/requests/${requestId}`);
  revalidatePath("/vendor");
  return { ok: true, taskId: created.id };
}

export async function updateRequestTaskStatusAction(
  requestId: string,
  taskId: string,
  status: string
): Promise<UpdateRequestTaskResult> {
  const session = await requireAnyRole(["owner", "vendor"]);
  await requireTaskAccess(requestId, session.user.id);
  if (!isRequestTaskStatus(status)) {
    return { error: "Choose a valid task status." };
  }

  const task = await db.query.requestTasks.findFirst({
    where: (t, { eq }) => eq(t.id, taskId),
  });
  if (!task || task.requestId !== requestId) {
    return { error: "Task not found." };
  }

  const nextStatus = status as RequestTaskStatus;
  await db
    .update(requestTasks)
    .set({
      status: nextStatus,
      acceptedAt: nextStatus === "done" ? task.acceptedAt : null,
      acceptedById: nextStatus === "done" ? task.acceptedById : null,
      updatedAt: new Date(),
    })
    .where(and(eq(requestTasks.id, taskId), eq(requestTasks.requestId, requestId)));

  await db.insert(decisionLog).values({
    requestId,
    actorId: session.user.id,
    action: "request_task_status_changed",
    details: {
      title: task.title,
      from: REQUEST_TASK_STATUS_LABELS[task.status],
      to: REQUEST_TASK_STATUS_LABELS[nextStatus],
    },
  });

  revalidatePath(`/owner/requests/${requestId}`);
  revalidatePath("/vendor");
  return { ok: true };
}

export async function updateRequestTaskCostAction(
  requestId: string,
  taskId: string,
  formData: FormData
): Promise<UpdateRequestTaskResult> {
  const session = await requireRole("owner");
  await requireOwnedRequest(requestId, session.user.id);

  const task = await db.query.requestTasks.findFirst({
    where: (t, { eq }) => eq(t.id, taskId),
  });
  if (!task || task.requestId !== requestId) {
    return { error: "Task not found." };
  }

  const estimatedCost = parseMoney(formData.get("estimatedCost"));
  const finalCost = parseMoney(formData.get("finalCost"));
  await db
    .update(requestTasks)
    .set({ estimatedCost, finalCost, updatedAt: new Date() })
    .where(and(eq(requestTasks.id, taskId), eq(requestTasks.requestId, requestId)));

  await db.insert(decisionLog).values({
    requestId,
    actorId: session.user.id,
    action: "request_task_cost_updated",
    details: { title: task.title, estimatedCost, finalCost },
  });

  revalidatePath(`/owner/requests/${requestId}`);
  revalidatePath("/vendor");
  return { ok: true };
}

export async function acceptRequestTaskAction(
  requestId: string,
  taskId: string
): Promise<UpdateRequestTaskResult> {
  const session = await requireRole("owner");
  await requireOwnedRequest(requestId, session.user.id);

  const task = await db.query.requestTasks.findFirst({
    where: (t, { eq }) => eq(t.id, taskId),
  });
  if (!task || task.requestId !== requestId) {
    return { error: "Task not found." };
  }
  if (task.status !== "done") {
    return { error: "Only done tasks can be accepted for closeout." };
  }

  await db
    .update(requestTasks)
    .set({
      acceptedAt: new Date(),
      acceptedById: session.user.id,
      updatedAt: new Date(),
    })
    .where(and(eq(requestTasks.id, taskId), eq(requestTasks.requestId, requestId)));

  await db.insert(decisionLog).values({
    requestId,
    actorId: session.user.id,
    action: "request_task_accepted",
    details: { title: task.title, finalCost: task.finalCost },
  });

  revalidatePath(`/owner/requests/${requestId}`);
  revalidatePath("/vendor");
  return { ok: true };
}

export async function deleteRequestTaskAction(
  requestId: string,
  taskId: string
): Promise<UpdateRequestTaskResult> {
  const session = await requireRole("owner");
  await requireOwnedRequest(requestId, session.user.id);

  const task = await db.query.requestTasks.findFirst({
    where: (t, { eq }) => eq(t.id, taskId),
  });
  if (!task || task.requestId !== requestId) {
    return { error: "Task not found." };
  }

  await db
    .delete(requestTasks)
    .where(and(eq(requestTasks.id, taskId), eq(requestTasks.requestId, requestId)));

  await db.insert(decisionLog).values({
    requestId,
    actorId: session.user.id,
    action: "request_task_deleted",
    details: { title: task.title },
  });

  revalidatePath(`/owner/requests/${requestId}`);
  revalidatePath("/vendor");
  return { ok: true };
}
