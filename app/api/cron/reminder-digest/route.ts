// Daily reminder digest — the Vercel Cron replacement for the Firebase
// build's onSchedule() Cloud Function (see vercel.json for the schedule).
// One email per owner covering every recurring maintenance reminder
// (Package 8) that's overdue or due within 3 days. Each reminder is only
// re-notified after NOTIFY_COOLDOWN_HOURS so an overdue item doesn't spam
// the owner every single day.
import { NextResponse } from "next/server";
import { and, lte, or, isNull, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { reminders, properties } from "@/lib/db/schema";
import { sendNotification } from "@/lib/email";

const NOTIFY_COOLDOWN_HOURS = 72;
const DUE_SOON_DAYS = 3;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const soonCutoff = new Date(now + DUE_SOON_DAYS * 24 * 60 * 60 * 1000);
  const cooldownCutoff = new Date(now - NOTIFY_COOLDOWN_HOURS * 60 * 60 * 1000);

  const dueReminders = await db
    .select({
      id: reminders.id,
      title: reminders.title,
      nextDueAt: reminders.nextDueAt,
      propertyId: reminders.propertyId,
      propertyLabel: properties.nickname,
      propertyAddress: properties.address,
      ownerId: properties.ownerId,
    })
    .from(reminders)
    .innerJoin(properties, eq(reminders.propertyId, properties.id))
    .where(
      and(
        lte(reminders.nextDueAt, soonCutoff),
        or(isNull(reminders.lastNotifiedAt), lte(reminders.lastNotifiedAt, cooldownCutoff))
      )
    );

  const byOwner = new Map<string, { reminderIds: string[]; lines: string[] }>();

  for (const r of dueReminders) {
    const overdue = r.nextDueAt.getTime() < now;
    const label = r.propertyLabel || r.propertyAddress;
    const entry = byOwner.get(r.ownerId) || { reminderIds: [], lines: [] };
    entry.reminderIds.push(r.id);
    entry.lines.push(`- ${overdue ? "OVERDUE" : "Due soon"}: ${r.title} (${label})`);
    byOwner.set(r.ownerId, entry);
  }

  let ownersNotified = 0;
  for (const [ownerId, { reminderIds, lines }] of byOwner.entries()) {
    const owner = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, ownerId),
      columns: { email: true },
    });

    const sent = await sendNotification({
      ownerId,
      type: "reminder_due",
      recipientEmail: owner?.email ?? null,
      subject: `TurnFlow Home: ${reminderIds.length} maintenance reminder(s)`,
      text: `You have upcoming or overdue maintenance:\n\n${lines.join("\n")}`,
    });

    if (sent) {
      await db
        .update(reminders)
        .set({ lastNotifiedAt: new Date() })
        .where(inArray(reminders.id, reminderIds));
      ownersNotified++;
    }
  }

  return NextResponse.json({ ownersNotified, remindersConsidered: dueReminders.length });
}
