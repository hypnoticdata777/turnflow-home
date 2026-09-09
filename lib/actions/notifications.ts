"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { sendNotification } from "@/lib/email";

export async function sendTestNotificationAction() {
  const session = await requireRole("owner");

  await sendNotification({
    ownerId: session.user.id,
    type: "delivery_test",
    recipientEmail: session.user.email ?? null,
    subject: "TurnFlow Home delivery test",
    text:
      "This is a TurnFlow Home delivery test. If you received it, outbound email is configured for this environment.",
  });

  revalidatePath("/owner/notifications");
}
