import "server-only";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { notificationLog } from "@/lib/db/schema";

const FROM_EMAIL = process.env.NOTIFICATIONS_FROM_EMAIL || "notifications@example.com";

async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set — email notifications are wired but not deployed yet.");
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, text });
  if (error) throw new Error(error.message);
}

type LogParams = {
  ownerId: string;
  requestId?: string | null;
  propertyId?: string | null;
  type: string;
  recipientEmail: string | null;
  subject: string;
};

async function logNotification({ ownerId, requestId = null, propertyId = null, type, recipientEmail, subject, status, error = null }: LogParams & { status: "sent" | "failed"; error?: string | null }) {
  await db.insert(notificationLog).values({
    ownerId,
    requestId,
    propertyId,
    type,
    recipientEmail,
    subject,
    status,
    error,
  });
}

/** Sends an email and logs the attempt (success or failure) to notificationLog — every send attempt gets a row, not just successes. Returns whether the send actually succeeded, so callers (e.g. the reminder digest) can gate follow-up state changes like lastNotifiedAt on a real send. */
export async function sendNotification(params: LogParams & { text: string }): Promise<boolean> {
  const { recipientEmail, subject, text, ...logParams } = params;

  if (!recipientEmail) {
    await logNotification({ ...logParams, subject, recipientEmail: null, status: "failed", error: "No email on record for recipient" });
    return false;
  }

  try {
    await sendEmail({ to: recipientEmail, subject, text });
    await logNotification({ ...logParams, subject, recipientEmail, status: "sent" });
    return true;
  } catch (error) {
    console.error(`Failed to send ${logParams.type} email:`, error);
    await logNotification({
      ...logParams,
      subject,
      recipientEmail,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
