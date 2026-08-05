"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reminders } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/dal";

async function requireOwnedProperty(propertyId: string, ownerId: string) {
  const property = await db.query.properties.findFirst({
    where: (p, { eq }) => eq(p.id, propertyId),
  });
  if (!property || property.ownerId !== ownerId) {
    throw new Error("Not authorized for this property");
  }
  return property;
}

function nextDueDate(intervalDays: number, fromMillis: number = Date.now()) {
  return new Date(fromMillis + intervalDays * 24 * 60 * 60 * 1000);
}

export type CreateReminderResult = { reminderId: string } | { error: string };

export async function createReminderAction(
  propertyId: string,
  formData: FormData
): Promise<CreateReminderResult> {
  const session = await requireRole("owner");
  await requireOwnedProperty(propertyId, session.user.id);

  const title = String(formData.get("title") || "").trim();
  const intervalDays = Number.parseInt(String(formData.get("intervalDays") || ""), 10);
  const notes = String(formData.get("notes") || "").trim();

  if (!title || !Number.isFinite(intervalDays) || intervalDays <= 0) {
    return { error: "Title and a valid interval are required." };
  }

  const [created] = await db
    .insert(reminders)
    .values({
      propertyId,
      title,
      intervalDays,
      nextDueAt: nextDueDate(intervalDays),
      notes: notes || null,
    })
    .returning({ id: reminders.id });

  revalidatePath("/owner/calendar");
  return { reminderId: created.id };
}

/** Marks a reminder done today and reschedules nextDueAt from its interval. */
export async function markReminderDoneAction(propertyId: string, reminderId: string) {
  const session = await requireRole("owner");
  await requireOwnedProperty(propertyId, session.user.id);

  const reminder = await db.query.reminders.findFirst({
    where: (r, { eq }) => eq(r.id, reminderId),
  });
  if (!reminder || reminder.propertyId !== propertyId) {
    throw new Error("Reminder not found");
  }

  const now = Date.now();
  await db
    .update(reminders)
    .set({
      lastCompletedAt: new Date(now),
      nextDueAt: nextDueDate(reminder.intervalDays, now),
      updatedAt: new Date(),
    })
    .where(eq(reminders.id, reminderId));

  revalidatePath("/owner/calendar");
}

export async function deleteReminderAction(propertyId: string, reminderId: string) {
  const session = await requireRole("owner");
  await requireOwnedProperty(propertyId, session.user.id);

  const reminder = await db.query.reminders.findFirst({
    where: (r, { eq }) => eq(r.id, reminderId),
  });
  if (!reminder || reminder.propertyId !== propertyId) {
    throw new Error("Reminder not found");
  }

  await db
    .delete(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.propertyId, propertyId)));
  revalidatePath("/owner/calendar");
}
